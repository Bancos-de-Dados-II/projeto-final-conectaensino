import type { ElementType, ReactNode } from "react";
import {
  Award,
  BookOpen,
  Building2,
  CalendarDays,
  Gauge,
  GraduationCap,
  Heart,
  History,
  LogOut,
  MapPinned,
  MessageCircle,
  MessageSquareText,
  Settings,
  Star,
  UserRound,
  UsersRound,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

interface SidebarProps {
  isOpen: boolean;
  onNavigate: () => void;
}

export default function Sidebar({
  isOpen,
  onNavigate,
}: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Verifica se o usuário logado possui a role de diretor
  const userRole = user?.user_metadata?.role || (user as any)?.role;
  const isDirector = userRole === "director";

  function handleLogout() {
    logout();
    onNavigate();
    navigate("/login", { replace: true });
  }

  return (
    <aside className={`sidebar ${isOpen ? "sidebar--open" : ""}`}>
      <div className="sidebar__content">
        <nav className="sidebar__navigation">
          <SidebarGroup title="Principal">
            <SidebarLink label="Dashboard" path="/dashboard" icon={Gauge} onNavigate={onNavigate} />
            <SidebarLink label="Mapa" path="/mapa" icon={MapPinned} onNavigate={onNavigate} />
            
            {/* Visível apenas para Diretores */}
            {isDirector && (
              <SidebarLink label="Monitores" path="/monitores" icon={GraduationCap} onNavigate={onNavigate} />
            )}

            <SidebarLink label="Favoritos" path="/favoritos" icon={Heart} onNavigate={onNavigate} />
            <SidebarLink label="Mensagens" path="/mensagens" icon={MessageCircle} onNavigate={onNavigate} />

            {/* Visível apenas para Diretores */}
            {isDirector && (
              <SidebarLink label="Alunos" path="/alunos" icon={UsersRound} onNavigate={onNavigate} />
            )}

            <SidebarLink label="Sessões" path="/sessoes" icon={CalendarDays} onNavigate={onNavigate} />
            <SidebarLink label="Agenda" path="/agenda" icon={CalendarDays} onNavigate={onNavigate} />
            <SidebarLink label="Histórico" path="/historico" icon={History} onNavigate={onNavigate} />
          </SidebarGroup>

          {/* Seção de Gerenciamento inteira restrita a Diretores */}
          {isDirector && (
            <SidebarGroup title="Gerenciamento">
              <SidebarLink label="Instituições" path="/instituicoes" icon={Building2} onNavigate={onNavigate} />
              <SidebarLink label="Disciplinas" path="/disciplinas" icon={BookOpen} onNavigate={onNavigate} />
              <SidebarLink label="Certificados" path="/certificados" icon={Award} onNavigate={onNavigate} />
              <SidebarLink label="Avaliações" path="/avaliacoes" icon={Star} onNavigate={onNavigate} />
            </SidebarGroup>
          )}

          <SidebarGroup title="Conta">
            <SidebarLink
              label="Meu perfil"
              path="/perfil"
              icon={UserRound}
              onNavigate={onNavigate}
            />
            <SidebarLink
              label="Configurações"
              path="/configuracoes"
              icon={Settings}
              onNavigate={onNavigate}
            />
          </SidebarGroup>
        </nav>

        <div className="sidebar__support-card">
          <div className="sidebar__support-icon">
            <MessageSquareText size={21} />
          </div>
          <div>
            <strong>Precisa de ajuda?</strong>
            <p>Fale com nossa equipe de suporte.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              navigate("/mensagens");
              onNavigate();
            }}
          >
            Abrir mensagens
          </button>
        </div>
      </div>

      <div className="sidebar__footer">
        <button
          className="sidebar__footer-button"
          type="button"
          onClick={() => {
            navigate("/configuracoes");
            onNavigate();
          }}
        >
          <Settings size={19} />
          <span>Configurações</span>
        </button>

        <button
          className="sidebar__footer-button sidebar__footer-button--danger"
          type="button"
          onClick={handleLogout}
        >
          <LogOut size={19} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}

function SidebarGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="sidebar-group">
      <span className="sidebar-group__title">{title}</span>
      <div className="sidebar-group__items">{children}</div>
    </div>
  );
}

function SidebarLink({
  label,
  path,
  icon: Icon,
  onNavigate,
}: {
  label: string;
  path: string;
  icon: ElementType;
  onNavigate: () => void;
}) {
  return (
    <NavLink
      to={path}
      onClick={onNavigate}
      className={({ isActive }) =>
        `sidebar-link ${isActive ? "sidebar-link--active" : ""}`
      }
    >
      <Icon size={20} />
      <span>{label}</span>
    </NavLink>
  );
}