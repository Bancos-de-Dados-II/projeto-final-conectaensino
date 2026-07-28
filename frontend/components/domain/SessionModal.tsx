import { useEffect, useState, type FormEvent } from "react";
import { CalendarClock, Save, X } from "lucide-react";

import type { SessionRecord } from "../../types/domain";

interface SessionModalProps {
  open: boolean;
  session: SessionRecord | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
}

function SessionModal({
  open,
  session,
  submitting,
  onClose,
  onSubmit,
}: SessionModalProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [studentName, setStudentName] = useState("");
  const [monitorName, setMonitorName] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setTitle(session?.title || "");
    setDate(session?.date?.slice(0, 10) || "");
    setTime(session?.time || "");
    setStudentName(session?.studentName || "");
    setMonitorName(session?.monitorName || "");
    setNotes(session?.notes || "");
  }, [open, session]);

  if (!open) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onSubmit({
      title,
      date,
      time,
      student_name: studentName || undefined,
      monitor_name: monitorName || undefined,
      notes: notes || undefined,
    });
  }

  return (
    <div className="crud-modal-backdrop">
      <section className="crud-modal" role="dialog" aria-modal="true">
        <header className="crud-modal__header">
          <div className="domain-modal-heading">
            <span className="domain-modal-icon">
              <CalendarClock size={21} />
            </span>

            <div>
              <span className="dashboard__eyebrow">
                {session ? "Editar sessão" : "Nova sessão"}
              </span>
              <h2>{session ? "Atualizar monitoria" : "Agendar monitoria"}</h2>
            </div>
          </div>

          <button
            className="icon-button"
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            disabled={submitting}
          >
            <X size={20} />
          </button>
        </header>

        <form className="crud-form" onSubmit={handleSubmit}>
          <div className="crud-form__fields">
            <label className="crud-form-field crud-form-field--full">
              <span>Título</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ex.: Revisão de Estrutura de Dados"
                required
              />
            </label>

            <label className="crud-form-field">
              <span>Data</span>
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
              />
            </label>

            <label className="crud-form-field">
              <span>Horário</span>
              <input
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
              />
            </label>

            <label className="crud-form-field">
              <span>Aluno</span>
              <input
                value={studentName}
                onChange={(event) => setStudentName(event.target.value)}
                placeholder="Nome do aluno"
              />
            </label>

            <label className="crud-form-field">
              <span>Monitor</span>
              <input
                value={monitorName}
                onChange={(event) => setMonitorName(event.target.value)}
                placeholder="Nome do monitor"
              />
            </label>

            <label className="crud-form-field crud-form-field--full">
              <span>Observações</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Informações adicionais"
              />
            </label>
          </div>

          <footer className="crud-modal__footer">
            <button
              className="secondary-button crud-modal-button"
              type="button"
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </button>

            <button
              className="primary-button crud-modal-button"
              type="submit"
              disabled={submitting}
            >
              {submitting ? (
                <span className="button-spinner" />
              ) : (
                <Save size={17} />
              )}
              {submitting ? "Salvando..." : "Salvar sessão"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

export default SessionModal;
