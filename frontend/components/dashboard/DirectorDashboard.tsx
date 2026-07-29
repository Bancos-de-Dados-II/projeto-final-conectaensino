import { useCallback, useEffect, useMemo, useState } from "react";
import { GraduationCap, MessageCircle, RefreshCw, Send, StickyNote, Trash2, UsersRound } from "lucide-react";

import type { DashboardData } from "../../types/dashboard";
import {
  createDirectorNote,
  deleteDirectorNote,
  getDirectorDashboard,
  getDirectorMessages,
  getDirectorNotes,
  sendDirectorMessage,
  type DirectorDashboardData,
  type DirectorMessage,
  type DirectorNote,
} from "../../services/director-dashboard.service";
import ReportExport from "../reports/ReportExport";
import StatCard from "../StatCard";

export default function DirectorDashboard() {
  const [data, setData] = useState<DirectorDashboardData | null>(null);
  const [notes, setNotes] = useState<DirectorNote[]>([]);
  const [messages, setMessages] = useState<DirectorMessage[]>([]);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dashboard, savedNotes, regionalMessages] = await Promise.all([
        getDirectorDashboard(),
        getDirectorNotes(),
        getDirectorMessages(),
      ]);
      setData(dashboard);
      setNotes(savedNotes);
      setMessages(regionalMessages);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const id = window.setInterval(() => void getDirectorMessages().then(setMessages), 10000);
    return () => window.clearInterval(id);
  }, []);

  const report = useMemo<DashboardData | null>(() => data ? ({
    stats: {
      students: data.students.length,
      monitors: data.monitors.length,
      sessions: data.sessionCount,
      certificates: 0,
      averageRating: data.sessionCount
        ? (data.completedSessionCount / data.sessionCount) * 5
        : 0,
    },
    sessionsByMonth: [],
    subjectsRanking: [],
    ratingsDistribution: [],
    activities: [],
  }) : null, [data]);

  if (loading && !data) {
    return <div className="experience-loading"><span className="route-loader__spinner" />Carregando dados da escola...</div>;
  }
  if (!data || !report) {
    return <div className="dashboard-error"><strong>Dashboard indisponível</strong><button onClick={() => void load()}>Tentar novamente</button></div>;
  }

  async function saveNote() {
    if (!note.trim()) return;
    const saved = await createDirectorNote(note);
    setNotes((current) => [saved, ...current]);
    setNote("");
  }

  async function publishMessage() {
    if (!message.trim()) return;
    const saved = await sendDirectorMessage(message);
    setMessages((current) => [...current, saved]);
    setMessage("");
  }

  return (
    <div className="dashboard director-school-dashboard">
      <section className="dashboard__heading">
        <div>
          <span className="dashboard__eyebrow">Gestão da escola</span>
          <h1>{data.institution.name}</h1>
          <p>Alunos, monitores e desempenho vinculados exclusivamente à sua instituição.</p>
        </div>
        <div className="dashboard-heading-actions">
          <button className="icon-button" type="button" onClick={() => void load()}><RefreshCw size={18} /></button>
          <ReportExport data={report} />
        </div>
      </section>

      <section className="stats-grid stats-grid--three">
        <StatCard title="Alunos da escola" value={data.students.length} variation="Atual" description="Cadastrados nesta escola" icon={UsersRound} tone="blue" />
        <StatCard title="Monitores da escola" value={data.monitors.length} variation="Atual" description="Vinculados à instituição" icon={GraduationCap} tone="purple" />
        <StatCard title="Monitorias concluídas" value={data.completedSessionCount} variation={`de ${data.sessionCount}`} description="Atendimentos registrados" icon={GraduationCap} tone="green" />
      </section>

      <section className="director-dashboard-grid">
        <article className="panel director-performance">
          <div className="panel__header"><div><span className="panel__eyebrow">Desempenho</span><h2>Alunos e monitores</h2></div></div>
          <div className="director-performance__groups">
            {[
              { title: "Alunos", items: data.students },
              { title: "Monitores", items: data.monitors },
            ].map((group) => (
              <section key={group.title}>
                <h3>{group.title}</h3>
                {group.items.length === 0 && <p>Nenhum cadastro nesta escola.</p>}
                {group.items.map((person) => (
                  <div className="director-performance__row" key={person.id}>
                    <span><strong>{person.name}</strong><small>{person.email || "E-mail não informado"}</small></span>
                    <div><i style={{ width: `${person.performance.percentage}%` }} /></div>
                    <b>{person.performance.percentage}%</b>
                  </div>
                ))}
              </section>
            ))}
          </div>
        </article>

        <article className="panel director-notes">
          <div className="panel__header"><div><span className="panel__eyebrow">Organização</span><h2><StickyNote size={17} /> Anotações</h2></div></div>
          <div className="director-compose"><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Escreva uma anotação..." maxLength={2000} /><button type="button" onClick={() => void saveNote()}>Salvar</button></div>
          <div className="director-notes__list">
            {notes.map((item) => <div key={item._id}><p>{item.content}</p><button type="button" aria-label="Excluir anotação" onClick={() => void deleteDirectorNote(item._id).then(() => setNotes((current) => current.filter((noteItem) => noteItem._id !== item._id)))}><Trash2 size={14} /></button></div>)}
          </div>
        </article>

        <article className="panel director-channel">
          <div className="panel__header"><div><span className="panel__eyebrow">Raio de 100 km</span><h2><MessageCircle size={17} /> Canal regional de diretores</h2></div></div>
          <div className="director-channel__messages">
            {messages.length === 0 && <p>Nenhuma mensagem regional.</p>}
            {messages.map((item) => <div key={item._id}><strong>{item.senderName}</strong><small>{item.institutionName}</small><p>{item.content}</p><time>{new Date(item.createdAt).toLocaleString("pt-BR")}</time></div>)}
          </div>
          <div className="director-channel__composer"><input value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void publishMessage(); }} placeholder="Mensagem para diretores próximos..." maxLength={2000} /><button type="button" onClick={() => void publishMessage()}><Send size={16} /></button></div>
        </article>
      </section>
    </div>
  );
}
