import { useEffect, useMemo, useState } from "react";
import {
  CalendarX2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  GraduationCap,
} from "lucide-react";

import SessionDetailsModal from "../components/calendar/SessionDetailsModal";
import { getSessions } from "../services/experience.service";
import type { ExperienceSession } from "../types/experience";

const week = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const keyOf = (date: Date) =>
  `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

function formatSelectedDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default function CalendarPage() {
  const [cursor, setCursor] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [sessions, setSessions] = useState<ExperienceSession[]>([]);
  const [selectedSession, setSelectedSession] =
    useState<ExperienceSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void getSessions()
      .then(setSessions)
      .finally(() => setLoading(false));
  }, []);

  const days = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = new Date(
      cursor.getFullYear(),
      cursor.getMonth(),
      1 - first.getDay(),
    );
    return Array.from(
      { length: 42 },
      (_, index) =>
        new Date(
          start.getFullYear(),
          start.getMonth(),
          start.getDate() + index,
        ),
    );
  }, [cursor]);

  const byDay = useMemo(() => {
    const map = new Map<string, ExperienceSession[]>();
    sessions.forEach((session) => {
      const key = keyOf(new Date(session.start));
      map.set(key, [...(map.get(key) ?? []), session]);
    });
    map.forEach((items) =>
      items.sort(
        (first, second) =>
          new Date(first.start).getTime() - new Date(second.start).getTime(),
      ),
    );
    return map;
  }, [sessions]);

  const selectedDaySessions = byDay.get(keyOf(selectedDay)) ?? [];
  const title = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(cursor);

  function goToToday() {
    const current = new Date();
    setCursor(current);
    setSelectedDay(current);
  }

  return (
    <section className="experience-page">
      <header className="experience-heading">
        <div>
          <span className="page-kicker">Organização</span>
          <h1>Agenda de monitorias</h1>
          <p>Selecione um dia para consultar suas monitorias marcadas.</p>
        </div>
        <div className="calendar-toolbar">
          <button className="icon-button" type="button" onClick={goToToday}>
            Hoje
          </button>
          <button
            className="icon-button"
            type="button"
            aria-label="Mês anterior"
            onClick={() =>
              setCursor(
                new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1),
              )
            }
          >
            <ChevronLeft size={18} />
          </button>
          <strong>{title}</strong>
          <button
            className="icon-button"
            type="button"
            aria-label="Próximo mês"
            onClick={() =>
              setCursor(
                new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1),
              )
            }
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </header>

      {loading ? (
        <div className="experience-loading">
          <span className="route-loader__spinner" />
          Carregando agenda...
        </div>
      ) : (
        <div className="student-calendar-layout">
          <article className="calendar-panel panel">
            <div className="calendar-weekdays">
              {week.map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
            <div className="calendar-grid">
              {days.map((day) => {
                const items = byDay.get(keyOf(day)) ?? [];
                const outside = day.getMonth() !== cursor.getMonth();
                const isToday = keyOf(day) === keyOf(new Date());
                const isSelected = keyOf(day) === keyOf(selectedDay);
                return (
                  <div
                    key={day.toISOString()}
                    className={[
                      "calendar-day",
                      outside ? "calendar-day--outside" : "",
                      isToday ? "calendar-day--today" : "",
                      isSelected ? "calendar-day--selected" : "",
                    ].join(" ")}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedDay(day)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedDay(day);
                      }
                    }}
                  >
                    <span className="calendar-day__number">{day.getDate()}</span>
                    <div className="calendar-day__events">
                      {items.slice(0, 3).map((session) => (
                        <button
                          key={session.id}
                          className={`calendar-event calendar-event--${session.status}`}
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedDay(day);
                            setSelectedSession(session);
                          }}
                        >
                          <b>
                            {new Date(session.start).toLocaleTimeString(
                              "pt-BR",
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </b>
                          <span>{session.subject}</span>
                        </button>
                      ))}
                      {items.length > 3 && (
                        <small>+{items.length - 3} monitorias</small>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </article>

          <aside className="selected-day-agenda panel">
            <header>
              <span className="page-kicker">Horários marcados</span>
              <h2>{formatSelectedDate(selectedDay)}</h2>
            </header>
            {selectedDaySessions.length === 0 ? (
              <div className="selected-day-agenda__empty">
                <CalendarX2 size={30} />
                <strong>Sem agendamentos para hoje</strong>
              </div>
            ) : (
              <div className="selected-day-agenda__list">
                {selectedDaySessions.map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => setSelectedSession(session)}
                  >
                    <time dateTime={session.start}>
                      <Clock3 size={15} />
                      {new Date(session.start).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                    <span>
                      <strong>{session.subject}</strong>
                      <small>
                        <GraduationCap size={13} />
                        {session.monitorName}
                      </small>
                    </span>
                    <i className={`status-pill status-pill--${session.status}`}>
                      {session.status === "cancelled"
                        ? "Cancelada"
                        : session.status === "completed"
                          ? "Concluída"
                          : session.status === "in_progress"
                            ? "Em andamento"
                            : "Agendada"}
                    </i>
                  </button>
                ))}
              </div>
            )}
          </aside>
        </div>
      )}

      <SessionDetailsModal
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
      />
    </section>
  );
}
