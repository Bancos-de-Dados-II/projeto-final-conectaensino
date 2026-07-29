import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { directorService } from '../services/director.service';
import { api, getApiBaseUrl } from '../api/axios';
import { GraduationCap, LockKeyhole, Mail, User, ShieldCheck, ArrowRight } from 'lucide-react';

interface Institution {
  _id: string;
  codigoInep: string;
  nome: string;
}

export function RegisterDirector() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargo, setCargo] = useState('Diretor(a)');
  const [institutionId, setInstitutionId] = useState('');
  const [codigoConfirmacao, setCodigoConfirmacao] = useState('');
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    async function loadInstitutions() {
      setIsLoading(true);
      try {
        const response = await api.get('/institutions');
        const list = Array.isArray(response.data) ? response.data : (response.data.institutions || []);

        const formatted = list
          .map((item: any) => ({
            _id: String(item._id),
            codigoInep: String(item.codigoInep ?? 'S/N'),
            nome: String(item.nome ?? item.name ?? 'Instituição sem nome')
          }))
          .filter((item: Institution) => /^[0-9a-fA-F]{24}$/.test(item._id));

        setInstitutions(formatted);
      } catch (err) {
        console.error('Erro ao carregar instituições:', err);
        setError('Não foi possível carregar a lista de instituições.');
      } finally {
        setIsLoading(false);
      }
    }

    void loadInstitutions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!institutionId) {
      setError('Por favor, selecione a instituição.');
      return;
    }

    const instituicaoSelecionada = institutions.find(i => i._id === institutionId);
    if (instituicaoSelecionada && instituicaoSelecionada.codigoInep !== codigoConfirmacao.trim()) {
      setError(`O Código INEP informado não confere com o da instituição selecionada (${instituicaoSelecionada.codigoInep}).`);
      return;
    }

    setIsSubmitting(true);

    try {
      await directorService.register({
        name,
        email,
        password,
        institutionId,
        cargo
      });

      alert('Diretor cadastrado com sucesso!');
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao realizar cadastro do diretor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-presentation">
        <div className="login-brand">
          <span className="login-brand__icon">
            <GraduationCap size={29} />
          </span>
          <div>
            <strong>Conecta Ensino</strong>
            <span>Gestão institucional integrada.</span>
          </div>
        </div>

        <div className="login-presentation__content">
          <span className="login-eyebrow">Painel do Gestor</span>
          <h1>Cadastre sua conta com validação institucional.</h1>
          <p>
            Vincule seu perfil de liderança à escola correspondente utilizando o código INEP oficial.
          </p>

          <div className="login-benefits">
            <div>
              <ShieldCheck size={21} />
              <span>
                <strong>Segurança de Dados</strong>
                <small>Validação baseada no registro da escola.</small>
              </span>
            </div>
          </div>
        </div>

        <span className="login-presentation__footer">
          Conecta Ensino • Gestão Acadêmica
        </span>
      </section>

      <section className="login-area">
        <div className="login-card">
          <header className="login-card__header">
            <span className="login-eyebrow">Novo acesso</span>
            <h2>Cadastro de Diretor(a)</h2>
            <p>Preencha os campos abaixo para criar sua conta gestora.</p>
          </header>

          {error && <div className="login-error" role="alert">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <label className="login-field">
              <span>Nome Completo</span>
              <div className="login-input">
                <User size={18} />
                <input 
                  type="text" 
                  placeholder="Seu nome completo"
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required 
                />
              </div>
            </label>

            <label className="login-field">
              <span>E-mail Institucional</span>
              <div className="login-input">
                <Mail size={18} />
                <input 
                  type="email" 
                  placeholder="diretor@escola.com"
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required 
                />
              </div>
            </label>

            <label className="login-field">
              <span>Senha</span>
              <div className="login-input">
                <LockKeyhole size={18} />
                <input 
                  type="password" 
                  placeholder="Digite sua senha"
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                />
              </div>
            </label>

            <label className="login-field">
              <span>Cargo</span>
              <div className="login-input">
                <input 
                  type="text" 
                  placeholder="Ex: Diretor(a) / Coordenador(a)"
                  value={cargo} 
                  onChange={e => setCargo(e.target.value)} 
                  required
                />
              </div>
            </label>

            <label className="login-field">
              <span>Instituição</span>
              <select 
                value={institutionId} 
                onChange={e => setInstitutionId(e.target.value)} 
                required
                disabled={isLoading}
              >
                <option value="">
                  {isLoading ? 'Carregando instituições...' : 'Selecione a Instituição'}
                </option>
                {institutions.map(inst => (
                  <option key={inst._id} value={inst._id}>
                    {inst.nome}
                  </option>
                ))}
              </select>
            </label>

            <label className="login-field">
              <span>Confirme o Código INEP da Instituição</span>
              <div className="login-input">
                <input 
                  type="text" 
                  placeholder="Digite o código INEP para validar"
                  value={codigoConfirmacao} 
                  onChange={e => setCodigoConfirmacao(e.target.value)} 
                  required 
                />
              </div>
            </label>

            <button type="submit" className="login-submit" disabled={isSubmitting}>
              {isSubmitting ? "Cadastrando..." : "Cadastrar Diretor"}
              <ArrowRight size={18} />
            </button>
          </form>

          <div style={{ marginTop: 12, textAlign: 'center' }}>
            <button 
              type="button" 
              className="secondary-button"
              style={{ width: '100%', height: '42px', justifyContent: 'center' }}
              onClick={() => navigate('/login')}
            >
              Voltar para o Login
            </button>
          </div>

          <footer className="login-card__footer">
            API configurada em:
            <code>{getApiBaseUrl()}</code>
          </footer>
        </div>
      </section>
    </main>
  );
}

export default RegisterDirector;