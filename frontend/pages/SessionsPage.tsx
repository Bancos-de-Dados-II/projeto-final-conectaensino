import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  CalendarX2,
  Building2,
  UserRound,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";

import {
  cancelSession,
  getSessions,
  getMonitorSchedule,
  getMonitors,
  scheduleMonitorSession,
} from "../services/experience.service";
import type {
  MonitorSchedule,
  ExperienceSession,
  PublicMonitor,
  ScheduleSlot,
} from "../types/experience";
import { useAuth } from "../hooks/useAuth";
import { getApplicationRole } from "../utils/auth-role";

const sessionStatusLabels = {
  scheduled: "Agendada",
  completed: "Concluída",
  cancelled: "Cancelada",
  in_progress: "Em andamento",
} as const;

const periodLabels = {
  matutino: {
    title: "Matutino",
    range: "07:00 às 11:59",
  },
  vespertino: {
    title: "Vespertino",
    range: "13:00 às 17:59",
  },
  noturno: {
    title: "Noturno",
    range: "18:00 às 21:00",
  },
} as const;

function today(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function toDateInputValue(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function nextBookableDate(availability: string[]): string {
  const weekdayTokens: Record<number, string[]> = {
    0: ["domingo"],
    1: ["segunda"],
    2: ["terca", "terça"],
    3: ["quarta"],
    4: ["quinta"],
    5: ["sexta"],
    6: ["sabado", "sábado"],
  };
  const normalized = availability.map((item) =>
    item
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR"),
  );
  const hasWeekday = normalized.some((item) =>
    Object.values(weekdayTokens)
      .flat()
      .some((token) => item.includes(token.normalize("NFD").replace(/[\u0300-\u036f]/g, ""))),
  );
  const start = new Date();
  start.setHours(12, 0, 0, 0);
  start.setDate(start.getDate() + 1);

  for (let offset = 0; offset < 14; offset += 1) {
    const candidate = new Date(start);
    candidate.setDate(start.getDate() + offset);
    const tokens = weekdayTokens[candidate.getDay()];
    const matchesDay =
      !hasWeekday ||
      normalized.some((item) =>
        tokens.some((token) =>
          item.includes(
            token.normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
          ),
        ),
      );

    if (matchesDay) {
      return toDateInputValue(candidate);
    }
  }

  return toDateInputValue(start);
}

function SessionsPage() {
  const { user } = useAuth();
  const role = getApplicationRole(user);
  const isManagement = role === "director" || role === "admin";
  const [searchParams] = useSearchParams();
  const requestedMonitorId = searchParams.get("monitor") ?? "";
  const [monitors, setMonitors] = useState<PublicMonitor[]>([]);
  const [monitorId, setMonitorId] = useState(requestedMonitorId);
  const [date, setDate] = useState(today());
  const [subject, setSubject] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [schedule, setSchedule] = useState<MonitorSchedule | null>(null);
  const [loadingMonitors, setLoadingMonitors] = useState(true);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [directorSessions, setDirectorSessions] = useState<ExperienceSession[]>([]);
  const [cancellingId, setCancellingId] = useState("");

  const selectedMonitor = useMemo(
    () => monitors.find((monitor) => monitor.id === monitorId) ?? null,
    [monitorId, monitors],
  );
  const hasAvailableSlots = schedule
    ? Object.values(schedule.periods)
        .flat()
        .some((slot) => slot.available)
    : false;

  useEffect(() => {
    if (isManagement) {
      void getSessions()
        .then(setDirectorSessions)
        .catch(() =>
          setErrorMessage("Não foi possível carregar os horários dos monitores."),
        )
        .finally(() => setLoadingMonitors(false));
      return;
    }

    void getMonitors()
      .then((items) => {
        setMonitors(items);
        setMonitorId((current) =>
          items.some((item) => item.id === current)
            ? current
            : items[0]?.id ?? "",
        );
      })
      .catch(() => setErrorMessage("Não foi possível carregar os monitores."))
      .finally(() => setLoadingMonitors(false));
  }, [isManagement]);

  useEffect(() => {
    if (isManagement) return;
    setSubject(selectedMonitor?.subjects[0] ?? "");
    setSelectedTime("");
    if (selectedMonitor) {
      setDate(nextBookableDate(selectedMonitor.availability));
    }
  }, [isManagement, selectedMonitor]);

  useEffect(() => {
    if (isManagement) return;
    if (!monitorId || !date) {
      setSchedule(null);
      return;
    }

    setLoadingSchedule(true);
    setErrorMessage("");
    setSelectedTime("");
    void getMonitorSchedule(monitorId, date)
      .then(setSchedule)
      .catch((error) =>
        setErrorMessage(
          axios.isAxiosError(error)
            ? String(
                (error.response?.data as { message?: string } | undefined)
                  ?.message ?? "Não foi possível consultar os horários.",
              )
            : "Não foi possível consultar os horários.",
        ),
      )
      .finally(() => setLoadingSchedule(false));
  }, [date, isManagement, monitorId]);

  async function handleDirectorCancel(session: ExperienceSession) {
    const confirmed = window.confirm(
      `Deseja desmarcar a aula de ${session.subject} com ${session.monitorName}?`,
    );
    if (!confirmed) return;

    setCancellingId(session.id);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await cancelSession(session.id);
      setDirectorSessions((current) =>
        current.map((item) =>
          item.id === session.id ? { ...item, status: "cancelled" } : item,
        ),
      );
      setSuccessMessage("Aula desmarcada com sucesso.");
    } catch (error) {
      setErrorMessage(
        axios.isAxiosError(error)
          ? String(
              (error.response?.data as { message?: string } | undefined)
                ?.message ?? "Não foi possível desmarcar a aula.",
            )
          : "Não foi possível desmarcar a aula.",
      );
    } finally {
      setCancellingId("");
    }
  }

  async function handleSchedule() {
    if (!monitorId || !date || !subject || !selectedTime) {
      setErrorMessage("Selecione monitor, disciplina, data e horário.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await scheduleMonitorSession({
        monitorId,
        subject,
        date,
        time: selectedTime,
      });
      setSuccessMessage(
        `Aula solicitada com ${selectedMonitor?.name ?? "o monitor"} em ${date
          .split("-")
          .reverse()
          .join("/")} às ${selectedTime}.`,
      );
      setSelectedTime("");
      setSchedule(await getMonitorSchedule(monitorId, date));
    } catch (error) {
      setErrorMessage(
        axios.isAxiosError(error)
          ? String(
              (error.response?.data as { message?: string } | undefined)
                ?.message ?? "Não foi possível agendar a aula.",
            )
          : "Não foi possível agendar a aula.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function renderSlots(slots: ScheduleSlot[]) {
    return (
      <div className="booking-slots">
        {slots.map((slot) => (
          <button
            className={`booking-slot ${
              selectedTime === slot.time ? "booking-slot--selected" : ""
            }`}
            type="button"
            key={slot.time}
            disabled={!slot.available}
            onClick={() => setSelectedTime(slot.time)}
            title={slot.available ? "Selecionar horário" : "Horário indisponível"}
          >
            {slot.time}
          </button>
        ))}
      </div>
    );
  }

  if (isManagement) {
    return (
      <div className="booking-page director-sessions-page">
        <section className="crud-page__heading">
          <div>
            <span className="dashboard__eyebrow">Sessões / Agenda institucional</span>
            <h1>Horários dos monitores</h1>
            <p>
              Consulte as aulas agendadas. O diretor pode somente desmarcar uma
              sessão quando necessário.
            </p>
          </div>
        </section>

        {errorMessage && (
          <div className="crud-feedback crud-feedback--error" role="alert">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="crud-feedback crud-feedback--success" role="status">
            <CheckCircle2 size={17} />
            {successMessage}
          </div>
        )}

        <section className="director-session-panel">
          <header>
            <div>
              <strong>Agenda da instituição</strong>
              <small>{directorSessions.length} sessão(ões)</small>
            </div>
          </header>

          {loadingMonitors ? (
            <div className="domain-empty">
              <span className="route-loader__spinner" />
              <p>Carregando horários...</p>
            </div>
          ) : directorSessions.length === 0 ? (
            <div className="domain-empty">
              <CalendarDays size={32} />
              <strong>Nenhuma aula agendada</strong>
              <p>As sessões dos monitores da instituição aparecerão aqui.</p>
            </div>
          ) : (
            <div className="director-session-list">
              {directorSessions.map((session) => {
                const canCancel =
                  session.status !== "cancelled"
                  && session.status !== "completed";
                return (
                  <article className="director-session-card" key={session.id}>
                    <time dateTime={session.start}>
                      <strong>
                        {new Date(session.start).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </strong>
                      <span>
                        {new Date(session.start).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </time>
                    <div className="director-session-card__details">
                      <strong>{session.subject}</strong>
                      <small>
                        <GraduationCap size={14} />
                        {session.monitorName}
                      </small>
                      <small>
                        <Building2 size={14} />
                        {session.institutionName || "Instituição não informada"}
                      </small>
                    </div>
                    <span className={`status-pill status-pill--${session.status}`}>
                      {sessionStatusLabels[session.status]}
                    </span>
                    {canCancel && (
                      <button
                        className="director-session-card__cancel"
                        type="button"
                        disabled={cancellingId === session.id}
                        onClick={() => void handleDirectorCancel(session)}
                      >
                        <CalendarX2 size={16} />
                        {cancellingId === session.id
                          ? "Desmarcando..."
                          : "Desmarcar aula"}
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="booking-page">
      <section className="crud-page__heading">
        <div>
          <span className="dashboard__eyebrow">Agendamento</span>
          <h1>Agende sua aula</h1>
          <p>Escolha um monitor e consulte os horários realmente disponíveis.</p>
        </div>
      </section>

      {errorMessage && (
        <div className="crud-feedback crud-feedback--error" role="alert">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="crud-feedback crud-feedback--success" role="status">
          <CheckCircle2 size={17} />
          {successMessage}
        </div>
      )}

      <section className="booking-layout">
        <aside className="booking-form-card">
          <header>
            <CalendarDays size={21} />
            <div>
              <strong>Dados da monitoria</strong>
              <small>Preencha para consultar a agenda</small>
            </div>
          </header>

          <label className="booking-field">
            <span>Monitor</span>
            <select
              value={monitorId}
              disabled={loadingMonitors}
              onChange={(event) => setMonitorId(event.target.value)}
            >
              {loadingMonitors && <option>Carregando monitores...</option>}
              {!loadingMonitors && monitors.length === 0 && (
                <option value="">Nenhum monitor cadastrado</option>
              )}
              {monitors.map((monitor) => (
                <option value={monitor.id} key={monitor.id}>
                  {monitor.name}
                </option>
              ))}
            </select>
          </label>

          <label className="booking-field">
            <span>Disciplina</span>
            {selectedMonitor?.subjects.length ? (
              <select
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
              >
                {selectedMonitor.subjects.map((item) => (
                  <option value={item} key={item}>
                    {item}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Informe a disciplina"
              />
            )}
          </label>

          <label className="booking-field">
            <span>Data</span>
            <input
              type="date"
              min={today()}
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>

          {selectedMonitor && (
            <article className="booking-monitor-card">
              <span><UserRound size={22} /></span>
              <div>
                <strong>{selectedMonitor.name}</strong>
                <small>
                  <GraduationCap size={13} />
                  {selectedMonitor.institution || "Instituição não informada"}
                </small>
                <small>
                  <BookOpen size={13} />
                  {selectedMonitor.subjects.join(", ") || "Disciplinas sob consulta"}
                </small>
              </div>
            </article>
          )}

          <button
            className="primary-button booking-submit"
            type="button"
            disabled={submitting || !selectedTime}
            onClick={() => void handleSchedule()}
          >
            {submitting ? <span className="button-spinner" /> : <CalendarDays size={17} />}
            {submitting
              ? "Agendando..."
              : selectedTime
                ? `Agendar às ${selectedTime}`
                : "Selecione um horário"}
          </button>
        </aside>

        <div className="booking-availability">
          <header>
            <div>
              <span className="dashboard__eyebrow">Horários disponíveis</span>
              <h2>
                {date.split("-").reverse().join("/")}
              </h2>
            </div>
            <span className="booking-legend">
              <i /> Disponível <i /> Ocupado
            </span>
          </header>

          {loadingSchedule ? (
            <div className="domain-empty">
              <span className="route-loader__spinner" />
              <p>Consultando a agenda do monitor...</p>
            </div>
          ) : schedule ? (
            <>
              {!hasAvailableSlots && (
                <div className="booking-no-slots" role="status">
                  <Clock3 size={18} />
                  <span>
                    <strong>Sem horários nesta data</strong>
                    Escolha outro dia compatível com a disponibilidade do monitor.
                  </span>
                </div>
              )}
              <div className="booking-periods">
                {(Object.keys(periodLabels) as Array<keyof typeof periodLabels>).map(
                  (period) => (
                    <article className="booking-period" key={period}>
                      <header>
                        <Clock3 size={19} />
                        <div>
                          <strong>{periodLabels[period].title}</strong>
                          <small>{periodLabels[period].range}</small>
                        </div>
                      </header>
                      {renderSlots(schedule.periods[period])}
                    </article>
                  ),
                )}
              </div>
            </>
          ) : (
            <div className="domain-empty">
              <CalendarDays size={32} />
              <p>Selecione um monitor e uma data.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default SessionsPage;
