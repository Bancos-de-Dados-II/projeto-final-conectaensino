import { Request, Response } from 'express';
import { StudentProfile } from '../models/mongodb/StudentProfile';
import { Institution } from '../models/mongodb/Institution';
import { supabase, supabaseAdmin } from '../config/supabase';
import crypto from 'crypto';
import type { GeoSearchQuery } from '../schemas/GeoSearchSchema';
import { DirectorProfile } from '../models/mongodb/DirectorProfile';
import { MonitorProfile } from '../models/mongodb/MonitorProfile';
import { Session } from '../models/mongodb/Session';
import { getAdminScope } from '../services/adminScope';

type StudentGeoDTO = {
  id: string;
  userId: string;
  tipoDeficiencia: string;
  necessidadesAcessibilidade: string;
  enderecoResidencial: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
};

function toStudentGeoDTO(student: {
  _id: unknown;
  userId: string;
  tipoDeficiencia: string;
  necessidadesAcessibilidade: string;
  enderecoResidencial: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
}): StudentGeoDTO {
  return {
    id: String(student._id),
    userId: student.userId,
    tipoDeficiencia: student.tipoDeficiencia,
    necessidadesAcessibilidade: student.necessidadesAcessibilidade,
    enderecoResidencial: student.enderecoResidencial,
    location: {
      type: 'Point',
      coordinates: [student.location.coordinates[0], student.location.coordinates[1]],
    },
  };
}

export class StudentController {
  static async getLinkedProfile(req: Request, res: Response): Promise<Response> {
    try {
      const monitor = await MonitorProfile.findOne({
        userId: req.user?.id,
      }).lean();
      if (!monitor) {
        return res.status(403).json({
          message: 'Somente monitores podem consultar este perfil.',
        });
      }

      const studentId = String(req.params.id ?? '');
      const hasLink = await Session.exists({
        monitorId: String(monitor._id),
        alunoId: studentId,
        status: { $ne: 'cancelada' },
      });
      if (!hasLink) {
        return res.status(403).json({
          message: 'Este aluno não possui vínculo ativo com o monitor.',
        });
      }

      const student = await StudentProfile.findById(studentId)
        .select('+avatarData +avatarMimeType')
        .populate('institutionId', 'nome')
        .lean();
      if (!student) {
        return res.status(404).json({ message: 'Aluno não encontrado.' });
      }

      const institution = student.institutionId as unknown as {
        nome?: string;
      } | null;
      const avatar = student.avatarData && student.avatarMimeType
        ? `data:${student.avatarMimeType};base64,${student.avatarData.toString('base64')}`
        : undefined;

      return res.status(200).json({
        id: String(student._id),
        name: student.name || student.email || 'Aluno',
        email: student.email || '',
        avatar,
        institutionName: institution?.nome || 'Instituição não informada',
        specialty: student.tipoDeficiencia || 'Não informada',
        accessibilityNeeds:
          student.necessidadesAcessibilidade || 'Nenhuma necessidade informada',
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao carregar perfil do aluno.';
      return res.status(500).json({ message });
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      if (!supabaseAdmin) {
        return res.status(503).json({
          message: 'Cadastro de usuários indisponível. Configure SUPABASE_SERVICE_ROLE_KEY.',
        });
      }
      if (req.user?.role === 'director') {
        const director = await DirectorProfile.findOne({
          userId: req.user.id,
        }).lean();
        if (!director) {
          return res.status(404).json({ message: 'Perfil do diretor não encontrado.' });
        }
        req.body.institutionId = String(director.institutionId);
      }
      if (req.user?.role === 'admin') {
        const scope = await getAdminScope(req.user.id);
        if (!scope || !scope.institutionIds.some((id) => String(id) === String(req.body.institutionId))) {
          return res.status(403).json({ message: 'Selecione uma escola da cidade administrada.' });
        }
      }
      console.log("--- INÍCIO DO CADASTRO DE ALUNO COM AUTH ---");
      console.log("DADOS RECEBIDOS NO BODY:", req.body);

      const {
        name,
        email,
        password,
        institutionId, 
        enderecoResidencial,
        tipoDeficiencia,
        necessidadesAcessibilidade,
        location,
      } = req.body;

      if (!email) {
        return res.status(400).json({ message: 'O campo email é obrigatório.' });
      }

      const { data: existingUser } = await supabaseAdmin
        .from('usuarios')
        .select('email')
        .eq('email', email)
        .maybeSingle();

      if (existingUser) {
        return res.status(400).json({ message: 'Já existe um aluno cadastrado com este e-mail.' });
      }

      let studentLocation: {
        type: 'Point';
        coordinates: [number, number];
      };
      
      const isMongoId = institutionId && /^[0-9a-fA-F]{24}$/.test(institutionId);

      if (isMongoId) {
        const institution = await Institution.findById(institutionId);
        if (!institution) {
          return res.status(404).json({ message: 'Instituição próxima não encontrada.' });
        }
        const instData = institution.toObject() as any;
        studentLocation = {
          type: 'Point',
          coordinates: [Number(instData.longitude || instData.lng || 0), Number(instData.latitude || instData.lat || 0)]
        };
      } else if (location && location.coordinates && location.coordinates.length === 2) {
        studentLocation = {
          type: 'Point',
          coordinates: [Number(location.coordinates[0]), Number(location.coordinates[1])]
        };
      } else {
        return res.status(400).json({ message: 'Instituição próxima ou coordenadas geográficas são obrigatórias.' });
      }

      const createdByDirector = req.user?.role === 'director';
      const createdByManager = createdByDirector || req.user?.role === 'admin';
      const studentPassword = createdByManager
        ? '12345678'
        : password || (crypto.randomBytes(6).toString('hex') + '!1A');
      const resolvedName = name || email.split('@')[0];

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: studentPassword,
        email_confirm: true,
        user_metadata: { name: resolvedName, role: 'student' }
      });

      if (authError) {
        console.error('Erro ao criar usuário aluno no Supabase Auth:', authError);
        return res.status(400).json({ message: 'Erro ao gerar credenciais de acesso.', error: authError.message });
      }

      const authUserId = authData.user.id;

        const student = await (StudentProfile.create as any)({
          userId: authUserId, 
          name: resolvedName,
          email,
          mustChangePassword: createdByManager,
          createdByDirectorId: createdByDirector ? req.user?.id : undefined,
          institutionId: isMongoId ? institutionId : undefined,
          enderecoResidencial,
          tipoDeficiencia,
          necessidadesAcessibilidade,
          location: studentLocation,
        });

      const mongoProfileId = student._id.toString();

      const { data: usuarioSupabase, error: supabaseError } = await supabaseAdmin
        .from('usuarios')
        .insert([
          { 
            id: authUserId, 
            email: email, 
            mongo_profile_id: mongoProfileId 
          }
        ])
        .select()
        .single();

      if (supabaseError) {
        await supabaseAdmin.auth.admin.deleteUser(authUserId);
        await StudentProfile.findByIdAndDelete(student._id);
        
        return res.status(400).json({
          message: 'Erro de integridade relacional. Cadastro desfeito.',
          error: supabaseError.message,
        });
      }

      return res.status(201).json({
        message: "Estudante cadastrado com sucesso em ambos os bancos com acesso ao sistema!",
        email: email,
        senhaTemporaria: createdByManager
          ? '12345678'
          : password
            ? undefined
            : studentPassword,
        mongoData: student,
        supabaseData: usuarioSupabase
      });

    } catch (error: any) {
      console.error('Erro crítico no cadastro de aluno:', error);
      return res.status(500).json({
        message: 'Erro interno ao cadastrar perfil do estudante.',
        error: error.message,
      });
    }
  }

  static async listAll(req: Request, res: Response): Promise<Response> {
    try {
      const director = req.user?.role === 'director'
        ? await DirectorProfile.findOne({ userId: req.user.id }).lean()
        : null;
      const adminScope = req.user?.role === 'admin' ? await getAdminScope(req.user.id) : null;
      if (req.user?.role === 'admin' && !adminScope) {
        return res.status(403).json({ message: 'Administrador municipal sem cidade configurada.' });
      }
      const filter = director
        ? { institutionId: director.institutionId }
        : adminScope
          ? { institutionId: { $in: adminScope.institutionIds } }
          : {};
      const students = await StudentProfile.find(filter)
        .select('+avatarData +avatarMimeType')
        .populate('institutionId', 'nome')
        .lean();
      return res.status(200).json(students.map((student) => {
        const populatedInstitution = student.institutionId as unknown as {
          nome?: string;
        } | null;
        const institutionName =
          populatedInstitution?.nome ?? 'Instituição não informada';
        const avatar = student.avatarData && student.avatarMimeType
          ? `data:${student.avatarMimeType};base64,${student.avatarData.toString('base64')}`
          : undefined;
        const { avatarData: _avatarData, ...safeStudent } = student;
        return {
          ...safeStudent,
          institutionName,
          nomeInstituicao: institutionName,
          id: String(student._id),
          avatar,
        };
      }));
    } catch (error: any) {
      return res.status(500).json({
        message: 'Erro ao buscar estudantes.',
        error: error.message,
      });
    }
  }

  static async getById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const student = await StudentProfile.findById(id);

      if (!student) {
        return res.status(404).json({ message: 'Estudante não encontrado.' });
      }

      return res.status(200).json(student);
    } catch (error: any) {
      return res.status(500).json({
        message: 'Erro ao buscar estudante.',
        error: error.message,
      });
    }
  }

  static async proximos(req: Request, res: Response): Promise<Response> {
    try {
      const { lat, lng, raioKm } = req.query as unknown as GeoSearchQuery;
      const raioEmMetros = raioKm * 1000;
      const raioEmRadianos = raioEmMetros / 6378100;

      const students = await StudentProfile.find({
        location: {
          $geoWithin: {
            $centerSphere: [[lng, lat], raioEmRadianos],
          },
        },
      }).lean();

      const data = students.map((student) => toStudentGeoDTO(student as any));

      return res.status(200).json({
        count: data.length,
        data,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: 'Erro ao buscar estudantes próximos.',
        error: error.message,
      });
    }
  }

  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const student = await StudentProfile.findById(req.params.id);
      if (!student) return res.status(404).json({ message: 'Aluno nÃ£o encontrado.' });
      if (req.user?.role === 'director') {
        const director = await DirectorProfile.findOne({ userId: req.user.id }).lean();
        if (!director || String(director.institutionId) !== String(student.institutionId)) {
          return res.status(403).json({ message: 'Aluno fora da sua escola.' });
        }
        req.body.institutionId = String(director.institutionId);
      }
      if (req.user?.role === 'admin') {
        const scope = await getAdminScope(req.user.id);
        if (!scope || !scope.institutionIds.some((id) => String(id) === String(student.institutionId))) {
          return res.status(403).json({ message: 'Aluno fora da cidade administrada.' });
        }
        if (req.body.institutionId && !scope.institutionIds.some((id) => String(id) === String(req.body.institutionId))) {
          return res.status(403).json({ message: 'A escola deve pertencer Ã  cidade administrada.' });
        }
      }
      if (req.body.institutionId && String(req.body.institutionId) !== String(student.institutionId)) {
        const institution = await Institution.findById(req.body.institutionId).lean();
        if (!institution) return res.status(404).json({ message: 'Nova escola nÃ£o encontrada.' });
        student.location = {
          type: 'Point',
          coordinates: [...institution.location.coordinates] as [number, number],
        };
      }
      const allowed = ['name', 'enderecoResidencial', 'tipoDeficiencia', 'necessidadesAcessibilidade', 'institutionId'];
      for (const field of allowed) if (req.body[field] !== undefined) (student as any)[field] = req.body[field];
      await student.save();
      return res.json({ ...student.toObject(), id: String(student._id) });
    } catch (error: any) {
      return res.status(500).json({ message: 'Erro ao editar aluno.', error: error.message });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      if (!supabaseAdmin) {
        return res.status(503).json({
          message: 'Exclusão de usuários indisponível. Configure SUPABASE_SERVICE_ROLE_KEY.',
        });
      }
      const student = await StudentProfile.findById(req.params.id);
      if (!student) return res.status(404).json({ message: 'Aluno não encontrado.' });

      if (req.user?.role === 'director') {
        const director = await DirectorProfile.findOne({ userId: req.user.id }).lean();
        if (!director || String(director.institutionId) !== String(student.institutionId)) {
          return res.status(403).json({ message: 'Aluno fora da sua escola.' });
        }
      }
      if (req.user?.role === 'admin') {
        const scope = await getAdminScope(req.user.id);
        if (!scope || !scope.institutionIds.some((id) => String(id) === String(student.institutionId))) {
          return res.status(403).json({ message: 'Aluno fora da cidade administrada.' });
        }
      }

      const { error: tableError } = await supabaseAdmin
        .from('usuarios')
        .delete()
        .eq('mongo_profile_id', String(student._id));
      if (tableError) {
        return res.status(502).json({ message: 'Não foi possível remover o cadastro relacional.', error: tableError.message });
      }
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(student.userId);
      if (authError) {
        return res.status(502).json({ message: 'Não foi possível remover as credenciais.', error: authError.message });
      }
      await student.deleteOne();
      return res.status(200).json({ message: 'Aluno excluído com sucesso.' });
    } catch (error: any) {
      return res.status(500).json({ message: 'Erro ao excluir aluno.', error: error.message });
    }
  }
}
