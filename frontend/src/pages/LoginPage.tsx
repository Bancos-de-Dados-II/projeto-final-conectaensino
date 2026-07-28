import { AxiosError } from 'axios';
import { GraduationCap, LockKeyhole, Mail } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export function LoginPage() {
  const { login, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (isAuthenticated) return <Navigate to="/" replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    try {
      await login({ email, password });
      const destination = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/';
      navigate(destination, { replace: true });
    } catch (requestError) {
      const axiosError = requestError as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message ?? 'Não foi possível entrar. Verifique os dados e o servidor.');
    }
  }

  return (
    <div className="login-page">
      <div className="login-visual">
        <div className="visual-grid" />
        <div className="visual-content">
          <div className="visual-badge"><GraduationCap size={18} /> Educação acessível e conectada</div>
          <h1>Conectando quem quer aprender com quem pode ensinar.</h1>
          <p>Encontre monitores, instituições e oportunidades de aprendizagem próximas de você.</p>
          <div className="visual-metrics">
            <div><strong>+120</strong><span>alunos conectados</span></div>
            <div><strong>+40</strong><span>monitores ativos</span></div>
            <div><strong>100%</strong><span>foco em inclusão</span></div>
          </div>
        </div>
      </div>

      <div className="login-panel">
        <form className="login-card" onSubmit={handleSubmit}>
          <div className="login-logo"><GraduationCap size={28} /></div>
          <span className="eyebrow">Bem-vindo de volta</span>
          <h2>Acesse sua conta</h2>
          <p>Use seus dados cadastrados no Supabase Auth.</p>

          <label>
            <span>E-mail</span>
            <div className="input-with-icon">
              <Mail size={18} />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nome@exemplo.com"
                autoComplete="email"
                required
              />
            </div>
          </label>

          <label>
            <span>Senha</span>
            <div className="input-with-icon">
              <LockKeyhole size={18} />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Digite sua senha"
                autoComplete="current-password"
                minLength={6}
                required
              />
            </div>
          </label>

          {error && <div className="form-error" role="alert">{error}</div>}

          <button className="primary-button" type="submit" disabled={isLoading}>
            {isLoading ? 'Entrando...' : 'Entrar no sistema'}
          </button>

          <small>Conecta Ensino © 2026 • Plataforma de inclusão educacional</small>
        </form>
      </div>
    </div>
  );
}
