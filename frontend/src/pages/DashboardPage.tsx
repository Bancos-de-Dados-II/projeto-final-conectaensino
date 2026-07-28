import {
  Award,
  BookOpenCheck,
  CalendarCheck,
  ChevronRight,
  GraduationCap,
  MapPin,
  MoreHorizontal,
  UsersRound,
} from 'lucide-react';
import { StatCard } from '../components/StatCard';

const activities = [
  { initials: 'AS', name: 'Ana Souza', action: 'solicitou uma aula', subject: 'Matemática', time: 'há 5 min' },
  { initials: 'JM', name: 'João Martins', action: 'aceitou uma sessão', subject: 'Algoritmos', time: 'há 18 min' },
  { initials: 'LC', name: 'Larissa Costa', action: 'recebeu certificado', subject: 'Lógica', time: 'há 1 h' },
  { initials: 'PR', name: 'Paulo Rocha', action: 'avaliou um monitor', subject: 'Física', time: 'há 2 h' },
];

export function DashboardPage() {
  return (
    <div className="dashboard-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Visão geral</span>
          <h1>Dashboard</h1>
          <p>Acompanhe os principais dados da plataforma.</p>
        </div>
        <div className="heading-actions">
          <button className="secondary-button">Exportar relatório</button>
          <button className="primary-button compact">+ Nova sessão</button>
        </div>
      </div>

      <section className="stats-grid">
        <StatCard label="Total de alunos" value="1.284" variation="+12,5% este mês" icon={UsersRound} tone="blue" />
        <StatCard label="Monitores ativos" value="86" variation="+8,2% este mês" icon={GraduationCap} tone="green" />
        <StatCard label="Sessões realizadas" value="342" variation="+18,4% este mês" icon={CalendarCheck} tone="orange" />
        <StatCard label="Certificados emitidos" value="128" variation="+10,1% este mês" icon={Award} tone="purple" />
      </section>

      <section className="dashboard-grid">
        <article className="panel map-preview-panel">
          <div className="panel-header">
            <div><h2>Distribuição geográfica</h2><p>Usuários cadastrados por localização</p></div>
            <button className="icon-button"><MoreHorizontal size={20} /></button>
          </div>
          <div className="map-preview">
            <div className="map-lines" />
            <div className="map-blob blob-one" />
            <div className="map-blob blob-two" />
            <div className="map-blob blob-three" />
            <span className="map-pin pin-one"><i /> Cajazeiras</span>
            <span className="map-pin pin-two"><i /> Sousa</span>
            <span className="map-pin pin-three"><i /> João Pessoa</span>
            <div className="map-preview-message"><MapPin size={20} /><span>Leaflet será ativado na Sprint 2</span></div>
          </div>
          <div className="map-legend">
            <span><i className="legend-dot student" /> Alunos</span>
            <span><i className="legend-dot monitor" /> Monitores</span>
            <span><i className="legend-dot institution" /> Instituições</span>
          </div>
        </article>

        <article className="panel disciplines-panel">
          <div className="panel-header">
            <div><h2>Disciplinas populares</h2><p>Maior procura na plataforma</p></div>
            <button className="icon-button"><MoreHorizontal size={20} /></button>
          </div>
          <div className="discipline-list">
            {[
              ['Algoritmos e Lógica', 88],
              ['Matemática', 74],
              ['Programação Web', 62],
              ['Física', 47],
              ['Banco de Dados', 39],
            ].map(([name, value], index) => (
              <div className="discipline-row" key={String(name)}>
                <div className="discipline-rank">{index + 1}</div>
                <div className="discipline-progress">
                  <div><strong>{name}</strong><span>{value} solicitações</span></div>
                  <div className="progress-track"><div style={{ width: `${value}%` }} /></div>
                </div>
              </div>
            ))}
          </div>
          <button className="text-button">Ver todas as disciplinas <ChevronRight size={16} /></button>
        </article>
      </section>

      <section className="dashboard-grid lower-grid">
        <article className="panel activity-panel">
          <div className="panel-header">
            <div><h2>Atividades recentes</h2><p>Últimas movimentações da plataforma</p></div>
            <button className="text-button">Ver tudo <ChevronRight size={16} /></button>
          </div>
          <div className="activity-list">
            {activities.map((activity) => (
              <div className="activity-row" key={`${activity.name}-${activity.time}`}>
                <div className="activity-avatar">{activity.initials}</div>
                <div className="activity-content">
                  <p><strong>{activity.name}</strong> {activity.action}</p>
                  <span>{activity.subject}</span>
                </div>
                <time>{activity.time}</time>
              </div>
            ))}
          </div>
        </article>

        <article className="panel quick-panel">
          <div className="panel-header"><div><h2>Acesso rápido</h2><p>Atalhos mais utilizados</p></div></div>
          <div className="quick-actions">
            <button><span className="quick-icon blue"><MapPin size={20} /></span><span><strong>Abrir mapa</strong><small>Buscar usuários próximos</small></span><ChevronRight size={18} /></button>
            <button><span className="quick-icon green"><CalendarCheck size={20} /></span><span><strong>Minhas sessões</strong><small>Acompanhar solicitações</small></span><ChevronRight size={18} /></button>
            <button><span className="quick-icon orange"><BookOpenCheck size={20} /></span><span><strong>Disciplinas</strong><small>Gerenciar vínculos</small></span><ChevronRight size={18} /></button>
          </div>
        </article>
      </section>
    </div>
  );
}
