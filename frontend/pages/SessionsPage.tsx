import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  CalendarClock,
  Clock3,
  Edit3,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserRound,
} from "lucide-react";

import SessionModal from "../components/domain/SessionModal";
import {
  createSession,
  deleteSession,
  listSessions,
  updateSession,
} from "../services/domain.service";
import type { SessionRecord } from "../types/domain";

function SessionsPage() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSession, setEditingSession] =
    useState<SessionRecord | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      setSessions(await listSessions());
    } catch {
      setErrorMessage("Não foi possível carregar as sessões.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredSessions = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase("pt-BR");

    if (!query) {
      return sessions;
    }

    return sessions.filter((session) =>
      [
        session.title,
        session.studentName,
        session.monitorName,
        session.subjectName,
        session.status,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLocaleLowerCase("pt-BR").includes(query),
        ),
    );
  }, [searchTerm, sessions]);

  async function handleSave(payload: Record<string, unknown>) {
    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (editingSession) {
        await updateSession(editingSession.id, payload);
        setSuccessMessage("Sessão atualizada com sucesso.");
      } else {
        await createSession(payload);
        setSuccessMessage("Sessão agendada com sucesso.");
      }

      setModalOpen(false);
      setEditingSession(null);
      await loadData();
    } catch (error) {
      setErrorMessage(
        axios.isAxiosError(error)
          ? String(
              (error.response?.data as { message?: string } | undefined)
                ?.message || "Não foi possível salvar a sessão.",
            )
          : "Não foi possível salvar a sessão.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(session: SessionRecord) {
    if (!window.confirm(`Excluir a sessão "${session.title}"?`)) {
      return;
    }

    try {
      await deleteSession(session.id);
      setSessions((current) =>
        current.filter((item) => item.id !== session.id),
      );
      setSuccessMessage("Sessão excluída com sucesso.");
    } catch {
      setErrorMessage("Não foi possível excluir a sessão.");
    }
  }

  return (
    <div className="domain-page">
      <section className="crud-page__heading">
        <div>
          <span className="dashboard__eyebrow">Agenda</span>
          <h1>Sessões</h1>
          <p>Organize e acompanhe as sessões de monitoria.</p>
        </div>

        <button
          className="primary-button"
          type="button"
          onClick={() => {
            setEditingSession(null);
            setModalOpen(true);
          }}
        >
          <Plus size={18} />
          Agendar sessão
        </button>
      </section>

      {errorMessage && (
        <div className="crud-feedback crud-feedback--error">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="crud-feedback crud-feedback--success">
          {successMessage}
        </div>
      )}

      <section className="domain-toolbar">
        <div className="crud-search">
          <Search size={17} />
          <input
            type="search"
            placeholder="Pesquisar sessões..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <button
          className="icon-button"
          type="button"
          aria-label="Atualizar"
          onClick={() => void loadData()}
          disabled={loading}
        >
          <RefreshCw
            size={18}
            className={loading ? "icon-spinning" : ""}
          />
        </button>
      </section>

      <section className="session-grid">
        {loading && (
          <div className="domain-empty">
            <span className="route-loader__spinner" />
            <p>Carregando sessões...</p>
          </div>
        )}

        {!loading && filteredSessions.length === 0 && (
          <div className="domain-empty">
            <CalendarClock size={34} />
            <strong>Nenhuma sessão encontrada</strong>
            <p>Agende uma nova monitoria para começar.</p>
          </div>
        )}

        {!loading &&
          filteredSessions.map((session) => (
            <article className="session-card" key={session.id}>
              <header>
                <span className="session-card__icon">
                  <CalendarClock size={20} />
                </span>

                <div>
                  <strong>{session.title}</strong>
                  <span>{session.status || "Agendada"}</span>
                </div>
              </header>

              <div className="session-card__details">
                <span>
                  <Clock3 size={16} />
                  {session.date || "Data não informada"}
                  {session.time ? ` • ${session.time}` : ""}
                </span>

                <span>
                  <UserRound size={16} />
                  {session.studentName || "Aluno não informado"}
                </span>

                <span>
                  <UserRound size={16} />
                  {session.monitorName || "Monitor não informado"}
                </span>
              </div>

              {session.notes && <p>{session.notes}</p>}

              <footer>
                <button
                  type="button"
                  onClick={() => {
                    setEditingSession(session);
                    setModalOpen(true);
                  }}
                >
                  <Edit3 size={16} />
                  Editar
                </button>

                <button
                  className="session-card__delete"
                  type="button"
                  onClick={() => void handleDelete(session)}
                >
                  <Trash2 size={16} />
                  Excluir
                </button>
              </footer>
            </article>
          ))}
      </section>

      <SessionModal
        open={modalOpen}
        session={editingSession}
        submitting={submitting}
        onClose={() => {
          setModalOpen(false);
          setEditingSession(null);
        }}
        onSubmit={handleSave}
      />
    </div>
  );
}

export default SessionsPage;
