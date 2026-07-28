import { NavLink } from 'react-router-dom';
import { FiAward, FiBookOpen, FiGrid, FiMap, FiMonitor, FiSearch, FiUsers, FiUser } from 'react-icons/fi';

const items = [
  { to: '/dashboard', label: 'Dashboard', icon: FiGrid },
  { to: '/mapa', label: 'Mapa', icon: FiMap },
  { to: '/monitores', label: 'Monitores', icon: FiMonitor },
  { to: '/alunos', label: 'Alunos', icon: FiUsers },
  { to: '/sessoes', label: 'Sessões', icon: FiBookOpen },
  { to: '/certificados', label: 'Certificados', icon: FiAward },
  { to: '/perfil', label: 'Perfil', icon: FiUser },
];

export function Sidebar() {
  return (
    <aside>
      <span className="sidebar-label">Navegação</span>
      <div className="search-wrap">
        <FiSearch className="search-icon" />
        <input placeholder="Buscar no sistema..." />
      </div>
      <nav className="nav-list">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `nav-item${isActive ? ' ativo' : ''}`}>
            <Icon /><span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <p className="contagem">Sprint 01 • Interface ativa</p>
    </aside>
  );
}
