import { Bell, LockKeyhole, MonitorCog } from "lucide-react";
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAppearance } from "../contexts/AppearanceContext";
import { useLayoutMode } from "../contexts/LayoutModeContext";
import { useAuth } from "../hooks/useAuth";
import { changeAccountPassword, deleteOwnAccount, revokeOtherSessions } from "../services/security.service";

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
  const [securityAction, setSecurityAction] = useState<"password" | "sessions" | "delete" | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [securityMessage, setSecurityMessage] = useState("");
  const [securityError, setSecurityError] = useState("");
  const [securityLoading, setSecurityLoading] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  function errorMessage(error: unknown): string {
    return axios.isAxiosError<{ message?: string }>(error)
      ? error.response?.data?.message ?? "Não foi possível concluir a operação."
      : "Não foi possível concluir a operação.";
  }

  async function handlePasswordChange() {
    setSecurityError(""); setSecurityMessage("");
    if (newPassword.length < 8) return setSecurityError("A nova senha deve possuir pelo menos 8 caracteres.");
    if (newPassword !== confirmPassword) return setSecurityError("As senhas não coincidem.");
    setSecurityLoading(true);
    try {
      setSecurityMessage(await changeAccountPassword(newPassword, confirmPassword));
      setNewPassword(""); setConfirmPassword(""); setSecurityAction(null);
    } catch (error) { setSecurityError(errorMessage(error)); }
    finally { setSecurityLoading(false); }
  }

  async function handleRevokeSessions() {
    setSecurityError(""); setSecurityMessage(""); setSecurityLoading(true);
    try {
      setSecurityMessage(await revokeOtherSessions());
      setSecurityAction(null);
    } catch (error) { setSecurityError(errorMessage(error)); }
    finally { setSecurityLoading(false); }
  }

  async function handleDeleteAccount() {
    setSecurityError(""); setSecurityMessage("");
    if (!deletePassword) return setSecurityError("Informe sua senha para confirmar a exclusão da conta.");
    setSecurityLoading(true);
    try {
      await deleteOwnAccount(deletePassword);
      logout();
      navigate("/login", { replace: true });
    } catch (error) {
      setSecurityError(errorMessage(error));
      setSecurityLoading(false);
    }
  }

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
                <span>02</span>
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
                <span>03</span>
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
                  <button type="button" onClick={() => setSecurityAction("password")}>CONFIGURAR</button>
                </article>
                <article>
                  <div>
                    <strong>SESSÕES CONECTADAS</strong>
                    <p>Encerre acessos ativos em outros dispositivos.</p>
                  </div>
                  <button type="button" onClick={() => setSecurityAction("sessions")}>VER SESSÕES</button>
                </article>
                <article className="prototype-danger-row">
                  <div>
                    <strong>EXCLUIR CONTA</strong>
                    <p>A ação será permanente após a confirmação.</p>
                  </div>
                  <button type="button" onClick={() => setSecurityAction("delete")}>SOLICITAR EXCLUSÃO</button>
                </article>
                {securityAction === "password" && (
                  <div className="security-action-panel">
                    <label>Nova senha<input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" /></label>
                    <label>Confirmar senha<input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" /></label>
                    <div><button type="button" onClick={() => setSecurityAction(null)}>CANCELAR</button><button type="button" disabled={securityLoading} onClick={() => void handlePasswordChange()}>{securityLoading ? "SALVANDO..." : "ALTERAR SENHA"}</button></div>
                  </div>
                )}
                {securityAction === "sessions" && (
                  <div className="security-action-panel">
                    <p>O acesso deste dispositivo será mantido. Todos os outros acessos da sua conta serão encerrados.</p>
                    <div><button type="button" onClick={() => setSecurityAction(null)}>CANCELAR</button><button type="button" disabled={securityLoading} onClick={() => void handleRevokeSessions()}>{securityLoading ? "ENCERRANDO..." : "ENCERRAR OUTRAS SESSÕES"}</button></div>
                  </div>
                )}
                {securityAction === "delete" && (
                  <div className="security-action-panel security-action-panel--danger">
                    <p>Esta ação é permanente. Informe sua senha atual para confirmar.</p>
                    <label>Senha atual<input type="password" value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} autoComplete="current-password" /></label>
                    <div><button type="button" onClick={() => setSecurityAction(null)}>CANCELAR</button><button type="button" disabled={securityLoading || !deletePassword} onClick={() => void handleDeleteAccount()}>{securityLoading ? "EXCLUINDO..." : "EXCLUIR CONTA"}</button></div>
                  </div>
                )}
                {securityMessage && <div className="security-feedback security-feedback--success">{securityMessage}</div>}
                {securityError && <div className="security-feedback security-feedback--error">{securityError}</div>}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
