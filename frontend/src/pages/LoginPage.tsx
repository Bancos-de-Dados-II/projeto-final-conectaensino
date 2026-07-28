import { AxiosError } from 'axios';
import { GraduationCap, LockKeyhole, Mail } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { api } from '../services/api';

export function LoginPage() {
  const { login, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [address, setAddress] = useState('');
  const [disabilityType, setDisabilityType] = useState('');
  const [accessibilityNeeds, setAccessibilityNeeds] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

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

  async function handleStudentRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    try {
      await api.post('/auth/register/student', {
        email,
        password,
        enderecoResidencial: address,
        tipoDeficiencia: disabilityType,
        necessidadesAcessibilidade: accessibilityNeeds,
        latitude: Number(latitude),
        longitude: Number(longitude),
      });

      await login({ email, password });
      navigate('/', { replace: true });
    } catch (requestError) {
      const axiosError = requestError as AxiosError<{ message?: string; error?: string }>;
      setError(axiosError.response?.data?.message ?? axiosError.response?.data?.error ?? 'Não foi possível concluir o cadastro do aluno.');
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
        <form className="login-card" onSubmit={isRegistering ? handleStudentRegister : handleSubmit}>
          <div className="login-logo"><GraduationCap size={28} /></div>
          <span className="eyebrow">{isRegistering ? 'Cadastro de aluno' : 'Bem-vindo de volta'}</span>
          <h2>{isRegistering ? 'Cadastre-se como aluno' : 'Acesse sua conta'}</h2>
          <p>{isRegistering ? 'O cadastro é salvo no banco e fica disponível para conexão com escolas e monitores.' : 'Use seus dados cadastrados no Supabase Auth.'}</p>

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
                autoComplete={isRegistering ? 'new-password' : 'current-password'}
                minLength={6}
                required
              />
            </div>
          </label>

          {isRegistering && (
            <>
              <label>
                <span>Endereço residencial</span>
                <input
                  type="text"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="Rua, bairro, cidade"
                  required
                />
              </label>

              <label>
                <span>Tipo de deficiência</span>
                <input
                  type="text"
                  value={disabilityType}
                  onChange={(event) => setDisabilityType(event.target.value)}
                  placeholder="Ex.: visual, auditiva, motora"
                  required
                />
              </label>

              <label>
                <span>Necessidades de acessibilidade</span>
                <input
                  type="text"
                  value={accessibilityNeeds}
                  onChange={(event) => setAccessibilityNeeds(event.target.value)}
                  placeholder="Ex.: libras, leitura em braille"
                />
              </label>

              <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                <label>
                  <span>Latitude</span>
                  <input
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(event) => setLatitude(event.target.value)}
                    placeholder="-23.5505"
                    required
                  />
                </label>
                <label>
                  <span>Longitude</span>
                  <input
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(event) => setLongitude(event.target.value)}
                    placeholder="-46.6333"
                    required
                  />
                </label>
              </div>
            </>
          )}

          {error && <div className="form-error" role="alert">{error}</div>}

          <button className="primary-button" type="submit" disabled={isLoading}>
            {isLoading ? (isRegistering ? 'Cadastrando...' : 'Entrando...') : (isRegistering ? 'Cadastrar aluno' : 'Entrar no sistema')}
          </button>

          <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => {
                setIsRegistering((value) => !value);
                setError('');
              }}
              aria-label="abrir cadastro de aluno"
              style={{ display: 'block', margin: '0.5rem auto 0', background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: 700, padding: '0.5rem 0', textDecoration: 'none', width: '100%', maxWidth: '320px' }}
            >
              {isRegistering ? 'Voltar para login' : 'CADASTRO'}
            </button>
          </div>

          <small>Conecta Ensino © 2026 • Plataforma de inclusão educacional</small>
        </form>
      </div>
    </div>
  );
}
