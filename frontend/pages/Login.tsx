import { useEffect, useState, type FormEvent } from "react";
import axios from "axios";
import {
  ArrowRight,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { getInstitutions } from "../services/map.service";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { getApiBaseUrl } from "../api/axios";
import { useAuth } from "../hooks/useAuth";

interface LocationState {
  from?: string;
}

interface InstitutionOption {
  id: string;
  nome: string;
  endereco?: string;
  cidade?: string;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
}

function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destination =
    (location.state as LocationState | null)?.from || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [address, setAddress] = useState("");
  const [street, setStreet] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [accessibilityNeeds, setAccessibilityNeeds] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [schools, setSchools] = useState<InstitutionOption[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [isLoadingSchools, setIsLoadingSchools] = useState(false);
  const [citySchools, setCitySchools] = useState<InstitutionOption[]>([]);
  const [schoolSearchMessage, setSchoolSearchMessage] = useState("");

  useEffect(() => {
    const fullAddress = [street, district, city].filter(Boolean).join(", ");
    setAddress(fullAddress);
  }, [street, district, city]);

  useEffect(() => {
    async function loadSchools() {
      setIsLoadingSchools(true);

      try {
        const institutions = await getInstitutions();

        setSchools(
          institutions
            .map((item: any) => ({
              id: String(item.id ?? item._id ?? ""),
              nome: item.name ?? item.nome ?? "Escola sem nome",
              endereco: item.address ?? item.endereco,
              cidade: item.city ?? item.cidade,
              latitude: item.latitude,
              longitude: item.longitude,
            }))
            .filter((item) => item.id),
        );
      } catch {
        setSchools([]);
      } finally {
        setIsLoadingSchools(false);
      }
    }

    void loadSchools();
  }, []);

  useEffect(() => {
    if (!city.trim()) {
      setCitySchools([]);
      setSchoolSearchMessage("");
      setSelectedSchoolId("");
      return;
    }

    const normalizedCity = city.trim().toLowerCase();
    const matchedSchools = schools.filter((school) => {
      const cityCandidates = [school.cidade, school.endereco, school.nome]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());

      return cityCandidates.some((value) => value.includes(normalizedCity));
    });

    const sortedSchools = [...matchedSchools].sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR"),
    );

    setCitySchools(sortedSchools);
    setSchoolSearchMessage(
      sortedSchools.length > 0
        ? `Escolas encontradas para a cidade ${city}.`
        : `Nenhuma escola encontrada para a cidade ${city}.`,
    );

    if (!sortedSchools.some((school) => school.id === selectedSchoolId)) {
      setSelectedSchoolId("");
    }
  }, [city, schools, selectedSchoolId]);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      if (!isRegistering) {
        await login({ email: email.trim(), password });
      } else {
        if (password !== confirmPassword) {
          throw new Error('A confirmação da senha não corresponde.');
        }

        if (!selectedSchoolId) {
          throw new Error('Selecione a escola para concluir o cadastro.');
        }

        // Register student then login
        const payload: any = {
          email: email.trim(),
          password,
          enderecoResidencial: address,
          necessidadesAcessibilidade: accessibilityNeeds,
        };

        // If user selected a CSV school id (fallback), send lat/lng as well
        if (selectedSchoolId.startsWith("csv-school-")) {
          const found = schools.find((s) => s.id === selectedSchoolId) ||
            citySchools.find((s) => s.id === selectedSchoolId);

          if (found && found.latitude !== undefined && found.longitude !== undefined) {
            payload.latitude = found.latitude;
            payload.longitude = found.longitude;
          }
        } else {
          payload.institutionId = selectedSchoolId;
        }

        await axios.post(`${getApiBaseUrl()}/auth/register/student`, payload);

        await login({ email: email.trim(), password });
      }
      navigate(destination, { replace: true });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const responseMessage =
          typeof error.response?.data === "object" &&
          error.response?.data !== null &&
          "message" in error.response.data
            ? String(error.response.data.message)
            : null;

        setErrorMessage(
          responseMessage ||
            (error.response?.status === 401
              ? "E-mail ou senha incorretos."
              : "Não foi possível entrar. Verifique se o backend está em execução."),
        );
      } else {
        setErrorMessage("Ocorreu um erro inesperado durante o login.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-presentation">
        <div className="login-brand">
          <span className="login-brand__icon">
            <GraduationCap size={29} />
          </span>

          <div>
            <strong>Conecta Ensino</strong>
            <span>Aprender fica mais fácil quando estamos conectados.</span>
          </div>
        </div>

        <div className="login-presentation__content">
          <span className="login-eyebrow">Plataforma educacional</span>
          <h1>Encontre apoio acadêmico perto de você.</h1>
          <p>
            Conecte alunos, monitores, instituições e disciplinas em uma única
            experiência.
          </p>

          <div className="login-benefits">
            <div>
              <ShieldCheck size={21} />
              <span>
                <strong>Acesso protegido</strong>
                <small>Sessão autenticada com token JWT.</small>
              </span>
            </div>

            <div>
              <GraduationCap size={21} />
              <span>
                <strong>Monitoria conectada</strong>
                <small>Encontre monitores e acompanhe suas sessões.</small>
              </span>
            </div>
          </div>
        </div>

        <span className="login-presentation__footer">
          Conecta Ensino • Desenvolvimento acadêmico
        </span>
      </section>

      <section className="login-area">
        <div className="login-card">
          <header className="login-card__header">
            <span className="login-eyebrow">Bem-vindo de volta</span>
            <h2>Entre na sua conta</h2>
            <p>Use as credenciais cadastradas no Conecta Ensino.</p>
          </header>

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="login-field">
              <span>E-mail</span>

              <div className="login-input">
                <Mail size={18} />
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="seuemail@exemplo.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
            </label>

            <label className="login-field">
              <span>Senha</span>

              <div className="login-input">
                <LockKeyhole size={18} />

                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />

                <button
                  type="button"
                  className="login-password-toggle"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            {isRegistering && (
              <label className="login-field">
                <span>Confirmação de senha</span>

                <div className="login-input">
                  <LockKeyhole size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Confirme sua senha"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                  />
                </div>
              </label>
            )}

            {errorMessage && (
              <div className="login-error" role="alert">
                {errorMessage}
              </div>
            )}

            <button
              className="login-submit"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="button-spinner" />
                  Entrando...
                </>
              ) : (
                <>
                  Entrar
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <div style={{ marginTop: 12, textAlign: 'center' }}>
              <button
                type="button"
                className="login-submit"
                style={{ width: '100%' }}
                onClick={() => {
                  setIsRegistering((v) => !v);
                  setErrorMessage('');
                  setSelectedSchoolId('');
                  setCitySchools([]);
                  setSchoolSearchMessage('');
                }}
              >
                {isRegistering ? 'Voltar para login' : 'CADASTRO'}
              </button>
            </div>

            {isRegistering && (
              <div className="register-fields" style={{ marginTop: 12 }}>
                <label className="login-field">
                  <span>Rua</span>
                  <input type="text" value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Ex.: Rua das Flores" required />
                </label>

                <label className="login-field">
                  <span>Bairro</span>
                  <input type="text" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Ex.: Centro" required />
                </label>

                <label className="login-field">
                  <span>Cidade</span>
                  <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ex.: João Pessoa" required />
                </label>

                <label className="login-field">
                  <span>Escola da cidade</span>
                  <select
                    value={selectedSchoolId}
                    onChange={(e) => setSelectedSchoolId(e.target.value)}
                    required
                    disabled={isLoadingSchools || !city.trim()}
                  >
                    <option value="">
                      {isLoadingSchools
                        ? "Carregando escolas..."
                        : city.trim()
                          ? "Selecione a escola"
                          : "Informe a cidade primeiro"}
                    </option>
                    {citySchools.length > 0 ? (
                      citySchools.map((school) => (
                        <option key={school.id} value={school.id}>
                          {school.nome}
                          {school.endereco ? ` — ${school.endereco}` : ''}
                        </option>
                      ))
                    ) : (
                      !isLoadingSchools && city.trim() && (
                        <option value="" disabled>
                          Nenhuma escola encontrada para esta cidade
                        </option>
                      )
                    )}
                  </select>
                  {schoolSearchMessage && (
                    <small style={{ marginTop: 6, display: 'block', color: '#5b6b7a' }}>
                      {schoolSearchMessage}
                    </small>
                  )}
                </label>

                <label className="login-field">
                  <span>Necessidades de acessibilidade</span>
                  <input type="text" value={accessibilityNeeds} onChange={(e) => setAccessibilityNeeds(e.target.value)} placeholder="Ex.: libras" />
                </label>
              </div>
            )}
          </form>

          <footer className="login-card__footer">
            API configurada em:
            <code>{getApiBaseUrl()}</code>
          </footer>
        </div>
      </section>
    </main>
  );
}

export default Login;
