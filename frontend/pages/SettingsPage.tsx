import {
  Bell,
  Camera,
  Moon,
  Save,
  Sun,
  UserRound,
} from "lucide-react";
import {
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import { useTheme } from "../contexts/ThemeContext";
import {
  getProfile,
  saveProfile,
  uploadAvatar,
} from "../services/preferences.service";
import type { AccountProfile, ThemeMode } from "../types/preferences";

export default function SettingsPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { preferences, setTheme, updatePreferences } = useTheme();
  const [profile, setProfile] = useState<AccountProfile>({
    name: "",
    email: "",
    phone: "",
    institution: "",
    bio: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void getProfile().then(setProfile);
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      setProfile(await saveProfile(profile));
      setMessage("Alterações salvas.");
    } finally {
      setSaving(false);
    }
  }

  async function changeAvatar(file?: File) {
    if (!file) return;
    const avatar = await uploadAvatar(file);
    const next = { ...profile, avatar };
    setProfile(next);
    await saveProfile(next);
  }

  const themes: Array<{
    value: ThemeMode;
    label: string;
    icon: typeof Moon;
  }> = [
    { value: "dark", label: "Escuro", icon: Moon },
    { value: "light", label: "Claro", icon: Sun },
    { value: "system", label: "Sistema", icon: UserRound },
  ];

  return (
    <div className="prototype-settings">
      <header className="prototype-page-header">
        <div>
          <small className="prototype-kicker">CONTA / PREFERÊNCIAS</small>
          <h1>Configurações</h1>
        </div>
        <span className="prototype-status-dot" />
      </header>

      <div className="prototype-settings-grid">
        <form className="prototype-card" onSubmit={submit}>
          <div className="prototype-section-title">
            <UserRound size={18} />
            <div>
              <h2>Perfil</h2>
              <p>Informações pessoais da conta.</p>
            </div>
          </div>

          <input
            ref={inputRef}
            hidden
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) =>
              void changeAvatar(event.target.files?.[0])
            }
          />

          <div className="prototype-avatar-row">
            <span className="prototype-avatar">
              {profile.avatar ? (
                <img src={profile.avatar} alt="" />
              ) : (
                profile.name.slice(0, 2).toUpperCase() || "CE"
              )}
            </span>
            <button
              className="prototype-secondary-button"
              type="button"
              onClick={() => inputRef.current?.click()}
            >
              <Camera size={15} />
              Alterar foto
            </button>
          </div>

          <div className="prototype-form-grid">
            <label>
              <span>Nome completo</span>
              <input
                value={profile.name}
                onChange={(event) =>
                  setProfile({ ...profile, name: event.target.value })
                }
              />
            </label>

            <label>
              <span>E-mail</span>
              <input
                type="email"
                value={profile.email}
                onChange={(event) =>
                  setProfile({ ...profile, email: event.target.value })
                }
              />
            </label>

            <label>
              <span>Telefone</span>
              <input
                value={profile.phone}
                onChange={(event) =>
                  setProfile({ ...profile, phone: event.target.value })
                }
              />
            </label>

            <label>
              <span>Instituição</span>
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

            <label className="prototype-full">
              <span>Biografia</span>
              <textarea
                rows={4}
                value={profile.bio}
                onChange={(event) =>
                  setProfile({ ...profile, bio: event.target.value })
                }
              />
            </label>
          </div>

          {message && <p className="prototype-success">{message}</p>}

          <div className="prototype-actions">
            <button className="prototype-primary-button" disabled={saving}>
              <Save size={16} />
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </form>

        <div className="prototype-settings-side">
          <section className="prototype-card">
            <div className="prototype-section-title">
              <Sun size={18} />
              <div>
                <h2>Aparência</h2>
                <p>Visual baseado no CSS original do protótipo.</p>
              </div>
            </div>

            <div className="prototype-theme-list">
              {themes.map(({ value, label, icon: Icon }) => (
                <button
                  type="button"
                  key={value}
                  className={
                    preferences.theme === value
                      ? "prototype-theme active"
                      : "prototype-theme"
                  }
                  onClick={() => setTheme(value)}
                >
                  <Icon size={17} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="prototype-card">
            <div className="prototype-section-title">
              <Bell size={18} />
              <div>
                <h2>Notificações</h2>
                <p>Escolha os alertas que deseja receber.</p>
              </div>
            </div>

            <div className="prototype-toggle-list">
              {[
                ["emailNotifications", "Notificações por e-mail"],
                ["browserNotifications", "Alertas no navegador"],
                ["sessionReminders", "Lembretes de monitoria"],
              ].map(([key, label]) => (
                <label key={key}>
                  <span>{label}</span>
                  <input
                    type="checkbox"
                    checked={
                      preferences[
                        key as keyof typeof preferences
                      ] as boolean
                    }
                    onChange={(event) =>
                      updatePreferences({
                        [key]: event.target.checked,
                      })
                    }
                  />
                </label>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
