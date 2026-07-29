import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { MonitorProfile } from '../models/mongodb/MonitorProfile';
import { Session } from '../models/mongodb/Session';
import { SessionActivity } from '../models/mongodb/SessionActivity';
import { StudentProfile } from '../models/mongodb/StudentProfile';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function detectMimeType(
  data: Buffer,
): 'application/pdf' | 'image/jpeg' | 'image/png' | null {
  if (data.subarray(0, 5).toString('ascii') === '%PDF-') {
    return 'application/pdf';
  }
  if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) {
    return 'image/jpeg';
  }
  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (data.subarray(0, 8).equals(pngSignature)) {
    return 'image/png';
  }
  return null;
}

function safeFileName(value: unknown): string {
  const name = typeof value === 'string' ? value.trim() : '';
  return name
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_')
    .slice(0, 150) || 'atividade';
}

async function userProfiles(userId?: string) {
  if (!userId) {
    return { student: null, monitor: null };
  }

  const [student, monitor] = await Promise.all([
    StudentProfile.findOne({ userId }).lean(),
    MonitorProfile.findOne({ userId }).lean(),
  ]);
  return { student, monitor };
}

export const SessionActivityController = {
  async upload(req: Request, res: Response): Promise<Response> {
    try {
      const sessionId = typeof req.params.id === 'string' ? req.params.id : '';
      const { originalName, contentBase64 } = req.body as {
        originalName?: unknown;
        contentBase64?: unknown;
      };

      if (!Types.ObjectId.isValid(sessionId)) {
        return res.status(400).json({ message: 'Sessão inválida.' });
      }
      if (typeof contentBase64 !== 'string' || !contentBase64.trim()) {
        return res.status(400).json({ message: 'Selecione um arquivo para enviar.' });
      }

      const { student } = await userProfiles(req.user?.id);
      if (!student) {
        return res.status(403).json({
          message: 'Somente alunos podem enviar atividades.',
        });
      }

      const session = await Session.findById(sessionId).lean();
      if (!session || session.alunoId !== String(student._id)) {
        return res.status(404).json({ message: 'Sessão não encontrada para este aluno.' });
      }

      const base64 = contentBase64.replace(/^data:[^;]+;base64,/, '');
      const data = Buffer.from(base64, 'base64');
      if (!data.length || data.length > MAX_FILE_SIZE) {
        return res.status(400).json({
          message: 'O arquivo deve possuir no máximo 5 MB.',
        });
      }

      const mimeType = detectMimeType(data);
      if (!mimeType) {
        return res.status(400).json({
          message: 'Formato inválido. Envie somente PDF, JPEG ou PNG.',
        });
      }

      const activity = await SessionActivity.create({
        sessionId,
        alunoId: session.alunoId,
        monitorId: session.monitorId,
        originalName: safeFileName(originalName),
        mimeType,
        size: data.length,
        data,
      });

      return res.status(201).json({
        id: String(activity._id),
        sessionId: activity.sessionId,
        originalName: activity.originalName,
        mimeType: activity.mimeType,
        size: activity.size,
        createdAt: activity.createdAt,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao enviar atividade.';
      return res.status(500).json({ message });
    }
  },

  async list(req: Request, res: Response): Promise<Response> {
    try {
      const { student, monitor } = await userProfiles(req.user?.id);
      const filter = student
        ? { alunoId: String(student._id) }
        : monitor
          ? { monitorId: String(monitor._id) }
          : null;
      if (!filter) {
        return res.status(200).json([]);
      }

      const activities = await SessionActivity.find(filter)
        .sort({ createdAt: -1 })
        .lean();
      return res.status(200).json(activities.map((activity) => ({
        id: String(activity._id),
        sessionId: activity.sessionId,
        originalName: activity.originalName,
        mimeType: activity.mimeType,
        size: activity.size,
        createdAt: activity.createdAt,
      })));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao listar atividades.';
      return res.status(500).json({ message });
    }
  },

  async download(req: Request, res: Response): Promise<Response> {
    try {
      const activityId =
        typeof req.params.activityId === 'string' ? req.params.activityId : '';
      if (!Types.ObjectId.isValid(activityId)) {
        return res.status(400).json({ message: 'Atividade inválida.' });
      }

      const { student, monitor } = await userProfiles(req.user?.id);
      const activity = await SessionActivity.findById(activityId)
        .select('+data')
        .lean();
      const authorized = activity && (
        (student && activity.alunoId === String(student._id))
        || (monitor && activity.monitorId === String(monitor._id))
      );
      if (!activity || !authorized) {
        return res.status(404).json({ message: 'Atividade não encontrada.' });
      }

      res.setHeader('Content-Type', activity.mimeType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${safeFileName(activity.originalName)}"`,
      );
      res.setHeader('Content-Length', String(activity.size));
      return res.status(200).send(activity.data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao baixar atividade.';
      return res.status(500).json({ message });
    }
  },
};
