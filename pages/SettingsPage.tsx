import {
  Bell,
  Camera,
  FileText,
  LockKeyhole,
  MonitorCog,
  Save,
  UserRound,
} from "lucide-react";
import {
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import DocumentManager from "../components/settings/DocumentManager";
import { useAppearance } from "../contexts/AppearanceContext";
import {
  getSettingsProfile,
  updateSettingsProfile,
  uploadProfileAvatar,
} from "../services/settings.service";
import type {
  SettingsProfile,
  ThemePreference,
} from "../types/settings";

type Section =
  | "profile"
  | "appearance"
  | "notifications"
  | "documents"
  | "security";

const sections = [
  { id: "profile" as const, label: "PERFIL", icon: UserRound },
  { id: "appearance" as const, label: "APARÊNCIA", icon: MonitorCog },
  { id: "notifications" as const, label: "NOTIFICAÇÕES", icon: Bell },
  { id: "documents" as const, label: "DOCUMENTOS", icon: FileText },
  { id: "security" as const, label: "SEGURANÇA", icon: LockKeyhole },
];

export default function SettingsPage() {
  const avatarInput = useRef<HTMLInputElement>(null);
  const { preferences, changePreferences } = useAppearance();
  const [section, setSection] = useState<Section>("profile");
  const [profile, setProfile] = useState<SettingsProfile>({
    name: "",
    email: "",
    phone: "",
    institution: "",
    bio: "",
    avatar: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    void getSettingsProfile()
      .then(setProfile)
      .finally(() => setLoading(false));
  }, []);

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setFeedback("");

    try {
      const updated = await updateSettingsProfile(profile);
      setProfile(updated);
      setFeedback("DADOS ATUALIZADOS COM SUCESSO");
    } finally {
      setSaving(false);
    }
  }

  async function changeAvatar(file?: File) {
    if (!file) return;
    const avatar = await uploadProfileAvatar(file);
    const next = { ...profile, avatar };
    setProfile(next);
    await updateSettingsProfile(next);
  }

  return (
    <div className="prototype-settings-page">
      <header className="prototype-page-heading">
        <div className="prototype-header-dot" />
        <div>
          <span className="prototype-kicker">CONTA DO USUÁRIO</span>
          <h1>CONFIGURAÇÕES</h1>
          <p>Gerencie sua conta sem abandonar a identidade do protótipo.</p>
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
                  onClick={() => {
                    setSection(item.id);
                    setFeedback("");
                  }}
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
          {section === "profile" && (
            <section className="prototype-panel">
              <div className="prototype-panel__header">
                <span>01</span>
                <div>
                  <h2>INFORMAÇÕES PESSOAIS</h2>
                  <p>Dados exibidos no perfil do Conecta Ensino.</p>
                </div>
              </div>

              {loading ? (
                <div className="prototype-loading">CARREGANDO DADOS...</div>
              ) : (
                <form
                  className="prototype-settings-form"
                  onSubmit={saveProfile}
                >
                  <input
                    ref={avatarInput}
                    hidden
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) =>
                      void changeAvatar(event.target.files?.[0])
                    }
                  />

                  <div className="prototype-avatar-editor">
                    <span>
                      {profile.avatar ? (
                        <img src={profile.avatar} alt="" />
                      ) : (
                        profile.name
                          .split(" ")
                          .slice(0, 2)
                          .map((part) => part[0]?.toUpperCase())
                          .join("") || "CE"
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => avatarInput.current?.click()}
                    >
                      <Camera size={16} />
                      ALTERAR FOTO
                    </button>
                  </div>

                  <div className="prototype-form-grid">
                    <label>
                      <span>NOME COMPLETO</span>
                      <input
                        value={profile.name}
                        onChange={(event) =>
                          setProfile({
                            ...profile,
                            name: event.target.value,
                          })
                        }
                      />
                    </label>
                    <label>
                      <span>E-MAIL</span>
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(event) =>
                          setProfile({
                            ...profile,
                            email: event.target.value,
                          })
                        }
                      />
                    </label>
                    <label>
                      <span>TELEFONE</span>
                      <input
                        value={profile.phone}
                        onChange={(event) =>
                          setProfile({
                            ...profile,
                            phone: event.target.value,
                          })
                        }
                      />
                    </label>
                    <label>
                      <span>INSTITUIÇÃO</span>
                      <input
                        value={profile.institution}
                        onChange={(event) =>
                          setProfile({
                            ...profile,
                            institution: event.target.value,
                          })
                        }
                      />
                    </label>
                    <label className="prototype-form-full">
                      <span>BIOGRAFIA</span>
                      <textarea
                        rows={5}
                        value={profile.bio}
                        onChange={(event) =>
                          setProfile({
                            ...profile,
                            bio: event.target.value,
                          })
                        }
                      />
                    </label>
                  </div>

                  {feedback && (
                    <div className="prototype-success">{feedback}</div>
                  )}

                  <footer className="prototype-form-actions">
                    <button
                      className="prototype-primary-button"
                      type="submit"
                      disabled={saving}
                    >
                      <Save size={16} />
                      {saving ? "SALVANDO..." : "SALVAR ALTERAÇÕES"}
                    </button>
                  </footer>
                </form>
              )}
            </section>
          )}

          {section === "appearance" && (
            <section className="prototype-panel">
              <div className="prototype-panel__header">
                <span>02</span>
                <div>
                  <h2>APARÊNCIA</h2>
                  <p>
                    O tema original permanece como configuração principal.
                  </p>
                </div>
              </div>

              <div className="prototype-panel__body">
                <span className="prototype-field-title">TEMA DA INTERFACE</span>
                <div className="prototype-theme-grid">
                  {[
                    {
                      value: "original" as ThemePreference,
                      title: "ORIGINAL",
                      text: "Preto, azul-ciano e laranja do protótipo.",
                    },
                    {
                      value: "light" as ThemePreference,
                      title: "CLARO",
                      text: "Variação clara mantendo as mesmas cores.",
                    },
                    {
                      value: "system" as ThemePreference,
                      title: "SISTEMA",
                      text: "Segue automaticamente o dispositivo.",
                    },
                  ].map((option) => (
                    <button
                      className={
                        preferences.theme === option.value
                          ? "prototype-theme-option prototype-theme-option--active"
                          : "prototype-theme-option"
                      }
                      type="button"
                      key={option.value}
                      onClick={() =>
                        void changePreferences({
                          theme: option.value,
                        })
                      }
                    >
                      <strong>{option.title}</strong>
                      <small>{option.text}</small>
                    </button>
                  ))}
                </div>

                <label className="prototype-toggle-row">
                  <span>
                    <strong>MODO COMPACTO</strong>
                    <small>Reduz espaços sem alterar o estilo visual.</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={preferences.compactMode}
                    onChange={(event) =>
                      void changePreferences({
                        compactMode: event.target.checked,
                      })
                    }
                  />
                  <i />
                </label>
              </div>
            </section>
          )}

          {section === "notifications" && (
            <section className="prototype-panel">
              <div className="prototype-panel__header">
                <span>03</span>
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

          {section === "documents" && (
            <section className="prototype-panel">
              <div className="prototype-panel__header">
                <span>04</span>
                <div>
                  <h2>DOCUMENTOS</h2>
                  <p>Arquivos vinculados à sua conta.</p>
                </div>
              </div>
              <div className="prototype-panel__body">
                <DocumentManager />
              </div>
            </section>
          )}

          {section === "security" && (
            <section className="prototype-panel">
              <div className="prototype-panel__header">
                <span>05</span>
                <div>
                  <h2>SEGURANÇA</h2>
                  <p>Controles preparados para os endpoints do backend.</p>
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
                    <p>A ação será permanente após confirmação no backend.</p>
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
