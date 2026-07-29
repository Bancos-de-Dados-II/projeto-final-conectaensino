import { Request, Response } from 'express';
import { MonitorProfile } from '../models/mongodb/MonitorProfile';
import { Session } from '../models/mongodb/Session';
import { StudentProfile } from '../models/mongodb/StudentProfile';
import { Task } from '../models/mongodb/Task';
import { supabase, supabaseAdmin } from '../config/supabase';

async function profiles(userId?: string) {
  if (!userId) return { monitor: null, student: null };
  const [monitor, student] = await Promise.all([
    MonitorProfile.findOne({ userId }).lean(),
    StudentProfile.findOne({ userId }).lean(),
  ]);
  return { monitor, student };
}

async function eligibleStudents(monitorId: string) {
  const sessions = await Session.find({ monitorId })
    .select('alunoId')
    .lean();
  const studentIds = [...new Set(sessions.map((session) => session.alunoId))];
  if (!studentIds.length) return [];

  const students = await StudentProfile.find({
    _id: { $in: studentIds },
  }).lean();
  const { data: users } = await supabase
    .from('usuarios')
    .select('id,email,mongo_profile_id');
  const userByProfile = new Map(
    (users ?? []).map((user) => [
      String(user.mongo_profile_id ?? ''),
      user,
    ]),
  );

  const authNames = new Map<string, string>();
  const adminClient = supabaseAdmin;
  if (adminClient) {
    await Promise.all(
      students.map(async (student) => {
        try {
          const { data } = await adminClient.auth.admin.getUserById(student.userId);
          const metadata = data.user?.user_metadata;
          const name =
            typeof metadata?.name === 'string'
              ? metadata.name
              : typeof metadata?.full_name === 'string'
                ? metadata.full_name
                : '';
          if (name) authNames.set(student.userId, name);
        } catch {
        }
      }),
    );
  }

  return students.map((student) => {
    const account = userByProfile.get(String(student._id));
    const email = String(student.email ?? account?.email ?? '');
    return {
      id: String(student._id),
      userId: student.userId,
      name:
        student.name
        ?? authNames.get(student.userId)
        ?? (email ? email.split('@')[0] : 'Aluno'),
      email,
    };
  });
}

export const TaskController = {
  async students(req: Request, res: Response): Promise<Response> {
    try {
      const { monitor } = await profiles(req.user?.id);
      if (!monitor) {
        return res.status(403).json({
          message: 'Somente monitores podem consultar alunos designados.',
        });
      }
      return res.status(200).json(await eligibleStudents(String(monitor._id)));
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao carregar alunos.';
      return res.status(500).json({ message });
    }
  },

  async create(req: Request, res: Response): Promise<Response> {
    try {
      const { title, subject, description, studentId } = req.body as {
        title?: unknown;
        subject?: unknown;
        description?: unknown;
        studentId?: unknown;
      };
      const cleanTitle = typeof title === 'string' ? title.trim() : '';
      const cleanSubject = typeof subject === 'string' ? subject.trim() : '';
      const cleanDescription =
        typeof description === 'string' ? description.trim() : '';
      const cleanStudentId =
        typeof studentId === 'string' ? studentId.trim() : '';

      if (!cleanTitle || !cleanSubject || !cleanStudentId) {
        return res.status(400).json({
          message: 'Aluno, disciplina e título são obrigatórios.',
        });
      }

      const { monitor } = await profiles(req.user?.id);
      if (!monitor) {
        return res.status(403).json({
          message: 'Somente monitores podem criar atividades.',
        });
      }

      const students = await eligibleStudents(String(monitor._id));
      const student = students.find((item) => item.id === cleanStudentId);
      if (!student) {
        return res.status(403).json({
          message: 'O aluno selecionado não possui sessão com este monitor.',
        });
      }

      const task = await Task.create({
        title: cleanTitle,
        subject: cleanSubject,
        description: cleanDescription,
        studentId: student.id,
        studentName: student.name,
        studentEmail: student.email || undefined,
        monitorId: String(monitor._id),
        monitorName: monitor.name ?? 'Monitor',
        status: 'pending',
      });
      return res.status(201).json(task);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao criar atividade.';
      return res.status(500).json({ message });
    }
  },

  async list(req: Request, res: Response): Promise<Response> {
    try {
      const { monitor, student } = await profiles(req.user?.id);
      const filter = monitor
        ? { monitorId: String(monitor._id) }
        : student
          ? { studentId: String(student._id) }
          : null;
      if (!filter) return res.status(200).json([]);

      const tasks = await Task.find(filter).sort({ createdAt: -1 }).lean();
      if (!monitor) return res.status(200).json(tasks);

      const students = await eligibleStudents(String(monitor._id));
      const studentNames = new Map(
        students.map((item) => [item.id, item.name]),
      );
      return res.status(200).json(
        tasks.map((task) => ({
          ...task,
          studentName: studentNames.get(task.studentId) ?? task.studentName,
        })),
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao listar atividades.';
      return res.status(500).json({ message });
    }
  },

  async updateStatus(req: Request, res: Response): Promise<Response> {
    try {
      const id = typeof req.params.id === 'string' ? req.params.id : '';
      const status = req.body?.status as unknown;
      if (
        status !== 'pending'
        && status !== 'in_progress'
        && status !== 'completed'
      ) {
        return res.status(400).json({ message: 'Status inválido.' });
      }

      const task = await Task.findById(id);
      if (!task) {
        return res.status(404).json({ message: 'Atividade não encontrada.' });
      }
      const { monitor, student } = await profiles(req.user?.id);
      const authorized =
        task.monitorId === String(monitor?._id ?? '')
        || task.studentId === String(student?._id ?? '');
      if (!authorized) {
        return res.status(403).json({
          message: 'Você não possui acesso a esta atividade.',
        });
      }

      task.status = status;
      await task.save();
      return res.status(200).json(task);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao atualizar atividade.';
      return res.status(500).json({ message });
    }
  },
};
