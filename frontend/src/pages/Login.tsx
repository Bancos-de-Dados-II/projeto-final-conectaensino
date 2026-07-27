import { FormEvent, useState } from 'react';
import { FiArrowRight, FiLock, FiMail } from 'react-icons/fi';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  async function submit(event: FormEvent) { event.preventDefault(); setError(''); setLoading(true); try { await login({ email, password }); navigate('/dashboard'); } catch (err: any) { setError(err.response?.data?.message ?? 'Não foi possível entrar.'); } finally { setLoading(false); } }
  return <div className="login-page"><section className="login-hero"><div className="hero-grid"/><span className="header-dot"/><span className="eyebrow">APRENDER • CONECTAR • EVOLUIR</span><h1>Conhecimento fica melhor quando é compartilhado.</h1><p>Encontre monitores próximos, organize sessões e acompanhe sua evolução acadêmica.</p></section><section className="login-panel"><form className="login-card" onSubmit={submit}><div><span className="eyebrow">ACESSO À PLATAFORMA</span><h2>Bem-vindo de volta</h2><p>Entre usando seus dados cadastrados.</p></div><label>E-mail<div className="input-wrap"><FiMail/><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required /></div></label><label>Senha<div className="input-wrap"><FiLock/><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required /></div></label>{error && <div className="erro-msg visible">{error}</div>}<button className="primary-button" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}<FiArrowRight/></button></form></section></div>;
}
