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
  Paperclip,
  Settings,
  ShieldCheck,
  Star,
  UserRound,
  UsersRound,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import {
  canManageMonitors,
  getApplicationRole,
} from "../utils/auth-role";

interface SidebarProps {
  isOpen: boolean;
  onNavigate: () => void;
}

const mainItems = [
  { label: "Dashboard", path: "/dashboard", icon: Gauge },
  { label: "Diretores", path: "/diretores", icon: ShieldCheck },
  { label: "Mapa", path: "/mapa", icon: MapPinned },
  { label: "Monitores", path: "/monitores", icon: GraduationCap },
  { label: "Favoritos", path: "/favoritos", icon: Heart },
  { label: "Tira-dúvidas", path: "/mensagens", icon: MessageCircle },
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
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const canManage = canManageMonitors(user);

  const userRole = getApplicationRole(user);
  const isDirector = userRole === "director";
  const isMonitor = userRole === "monitor";
  const isStudent = userRole === "student";
  const isAdmin = userRole === "admin";

  const visibleMainItems = mainItems.filter((item) => {
    if (isAdmin && !["/dashboard", "/diretores", "/mapa", "/monitores", "/alunos"].includes(item.path)) return false;
    if (!isAdmin && item.path === "/diretores") return false;
    if (
      isDirector
      && ["/mapa", "/mensagens", "/favoritos", "/agenda"].includes(item.path)
    ) {
      return false;
    }
    if (isMonitor && (item.path === "/mapa" || item.path === "/favoritos")) {
      return false;
    }
    if (isStudent && item.path === "/favoritos") {
      return false;
    }
    if (!canManage && item.path === "/alunos") {
      return false;
    }
    if (!canManage && item.path === "/monitores") {
      return false;
    }
    return true;
  });
  const visibleManagementItems = managementItems.filter(
    (item) =>
      !isAdmin && (
        !isDirector
        || !["/instituicoes", "/disciplinas"].includes(item.path)
      ),
  );

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
            {visibleMainItems.map((item) => (
              <div key={item.path}>
                <SidebarLink
                  {...item}
                  label={
                    isDirector && item.path === "/sessoes"
                      ? "Acompanhamento"
                      : item.label
                  }
                  onNavigate={onNavigate}
                />
                {item.path === "/sessoes" && (
                  <SidebarLink
                    label={
                      canManage
                        ? "Relatório de atividades"
                        : isMonitor
                          ? "Materiais"
                          : "Atividades"
                    }
                    path="/sessoes/atividades"
                    icon={Paperclip}
                    onNavigate={onNavigate}
                    nested
                  />
                )}
              </div>
            ))}
          </SidebarGroup>

          {canManage && (
            <SidebarGroup title="Gerenciamento">
              {visibleManagementItems.map((item) => (
                <SidebarLink
                  key={item.path}
                  {...item}
                  onNavigate={onNavigate}
                />
              ))}
            </SidebarGroup>
          )}
        </nav>
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
  nested = false,
}: {
  label: string;
  path: string;
  icon: ElementType;
  onNavigate: () => void;
  nested?: boolean;
}) {
  return (
    <NavLink
      to={path}
      onClick={onNavigate}
      className={({ isActive }) =>
        `sidebar-link ${nested ? "sidebar-link--nested" : ""} ${
          isActive ? "sidebar-link--active" : ""
        }`
      }
    >
      <Icon size={20} />
      <span>{label}</span>
    </NavLink>
  );
}
