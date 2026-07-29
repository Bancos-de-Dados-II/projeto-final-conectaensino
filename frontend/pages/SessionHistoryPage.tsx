import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  Download,
  GraduationCap,
  Search,
  UserRound,
} from "lucide-react";

import { useAuth } from "../hooks/useAuth";
import {
  getDirectorRegistrationHistory,
  type DirectorRegistration,
} from "../services/director-dashboard.service";
import { getSessionHistory } from "../services/experience.service";
import type {
  ExperienceSession,
  SessionStatus,
} from "../types/experience";
import { getApplicationRole } from "../utils/auth-role";

const labels: Record<SessionStatus, string> = {
  scheduled: "Agendada",
  completed: "Concluída",
  cancelled: "Cancelada",
  in_progress: "Em andamento",
};

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(";"),
    )
    .join("\n");
  const url = URL.createObjectURL(
    new Blob(["\ufeff", csv], { type: "text/csv" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function SessionHistoryPage() {
  const { user } = useAuth();
  const isDirector = getApplicationRole(user) === "director";
  const [sessions, setSessions] = useState<ExperienceSession[]>([]);
  const [registrations, setRegistrations] = useState<DirectorRegistration[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    const request = isDirector
      ? getDirectorRegistrationHistory().then(setRegistrations)
      : getSessionHistory().then(setSessions);

    void request
      .catch(() => setError("Não foi possível carregar o histórico."))
      .finally(() => setLoading(false));
  }, [isDirector]);

  const filteredSessions = useMemo(
    () =>
      sessions.filter(
        (item) =>
          (status === "all" || item.status === status) &&
          `${item.title} ${item.subject} ${item.monitorName}`
            .toLocaleLowerCase("pt-BR")
            .includes(query.toLocaleLowerCase("pt-BR")),
      ),
    [query, sessions, status],
  );

  const filteredRegistrations = useMemo(
    () =>
      registrations.filter(
        (item) =>
          (status === "all" || item.type === status) &&
          `${item.name} ${item.email} ${item.institutionName}`
            .toLocaleLowerCase("pt-BR")
            .includes(query.toLocaleLowerCase("pt-BR")),
      ),
    [query, registrations, status],
  );

  function exportCsv() {
    if (isDirector) {
      downloadCsv("historico-cadastros.csv", [
        ["Data", "Tipo", "Nome", "E-mail", "Escola"],
        ...filteredRegistrations.map((item) => [
          new Date(item.createdAt).toLocaleString("pt-BR"),
          item.type === "student" ? "Aluno" : "Monitor",
          item.name,
          item.email,
          item.institutionName,
        ]),
      ]);
      return;
    }

    downloadCsv("historico-sessoes.csv", [
      ["Data", "Disciplina", "Monitor", "Status"],
      ...filteredSessions.map((item) => [
        new Date(item.start).toLocaleString("pt-BR"),
        item.subject,
        item.monitorName,
        labels[item.status],
      ]),
    ]);
  }

  return (
    <section className="experience-page">
      <header className="experience-heading">
        <div>
          <span className="page-kicker">Acompanhamento</span>
          <h1>
            {isDirector ? "Histórico de cadastros" : "Histórico de sessões"}
          </h1>
          <p>
            {isDirector
              ? "Veja as últimas inclusões de alunos e monitores da sua escola."
              : "Consulte monitorias passadas, atuais e futuras."}
          </p>
        </div>
        <button className="secondary-button" onClick={exportCsv}>
          <Download size={17} />
          Exportar CSV
        </button>
      </header>

      <div className="history-filters panel">
        <label>
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={
              isDirector
                ? "Buscar aluno, monitor ou e-mail..."
                : "Buscar disciplina ou monitor..."
            }
          />
        </label>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">Todos</option>
          {isDirector ? (
            <>
              <option value="student">Alunos</option>
              <option value="monitor">Monitores</option>
            </>
          ) : (
            <>
              <option value="scheduled">Agendadas</option>
              <option value="in_progress">Em andamento</option>
              <option value="completed">Concluídas</option>
              <option value="cancelled">Canceladas</option>
            </>
          )}
        </select>
      </div>

      <article className="panel history-panel">
        {loading ? (
          <div className="experience-loading">
            <span className="route-loader__spinner" />
            Carregando histórico...
          </div>
        ) : error ? (
          <div className="experience-empty">
            <CalendarClock size={31} />
            <strong>{error}</strong>
          </div>
        ) : isDirector ? (
          filteredRegistrations.length === 0 ? (
            <div className="experience-empty">
              <CalendarClock size={31} />
              <strong>Nenhum cadastro encontrado</strong>
              <p>As inclusões de alunos e monitores aparecerão aqui.</p>
            </div>
          ) : (
            <div className="history-list">
              {filteredRegistrations.map((item) => {
                const date = new Date(item.createdAt);
                return (
                  <div className="history-item" key={`${item.type}-${item.id}`}>
                    <div className="history-date">
                      <strong>{date.getDate()}</strong>
                      <small>
                        {date.toLocaleDateString("pt-BR", { month: "short" })}
                      </small>
                    </div>
                    <div>
                      <strong>{item.name}</strong>
                      <p>
                        {item.email || "E-mail não informado"} ·{" "}
                        {date.toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <small>{item.institutionName}</small>
                    </div>
                    <span
                      className={`status-pill status-pill--${
                        item.type === "student" ? "scheduled" : "completed"
                      }`}
                    >
                      {item.type === "student" ? (
                        <UserRound size={14} />
                      ) : (
                        <GraduationCap size={14} />
                      )}
                      {item.type === "student" ? "Aluno" : "Monitor"}
                    </span>
                  </div>
                );
              })}
            </div>
          )
        ) : filteredSessions.length === 0 ? (
          <div className="experience-empty">
            <CalendarClock size={31} />
            <strong>Nenhuma sessão encontrada</strong>
            <p>Ajuste os filtros para visualizar outros resultados.</p>
          </div>
        ) : (
          <div className="history-list">
            {filteredSessions.map((item) => (
              <div className="history-item" key={item.id}>
                <div className="history-date">
                  <strong>{new Date(item.start).getDate()}</strong>
                  <small>
                    {new Date(item.start).toLocaleDateString("pt-BR", {
                      month: "short",
                    })}
                  </small>
                </div>
                <div>
                  <strong>{item.subject}</strong>
                  <p>
                    {item.monitorName} ·{" "}
                    {new Date(item.start).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span className={`status-pill status-pill--${item.status}`}>
                  {labels[item.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}
