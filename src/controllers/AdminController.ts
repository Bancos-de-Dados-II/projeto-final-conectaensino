import { Request, Response } from 'express';
import { DirectorProfile } from '../models/mongodb/DirectorProfile';
import { MonitorProfile } from '../models/mongodb/MonitorProfile';
import { StudentProfile } from '../models/mongodb/StudentProfile';
import { getAdminScope } from '../services/adminScope';
import { supabaseAdmin } from '../config/supabase';
import { Session } from '../models/mongodb/Session';
import PDFDocument from 'pdfkit';

async function scopeOrResponse(req: Request, res: Response) {
  const scope = await getAdminScope(req.user!.id);
  if (!scope) {
    res.status(403).json({ message: 'Administrador municipal sem cidade configurada.' });
    return null;
  }
  return scope;
}

export const AdminController = {
  async dashboard(req: Request, res: Response) {
    try {
      const scope = await scopeOrResponse(req, res);
      if (!scope) return;
      const institutionFilter = { $in: scope.institutionIds };
      const [students, monitors, pendingDirectors, approvedDirectors] = await Promise.all([
        StudentProfile.countDocuments({ institutionId: institutionFilter }),
        MonitorProfile.countDocuments({ institutionId: institutionFilter }),
        DirectorProfile.countDocuments({
          institutionId: institutionFilter,
          $or: [
            { approvalStatus: 'pending' },
            { approvalStatus: { $exists: false } },
            { approvalStatus: null },
          ],
        }),
        DirectorProfile.countDocuments({ institutionId: institutionFilter, approvalStatus: 'approved' }),
      ]);
      return res.json({
        city: { name: scope.admin.cityName, stateCode: scope.admin.stateCode, codigoIbge: scope.admin.codigoIbge },
        counts: { institutions: scope.institutions.length, students, monitors, pendingDirectors, approvedDirectors },
      });
    } catch (error: any) {
      return res.status(500).json({ message: 'Erro ao carregar painel municipal.', error: error.message });
    }
  },

  async institutions(req: Request, res: Response) {
    try {
      const scope = await scopeOrResponse(req, res);
      if (!scope) return;
      const counts = await MonitorProfile.aggregate([
        { $match: { institutionId: { $in: scope.institutionIds } } },
        { $group: { _id: '$institutionId', total: { $sum: 1 } } },
      ]);
      const countMap = new Map(counts.map((item) => [String(item._id), item.total]));
      return res.json({
        city: { name: scope.admin.cityName, stateCode: scope.admin.stateCode, codigoIbge: scope.admin.codigoIbge },
        institutions: scope.institutions.map((institution) => ({
          ...institution,
          id: String(institution._id),
          monitorCount: countMap.get(String(institution._id)) ?? 0,
        })),
      });
    } catch (error: any) {
      return res.status(500).json({ message: 'Erro ao listar escolas municipais.', error: error.message });
    }
  },

  async mapEntities(req: Request, res: Response) {
    try {
      const scope = await scopeOrResponse(req, res);
      if (!scope) return;
      const filter = String(req.query.filter ?? 'all').toLowerCase();
      if (!['all', 'students', 'monitors', 'directors'].includes(filter)) {
        return res.status(400).json({ message: 'Filtro de mapa invalido.' });
      }
      const institutionIds = scope.institutionIds;
      const groupByInstitution = async (model: typeof StudentProfile | typeof MonitorProfile | typeof DirectorProfile) =>
        model.aggregate([
          { $match: { institutionId: { $in: institutionIds } } },
          { $group: { _id: '$institutionId', total: { $sum: 1 } } },
        ]);
      const [studentCounts, monitorCounts, directorCounts] = await Promise.all([
        groupByInstitution(StudentProfile),
        groupByInstitution(MonitorProfile),
        groupByInstitution(DirectorProfile),
      ]);
      const toCountMap = (items: Array<{ _id: unknown; total: number }>) =>
        new Map(items.map((item) => [String(item._id), item.total]));
      const studentCountMap = toCountMap(studentCounts);
      const monitorCountMap = toCountMap(monitorCounts);
      const directorCountMap = toCountMap(directorCounts);
      const selectedCountMap = filter === 'students'
        ? studentCountMap
        : filter === 'monitors'
          ? monitorCountMap
          : filter === 'directors'
            ? directorCountMap
            : null;
      const visibleSchools = selectedCountMap
        ? scope.institutions.filter((school) => (selectedCountMap.get(String(school._id)) ?? 0) > 0)
        : scope.institutions;
      const entities = visibleSchools.map((school) => ({
        id: String(school._id),
        name: school.nome,
        type: 'institution',
        address: school.endereco,
        location: school.location,
        monitorCount: monitorCountMap.get(String(school._id)) ?? 0,
        relatedCount: selectedCountMap?.get(String(school._id)) ?? 0,
        relatedType: filter,
      }));
      return res.json({
        city: { name: scope.admin.cityName, stateCode: scope.admin.stateCode },
        filter,
        entities,
      });
    } catch (error: any) {
      return res.status(500).json({ message: 'Erro ao carregar mapa municipal.', error: error.message });
    }
  },

  async directors(req: Request, res: Response) {
    try {
      const scope = await scopeOrResponse(req, res);
      if (!scope) return;
      const directors = await DirectorProfile.find({ institutionId: { $in: scope.institutionIds } })
        .populate('institutionId', 'nome codigoIbge endereco')
        .sort({ createdAt: -1 })
        .lean();
      return res.json(directors.map((director) => ({
        ...director,
        id: String(director._id),
        approvalStatus: director.approvalStatus || 'pending',
      })));
    } catch (error: any) {
      return res.status(500).json({ message: 'Erro ao listar diretores.', error: error.message });
    }
  },

  async setDirectorStatus(req: Request, res: Response) {
    try {
      const status = String(req.body?.status ?? '');
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Status deve ser approved ou rejected.' });
      }
      const scope = await scopeOrResponse(req, res);
      if (!scope) return;
      const director = await DirectorProfile.findOne({
        _id: req.params.id,
        institutionId: { $in: scope.institutionIds },
      });
      if (!director) return res.status(404).json({ message: 'Diretor nÃ£o encontrado nesta cidade.' });

      director.approvalStatus = status as 'approved' | 'rejected';
      director.approvedByAdminId = req.user!.id;
      director.approvedAt = status === 'approved' ? new Date() : undefined;
      director.rejectionReason = status === 'rejected' ? String(req.body?.reason ?? '') : undefined;
      await director.save();

      if (supabaseAdmin) {
        await supabaseAdmin.auth.admin.updateUserById(director.userId, {
          user_metadata: { role: 'director', approval_status: status },
        });
      }
      return res.json({ message: status === 'approved' ? 'Diretor aprovado.' : 'Diretor recusado.', director });
    } catch (error: any) {
      return res.status(500).json({ message: 'Erro ao atualizar aprovaÃ§Ã£o.', error: error.message });
    }
  },

  async reallocateDirector(req: Request, res: Response) {
    try {
      const institutionId = String(req.body?.institutionId ?? '');
      const scope = await scopeOrResponse(req, res);
      if (!scope) return;
      if (!scope.institutionIds.some((id) => String(id) === institutionId)) {
        return res.status(403).json({ message: 'A escola deve pertencer Ã  cidade administrada.' });
      }
      const director = await DirectorProfile.findOneAndUpdate(
        { _id: req.params.id, institutionId: { $in: scope.institutionIds } },
        { $set: { institutionId } },
        { returnDocument: 'after', runValidators: true },
      ).populate('institutionId', 'nome codigoIbge endereco');
      if (!director) return res.status(404).json({ message: 'Diretor nÃ£o encontrado nesta cidade.' });
      return res.json({ message: 'Diretor realocado com sucesso.', director });
    } catch (error: any) {
      return res.status(500).json({ message: 'Erro ao realocar diretor.', error: error.message });
    }
  },

  async deleteDirector(req: Request, res: Response) {
    try {
      const scope = await scopeOrResponse(req, res);
      if (!scope) return;
      const director = await DirectorProfile.findOne({
        _id: req.params.id,
        institutionId: { $in: scope.institutionIds },
      });
      if (!director) return res.status(404).json({ message: 'Diretor nÃ£o encontrado nesta cidade.' });
      if (!supabaseAdmin) {
        return res.status(503).json({ message: 'ServiÃ§o administrativo do Supabase nÃ£o configurado.' });
      }
      const { error: tableError } = await supabaseAdmin
        .from('usuarios')
        .delete()
        .eq('mongo_profile_id', String(director._id));
      if (tableError) return res.status(502).json({ message: 'NÃ£o foi possÃ­vel remover o cadastro relacional.', error: tableError.message });
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(director.userId);
      if (authError) return res.status(502).json({ message: 'NÃ£o foi possÃ­vel remover as credenciais.', error: authError.message });
      await director.deleteOne();
      return res.json({ message: 'Diretor excluÃ­do com sucesso.' });
    } catch (error: any) {
      return res.status(500).json({ message: 'Erro ao excluir diretor.', error: error.message });
    }
  },

  async exportReport(req: Request, res: Response) {
    try {
      const scope = await scopeOrResponse(req, res);
      if (!scope) return;
      const institutionIds = scope.institutionIds;
      const [students, monitors, directors] = await Promise.all([
        StudentProfile.find({ institutionId: { $in: institutionIds } }).populate('institutionId', 'nome').sort({ createdAt: -1 }).lean(),
        MonitorProfile.find({ institutionId: { $in: institutionIds } }).populate('institutionId', 'nome').sort({ createdAt: -1 }).lean(),
        DirectorProfile.find({ institutionId: { $in: institutionIds } }).populate('institutionId', 'nome').sort({ createdAt: -1 }).lean(),
      ]);
      const studentIds = students.map((item) => String(item._id));
      const monitorIds = monitors.map((item) => String(item._id));
      const sessions = await Session.find({
        alunoId: { $in: studentIds },
        monitorId: { $in: monitorIds },
      }).sort({ dataHora: -1 }).lean();
      const studentMap = new Map(students.map((item) => [String(item._id), item.name || item.email || 'Aluno']));
      const monitorMap = new Map(monitors.map((item) => [String(item._id), item.name || item.email || 'Monitor']));
      const completed = sessions.filter((item) => item.status === 'finalizada').length;
      const cancelled = sessions.filter((item) => item.status === 'cancelada').length;
      const active = sessions.length - completed - cancelled;
      const generatedAt = new Date();

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="relatorio-${scope.admin.cityName.toLowerCase()}-${generatedAt.toISOString().slice(0, 10)}.pdf"`);
      const doc = new PDFDocument({ size: 'A4', margin: 42, info: { Title: `Relatorio municipal - ${scope.admin.cityName}` } });
      doc.pipe(res);
      const pageWidth = doc.page.width - 84;
      const ensureSpace = (height = 28) => { if (doc.y + height > doc.page.height - 50) doc.addPage(); };
      const heading = (title: string) => {
        ensureSpace(38);
        doc.moveDown(0.6);
        doc.font('Helvetica-Bold').fontSize(15).fillColor('#063b52').text(title, 42, doc.y, { width: pageWidth });
        doc.moveDown(0.35);
      };
      const line = (text: string) => {
        ensureSpace();
        doc.font('Helvetica').fontSize(9).fillColor('#26343d').text(text, 42, doc.y, { width: pageWidth });
      };
      const schoolName = (value: unknown) => (value as { nome?: string } | null)?.nome || 'Escola nao informada';
      const date = (value: unknown) => value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(String(value))) : 'Nao informado';

      doc.rect(0, 0, doc.page.width, 110).fill('#07131d');
      doc.fillColor('#12bdf2').font('Helvetica-Bold').fontSize(11).text('CONECTA ENSINO', 42, 35);
      doc.fillColor('#ffffff').fontSize(22).text('Relatorio de desenvolvimento municipal', 42, 55);
      doc.font('Helvetica').fontSize(10).text(`${scope.admin.cityName}/${scope.admin.stateCode} - Gerado em ${date(generatedAt)}`, 42, 86);
      doc.y = 130;
      heading('Visao geral do projeto');
      line(`Escolas: ${scope.institutions.length} | Alunos: ${students.length} | Monitores: ${monitors.length} | Diretores: ${directors.length} | Monitorias: ${sessions.length}`);
      line(`Sessoes finalizadas: ${completed} | Em acompanhamento: ${active} | Canceladas: ${cancelled} | Conclusao: ${sessions.length ? Math.round((completed / sessions.length) * 100) : 0}%`);

      heading('Grafico atualizado na exportacao');
      const bars = [
        ['Alunos', students.length, '#12bdf2'], ['Monitores', monitors.length, '#10b981'],
        ['Diretores', directors.length, '#6366f1'], ['Sessoes', sessions.length, '#f59e0b'],
        ['Finalizadas', completed, '#22c55e'],
      ] as const;
      const max = Math.max(1, ...bars.map((bar) => bar[1]));
      const startX = 120;
      for (const [label, value, color] of bars) {
        ensureSpace(24);
        const y = doc.y;
        doc.font('Helvetica').fontSize(9).fillColor('#26343d').text(label, 42, y + 3, { width: 72 });
        doc.rect(startX, y, (value / max) * 330, 15).fill(color);
        doc.fillColor('#26343d').text(String(value), 458, y + 3, { width: 60 });
        doc.y = y + 23;
      }
      doc.x = 42;

      heading('Diretores cadastrados');
      directors.forEach((item) => line(`${item.name || item.email || 'Diretor'} | ${item.email || 'sem e-mail'} | ${schoolName(item.institutionId)} | Status: ${item.approvalStatus || 'legado'} | Inserido em: ${date((item as any).createdAt)}`));
      heading('Monitores cadastrados');
      monitors.forEach((item) => line(`${item.name || item.email || 'Monitor'} | ${item.email || 'sem e-mail'} | ${schoolName(item.institutionId)} | Disciplinas: ${(item.disciplinas || []).join(', ') || 'nao informadas'} | Inserido em: ${date(item.createdAt)}`));
      heading('Alunos cadastrados');
      students.forEach((item) => line(`${item.name || item.email || 'Aluno'} | ${item.email || 'sem e-mail'} | ${schoolName(item.institutionId)} | Especialidade: ${item.tipoDeficiencia || 'nao informada'} | Inserido em: ${date(item.createdAt)}`));
      heading('Monitorias e sessoes aluno-monitor');
      if (!sessions.length) line('Nenhuma sessao registrada entre alunos e monitores desta cidade.');
      sessions.forEach((item) => line(`${date(item.dataHora)} | Aluno: ${studentMap.get(item.alunoId) || item.alunoId} | Monitor: ${monitorMap.get(item.monitorId) || item.monitorId} | Status: ${item.status} | Local: ${item.enderecoEncontro}`));
      heading('Evolucao dos cadastros');
      const allRegistrations = [
        ...students.map((item) => ({ type: 'Aluno', name: item.name || item.email || 'Aluno', createdAt: item.createdAt })),
        ...monitors.map((item) => ({ type: 'Monitor', name: item.name || item.email || 'Monitor', createdAt: item.createdAt })),
        ...directors.map((item) => ({ type: 'Diretor', name: item.name || item.email || 'Diretor', createdAt: (item as any).createdAt })),
      ].sort((a, b) => new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime());
      allRegistrations.forEach((item) => line(`${date(item.createdAt)} | Novo ${item.type.toLowerCase()}: ${item.name}`));
      ensureSpace(35);
      doc.moveDown().fontSize(8).fillColor('#667784').text('Relatorio gerado automaticamente pelo Conecta Ensino. Os indicadores refletem os dados existentes no momento da exportacao.', 42, doc.y, { width: pageWidth, align: 'center' });
      doc.end();
    } catch (error: any) {
      if (!res.headersSent) return res.status(500).json({ message: 'Erro ao gerar relatorio municipal.', error: error.message });
      res.end();
    }
  },
};
