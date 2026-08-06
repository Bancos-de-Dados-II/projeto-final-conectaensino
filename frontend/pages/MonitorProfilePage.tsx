import { useEffect, useState } from "react";
import { Accessibility, Award, BookOpen, CalendarPlus, Check, GraduationCap, Home, MapPin, PenLine, Plus, Save, Star, X } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import FavoriteButton from "../components/favorites/FavoriteButton";
import { getMonitor, getMyMonitorProfile, updateMonitorPreferences } from "../services/experience.service";
import type { PublicMonitor } from "../types/experience";
import SubjectSuggestionForm from "../components/subjects/SubjectSuggestionForm";
import { getSubjectCatalog } from "../services/subject.service";

const HABILIDADES_PCD_OPCOES = [
  "Libras (Língua Brasileira de Sinais)",
  "Material em Braille / Texto Ampliado",
  "Suporte para TEA (Autismo)",
  "Metodologias para TDAH / Dislexia",
  "Comunicação Alternativa (CAA)",
  "Audiodescrição",
];

export default function MonitorProfilePage() {
  const { id } = useParams();
  const [monitor, setMonitor] = useState<PublicMonitor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [aceitaCasa, setAceitaCasa] = useState(false);
  
  // Estado para disciplinas
  const [editingSubjects, setEditingSubjects] = useState(false);
  const [subjectsInput, setSubjectsInput] = useState("");
  const [savingSubjects, setSavingSubjects] = useState(false);
  const [subjectsMessage, setSubjectsMessage] = useState("");
  const [subjectCatalog, setSubjectCatalog] = useState<string[]>([]);

  // Estado para Habilidades PCD
  const [editingPcd, setEditingPcd] = useState(false);
  const [pcdSelected, setPcdSelected] = useState<string[]>([]);
  const [savingPcd, setSavingPcd] = useState(false);
  const [pcdMessage, setPcdMessage] = useState("");

  const isMyProfile = !id;

  useEffect(() => {
    // Se TEM 'id' na URL -> Perfil público (getMonitor)
    // Se NÃO tem 'id' na URL -> Meu Perfil (getMyMonitorProfile)
    const fetchPromise = id ? getMonitor(id) : getMyMonitorProfile();

    void fetchPromise
      .then((data: any) => {
        setMonitor(data);
        setAceitaCasa(data.aceitaMonitoriaCasa ?? false);
        setSubjectsInput(data.subjects?.join(", ") || "");
        setPcdSelected(data.habilidadesPcd || []);
      })
      .catch((err) => {
        console.error("Erro na busca de perfil:", err);
        setError("Não foi possível localizar o perfil.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!isMyProfile) return;
    void getSubjectCatalog().then(setSubjectCatalog).catch(() => setSubjectCatalog([]));
  }, [isMyProfile]);

  const handleToggleHomeTutoring = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const novoValor = e.target.checked;
    setAceitaCasa(novoValor);
    try {
      await updateMonitorPreferences({ aceitaMonitoriaCasa: novoValor });
    } catch {
      setAceitaCasa(!novoValor);
    }
  };

  const handleSaveSubjects = async () => {
    const subjects = [...new Set(
      subjectsInput.split(",").map((subject) => subject.trim()).filter(Boolean),
    )];
    if (!subjects.length) {
      setSubjectsMessage("Informe pelo menos uma disciplina.");
      return;
    }
    setSavingSubjects(true);
    setSubjectsMessage("");
    try {
      await updateMonitorPreferences({ disciplinas: subjects });
      setMonitor((current) => current ? { ...current, subjects } : current);
      setSubjectsInput(subjects.join(", "));
      setEditingSubjects(false);
      setSubjectsMessage("Disciplinas atualizadas com sucesso.");
    } catch {
      setSubjectsMessage("Não foi possível atualizar as disciplinas.");
    } finally {
      setSavingSubjects(false);
    }
  };

  const togglePcdHabilidade = (opcao: string) => {
    setPcdSelected((prev) =>
      prev.includes(opcao) ? prev.filter((item) => item !== opcao) : [...prev, opcao]
    );
  };

  const handleSavePcd = async () => {
    setSavingPcd(true);
    setPcdMessage("");
    try {
      await updateMonitorPreferences({ habilidadesPcd: pcdSelected });
      setMonitor((current) => current ? { ...current, habilidadesPcd: pcdSelected } : current);
      setEditingPcd(false);
      setPcdMessage("Habilidades PCD atualizadas com sucesso.");
    } catch {
      setPcdMessage("Não foi possível atualizar as habilidades PCD.");
    } finally {
      setSavingPcd(false);
    }
  };

  if (loading) {
    return (
      <div className="experience-loading experience-loading--page">
        <span className="route-loader__spinner" />
        Carregando perfil...
      </div>
    );
  }

  if (!monitor) {
    return (
      <section className="experience-page">
        <div className="experience-empty panel">
          <GraduationCap size={36} />
          <strong>Monitor não encontrado</strong>
          <p>{error}</p>
          <Link className="primary-button" to="/monitores">
            Voltar aos monitores
          </Link>
        </div>
      </section>
    );
  }

  const initials = monitor.name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <section className="experience-page">
      <article className="monitor-hero panel">
        <div className="monitor-avatar">
          {monitor.avatar ? <img src={monitor.avatar} alt={monitor.name} /> : initials}
        </div>
        <div className="monitor-hero__content">
          <span className="page-kicker">{isMyProfile ? "Meu Perfil de Monitor" : "Perfil público"}</span>
          <h1>{monitor.name}</h1>
          <p>{monitor.bio}</p>
          <div className="monitor-meta">
            {monitor.institution && (
              <span>
                <GraduationCap size={15} />
                {monitor.institution}
              </span>
            )}
            {monitor.city && (
              <span>
                <MapPin size={15} />
                {monitor.city}
              </span>
            )}
            <span>
              <Star size={15} />
              {monitor.rating.toFixed(1)} de avaliação
            </span>
          </div>

          {isMyProfile && (
            <div className="monitor-checkbox" style={{ marginTop: "12px" }}>
              <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.9rem", fontWeight: 500 }}>
                <input 
                  type="checkbox" 
                  checked={aceitaCasa} 
                  onChange={handleToggleHomeTutoring}
                  className="monitor-checkbox-input"
                />
                <Home size={16} /> Aceita monitoria na casa do aluno
              </label>
            </div>
          )}
        </div>
        
        <div className="monitor-hero__actions">
          {!isMyProfile && (
            <>
              <FavoriteButton monitorId={monitor.id} />
              <Link className="primary-button" to={`/sessoes?monitor=${monitor.id}`}>
                <CalendarPlus size={17} />
                Solicitar monitoria
              </Link>
            </>
          )}
        </div>
      </article>

      <section className="monitor-stat-grid">
        <div className="panel">
          <Star size={20} />
          <strong>{monitor.rating.toFixed(1)}</strong>
          <small>Avaliação média</small>
        </div>
        <div className="panel">
          <CalendarPlus size={20} />
          <strong>{monitor.sessions}</strong>
          <small>Monitorias realizadas</small>
        </div>
        <div className="panel">
          <Award size={20} />
          <strong>{monitor.certificates}</strong>
          <small>Certificados</small>
        </div>
      </section>

      {/* PAINEL DE DISCIPLINAS */}
      <article className="panel monitor-subjects">
        <div className="panel__header">
          <div>
            <span className="panel__eyebrow">Especialidades</span>
            <h2>Disciplinas atendidas</h2>
          </div>
          {isMyProfile && !editingSubjects && (
            <button className="secondary-button" type="button" onClick={() => { setSubjectsMessage(""); setEditingSubjects(true); }}>
              <PenLine size={16} />
              Editar disciplinas
            </button>
          )}
        </div>
        {isMyProfile && editingSubjects ? (
          <div className="monitor-subjects__editor">
            <fieldset>
              <legend>Selecione as disciplinas que você leciona</legend>
              <div className="monitor-subjects__options">
                {subjectCatalog.map((subject) => {
                  const selected = subjectsInput.split(",").map((item) => item.trim()).includes(subject);
                  return (
                    <label key={subject}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => {
                          const current = subjectsInput.split(",").map((item) => item.trim()).filter(Boolean);
                          const next = selected ? current.filter((item) => item !== subject) : [...current, subject];
                          setSubjectsInput(next.join(", "));
                        }}
                      />
                      <span>{subject}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <div>
              <button className="secondary-button" type="button" disabled={savingSubjects} onClick={() => { setSubjectsInput(monitor.subjects.join(", ")); setSubjectsMessage(""); setEditingSubjects(false); }}>
                <X size={16} /> Cancelar
              </button>
              <button className="primary-button" type="button" disabled={savingSubjects} onClick={() => void handleSaveSubjects()}>
                <Save size={16} /> {savingSubjects ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        ) : (
          <div>
          {monitor.subjects.length ? (
            monitor.subjects.map((subject) => (
              <span key={subject}>
                <BookOpen size={15} />
                {subject}
              </span>
            ))
          ) : (
            <p>Nenhuma disciplina informada.</p>
          )}
          </div>
        )}
        {subjectsMessage && <p className="monitor-subjects__message" role="status">{subjectsMessage}</p>}
      </article>

      {/* NOVO PAINEL: HABILIDADES PCD E ACESSIBILIDADE */}
      <article className="panel monitor-pcd" style={{ marginTop: "20px" }}>
        <div className="panel__header">
          <div>
            <span className="panel__eyebrow">Acessibilidade</span>
            <h2>Recursos e Habilidades PCD</h2>
          </div>
          {isMyProfile && !editingPcd && (
            <button className="secondary-button" type="button" onClick={() => { setPcdMessage(""); setEditingPcd(true); }}>
              <PenLine size={16} />
              Editar Habilidades PCD
            </button>
          )}
        </div>

        {isMyProfile && editingPcd ? (
          <div className="monitor-pcd__editor" style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "12px" }}>
            <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>Selecione os recursos e metodologias de acessibilidade que você utiliza em suas aulas:</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {HABILIDADES_PCD_OPCOES.map((opcao) => {
                const isSelected = pcdSelected.includes(opcao);
                return (
                  <button
                    key={opcao}
                    type="button"
                    onClick={() => togglePcdHabilidade(opcao)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 14px",
                      borderRadius: "20px",
                      border: isSelected ? "1px solid var(--color-primary, #e05333)" : "1px solid rgba(255,255,255,0.2)",
                      backgroundColor: isSelected ? "var(--color-primary, #e05333)" : "transparent",
                      color: "#fff",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                  >
                    {isSelected ? <Check size={14} /> : <Plus size={14} />}
                    {opcao}
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button 
                className="secondary-button" 
                type="button" 
                disabled={savingPcd} 
                onClick={() => { 
                  setPcdSelected(monitor.habilidadesPcd || []); 
                  setPcdMessage(""); 
                  setEditingPcd(false); 
                }}
              >
                <X size={16} /> Cancelar
              </button>
              <button 
                className="primary-button" 
                type="button" 
                disabled={savingPcd} 
                onClick={() => void handleSavePcd()}
              >
                <Save size={16} /> {savingPcd ? "Salvando..." : "Salvar Habilidades"}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
            {monitor.habilidadesPcd && monitor.habilidadesPcd.length > 0 ? (
              monitor.habilidadesPcd.map((habilidade) => (
                <span 
                  key={habilidade}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    borderRadius: "16px",
                    backgroundColor: "rgba(224, 83, 51, 0.15)",
                    border: "1px solid var(--color-primary, #e05333)",
                    color: "var(--color-primary, #e05333)",
                    fontSize: "0.85rem",
                    fontWeight: 500
                  }}
                >
                  <Accessibility size={14} />
                  {habilidade}
                </span>
              ))
            ) : (
              <p style={{ fontSize: "0.9rem", opacity: 0.7 }}>Nenhum recurso de acessibilidade PCD cadastrado.</p>
            )}
          </div>
        )}
        {pcdMessage && <p className="monitor-subjects__message" role="status" style={{ marginTop: "10px" }}>{pcdMessage}</p>}
      </article>

      {isMyProfile && <SubjectSuggestionForm />}
    </section>
  );
}