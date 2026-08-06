import { useCallback, useEffect, useState } from "react";
import { BookOpen, Check, RefreshCw, X } from "lucide-react";
import EntityManager from "../components/crud/EntityManager";
import { subjectsResource } from "../config/resources";
import { useAuth } from "../hooks/useAuth";
import {
  getSubjectSuggestions,
  reviewSubjectSuggestion,
  type SubjectSuggestionRecord,
} from "../services/subject.service";
import { getApplicationRole } from "../utils/auth-role";

function AdminSubjectSuggestions() {
  const [items, setItems] = useState<SubjectSuggestionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await getSubjectSuggestions()); }
    catch { setMessage("Não foi possível carregar as sugestões."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function review(item: SubjectSuggestionRecord, status: "approved" | "rejected") {
    setReviewingId(item._id);
    setMessage("");
    try {
      await reviewSubjectSuggestion(item._id, status);
      setItems((current) => current.map((entry) => entry._id === item._id ? { ...entry, status } : entry));
      setMessage(status === "approved" ? "Disciplina aprovada." : "Sugestão rejeitada.");
    } catch { setMessage("Não foi possível revisar a sugestão."); }
    finally { setReviewingId(""); }
  }

  return (
    <div className="domain-page">
      <section className="crud-page__heading">
        <div><span className="dashboard__eyebrow">Moderação</span><h1>Sugestões de disciplinas</h1><p>Aprove as novas disciplinas sugeridas pelos usuários.</p></div>
        <button className="icon-button" type="button" title="Atualizar" aria-label="Atualizar" onClick={() => void load()} disabled={loading}><RefreshCw size={18} /></button>
      </section>
      {message && <div className="crud-feedback crud-feedback--success" role="status">{message}</div>}
      <section className="subject-review-list panel">
        {loading && <div className="domain-empty"><span className="route-loader__spinner" /></div>}
        {!loading && items.length === 0 && <div className="domain-empty"><BookOpen size={30} /><strong>Nenhuma sugestão</strong></div>}
        {!loading && items.map((item) => (
          <article key={item._id}>
            <div><strong>{item.name}</strong><small>Sugerida por: {item.suggestedByRole}</small></div>
            <span className={`status-pill status-pill--${item.status}`}>{item.status === "pending" ? "Pendente" : item.status === "approved" ? "Aprovada" : "Rejeitada"}</span>
            {item.status === "pending" && <div>
              <button className="icon-button" type="button" title="Aprovar" aria-label="Aprovar" disabled={reviewingId === item._id} onClick={() => void review(item, "approved")}><Check size={17} /></button>
              <button className="icon-button" type="button" title="Rejeitar" aria-label="Rejeitar" disabled={reviewingId === item._id} onClick={() => void review(item, "rejected")}><X size={17} /></button>
            </div>}
          </article>
        ))}
      </section>
    </div>
  );
}

function SubjectsPage() {
  const { user } = useAuth();
  return getApplicationRole(user) === "admin"
    ? <AdminSubjectSuggestions />
    : <EntityManager config={subjectsResource} />;
}

export default SubjectsPage;
