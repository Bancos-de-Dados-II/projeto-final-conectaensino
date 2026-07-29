import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  CalendarClock,
  Download,
  FileImage,
  FileText,
  Paperclip,
  Upload,
} from "lucide-react";

import { useAuth } from "../hooks/useAuth";
import { getSessions } from "../services/experience.service";
import {
  downloadSessionActivity,
  listSessionActivities,
  uploadSessionActivity,
} from "../services/session-activity.service";
import type { ExperienceSession } from "../types/experience";
import type { SessionActivity } from "../types/session-activity";
import { getApplicationRole } from "../utils/auth-role";

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function formatSize(size: number): string {
  return size < 1024 * 1024
    ? `${Math.ceil(size / 1024)} KB`
    : `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function SessionActivitiesPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const role = getApplicationRole(user);
  const isStudent = role === "student";
  const [sessions, setSessions] = useState<ExperienceSession[]>([]);
  const [activities, setActivities] = useState<SessionActivity[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    void Promise.all([getSessions(), listSessionActivities()])
      .then(([sessionItems, activityItems]) => {
        setSessions(sessionItems);
        setActivities(activityItems);
        setSessionId(sessionItems[0]?.id ?? "");
      })
      .catch(() => setErrorMessage("Não foi possível carregar as atividades."))
      .finally(() => setLoading(false));
  }, []);

  const sessionsById = useMemo(
    () => new Map(sessions.map((session) => [session.id, session])),
    [sessions],
  );

  function chooseFile(selected?: File) {
    setErrorMessage("");
    setFeedback("");
    if (!selected) {
      setFile(null);
      return;
    }
    if (!ALLOWED_TYPES.has(selected.type)) {
      setFile(null);
      setErrorMessage("Formato inválido. Selecione um PDF, JPEG ou PNG.");
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      setFile(null);
      setErrorMessage("O arquivo deve possuir no máximo 5 MB.");
      return;
    }
    setFile(selected);
  }

  async function submitFile() {
    if (!sessionId || !file) {
      setErrorMessage("Selecione uma sessão e um arquivo.");
      return;
    }
    setUploading(true);
    setErrorMessage("");
    setFeedback("");
    try {
      const created = await uploadSessionActivity(sessionId, file);
      setActivities((current) => [created, ...current]);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      setFeedback("Atividade enviada ao monitor com sucesso.");
    } catch (error) {
      setErrorMessage(
        axios.isAxiosError(error)
          ? String(
              (error.response?.data as { message?: string } | undefined)
                ?.message ?? "Não foi possível enviar a atividade.",
            )
          : "Não foi possível enviar a atividade.",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="session-activities-page">
      <header className="crud-page__heading">
        <div>
          <span className="dashboard__eyebrow">Sessões / Atividades</span>
          <h1>{isStudent ? "Enviar lições" : "Atividades recebidas"}</h1>
          <p>
            {isStudent
              ? "Compartilhe o material da aula para o monitor se preparar."
              : "Consulte os materiais enviados pelos alunos antes das aulas."}
          </p>
        </div>
      </header>

      {errorMessage && (
        <div className="crud-feedback crud-feedback--error" role="alert">
          {errorMessage}
        </div>
      )}
      {feedback && (
        <div className="crud-feedback crud-feedback--success" role="status">
          {feedback}
        </div>
      )}

      {isStudent && (
        <section className="activity-upload-panel">
          <div className="activity-upload-fields">
            <label>
              <span>Sessão</span>
              <select
                value={sessionId}
                onChange={(event) => setSessionId(event.target.value)}
                disabled={loading || sessions.length === 0}
              >
                {sessions.length === 0 && (
                  <option value="">Nenhuma sessão agendada</option>
                )}
                {sessions.map((session) => (
                  <option value={session.id} key={session.id}>
                    {session.subject} — {session.monitorName} —{" "}
                    {new Date(session.start).toLocaleString("pt-BR")}
                  </option>
                ))}
              </select>
            </label>

            <button
              className="activity-dropzone"
              type="button"
              onClick={() => inputRef.current?.click()}
            >
              <Upload size={24} />
              <strong>{file ? file.name : "Selecionar atividade"}</strong>
              <small>PDF, JPEG ou PNG • máximo de 5 MB</small>
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              hidden
              onChange={(event) => chooseFile(event.target.files?.[0])}
            />
          </div>

          <button
            className="primary-button activity-upload-submit"
            type="button"
            disabled={!file || !sessionId || uploading}
            onClick={() => void submitFile()}
          >
            {uploading ? <span className="button-spinner" /> : <Paperclip size={17} />}
            {uploading ? "Enviando..." : "Enviar ao monitor"}
          </button>
        </section>
      )}

      <section className="activity-list-panel">
        <header>
          <div>
            <strong>{isStudent ? "Arquivos enviados" : "Materiais dos alunos"}</strong>
            <small>{activities.length} atividade(s)</small>
          </div>
        </header>

        {loading ? (
          <div className="domain-empty">
            <span className="route-loader__spinner" />
            <p>Carregando atividades...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="domain-empty">
            <Paperclip size={32} />
            <strong>Nenhuma atividade enviada</strong>
            <p>Os materiais vinculados às sessões aparecerão aqui.</p>
          </div>
        ) : (
          <div className="session-activity-list">
            {activities.map((activity) => {
              const session = sessionsById.get(activity.sessionId);
              const Icon =
                activity.mimeType === "application/pdf" ? FileText : FileImage;
              return (
                <article className="session-activity-card" key={activity.id}>
                  <span className="session-activity-card__icon">
                    <Icon size={21} />
                  </span>
                  <div>
                    <strong>{activity.originalName}</strong>
                    <small>
                      <CalendarClock size={13} />
                      {session
                        ? `${session.subject} • ${new Date(
                            session.start,
                          ).toLocaleString("pt-BR")}`
                        : "Sessão vinculada"}
                    </small>
                    <small>
                      {formatSize(activity.size)}
                      {activity.createdAt
                        ? ` • enviado em ${new Date(
                            activity.createdAt,
                          ).toLocaleString("pt-BR")}`
                        : ""}
                    </small>
                  </div>
                  <button
                    type="button"
                    onClick={() => void downloadSessionActivity(activity)}
                  >
                    <Download size={16} />
                    Baixar
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
