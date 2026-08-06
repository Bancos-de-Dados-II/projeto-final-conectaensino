import {
  ChevronDown,
  Menu,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { getOwnAccountProfile } from "../services/monitor-profile.service";
import { getApplicationRole } from "../utils/auth-role";
import NotificationCenter from "./notifications/NotificationCenter";
import GlobalSearch from "./search/GlobalSearch";

interface HeaderProps {
  onMenuClick: () => void;
}

function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profileAvatar, setProfileAvatar] = useState("");

  const loadProfileImage = useCallback(() => {
    if (!user || getApplicationRole(user) === "admin") return;
    void getOwnAccountProfile()
      .then((profile) => setProfileAvatar(profile.avatar ?? ""))
      .catch(() => undefined);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadProfileImage();
    const intervalId = window.setInterval(loadProfileImage, 10000);
    window.addEventListener("profile-updated", loadProfileImage);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("profile-updated", loadProfileImage);
    };
  }, [loadProfileImage, user]);

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
    <header className={`header ${!user ? "header--guest" : ""}`}> 
      <div className="header__brand">
        <button
          className="icon-button header__menu-button"
          type="button"
          aria-label="Abrir menu"
          onClick={onMenuClick}
        >
          <Menu size={22} />
        </button>

        {/* Direciona para o dashboard se logado, ou para a landing page se deslogado */}
        <Link 
          to={user ? "/dashboard" : "/"} 
          className="header-brand-link" 
          style={{ display: "flex", alignItems: "center", textDecoration: "none" }}
        >
          <img className="header-logo" alt="Conecta Ensino" src="" />
        </Link>
      </div>

      {/* A barra de busca só aparece se o usuário estiver autenticado */}
      {user && <GlobalSearch />}

      <div className="header__actions">
        {user ? (
          <>
            <NotificationCenter compact />
            <button
              className="profile-button"
              type="button"
              onClick={() => navigate("/perfil")}
            >
              <span className="profile-avatar">
                {profileAvatar ? (
                  <img src={profileAvatar} alt={`Foto de ${displayName}`} />
                ) : (
                  initials || "CE"
                )}
              </span>
              <span className="profile-info">
                <strong>{displayName}</strong>
                <small>{user?.role || "Usuário"}</small>
              </span>
              <ChevronDown size={17} />
            </button>
          </>
        ) : (
          <Link to="/login" className="primary-button" style={{ textDecoration: "none" }}>
            Entrar
          </Link>
        )}
      </div>
    </header>
  );
}

export default Header;