import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import { supabase } from '../config/supabase';
import { MonitorProfile } from '../models/mongodb/MonitorProfile';
import { generateMonthlyCertificatesForPreviousMonth } from '../services/certificado.service';

type CertificadoCreateBody = {
  mongo_monitor_id?: string;
  disciplina_id?: string;
  horas_validadas?: number;
};

export const CertificadoController = {
  async gerarCertificado(req: Request, res: Response): Promise<Response> {
    try {
      const body = req.body as CertificadoCreateBody;
      const mongoMonitorId = typeof body.mongo_monitor_id === 'string' ? body.mongo_monitor_id.trim() : '';
      const disciplinaId = typeof body.disciplina_id === 'string' ? body.disciplina_id.trim() : '';
      const horasValidadas = body.horas_validadas;

      if (!mongoMonitorId || !disciplinaId) {
        return res.status(400).json({ message: 'mongo_monitor_id e disciplina_id são obrigatórios.' });
      }

      if (!Number.isFinite(horasValidadas) || (horasValidadas ?? 0) <= 0) {
        return res.status(400).json({ message: 'horas_validadas deve ser um número maior que zero.' });
      }

      const { data, error } = await supabase
        .from('certificados')
        .insert({
          mongo_monitor_id: mongoMonitorId,
          disciplina_id: disciplinaId,
          horas_validadas: horasValidadas,
        })
        .select('id, mongo_monitor_id, disciplina_id, horas_validadas, emitido_em, created_at, updated_at')
        .single();

      if (error) {
        return res.status(400).json({ message: 'Erro ao gerar certificado.', error: error.message });
      }

      return res.status(201).json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro interno ao gerar certificado.';
      return res.status(500).json({ message });
    }
  },

  async download(req: Request, res: Response): Promise<void | Response> {
    try {
      const certificadoId = typeof req.params.id === 'string' ? req.params.id.trim() : '';

      if (!certificadoId) {
        return res.status(400).json({ message: 'ID do certificado é obrigatório.' });
      }

      const { data: certificado, error: certificadoError } = await supabase
        .from('certificados')
        .select('id, mongo_monitor_id, disciplina_id, horas_validadas, emitido_em')
        .eq('id', certificadoId)
        .maybeSingle();

      if (certificadoError) {
        return res.status(400).json({ message: 'Erro ao buscar certificado.', error: certificadoError.message });
      }

      if (!certificado) {
        return res.status(404).json({ message: 'Certificado não encontrado.' });
      }

      const { data: disciplina, error: disciplinaError } = await supabase
        .from('disciplinas')
        .select('id, nome, carga_horaria')
        .eq('id', certificado.disciplina_id)
        .maybeSingle();

      if (disciplinaError) {
        return res.status(400).json({ message: 'Erro ao buscar disciplina.', error: disciplinaError.message });
      }

      if (!disciplina) {
        return res.status(404).json({ message: 'Disciplina vinculada ao certificado não encontrada.' });
      }

      const monitor = await MonitorProfile.findById(certificado.mongo_monitor_id).lean();
      const nomeDestinatario = req.user?.name ?? req.user?.email ?? 'Aluno não informado';
      const nomeMonitor = monitor ? monitor.userId : certificado.mongo_monitor_id;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="certificado-${certificado.id}.pdf"`);

      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      doc.pipe(res);

      doc.fontSize(22).text('Certificado', { align: 'center' });
      doc.moveDown(1.5);
      doc.fontSize(12).text(`Identificador: ${certificado.id}`);
      doc.text(`Nome do aluno: ${nomeDestinatario}`);
      doc.text(`Disciplina: ${disciplina.nome}`);
      doc.text(`Carga horária: ${certificado.horas_validadas} horas`);
      doc.text(`Monitor responsável: ${nomeMonitor}`);
      doc.text(`Emitido em: ${certificado.emitido_em ?? new Date().toISOString()}`);
      doc.moveDown(2);
      doc.text('Documento gerado automaticamente pelo backend Conecta Ensino.', { align: 'center' });

      doc.end();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro interno ao gerar PDF do certificado.';
      return res.status(500).json({ message });
    }
  },

  async gerarMensal(req: Request, res: Response): Promise<Response> {
    try {
      const dryRun = req.body?.dryRun === true;
      await generateMonthlyCertificatesForPreviousMonth(dryRun);
      return res.status(200).json({ message: 'Geração mensal executada (ou agendada).', dryRun });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao executar geração mensal.';
      return res.status(500).json({ message });
    }
  },
};
