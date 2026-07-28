import { useEffect, useState } from 'react';
import { FiAward, FiBookOpen, FiMapPin, FiMonitor, FiUsers } from 'react-icons/fi';
import { StatCard } from '../components/StatCard';
import { api } from '../services/api';

type Counts = { students: number; monitors: number; disciplinas: number };
const sizeOf = (data: unknown) => Array.isArray(data) ? data.length : Array.isArray((data as { data?: unknown[] })?.data) ? (data as { data: unknown[] }).data.length : 0;

export default function Dashboard() {
  const [counts, setCounts] = useState<Counts>({ students: 0, monitors: 0, disciplinas: 0 });
  const [online, setOnline] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/students'), api.get('/monitors'), api.get('/disciplinas')])
      .then(([students, monitors, disciplinas]) => {
        setCounts({ students: sizeOf(students.data), monitors: sizeOf(monitors.data), disciplinas: sizeOf(disciplinas.data) });
        setOnline(true);
      })
      .catch(() => setOnline(false));
  }, []);

  return <div className="dashboard-page">
    <section className="page-heading"><div><span className="eyebrow">VISÃO GERAL</span><h2>Olá, bem-vindo ao Conecta Ensino</h2><p>Acompanhe alunos, monitores e atividades em um só lugar.</p></div><span className={`api-status ${online ? 'online' : ''}`}>{online ? 'API conectada' : 'Modo de visualização'}</span></section>
    <section className="stats-grid">
      <StatCard title="Alunos" value={counts.students} caption="perfis cadastrados" icon={FiUsers} />
      <StatCard title="Monitores" value={counts.monitors} caption="disponíveis na rede" icon={FiMonitor} />
      <StatCard title="Disciplinas" value={counts.disciplinas} caption="áreas de estudo" icon={FiBookOpen} />
      <StatCard title="Certificados" value="—" caption="acesso na próxima etapa" icon={FiAward} />
    </section>
    <section className="dashboard-grid">
      <article className="mapa-card dashboard-map"><div className="card-heading"><div><span className="eyebrow">LOCALIZAÇÃO</span><h3>Mapa de conexões</h3></div><FiMapPin /></div><div className="map-placeholder"><span className="map-pulse one"/><span className="map-pulse two"/><span className="map-pulse three"/><div><FiMapPin/><strong>Leaflet entra na Sprint 02</strong><small>O layout já está preparado para receber o mapa.</small></div></div></article>
      <article className="panel"><div className="card-heading"><div><span className="eyebrow">ATIVIDADE</span><h3>Próximas ações</h3></div></div><div className="activity-list"><div><span className="activity-mark"/><p><strong>Encontre um monitor</strong><small>Use localização e disciplina.</small></p></div><div><span className="activity-mark"/><p><strong>Solicite uma sessão</strong><small>Conecte-se com quem pode ajudar.</small></p></div><div><span className="activity-mark"/><p><strong>Emita seu certificado</strong><small>Registre sua participação.</small></p></div></div></article>
    </section>
  </div>;
}
