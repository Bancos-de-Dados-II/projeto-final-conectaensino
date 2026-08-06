import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { DirectorProfile } from '../models/mongodb/DirectorProfile';
import { Institution } from '../models/mongodb/Institution';
import { MonitorProfile } from '../models/mongodb/MonitorProfile';
import { Session } from '../models/mongodb/Session';
import { StudentProfile } from '../models/mongodb/StudentProfile';

type SessionCreateBody = {
  monitorId?: string;
  disciplinaId?: string;
  dataHora?: string;
  tipoLocal?: 'casa_aluno' | 'escola' | 'local_publico';
  institutionId?: string;
  enderecoEncontro?: string;
  locationMeeting?: {
    type?: 'Point';
    coordinates?: [number, number];
  };
};

const PERIOD_SLOTS = {
  matutino: ['07:00', '08:00', '09:00', '10:00', '11:00'],
  vespertino: ['13:00', '14:00', '15:00', '16:00', '17:00'],
  noturno: ['18:00', '19:00', '20:00', '21:00'],
} as const;

const ALL_SLOTS = Object.values(PERIOD_SLOTS).flat();

function datePartsInSaoPaulo(date: Date): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';

  return {
    date: `${value('year')}-${value('month')}-${value('day')}`,
    time: `${value('hour')}:${value('minute')}`,
  };
}

function normalizeAvailability(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
}

function slotsAllowedByMonitor(availability: string[], requestedDate: string): string[] {
  if (!availability.length) {
    return ALL_SLOTS;
  }

  const weekday = normalizeAvailability(
    new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      weekday: 'long',
    }).format(new Date(`${requestedDate}T12:00:00-03:00`)),
  );
  const dayTokens = [weekday, weekday.split('-')[0]];
  const entriesForDay = availability
    .map(normalizeAvailability)
    .filter((entry) => dayTokens.some((day) => entry.includes(day)));
  const mentionsWeekday = availability
    .map(normalizeAvailability)
    .some((entry) =>
      ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo']
        .some((day) => entry.includes(day)),
    );
  if (mentionsWeekday && entriesForDay.length === 0) {
    return [];
  }
  const relevantEntries = entriesForDay.length
    ? entriesForDay
    : availability.map(normalizeAvailability);
  const recognizedPeriods = (Object.keys(PERIOD_SLOTS) as Array<keyof typeof PERIOD_SLOTS>)
    .filter((period) => relevantEntries.some((entry) =>
      entry.includes(period) || (period === 'matutino' && entry.includes('manha')),
    ));

  return recognizedPeriods.length
    ? recognizedPeriods.flatMap((period) => [...PERIOD_SLOTS[period]])
    : ALL_SLOTS;
}

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
  async listar(req: Request, res: Response): Promise<Response> {
    try {
      const authUserId = req.user?.id;
      if (!authUserId) {
        return res.status(401).json({ message: 'Usuário não autenticado.' });
      }

      const [student, monitor, director] = await Promise.all([
        StudentProfile.findOne({ userId: authUserId }).lean(),
        MonitorProfile.findOne({ userId: authUserId }).lean(),
        DirectorProfile.findOne({ userId: authUserId }).lean(),
      ]);
      let filter: Record<string, unknown> | null = student
        ? { alunoId: String(student._id) }
        : monitor
          ? { monitorId: String(monitor._id) }
          : null;
      if (director) {
        const institutionMonitors = await MonitorProfile.find({
          institutionId: new Types.ObjectId(String(director.institutionId)),
        }).select('_id').lean();
        filter = {
          monitorId: {
            $in: institutionMonitors.map((item) => String(item._id)),
          },
        };
      } else if (req.user?.role?.toLocaleLowerCase('pt-BR') === 'admin') {
        filter = {};
      }
      if (!filter) {
        return res.status(200).json([]);
      }
      const sessions = await Session.find(filter).sort({ dataHora: 1 }).lean();
      const monitorIds = [...new Set(sessions.map((session) => session.monitorId))];
      const studentIds = [...new Set(sessions.map((session) => session.alunoId))];
      const [monitors, students] = await Promise.all([
        MonitorProfile.find({ _id: { $in: monitorIds } }).lean(),
        StudentProfile.find({ _id: { $in: studentIds } }).lean(),
      ]);
      const institutionIds = [
        ...new Set(
          monitors
            .map((item) => item.institutionId)
            .filter(Boolean)
            .map(String),
        ),
      ];
      const institutions = await Institution.find({
        _id: { $in: institutionIds },
      })
        .select('nome')
        .lean();
      const monitorNames = new Map(monitors.map((item) => [String(item._id), item.name ?? 'Monitor']));
      const studentNames = new Map(students.map((item) => [String(item._id), item.userId]));
      const institutionNames = new Map(
        institutions.map((item) => [String(item._id), item.nome]),
      );
      const monitorInstitutionNames = new Map(
        monitors.map((item) => [
          String(item._id),
          institutionNames.get(String(item.institutionId)) ?? 'Instituição não informada',
        ]),
      );

      return res.status(200).json(sessions.map((session) => ({
        ...session,
        monitorName: monitorNames.get(session.monitorId) ?? 'Monitor',
        studentName: studentNames.get(session.alunoId) ?? 'Aluno',
        institutionName:
          monitorInstitutionNames.get(session.monitorId)
          ?? 'Instituição não informada',
      })));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao listar sessões.';
      return res.status(500).json({ message });
    }
  },

  async horariosDisponiveis(req: Request, res: Response): Promise<Response> {
    try {
      const monitorId = typeof req.query.monitorId === 'string' ? req.query.monitorId : '';
      const requestedDate = typeof req.query.data === 'string' ? req.query.data : '';

      if (!isValidObjectId(monitorId) || !/^\d{4}-\d{2}-\d{2}$/.test(requestedDate)) {
        return res.status(400).json({ message: 'Monitor ou data inválidos.' });
      }

      const monitor = await MonitorProfile.findById(monitorId).lean();
      if (!monitor || monitor.ativo === false) {
        return res.status(404).json({ message: 'Monitor não encontrado ou inativo.' });
      }

      const dayStart = new Date(`${requestedDate}T00:00:00-03:00`);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const occupiedSessions = await Session.find({
        monitorId,
        dataHora: { $gte: dayStart, $lt: dayEnd },
        status: { $ne: 'cancelada' },
      }).select('dataHora').lean();
      const occupiedTimes = new Set(
        occupiedSessions.map((session) => datePartsInSaoPaulo(session.dataHora).time),
      );
      const now = new Date();
      const allowedSlots = slotsAllowedByMonitor(monitor.disponibilidade ?? [], requestedDate);

      return res.status(200).json({
        date: requestedDate,
        monitorId,
        periods: Object.fromEntries(
          (Object.entries(PERIOD_SLOTS) as Array<[keyof typeof PERIOD_SLOTS, readonly string[]]>)
            .map(([period, slots]) => [
              period,
              slots.map((time) => {
                const slotDate = new Date(`${requestedDate}T${time}:00-03:00`);
                return {
                  time,
                  available:
                    allowedSlots.includes(time)
                    && !occupiedTimes.has(time)
                    && slotDate.getTime() > now.getTime(),
                };
              }),
            ]),
        ),
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao consultar horários.';
      return res.status(500).json({ message });
    }
  },

  async solicitarAula(req: Request, res: Response): Promise<Response> {
    try {
      const body = req.body as SessionCreateBody;
      const monitorId = typeof body.monitorId === 'string' ? body.monitorId.trim() : '';
      const disciplinaId = typeof body.disciplinaId === 'string' ? body.disciplinaId.trim() : '';
      const dataHora = body.dataHora ? new Date(body.dataHora) : null;
      const tipoLocal = body.tipoLocal;
      const enderecoEncontro = typeof body.enderecoEncontro === 'string' ? body.enderecoEncontro.trim() : '';
      const locationMeeting = body.locationMeeting;
      const institutionId = typeof body.institutionId === 'string' ? body.institutionId.trim() : '';

      if (!monitorId || !disciplinaId || !body.dataHora || !tipoLocal || !enderecoEncontro || !locationMeeting) {
        return res.status(400).json({ message: 'Todos os campos da sessão são obrigatórios.' });
      }

      if (!isValidObjectId(monitorId)) {
        return res.status(400).json({ message: 'monitorId deve ser um ObjectId válido do MongoDB.' });
      }

      if (!dataHora || Number.isNaN(dataHora.getTime())) {
        return res.status(400).json({ message: 'dataHora inválida.' });
      }

      const localDateTime = datePartsInSaoPaulo(dataHora);
      if (!ALL_SLOTS.includes(localDateTime.time as typeof ALL_SLOTS[number])) {
        return res.status(400).json({
          message: 'Horário inválido. Use os horários dos turnos matutino, vespertino ou noturno.',
        });
      }

      if (dataHora.getTime() <= Date.now()) {
        return res.status(400).json({ message: 'Escolha um horário futuro.' });
      }

      if (!locationMeeting.type || locationMeeting.type !== 'Point' || !Array.isArray(locationMeeting.coordinates) || locationMeeting.coordinates.length !== 2) {
        return res.status(400).json({ message: 'locationMeeting deve seguir o formato GeoJSON Point.' });
      }

      const monitor = await MonitorProfile.findById(monitorId);
      if (!monitor) {
        return res.status(404).json({ message: 'Monitor não encontrado no MongoDB.' });
      }
      if (monitor.userId === req.user?.id) {
        return res.status(403).json({
          message: 'Você não pode agendar uma aula consigo mesmo como aluno.',
        });
      }

      const student = await StudentProfile.findOne({ userId: req.user?.id });
      if (!student) {
        return res.status(404).json({ message: 'O usuário autenticado não possui perfil de aluno.' });
      }
      const alunoId = String(student._id);
      let selectedInstitution = null;
      if (tipoLocal === 'escola') {
        if (!isValidObjectId(institutionId)) {
          return res.status(400).json({ message: 'Selecione a instituição onde a aula será realizada.' });
        }
        const allowedInstitutionIds = [monitor.institutionId, student.institutionId]
          .filter(Boolean)
          .map((id) => String(id));
        if (!allowedInstitutionIds.includes(institutionId)) {
          return res.status(403).json({ message: 'A instituição deve pertencer ao aluno ou ao monitor.' });
        }
        selectedInstitution = await Institution.findById(institutionId).lean();
        if (!selectedInstitution || selectedInstitution.ativa === false) {
          return res.status(404).json({ message: 'Instituição não encontrada ou inativa.' });
        }
      }
      const meetingCoordinates = selectedInstitution
        ? selectedInstitution.location.coordinates
        : locationMeeting.coordinates;

      const allowedSlots = slotsAllowedByMonitor(monitor.disponibilidade ?? [], localDateTime.date);
      if (!allowedSlots.includes(localDateTime.time)) {
        return res.status(400).json({ message: 'O monitor não atende nesse turno ou dia.' });
      }

      const conflict = await Session.exists({
        monitorId,
        dataHora,
        status: { $ne: 'cancelada' },
      });
      if (conflict) {
        return res.status(409).json({ message: 'Este horário acabou de ser ocupado. Escolha outro.' });
      }

      // Criação da sessão injetando automaticamente o institutionId do monitor
      const session = await Session.create({
        alunoId,
        monitorId,
        institutionId: selectedInstitution?._id,
        disciplinaId,
        dataHora,
        tipoLocal,
        enderecoEncontro: selectedInstitution
          ? selectedInstitution.endereco || selectedInstitution.nome
          : enderecoEncontro,
        locationMeeting: {
          type: 'Point',
          coordinates: meetingCoordinates,
        },
        status: 'pendente',
      });

      return res.status(201).json({
        session,
        aluno: student,
        monitor,
        disciplina: { id: disciplinaId },
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
      const role = req.user?.role?.toLocaleLowerCase('pt-BR');
      const [student, monitor, director] = await Promise.all([
        StudentProfile.findOne({ userId: req.user?.id }).lean(),
        MonitorProfile.findOne({ userId: req.user?.id }).lean(),
        DirectorProfile.findOne({ userId: req.user?.id }).lean(),
      ]);

      if (director) {
        if (status !== 'cancelada') {
          return res.status(403).json({
            message: 'Diretores podem apenas desmarcar sessões.',
          });
        }
        const institutionMonitor = await MonitorProfile.exists({
          _id: session.monitorId,
          institutionId: new Types.ObjectId(String(director.institutionId)),
        });
        if (!institutionMonitor) {
          return res.status(403).json({
            message: 'Esta sessão não pertence à instituição do diretor.',
          });
        }
      } else if (
        role !== 'admin'
        && session.alunoId !== String(student?._id ?? '')
        && session.monitorId !== String(monitor?._id ?? '')
      ) {
        return res.status(403).json({
          message: 'Você não possui permissão para alterar esta sessão.',
        });
      }

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
