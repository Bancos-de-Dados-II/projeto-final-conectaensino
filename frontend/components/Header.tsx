import {
  ChevronDown,
  GraduationCap,
  Menu,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import NotificationCenter from "./notifications/NotificationCenter";
import GlobalSearch from "./search/GlobalSearch";

interface HeaderProps {
  onMenuClick: () => void;
}

function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const displayName =
    typeof user?.user_metadata?.name === "string"
      ? user.user_metadata.name
      : user?.email?.split("@")[0] || "Usuário";

  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <header className="header">
      <div className="header__brand">
        <button
          className="icon-button header__menu-button"
          type="button"
          aria-label="Abrir menu"
          onClick={onMenuClick}
        >
          <Menu size={22} />
        </button>

        <div className="brand-logo" aria-hidden="true">
          <GraduationCap size={25} />
        </div>

        <div className="brand-text">
          <strong>Conecta Ensino</strong>
          <span>Plataforma educacional</span>
        </div>
      </div>

      <GlobalSearch />

      <div className="header__actions">
        <NotificationCenter compact />

        <button
          className="profile-button"
          type="button"
          onClick={() => navigate("/perfil")}
        >
          <span className="profile-avatar">{initials || "CE"}</span>

          <span className="profile-info">
            <strong>{displayName}</strong>
            <small>{user?.role || "Usuário"}</small>
          </span>

          <ChevronDown size={17} />
        </button>
      </div>
    </header>
  );
}

export default Header;
