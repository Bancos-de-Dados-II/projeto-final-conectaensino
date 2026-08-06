import { useState, type FormEvent } from "react";
import axios from "axios";
import { Lightbulb, Send } from "lucide-react";
import { suggestSubject } from "../../services/subject.service";

export default function SubjectSuggestionForm() {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (name.trim().length < 2) return;
    setSubmitting(true);
    setMessage("");
    try {
      await suggestSubject(name.trim());
      setName("");
      setMessage("Sugestão enviada para aprovação do administrador.");
    } catch (error) {
      setMessage(
        axios.isAxiosError(error)
          ? String((error.response?.data as { message?: string })?.message ?? "Não foi possível enviar a sugestão.")
          : "Não foi possível enviar a sugestão.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="subject-suggestion panel">
      <header>
        <Lightbulb size={19} />
        <div><strong>Sugerir disciplina</strong><small>Novas disciplinas precisam da aprovação do administrador.</small></div>
      </header>
      <form onSubmit={(event) => void handleSubmit(event)}>
        <input value={name} maxLength={80} onChange={(event) => setName(event.target.value)} placeholder="Nome da nova disciplina" aria-label="Nome da disciplina sugerida" />
        <button className="secondary-button" type="submit" disabled={submitting || name.trim().length < 2}>
          <Send size={16} /> {submitting ? "Enviando..." : "Enviar sugestão"}
        </button>
      </form>
      {message && <p role="status">{message}</p>}
    </section>
  );
}
