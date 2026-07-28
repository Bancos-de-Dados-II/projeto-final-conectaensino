import { useEffect, useState, type FormEvent } from "react";
import {
  Building2,
  GraduationCap,
  Mail,
  Phone,
  Save,
  UserRound,
} from "lucide-react";

import { useAuth } from "../hooks/useAuth";
import {
  getProfile,
  updateProfile,
} from "../services/domain.service";

function ProfilePage() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [institution, setInstitution] = useState("");
  const [course, setCourse] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const profile = await getProfile();

      if (profile) {
        setName(profile.name);
        setEmail(profile.email || user?.email || "");
        setPhone(profile.phone || "");
        setInstitution(profile.institution || "");
        setCourse(profile.course || "");
        return;
      }

      const metadataName =
        typeof user?.user_metadata?.name === "string"
          ? user.user_metadata.name
          : "";

      setName(metadataName);
      setEmail(user?.email || "");
    }

    void loadProfile();
  }, [user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      await updateProfile({
        name,
        email,
        phone: phone || undefined,
        institution: institution || undefined,
        course: course || undefined,
      });

      setMessage("Perfil atualizado com sucesso.");
    } catch {
      setMessage(
        "Não foi possível atualizar no backend. Os dados continuam visíveis apenas nesta tela.",
      );
    } finally {
      setSaving(false);
    }
  }

  const initials =
    name
      .split(" ")
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "CE";

  return (
    <div className="domain-page">
      <section className="crud-page__heading">
        <div>
          <span className="dashboard__eyebrow">Conta</span>
          <h1>Meu perfil</h1>
          <p>Atualize seus dados pessoais e acadêmicos.</p>
        </div>
      </section>

      <section className="profile-layout">
        <aside className="profile-card">
          <span className="profile-card__avatar">{initials}</span>
          <h2>{name || "Usuário Conecta Ensino"}</h2>
          <p>{email}</p>
          <span className="profile-card__role">
            {user?.role || "Usuário"}
          </span>
        </aside>

        <form className="profile-form" onSubmit={handleSubmit}>
          <header>
            <div>
              <span className="dashboard__eyebrow">Informações</span>
              <h2>Dados do perfil</h2>
            </div>
          </header>

          <div className="profile-form__grid">
            <label className="profile-input-field">
              <span>Nome</span>
              <div>
                <UserRound size={17} />
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Seu nome"
                />
              </div>
            </label>

            <label className="profile-input-field">
              <span>E-mail</span>
              <div>
                <Mail size={17} />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Seu e-mail"
                />
              </div>
            </label>

            <label className="profile-input-field">
              <span>Telefone</span>
              <div>
                <Phone size={17} />
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </label>

            <label className="profile-input-field">
              <span>Instituição</span>
              <div>
                <Building2 size={17} />
                <input
                  value={institution}
                  onChange={(event) => setInstitution(event.target.value)}
                  placeholder="Sua instituição"
                />
              </div>
            </label>

            <label className="profile-input-field profile-input-field--full">
              <span>Curso</span>
              <div>
                <GraduationCap size={17} />
                <input
                  value={course}
                  onChange={(event) => setCourse(event.target.value)}
                  placeholder="Seu curso"
                />
              </div>
            </label>
          </div>

          {message && <div className="profile-message">{message}</div>}

          <footer>
            <button
              className="primary-button"
              type="submit"
              disabled={saving}
            >
              {saving ? (
                <span className="button-spinner" />
              ) : (
                <Save size={17} />
              )}
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

export default ProfilePage;
