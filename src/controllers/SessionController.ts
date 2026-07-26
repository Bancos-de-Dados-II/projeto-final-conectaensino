import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { supabase } from '../config/supabase';
import { MonitorProfile } from '../models/mongodb/MonitorProfile';
import { Session } from '../models/mongodb/Session';
import { StudentProfile } from '../models/mongodb/StudentProfile';

type SessionCreateBody = {
  alunoId?: string;
  monitorId?: string;
  disciplinaId?: string;
  dataHora?: string;
  tipoLocal?: 'casa_aluno' | 'escola' | 'local_publico';
  enderecoEncontro?: string;
  locationMeeting?: {
    type?: 'Point';
    coordinates?: [number, number];
  };
};

type SessionStatus = 'pendente' | 'confirmada' | 'em_andamento' | 'aguardando_avaliacao' | 'finalizada' | 'cancelada';

const allowedTransitions: Record<SessionStatus, SessionStatus[]> = {
  pendente: ['confirmada', 'cancelada'],
  confirmada: ['em_andamento', 'cancelada'],
  em_andamento: ['aguardando_avaliacao', 'cancelada'],
  aguardando_avaliacao: ['finalizada', 'cancelada'],
  finalizada: [],
  cancelada: [],
};

function isValidSessionStatus(value: unknown): value is SessionStatus {
  return value === 'pendente'
    || value === 'confirmada'
    || value === 'em_andamento'
    || value === 'aguardando_avaliacao'
    || value === 'finalizada'
    || value === 'cancelada';
}

function isValidObjectId(value: string): boolean {
  return Types.ObjectId.isValid(value);
}

export const SessionController = {
  async solicitarAula(req: Request, res: Response): Promise<Response> {
    try {
      const body = req.body as SessionCreateBody;
      const alunoId = typeof body.alunoId === 'string' ? body.alunoId.trim() : '';
      const monitorId = typeof body.monitorId === 'string' ? body.monitorId.trim() : '';
      const disciplinaId = typeof body.disciplinaId === 'string' ? body.disciplinaId.trim() : '';
      const dataHora = body.dataHora ? new Date(body.dataHora) : null;
      const tipoLocal = body.tipoLocal;
      const enderecoEncontro = typeof body.enderecoEncontro === 'string' ? body.enderecoEncontro.trim() : '';
      const locationMeeting = body.locationMeeting;

      if (!alunoId || !monitorId || !disciplinaId || !body.dataHora || !tipoLocal || !enderecoEncontro || !locationMeeting) {
        return res.status(400).json({ message: 'Todos os campos da sessão são obrigatórios.' });
      }

      if (!isValidObjectId(alunoId) || !isValidObjectId(monitorId)) {
        return res.status(400).json({ message: 'alunoId e monitorId devem ser ObjectIds válidos do MongoDB.' });
      }

      if (!dataHora || Number.isNaN(dataHora.getTime())) {
        return res.status(400).json({ message: 'dataHora inválida.' });
      }

      if (!locationMeeting.type || locationMeeting.type !== 'Point' || !Array.isArray(locationMeeting.coordinates) || locationMeeting.coordinates.length !== 2) {
        return res.status(400).json({ message: 'locationMeeting deve seguir o formato GeoJSON Point.' });
      }

      const student = await StudentProfile.findById(alunoId);
      if (!student) {
        return res.status(404).json({ message: 'Aluno não encontrado no MongoDB.' });
      }

      const monitor = await MonitorProfile.findById(monitorId);
      if (!monitor) {
        return res.status(404).json({ message: 'Monitor não encontrado no MongoDB.' });
      }

      const { data: disciplina, error: disciplinaError } = await supabase
        .from('disciplinas')
        .select('id')
        .eq('id', disciplinaId)
        .single();

      if (disciplinaError || !disciplina) {
        return res.status(404).json({ message: 'Disciplina não encontrada no Supabase.' });
      }

      const session = await Session.create({
        alunoId,
        monitorId,
        disciplinaId,
        dataHora,
        tipoLocal,
        enderecoEncontro,
        locationMeeting: {
          type: 'Point',
          coordinates: locationMeeting.coordinates,
        },
        status: 'pendente',
      });

      return res.status(201).json({
        session,
        aluno: student,
        monitor,
        disciplina,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro interno ao solicitar aula.';
      return res.status(500).json({ message });
    }
  },

  async atualizarStatus(req: Request, res: Response): Promise<Response> {
    try {
      const id = typeof req.params.id === 'string' ? req.params.id : '';
      const { status } = req.body as { status?: SessionStatus };

      if (!isValidObjectId(id)) {
        return res.status(400).json({ message: 'ID da sessão inválido.' });
      }

      if (!isValidSessionStatus(status)) {
        return res.status(400).json({ message: 'Status inválido.' });
      }

      const session = await Session.findById(id);
      if (!session) {
        return res.status(404).json({ message: 'Sessão não encontrada.' });
      }

      const currentStatus = session.status as SessionStatus;
      const nextStatuses = allowedTransitions[currentStatus] ?? [];

      if (currentStatus === status) {
        return res.status(200).json(session);
      }

      if (!nextStatuses.includes(status)) {
        return res.status(400).json({
          message: `Transição de status inválida: ${currentStatus} -> ${status}.`,
        });
      }

      session.status = status;
      await session.save();

      return res.status(200).json(session);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro interno ao atualizar status da sessão.';
      return res.status(500).json({ message });
    }
  },
};
