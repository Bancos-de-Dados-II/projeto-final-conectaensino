import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SessionDetailsModal from "../components/calendar/SessionDetailsModal";
import { getSessions } from "../services/experience.service";
import type { ExperienceSession } from "../types/experience";

const week = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const keyOf = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

export default function CalendarPage() {
  const [cursor, setCursor] = useState(new Date());
  const [sessions, setSessions] = useState<ExperienceSession[]>([]);
  const [selected, setSelected] = useState<ExperienceSession | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { void getSessions().then(setSessions).finally(() => setLoading(false)); }, []);
  const days = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1 - first.getDay());
    return Array.from({ length: 42 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));
  }, [cursor]);
  const byDay = useMemo(() => {
    const map = new Map<string, ExperienceSession[]>();
    sessions.forEach((session) => {
      const date = new Date(session.start); const key = keyOf(date);
      map.set(key, [...(map.get(key) || []), session]);
    }); return map;
  }, [sessions]);
  const title = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(cursor);
  return <section className="experience-page">
    <header className="experience-heading"><div><span className="page-kicker">Organização</span><h1>Agenda de monitorias</h1><p>Visualize suas sessões em um calendário mensal.</p></div>
      <div className="calendar-toolbar"><button className="icon-button" onClick={() => setCursor(new Date())}>Hoje</button><button className="icon-button" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth()-1,1))}><ChevronLeft size={18}/></button><strong>{title}</strong><button className="icon-button" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth()+1,1))}><ChevronRight size={18}/></button></div>
    </header>
    {loading ? <div className="experience-loading"><span className="route-loader__spinner"/>Carregando agenda...</div> :
    <article className="calendar-panel panel"><div className="calendar-weekdays">{week.map((day)=><span key={day}>{day}</span>)}</div><div className="calendar-grid">{days.map((day) => {
      const items=byDay.get(keyOf(day))||[]; const outside=day.getMonth()!==cursor.getMonth(); const today=keyOf(day)===keyOf(new Date());
      return <div key={day.toISOString()} className={`calendar-day ${outside?'calendar-day--outside':''} ${today?'calendar-day--today':''}`}><span className="calendar-day__number">{day.getDate()}</span><div className="calendar-day__events">{items.slice(0,3).map((session)=><button key={session.id} className={`calendar-event calendar-event--${session.status}`} onClick={()=>setSelected(session)}><b>{new Date(session.start).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</b><span>{session.subject}</span></button>)}{items.length>3&&<small>+{items.length-3} sessões</small>}</div></div>;
    })}</div></article>}
    <SessionDetailsModal session={selected} onClose={()=>setSelected(null)}/>
  </section>;
}
