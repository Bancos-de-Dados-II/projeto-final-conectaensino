import { useState, type FormEvent } from "react";
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
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { getApiBaseUrl } from "../api/axios";
import { useAuth } from "../hooks/useAuth";

interface LocationState {
  from?: string;
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

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await login({ email: email.trim(), password });
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
