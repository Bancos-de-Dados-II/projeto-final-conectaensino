import { FiBell, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

export function Header() {
  const { user, logout } = useAuth();
  return (
    <header className="app-header">
      <div className="brand-block">
        <span className="header-dot" />
        <div>
          <h1>Conecta Ensino</h1>
          <small>Plataforma de monitoria acadêmica</small>
        </div>
      </div>
      <div className="header-actions">
        <button className="icon-button" aria-label="Notificações"><FiBell /></button>
        <div className="user-chip">
          <span className="avatar">{user?.email?.charAt(0).toUpperCase() ?? 'U'}</span>
          <span>{user?.email ?? 'Usuário'}</span>
        </div>
        <button className="icon-button danger" aria-label="Sair" onClick={logout}><FiLogOut /></button>
      </div>
    </header>
  );
}
