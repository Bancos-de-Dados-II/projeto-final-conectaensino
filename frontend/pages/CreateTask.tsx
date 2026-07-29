import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, CheckCircle, ListTodo, UserCheck } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../../src/config/supabase";
interface Student {
  email: string;
  name: string;
}

export default function CreateTask() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Carrega apenas os alunos elegíveis (que possuem sessão com este monitor)
  useEffect(() => {
    async function loadMyStudents() {
      try {
        const sessionData = await supabase.auth.getSession();
        const token = sessionData.data.session?.access_token;

        const response = await fetch("/api/monitors/my-students", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setStudents(data);
      } catch (err) {
        console.error("Erro ao carregar alunos", err);
      }
    }
    void loadMyStudents();
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const sessionData = await supabase.auth.getSession();
      const token = sessionData.data.session?.access_token;

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          subject,
          description,
          studentEmail: selectedStudent,
          monitorName: user?.user_metadata?.name || "Monitor"
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => navigate("/dashboard"), 1500);
      }
    } catch (err) {
      console.error("Erro ao atribuir atividade", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-container" style={{ maxWidth: "600px", margin: "2rem auto" }}>
      <div className="panel">
        <div className="panel__header" style={{ marginBottom: "1.5rem" }}>
          <div>
            <span className="panel__eyebrow">Área do Monitor</span>
            <h2>Atribuir Nova Atividade</h2>
          </div>
        </div>

        {success && (
          <div className="crud-feedback crud-feedback--success" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem" }}>
            <CheckCircle size={18} />
            Atividade enviada para o aluno com sucesso!
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
          {/* Seleção do Aluno Elegível */}
          <div className="form-group">
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "bold", marginBottom: "6px" }}>
              <UserCheck size={18} /> Aluno (Apenas com sessões agendadas/realizadas)
            </label>
            <select
              className="form-input"
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              required
              style={{ width: "100%", padding: "10px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <option value="" disabled style={{ background: "#1e293b" }}>
                Selecione um aluno...
              </option>
              {students.map((student) => (
                <option key={student.email} value={student.email} style={{ background: "#1e293b" }}>
                  {student.name} ({student.email})
                </option>
              ))}
            </select>
            {students.length === 0 && (
              <small style={{ color: "#9ca3af", marginTop: "4px", display: "block" }}>
                Você só pode enviar tarefas para alunos com os quais já possui sessões registradas.
              </small>
            )}
          </div>

          {/* Disciplina */}
          <div className="form-group">
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "bold", marginBottom: "6px" }}>
              <BookOpen size={18} /> Disciplina
            </label>
            <input
              type="text"
              placeholder="Ex: Banco de Dados II, Cálculo..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              style={{ width: "100%", padding: "10px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>

          {/* Título da Atividade */}
          <div className="form-group">
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "bold", marginBottom: "6px" }}>
              <ListTodo size={18} /> Título da Atividade
            </label>
            <input
              type="text"
              placeholder="Ex: Exercícios de Normalização de Dados"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{ width: "100%", padding: "10px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>

          {/* Descrição / Orientação */}
          <div className="form-group">
            <label style={{ fontWeight: "bold", marginBottom: "6px", display: "block" }}>Orientação / Descrição</label>
            <textarea
              rows={4}
              placeholder="Descreva o que o aluno deve resolver..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: "100%", padding: "10px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>

          <button
            type="submit"
            className="primary-button"
            disabled={loading || !selectedStudent}
            style={{ marginTop: "1rem" }}
          >
            {loading ? "Enviando..." : "Atribuir Atividade"}
          </button>
        </form>
      </div>
    </div>
  );
}