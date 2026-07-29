import { Request, Response } from 'express';
import { DirectorMessage } from '../models/mongodb/DirectorMessage';
import { DirectorNote } from '../models/mongodb/DirectorNote';
import { DirectorProfile } from '../models/mongodb/DirectorProfile';
import { Institution } from '../models/mongodb/Institution';
import { MonitorProfile } from '../models/mongodb/MonitorProfile';
import { Session } from '../models/mongodb/Session';
import { StudentProfile } from '../models/mongodb/StudentProfile';
import { Task } from '../models/mongodb/Task';

async function context(userId?: string) {
  const director = userId
    ? await DirectorProfile.findOne({ userId }).lean()
    : null;
  if (!director) return null;
  const institution = await Institution.findById(director.institutionId).lean();
  if (!institution) return null;
  return { director, institution };
}

async function nearbyInstitutionIds(coordinates: [number, number]) {
  const institutions = await Institution.find({
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates },
        $maxDistance: 100_000,
      },
    },
  }).select('_id').lean();
  return institutions.map((item) => item._id);
}

function avatar(profile: { avatarData?: Buffer; avatarMimeType?: string }) {
  return profile.avatarData && profile.avatarMimeType
    ? `data:${profile.avatarMimeType};base64,${profile.avatarData.toString('base64')}`
    : undefined;
}

export const DirectorDashboardController = {
  async registrationHistory(req: Request, res: Response): Promise<Response> {
    try {
      const data = await context(req.user?.id);
      if (!data) {
        return res.status(404).json({ message: 'Perfil do diretor não encontrado.' });
      }

      const ownershipFilter = {
        institutionId: data.institution._id,
        $or: [
          { createdByDirectorId: req.user?.id },
          { createdByDirectorId: { $exists: false } },
          { createdByDirectorId: null },
        ],
      };
      const [students, monitors] = await Promise.all([
        StudentProfile.find(ownershipFilter).lean(),
        MonitorProfile.find(ownershipFilter).lean(),
      ]);
      const createdAt = (item: { _id: unknown; createdAt?: Date }) =>
        item.createdAt
        ?? (item._id as { getTimestamp?: () => Date }).getTimestamp?.()
        ?? new Date(0);

      const entries = [
        ...students.map((student) => ({
          id: String(student._id),
          type: 'student' as const,
          name: student.name || student.email || 'Aluno',
          email: student.email || '',
          institutionName: data.institution.nome,
          createdAt: createdAt(student),
          legacy: !student.createdByDirectorId,
        })),
        ...monitors.map((monitor) => ({
          id: String(monitor._id),
          type: 'monitor' as const,
          name: monitor.name || monitor.email || 'Monitor',
          email: monitor.email || '',
          institutionName: data.institution.nome,
          createdAt: createdAt(monitor),
          legacy: !monitor.createdByDirectorId,
        })),
      ]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 100);

      return res.status(200).json(entries);
    } catch (error: unknown) {
      return res.status(500).json({
        message: error instanceof Error
          ? error.message
          : 'Erro ao carregar histórico de cadastros.',
      });
    }
  },

  async students(req: Request, res: Response): Promise<Response> {
    try {
      const data = await context(req.user?.id);
      if (!data) return res.status(404).json({ message: 'Perfil do diretor não encontrado.' });
      const students = await StudentProfile.find({
        institutionId: data.institution._id,
      })
        .select('+avatarData +avatarMimeType')
        .populate('institutionId', 'nome')
        .lean();
      return res.status(200).json(students.map((student) => ({
        ...student,
        id: String(student._id),
        name: student.name || student.email || 'Aluno',
        institutionName: data.institution.nome,
        nomeInstituicao: data.institution.nome,
        avatar: avatar(student),
      })));
    } catch (error: unknown) {
      return res.status(500).json({ message: error instanceof Error ? error.message : 'Erro ao listar alunos.' });
    }
  },

  async monitors(req: Request, res: Response): Promise<Response> {
    try {
      const data = await context(req.user?.id);
      if (!data) return res.status(404).json({ message: 'Perfil do diretor não encontrado.' });
      const monitors = await MonitorProfile.find({
        institutionId: data.institution._id,
      })
        .select('+avatarData +avatarMimeType')
        .populate('institutionId', 'nome')
        .lean();
      return res.status(200).json(monitors.map((monitor) => ({
        ...monitor,
        id: String(monitor._id),
        name: monitor.name || monitor.email || 'Monitor',
        institutionName: data.institution.nome,
        nomeInstituicao: data.institution.nome,
        avatar: avatar(monitor),
      })));
    } catch (error: unknown) {
      return res.status(500).json({ message: error instanceof Error ? error.message : 'Erro ao listar monitores.' });
    }
  },

  async dashboard(req: Request, res: Response): Promise<Response> {
    try {
      const data = await context(req.user?.id);
      if (!data) return res.status(404).json({ message: 'Perfil do diretor não encontrado.' });
      const [students, monitors] = await Promise.all([
        StudentProfile.find({ institutionId: data.institution._id }).lean(),
        MonitorProfile.find({ institutionId: data.institution._id }).lean(),
      ]);
      const studentIds = students.map((item) => String(item._id));
      const monitorIds = monitors.map((item) => String(item._id));
      const [sessions, tasks] = await Promise.all([
        Session.find({ monitorId: { $in: monitorIds } }).lean(),
        Task.find({
          $or: [
            { studentId: { $in: studentIds } },
            { monitorId: { $in: monitorIds } },
          ],
        }).lean(),
      ]);
      const performance = (id: string, type: 'student' | 'monitor') => {
        const own = tasks.filter((task) =>
          type === 'student' ? task.studentId === id : task.monitorId === id,
        );
        const completed = own.filter((task) => task.status === 'completed').length;
        return {
          total: own.length,
          completed,
          percentage: own.length ? Math.round((completed / own.length) * 100) : 0,
        };
      };
      return res.status(200).json({
        institution: { id: String(data.institution._id), name: data.institution.nome },
        students: students.map((item) => ({
          id: String(item._id),
          name: item.name || item.email || 'Aluno',
          email: item.email || '',
          performance: performance(String(item._id), 'student'),
        })),
        monitors: monitors.map((item) => ({
          id: String(item._id),
          name: item.name || item.email || 'Monitor',
          email: item.email || '',
          active: item.ativo !== false,
          performance: performance(String(item._id), 'monitor'),
        })),
        sessionCount: sessions.length,
        completedSessionCount: sessions.filter((item) => item.status === 'finalizada').length,
      });
    } catch (error: unknown) {
      return res.status(500).json({ message: error instanceof Error ? error.message : 'Erro no dashboard.' });
    }
  },

  async notes(req: Request, res: Response): Promise<Response> {
    const data = await context(req.user?.id);
    if (!data) return res.status(404).json({ message: 'Diretor não encontrado.' });
    const notes = await DirectorNote.find({ directorId: String(data.director._id) })
      .sort({ createdAt: -1 }).lean();
    return res.status(200).json(notes);
  },

  async createNote(req: Request, res: Response): Promise<Response> {
    const data = await context(req.user?.id);
    const content = typeof req.body?.content === 'string' ? req.body.content.trim() : '';
    if (!data) return res.status(404).json({ message: 'Diretor não encontrado.' });
    if (!content) return res.status(400).json({ message: 'Escreva uma anotação.' });
    const note = await DirectorNote.create({ directorId: String(data.director._id), content });
    return res.status(201).json(note);
  },

  async deleteNote(req: Request, res: Response): Promise<Response> {
    const data = await context(req.user?.id);
    if (!data) return res.status(404).json({ message: 'Diretor não encontrado.' });
    const removed = await DirectorNote.findOneAndDelete({
      _id: req.params.id,
      directorId: String(data.director._id),
    });
    if (!removed) return res.status(404).json({ message: 'Anotação não encontrada.' });
    return res.status(204).send();
  },

  async messages(req: Request, res: Response): Promise<Response> {
    const data = await context(req.user?.id);
    if (!data) return res.status(404).json({ message: 'Diretor não encontrado.' });
    const ids = await nearbyInstitutionIds(data.institution.location.coordinates);
    const messages = await DirectorMessage.find({ institutionId: { $in: ids } })
      .sort({ createdAt: -1 }).limit(100).lean();
    return res.status(200).json(messages.reverse());
  },

  async sendMessage(req: Request, res: Response): Promise<Response> {
    const data = await context(req.user?.id);
    const content = typeof req.body?.content === 'string' ? req.body.content.trim() : '';
    if (!data) return res.status(404).json({ message: 'Diretor não encontrado.' });
    if (!content) return res.status(400).json({ message: 'Escreva uma mensagem.' });
    const message = await DirectorMessage.create({
      directorId: String(data.director._id),
      senderName: data.director.name || data.director.email || 'Diretor(a)',
      institutionId: data.institution._id,
      institutionName: data.institution.nome,
      content,
    });
    return res.status(201).json(message);
  },
};
