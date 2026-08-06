import { useEffect, useRef, useState, type FormEvent } from "react";
import axios from "axios";
import {
  Building2,
  Camera,
  GraduationCap,
  LockKeyhole,
  Mail,
  Phone,
  Save,
  Star,
  UserRound,
} from "lucide-react";

import { useAuth } from "../hooks/useAuth";
import {
  getProfile,
  updateProfile,
} from "../services/domain.service";
import { getNearbyInstitutions } from "../services/map.service";
import {
  getOwnMonitorProfile,
  getOwnAccountProfile,
  updateOwnAccountAvatar,
  updateOwnAccountInstitution,
  updateOwnMonitorAvatar,
  updateOwnMonitorInstitution,
  updateRequiredPassword,
} from "../services/monitor-profile.service";
import type { MapEntity } from "../types/map";
import { getApplicationRole } from "../utils/auth-role";
import SubjectSuggestionForm from "../components/subjects/SubjectSuggestionForm";

function ProfilePage() {
  const { user } = useAuth();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const applicationRole = getApplicationRole(user);
  const isMonitor = applicationRole === "monitor";
  const isDirector = applicationRole === "director";
  const isStudent = applicationRole === "student";
  const supportsProfileCustomization = applicationRole !== "admin";
  const [name, setName] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [institution, setInstitution] = useState("");
  const [institutionId, setInstitutionId] = useState("");
  const [schoolSuggestions, setSchoolSuggestions] = useState<MapEntity[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [schoolInputFocused, setSchoolInputFocused] = useState(false);
  const [avatar, setAvatar] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [course, setCourse] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const profile = await getProfile();

      if (profile) {
        const metadataName =
          typeof user?.user_metadata?.name === "string"
            ? user.user_metadata.name
            : "";
        setName(profile.name || metadataName || user?.email?.split("@")[0] || "");
        setEmail(profile.email || user?.email || "");
        setPhone(profile.phone || "");
        if (!supportsProfileCustomization) {
          setInstitution(profile.institution || "");
        }
        setCourse(profile.course || "");
        setSpecialty(profile.specialty || "");
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
  }, [supportsProfileCustomization, user]);

  useEffect(() => {
    if (!supportsProfileCustomization) return;

    setLoadingSchools(true);
    const profileRequest = isMonitor
      ? getOwnMonitorProfile()
      : getOwnAccountProfile();
    void profileRequest
      .then(async (profile) => {
        setMustChangePassword(profile.mustChangePassword === true);
        setAvatar(profile.avatar ?? "");
        if (isStudent) {
          setSpecialty(profile.tipoDeficiencia ?? profile.specialty ?? "");
        }
        const linkedInstitution = profile.institutionId;
        if (linkedInstitution && typeof linkedInstitution === "object") {
          setInstitutionId(
            String(linkedInstitution._id ?? linkedInstitution.id ?? ""),
          );
          setInstitution(
            String(linkedInstitution.nome ?? linkedInstitution.name ?? ""),
          );
        }

        const institutionCoordinates =
          linkedInstitution && typeof linkedInstitution === "object"
            ? linkedInstitution.location?.coordinates
            : undefined;
        const coordinates =
          profile.location?.coordinates ?? institutionCoordinates;
        if (!coordinates || coordinates.length !== 2) return;
        setSchoolSuggestions(
          await getNearbyInstitutions({
            longitude: coordinates[0],
            latitude: coordinates[1],
            radiusKm: 25,
          }),
        );
      })
      .catch(() => setMessage("Não foi possível carregar as escolas próximas."))
      .finally(() => setLoadingSchools(false));
  }, [isMonitor, isStudent, supportsProfileCustomization]);

  function selectAvatar(file?: File) {
    setMessage("");
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setMessage("Selecione uma foto JPEG ou PNG.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage("A foto deve possuir no máximo 2 MB.");
      return;
    }
    setAvatarFile(file);
    setAvatar(URL.createObjectURL(file));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      if (supportsProfileCustomization) {
        const messages: string[] = [];
        if (mustChangePassword) {
          if (newPassword.length < 8) {
            setMessage("A nova senha deve possuir pelo menos 8 caracteres.");
            return;
          }
          if (newPassword !== confirmPassword) {
            setMessage("As senhas não coincidem.");
            return;
          }
          await updateRequiredPassword(newPassword, confirmPassword);
          setMustChangePassword(false);
          setNewPassword("");
          setConfirmPassword("");
          messages.push("Senha atualizada");
        }
        await updateProfile({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          course: isMonitor ? course.trim() : undefined,
          specialty: isStudent ? specialty.trim() : undefined,
        });
        messages.push("Dados atualizados");
        if (avatarFile) {
          setAvatar(
            await (isMonitor
              ? updateOwnMonitorAvatar(avatarFile)
              : updateOwnAccountAvatar(avatarFile)),
          );
          setAvatarFile(null);
          messages.push("Foto atualizada");
        }
        if (institutionId) {
          const updated = await (isMonitor
            ? updateOwnMonitorInstitution(institutionId)
            : updateOwnAccountInstitution(institutionId));
          setInstitution(updated.institutionName);
          messages.push(
            `escola confirmada a ${updated.distanceKm.toFixed(1)} km`,
          );
        }
        window.dispatchEvent(new Event("profile-updated"));
        setMessage(`${messages.join(" e ")} com sucesso.`);
        return;
      }

      await updateProfile({
        name,
        email,
        phone: phone || undefined,
        institution: institution || undefined,
        course: course || undefined,
      });

      setMessage("Perfil atualizado com sucesso.");
    } catch (error) {
      setMessage(
        axios.isAxiosError(error)
          ? String(
              (error.response?.data as { message?: string } | undefined)
                ?.message ?? "Não foi possível atualizar a escola.",
            )
          : "Não foi possível atualizar o perfil.",
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
          <span className={`profile-card__avatar ${avatar ? "profile-card__avatar--image" : ""}`}>
            {avatar ? <img src={avatar} alt={`Foto de ${name || "perfil"}`} /> : initials}
          </span>
          {supportsProfileCustomization && (
            <>
              <input
                ref={avatarInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                hidden
                onChange={(event) => selectAvatar(event.target.files?.[0])}
              />
              <button
                className="profile-card__photo-button"
                type="button"
                onClick={() => avatarInputRef.current?.click()}
              >
                <Camera size={16} />
                Alterar foto
              </button>
              <small className="profile-card__photo-help">
                JPEG ou PNG • máximo de 2 MB
              </small>
            </>
          )}
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

            <label className={`profile-input-field ${supportsProfileCustomization ? "profile-school-field" : ""}`}>
              <span>Instituição</span>
              <div>
                <Building2 size={17} />
                <input
                  value={institution}
                  autoComplete="off"
                  onFocus={() => setSchoolInputFocused(true)}
                  onBlur={() =>
                    window.setTimeout(() => setSchoolInputFocused(false), 150)
                  }
                  onChange={(event) => {
                    setInstitution(event.target.value);
                    if (supportsProfileCustomization) setInstitutionId("");
                  }}
                  placeholder={
                    supportsProfileCustomization
                      ? "Digite o nome da escola..."
                      : "Sua instituição"
                  }
                />
              </div>
              {supportsProfileCustomization && (
                <>
                  <small>
                    {loadingSchools
                      ? "Buscando escolas em até 25 km..."
                      : `${schoolSuggestions.length} escola(s) encontrada(s) em até 25 km.`}
                  </small>
                  {schoolInputFocused && !loadingSchools && (
                    <div className="profile-school-suggestions">
                      {schoolSuggestions
                        .filter((school) =>
                          school.name
                            .toLocaleLowerCase("pt-BR")
                            .includes(institution.trim().toLocaleLowerCase("pt-BR")),
                        )
                        .slice(0, 8)
                        .map((school) => (
                          <button
                            type="button"
                            key={school.id}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                              setInstitutionId(school.id);
                              setInstitution(school.name);
                              setSchoolInputFocused(false);
                            }}
                          >
                            <Building2 size={16} />
                            <span>
                              <strong>{school.name}</strong>
                              <small>
                                {school.distanceKm?.toFixed(1) ?? "Até 25"} km
                                {school.address ? ` • ${school.address}` : ""}
                              </small>
                            </span>
                          </button>
                        ))}
                    </div>
                  )}
                </>
              )}
            </label>

            {isMonitor && (
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
            )}

            {isStudent && (
              <label className="profile-input-field profile-input-field--full">
                <span>Especialidade</span>
                <div>
                  <Star size={17} />
                  <input
                    value={specialty}
                    onChange={(event) => setSpecialty(event.target.value)}
                    placeholder="Informe sua especialidade"
                  />
                </div>
              </label>
            )}

            {mustChangePassword && (
              <>
                <label className="profile-input-field">
                  <span>Nova senha</span>
                  <div>
                    <LockKeyhole size={17} />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder="Mínimo de 8 caracteres"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </label>
                <label className="profile-input-field">
                  <span>Confirmar senha</span>
                  <div>
                    <LockKeyhole size={17} />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      placeholder="Digite a nova senha novamente"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </label>
              </>
            )}
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
      {(isStudent || isDirector) && <SubjectSuggestionForm />}
    </div>
  );
}

export default ProfilePage;
