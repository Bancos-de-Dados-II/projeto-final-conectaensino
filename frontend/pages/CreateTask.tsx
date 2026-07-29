import { useEffect, useState } from "react";
import axios from "axios";
import {
  BookOpen,
  CheckCircle2,
  ListTodo,
  Send,
  UserCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  createTask,
  getEligibleStudents,
} from "../services/task.service";
import type { EligibleStudent } from "../types/task";

export default function CreateTask() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<EligibleStudent[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    void getEligibleStudents()
      .then((items) => {
        setStudents(items);
        setSelectedStudent(items[0]?.id ?? "");
      })
      .catch(() =>
        setErrorMessage("Não foi possível carregar os alunos designados."),
      )
      .finally(() => setLoadingStudents(false));
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setSuccess("");
    setErrorMessage("");
    try {
      await createTask({
        studentId: selectedStudent,
        title,
        subject,
        description,
      });
      setSuccess("Atividade atribuída ao aluno com sucesso.");
      window.setTimeout(() => navigate("/dashboard"), 1000);
    } catch (error) {
      setErrorMessage(
        axios.isAxiosError(error)
          ? String(
              (error.response?.data as { message?: string } | undefined)
                ?.message ?? "Não foi possível criar a atividade.",
            )
          : "Não foi possível criar a atividade.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="task-create-page">
      <header className="crud-page__heading">
        <div>
          <span className="dashboard__eyebrow">Área do monitor</span>
          <h1>Nova atividade</h1>
          <p>Atribua uma tarefa a um aluno que possui sessão com você.</p>
        </div>
      </header>

      {errorMessage && (
        <div className="crud-feedback crud-feedback--error" role="alert">
          {errorMessage}
        </div>
      )}
      {success && (
        <div className="crud-feedback crud-feedback--success" role="status">
          <CheckCircle2 size={17} />
          {success}
        </div>
      )}

      <form className="task-create-form" onSubmit={handleSubmit}>
        <label>
          <span><UserCheck size={17} /> Aluno designado</span>
          <select
            value={selectedStudent}
            disabled={loadingStudents || students.length === 0}
            required
            onChange={(event) => setSelectedStudent(event.target.value)}
          >
            {loadingStudents && <option>Carregando alunos...</option>}
            {!loadingStudents && students.length === 0 && (
              <option value="">Nenhum aluno com sessão registrada</option>
            )}
            {students.map((student) => (
              <option value={student.id} key={student.id}>
                {student.name}{student.email ? ` — ${student.email}` : ""}
              </option>
            ))}
          </select>
          <small>
            São exibidos apenas alunos que já possuem uma sessão registrada
            com o monitor.
          </small>
        </label>

        <label>
          <span><BookOpen size={17} /> Disciplina</span>
          <input
            value={subject}
            maxLength={120}
            required
            placeholder="Ex.: Banco de Dados II"
            onChange={(event) => setSubject(event.target.value)}
          />
        </label>

        <label>
          <span><ListTodo size={17} /> Título</span>
          <input
            value={title}
            maxLength={150}
            required
            placeholder="Ex.: Exercícios de normalização"
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>

        <label>
          <span>Orientações</span>
          <textarea
            value={description}
            rows={6}
            maxLength={3000}
            placeholder="Descreva o que o aluno deve realizar..."
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>

        <div className="task-create-form__actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate("/dashboard")}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="primary-button"
            disabled={submitting || !selectedStudent}
          >
            <Send size={17} />
            {submitting ? "Enviando..." : "Atribuir atividade"}
          </button>
        </div>
      </form>
    </div>
  );
}
