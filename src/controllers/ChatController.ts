import { Request, Response } from 'express';
import { ChatMessage } from '../models/mongodb/ChatMessage';
import { MonitorProfile } from '../models/mongodb/MonitorProfile';
import { Session } from '../models/mongodb/Session';
import { StudentProfile } from '../models/mongodb/StudentProfile';

const conversationId = (studentId: string, monitorId: string) =>
  `${studentId}--${monitorId}`;

function avatarDataUrl(profile: {
  avatarData?: Buffer;
  avatarMimeType?: string;
}) {
  return profile.avatarData && profile.avatarMimeType
    ? `data:${profile.avatarMimeType};base64,${profile.avatarData.toString('base64')}`
    : undefined;
}

async function currentProfile(userId?: string) {
  if (!userId) return null;
  const [student, monitor] = await Promise.all([
    StudentProfile.findOne({ userId }).lean(),
    MonitorProfile.findOne({ userId }).lean(),
  ]);
  if (student) {
    return { role: 'student' as const, id: String(student._id), profile: student };
  }
  if (monitor) {
    return { role: 'monitor' as const, id: String(monitor._id), profile: monitor };
  }
  return null;
}

function parseConversation(value: string) {
  const [studentId, monitorId, extra] = value.split('--');
  if (
    extra
    || !/^[0-9a-fA-F]{24}$/.test(studentId ?? '')
    || !/^[0-9a-fA-F]{24}$/.test(monitorId ?? '')
  ) {
    return null;
  }
  return { studentId, monitorId };
}

async function linked(studentId: string, monitorId: string) {
  return Boolean(await Session.exists({
    alunoId: studentId,
    monitorId,
    status: { $ne: 'cancelada' },
  }));
}

async function authorize(req: Request, id: string) {
  const pair = parseConversation(id);
  const current = await currentProfile(req.user?.id);
  if (!pair || !current) return null;
  const belongs =
    (current.role === 'student' && current.id === pair.studentId)
    || (current.role === 'monitor' && current.id === pair.monitorId);
  if (!belongs || !(await linked(pair.studentId, pair.monitorId))) return null;
  return { ...pair, current };
}

function messageResponse(
  message: {
    _id: unknown;
    conversationId: string;
    senderId: string;
    senderRole: 'student' | 'monitor';
    content: string;
    createdAt: Date;
    readBy?: string[];
  },
  currentId: string,
) {
  return {
    id: String(message._id),
    conversationId: message.conversationId,
    senderId: message.senderId === currentId ? 'me' : message.senderId,
    senderName: message.senderId === currentId ? 'Você' : undefined,
    senderRole: message.senderRole,
    content: message.content,
    createdAt: message.createdAt,
    status: message.readBy?.length ? 'read' : 'sent',
  };
}

export const ChatController = {
  async conversations(req: Request, res: Response): Promise<Response> {
    try {
      const current = await currentProfile(req.user?.id);
      if (!current) {
        return res.status(403).json({ message: 'Perfil sem acesso ao chat.' });
      }
      const sessions = await Session.find({
        ...(current.role === 'student'
          ? { alunoId: current.id }
          : { monitorId: current.id }),
        status: { $ne: 'cancelada' },
      }).sort({ dataHora: -1 }).lean();

      const pairs = new Map<string, typeof sessions[number]>();
      for (const session of sessions) {
        const id = conversationId(session.alunoId, session.monitorId);
        if (!pairs.has(id)) pairs.set(id, session);
      }

      const studentIds = [...new Set(sessions.map((item) => item.alunoId))];
      const monitorIds = [...new Set(sessions.map((item) => item.monitorId))];
      const [students, monitors] = await Promise.all([
        StudentProfile.find({ _id: { $in: studentIds } })
          .select('+avatarData +avatarMimeType')
          .lean(),
        MonitorProfile.find({ _id: { $in: monitorIds } })
          .select('+avatarData +avatarMimeType')
          .lean(),
      ]);
      const studentNames = new Map(
        students.map((item) => [
          String(item._id),
          item.name || item.email || 'Aluno',
        ]),
      );
      const monitorNames = new Map(
        monitors.map((item) => [
          String(item._id),
          item.name || item.email || 'Monitor',
        ]),
      );
      const studentAvatars = new Map(
        students.map((item) => [String(item._id), avatarDataUrl(item)]),
      );
      const monitorAvatars = new Map(
        monitors.map((item) => [String(item._id), avatarDataUrl(item)]),
      );
      const studentLastLogins = new Map(
        students.map((item) => [
          String(item._id),
          item.lastLoginAt?.toISOString(),
        ]),
      );
      const monitorLastLogins = new Map(
        monitors.map((item) => [
          String(item._id),
          item.lastLoginAt?.toISOString(),
        ]),
      );

      const items = await Promise.all(
        [...pairs.entries()].map(async ([id, session]) => {
          const [lastMessage, unreadCount, studentStarted] = await Promise.all([
            ChatMessage.findOne({ conversationId: id })
              .sort({ createdAt: -1 })
              .lean(),
            ChatMessage.countDocuments({
              conversationId: id,
              senderId: { $ne: current.id },
              readBy: { $ne: current.id },
            }),
            ChatMessage.exists({
              conversationId: id,
              senderRole: 'student',
            }),
          ]);
          const participantId =
            current.role === 'student' ? session.monitorId : session.alunoId;
          return {
            id,
            participant: {
              id: participantId,
              name:
                current.role === 'student'
                  ? monitorNames.get(participantId) ?? 'Monitor'
                  : studentNames.get(participantId) ?? 'Aluno',
              avatar:
                current.role === 'student'
                  ? monitorAvatars.get(participantId)
                  : studentAvatars.get(participantId),
              lastSeen:
                current.role === 'student'
                  ? monitorLastLogins.get(participantId)
                  : studentLastLogins.get(participantId),
              role: current.role === 'student' ? 'Monitor' : 'Aluno',
            },
            lastMessage: lastMessage?.content ?? '',
            lastMessageAt: lastMessage?.createdAt ?? session.updatedAt,
            unreadCount,
            sessionId: String(session._id),
            subject: session.disciplinaId,
            studentStarted: Boolean(studentStarted),
          };
        }),
      );
      return res.status(200).json(
        items
          .filter(
            (item) =>
              current.role !== 'monitor' || item.studentStarted,
          )
          .map(({ studentStarted: _studentStarted, ...item }) => item),
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao carregar conversas.';
      return res.status(500).json({ message });
    }
  },

  async messages(req: Request, res: Response): Promise<Response> {
    try {
      const id = String(req.params.conversationId ?? '');
      const access = await authorize(req, id);
      if (!access) {
        return res.status(403).json({ message: 'Conversa não autorizada.' });
      }
      const messages = await ChatMessage.find({ conversationId: id })
        .sort({ createdAt: 1 })
        .limit(500)
        .lean();
      return res.status(200).json(
        messages.map((item) => messageResponse(item, access.current.id)),
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao carregar mensagens.';
      return res.status(500).json({ message });
    }
  },

  async send(req: Request, res: Response): Promise<Response> {
    try {
      const id =
        typeof req.body?.conversation_id === 'string'
          ? req.body.conversation_id
          : '';
      const content =
        typeof req.body?.content === 'string' ? req.body.content.trim() : '';
      if (!content || content.length > 2000) {
        return res.status(400).json({
          message: 'A mensagem deve possuir entre 1 e 2000 caracteres.',
        });
      }
      const access = await authorize(req, id);
      if (!access) {
        return res.status(403).json({
          message: 'É necessário possuir vínculo de monitoria para conversar.',
        });
      }
      if (access.current.role === 'monitor') {
        const studentStarted = await ChatMessage.exists({
          conversationId: id,
          senderRole: 'student',
        });
        if (!studentStarted) {
          return res.status(403).json({
            message:
              'O monitor só pode responder depois que o aluno iniciar o contato.',
          });
        }
      }
      const saved = await ChatMessage.create({
        conversationId: id,
        studentId: access.studentId,
        monitorId: access.monitorId,
        senderId: access.current.id,
        senderRole: access.current.role,
        content,
        readBy: [access.current.id],
      });
      return res.status(201).json(
        messageResponse(saved, access.current.id),
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao enviar mensagem.';
      return res.status(500).json({ message });
    }
  },

  async read(req: Request, res: Response): Promise<Response> {
    try {
      const id = String(req.params.conversationId ?? '');
      const access = await authorize(req, id);
      if (!access) {
        return res.status(403).json({ message: 'Conversa não autorizada.' });
      }
      await ChatMessage.updateMany(
        { conversationId: id, readBy: { $ne: access.current.id } },
        { $addToSet: { readBy: access.current.id } },
      );
      return res.status(200).json({ message: 'Conversa marcada como lida.' });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao atualizar conversa.';
      return res.status(500).json({ message });
    }
  },
};
