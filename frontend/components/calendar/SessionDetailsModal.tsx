import { CalendarClock, MapPin, UserRound, X } from "lucide-react";
import type { ExperienceSession } from "../../types/experience";

interface Props { session: ExperienceSession | null; onClose: () => void; }

export default function SessionDetailsModal({ session, onClose }: Props) {
  if (!session) return null;
  const formatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "full", timeStyle: "short" });
  return (
    <div className="experience-modal-backdrop" onMouseDown={onClose}>
      <article className="experience-modal" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div><span className="page-kicker">Detalhes da sessão</span><h2>{session.title}</h2></div>
          <button className="icon-button" type="button" onClick={onClose}><X size={19} /></button>
        </header>
        <div className="experience-modal__body">
          <div><CalendarClock size={18}/><span><strong>Data e hora</strong><small>{formatter.format(new Date(session.start))}</small></span></div>
          <div><UserRound size={18}/><span><strong>Monitor</strong><small>{session.monitorName}</small></span></div>
          {session.location && <div><MapPin size={18}/><span><strong>Local</strong><small>{session.location}</small></span></div>}
          <p>{session.description || "Nenhuma observação cadastrada para esta sessão."}</p>
        </div>
      </article>
    </div>
  );
}
