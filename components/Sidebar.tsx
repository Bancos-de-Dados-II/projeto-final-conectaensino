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

const mainItems = [
  { label: "Dashboard", path: "/dashboard", icon: Gauge },
  { label: "Mapa", path: "/mapa", icon: MapPinned },
  { label: "Monitores", path: "/monitores", icon: GraduationCap },
  { label: "Favoritos", path: "/favoritos", icon: Heart },
  { label: "Mensagens", path: "/mensagens", icon: MessageCircle },
  { label: "Alunos", path: "/alunos", icon: UsersRound },
  { label: "Sessões", path: "/sessoes", icon: CalendarDays },
  { label: "Agenda", path: "/agenda", icon: CalendarDays },
  { label: "Histórico", path: "/historico", icon: History },
];

const managementItems = [
  { label: "Instituições", path: "/instituicoes", icon: Building2 },
  { label: "Disciplinas", path: "/disciplinas", icon: BookOpen },
  { label: "Certificados", path: "/certificados", icon: Award },
  { label: "Avaliações", path: "/avaliacoes", icon: Star },
];

export default function Sidebar({
  isOpen,
  onNavigate,
}: SidebarProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();

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
            {mainItems.map((item) => (
              <SidebarLink
                key={item.path}
                {...item}
                onNavigate={onNavigate}
              />
            ))}
          </SidebarGroup>

          <SidebarGroup title="Gerenciamento">
            {managementItems.map((item) => (
              <SidebarLink
                key={item.path}
                {...item}
                onNavigate={onNavigate}
              />
            ))}
          </SidebarGroup>

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
