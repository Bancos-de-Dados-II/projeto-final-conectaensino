import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { directorService } from '../services/director.service';
import { api } from '../api/axios';

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
  
  const navigate = useNavigate();

 useEffect(() => {
    async function loadInstitutions() {
      setIsLoading(true);
      try {
        const response = await api.get('/institutions');
        console.log('Dados recebidos do back-end:', response.data);
        
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
        console.error('Erro ao carregar instituições do MongoDB:', err);
        setError('Não foi possível carregar a lista de instituições.');
      } finally {
        setIsLoading(false);
      }
    }

    loadInstitutions();
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
    }
  };

  return (
    <div className="login-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div className="login-card" style={{ width: '100%', maxWidth: '480px', padding: '32px' }}>
        <h2>Cadastro de Diretor(a)</h2>
        <p>Vincule sua conta gestora selecionando a instituição.</p>

        {error && <div className="login-error" style={{ marginBottom: '16px', color: 'red' }}>{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <label className="login-field">
            <span>Nome Completo</span>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required 
            />
          </label>

          <label className="login-field">
            <span>E-mail Institucional</span>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
          </label>

          <label className="login-field">
            <span>Senha</span>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </label>

          <label className="login-field">
            <span>Cargo</span>
            <input 
              type="text" 
              value={cargo} 
              onChange={e => setCargo(e.target.value)} 
            />
          </label>

          <label className="login-field">
            <span>Instituição</span>
            <select 
              value={institutionId} 
              onChange={e => setInstitutionId(e.target.value)} 
              required
              disabled={isLoading}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
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
            <input 
              type="text" 
              placeholder="Digite o código INEP para validar"
              value={codigoConfirmacao} 
              onChange={e => setCodigoConfirmacao(e.target.value)} 
              required 
            />
          </label>

          <button type="submit" className="login-submit" style={{ marginTop: '20px', width: '100%' }}>
            Cadastrar Diretor
          </button>
        </form>

        <button 
          type="button" 
          onClick={() => navigate('/login')} 
          style={{ background: 'transparent', border: 'none', color: '#4f46e5', marginTop: '16px', cursor: 'pointer', width: '100%' }}
        >
          Voltar para o Login
        </button>
      </div>
    </div>
  );
}

export default RegisterDirector;