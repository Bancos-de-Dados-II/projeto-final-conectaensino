import { Bell, LockKeyhole, MonitorCog, LayoutGrid } from "lucide-react";
import { useState } from "react";

import { useAppearance } from "../contexts/AppearanceContext";
import { useLayoutMode } from "../contexts/LayoutModeContext";
import type { ThemePreference } from "../types/settings";

type Section = "appearance" | "notifications" | "security";

const sections = [
  { id: "appearance" as const, label: "APARÊNCIA", icon: MonitorCog },
  { id: "notifications" as const, label: "NOTIFICAÇÕES", icon: Bell },
  { id: "security" as const, label: "SEGURANÇA", icon: LockKeyhole },
];

export default function SettingsPage() {
  const { preferences, changePreferences } = useAppearance();
  const { layoutMode, setLayoutMode } = useLayoutMode();
  const [section, setSection] = useState<Section>("appearance");

  return (
    <div className="prototype-settings-page">
      <header className="prototype-page-heading">
        <div className="prototype-header-dot" />
        <div>
          <span className="prototype-kicker">PREFERÊNCIAS DO USUÁRIO</span>
          <h1>CONFIGURAÇÕES</h1>
          <p>
            Gerencie a aparência, as notificações e a segurança da sua conta.
          </p>
        </div>
        <span className="prototype-status">SISTEMA // ONLINE</span>
      </header>

      <div className="prototype-settings-grid">
        <aside className="prototype-settings-sidebar">
          <span className="prototype-sidebar-label">SEÇÕES</span>
          <nav>
            {sections.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  className={
                    section === item.id
                      ? "prototype-settings-nav prototype-settings-nav--active"
                      : "prototype-settings-nav"
                  }
                  type="button"
                  key={item.id}
                  onClick={() => setSection(item.id)}
                >
                  <Icon size={17} />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <span className="prototype-count">
            {sections.length} MÓDULOS DISPONÍVEIS
          </span>
        </aside>

        <main className="prototype-settings-main">
          {section === "appearance" && (
            <section className="prototype-panel">
              <div className="prototype-panel__header">
                <div>
                  <h2>APARÊNCIA</h2>
                  <p>Personalize a apresentação da plataforma.</p>
                </div>
              </div>

              <div className="prototype-panel__body">
                {/* Seletor de Versão do Layout (Moderno vs Tradicional) */}
                <span className="prototype-field-title">ESTILO DE LAYOUT</span>
                <div className="prototype-theme-grid" style={{ marginBottom: "22px" }}>
                  <button
                    className={
                      layoutMode === "modern"
                        ? "prototype-theme-option prototype-theme-option--active"
                        : "prototype-theme-option"
                    }
                    type="button"
                    onClick={() => setLayoutMode("modern")}
                  >
                    <strong>MODERNO</strong>
                    <small>Bordas arredondadas fluidas, sombras suaves e design contemporâneo.</small>
                  </button>

                  <button
                    className={
                      layoutMode === "traditional"
                        ? "prototype-theme-option prototype-theme-option--active"
                        : "prototype-theme-option"
                    }
                    type="button"
                    onClick={() => setLayoutMode("traditional")}
                  >
                    <strong>TRADICIONAL</strong>
                    <small>Visual corporativo clássico, estruturado, linhas retas e alta densidade.</small>
                  </button>
                </div>
              </div>
            </section>
          )}

          {section === "notifications" && (
            <section className="prototype-panel">
              <div className="prototype-panel__header">
                <div>
                  <h2>NOTIFICAÇÕES</h2>
                  <p>Escolha quais alertas deseja receber.</p>
                </div>
              </div>
              <div className="prototype-panel__body">
                {[
                  {
                    key: "emailNotifications" as const,
                    title: "NOTIFICAÇÕES POR E-MAIL",
                    text: "Avisos importantes enviados ao seu e-mail.",
                  },
                  {
                    key: "browserNotifications" as const,
                    title: "NOTIFICAÇÕES NO NAVEGADOR",
                    text: "Alertas enquanto a plataforma estiver aberta.",
                  },
                  {
                    key: "sessionReminders" as const,
                    title: "LEMBRETES DE MONITORIA",
                    text: "Avisos antes do início de cada sessão.",
                  },
                ].map((item) => (
                  <label className="prototype-toggle-row" key={item.key}>
                    <span>
                      <strong>{item.title}</strong>
                      <small>{item.text}</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={preferences[item.key]}
                      onChange={(event) =>
                        void changePreferences({
                          [item.key]: event.target.checked,
                        })
                      }
                    />
                    <i />
                  </label>
                ))}
              </div>
            </section>
          )}

          {section === "security" && (
            <section className="prototype-panel">
              <div className="prototype-panel__header">
                <div>
                  <h2>SEGURANÇA</h2>
                  <p>Controles de acesso e proteção da sua conta.</p>
                </div>
              </div>
              <div className="prototype-panel__body prototype-security">
                <article>
                  <div>
                    <strong>ALTERAR SENHA</strong>
                    <p>Atualize a senha usada no acesso à plataforma.</p>
                  </div>
                  <button type="button">CONFIGURAR</button>
                </article>
                <article>
                  <div>
                    <strong>SESSÕES CONECTADAS</strong>
                    <p>Encerre acessos ativos em outros dispositivos.</p>
                  </div>
                  <button type="button">VER SESSÕES</button>
                </article>
                <article className="prototype-danger-row">
                  <div>
                    <strong>EXCLUIR CONTA</strong>
                    <p>A ação será permanente após a confirmação.</p>
                  </div>
                  <button type="button">SOLICITAR EXCLUSÃO</button>
                </article>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}