import { useCallback, useEffect, useState } from 'react';
import { Check, RefreshCw, Save, ShieldCheck, Trash2, X } from 'lucide-react';
import { api } from '../api/axios';

type Institution = { id: string; name?: string; nome?: string };
type Director = {
  _id: string;
  name?: string;
  email?: string;
  cargo?: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  institutionId?: { _id?: string; id?: string; nome?: string };
};

export default function DirectorsPage() {
  const [directors, setDirectors] = useState<Director[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedSchools, setSelectedSchools] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [directorResponse, institutionResponse] = await Promise.all([
        api.get<Director[]>('/admins/directors'),
        api.get<{ institutions: Institution[] }>('/admins/institutions'),
      ]);
      setDirectors(directorResponse.data);
      setInstitutions(institutionResponse.data.institutions);
      setSelectedSchools(Object.fromEntries(directorResponse.data.map((director) => [
        director._id,
        String(director.institutionId?._id ?? director.institutionId?.id ?? ''),
      ])));
      setMessage('');
    } catch { setMessage('NÃ£o foi possÃ­vel carregar os diretores.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function updateStatus(id: string, status: 'approved' | 'rejected') {
    setBusyId(id);
    try {
      await api.patch(`/admins/directors/${id}/status`, { status });
      setMessage(status === 'approved' ? 'Diretor aprovado.' : 'Diretor rejeitado.');
      await load();
    } finally { setBusyId(''); }
  }

  async function reallocate(id: string) {
    const institutionId = selectedSchools[id];
    if (!institutionId) return;
    setBusyId(id);
    try {
      await api.patch(`/admins/directors/${id}/institution`, { institutionId });
      setMessage('Diretor realocado com sucesso.');
      await load();
    } finally { setBusyId(''); }
  }

  async function remove(id: string, name: string) {
    if (!window.confirm(`Excluir permanentemente o diretor ${name}?`)) return;
    setBusyId(id);
    try {
      await api.delete(`/admins/directors/${id}`);
      setMessage('Diretor excluÃ­do com sucesso.');
      await load();
    } finally { setBusyId(''); }
  }

  return <div className="dashboard dashboard--analytics">
    <header className="page-heading">
      <div><span className="eyebrow">ADMINISTRAÃ‡ÃƒO MUNICIPAL</span><h1>Diretores</h1><p>Aprove, rejeite, realoque ou exclua diretores das escolas da sua cidade.</p></div>
      <button className="secondary-button" type="button" onClick={() => void load()}><RefreshCw size={17}/> Atualizar</button>
    </header>
    {message && <div className="dashboard-panel"><p>{message}</p></div>}
    <section className="dashboard-panel">
      {loading ? <p>Carregando diretores...</p> : directors.length === 0 ? <p>Nenhum diretor cadastrado nesta cidade.</p> : directors.map((director) => {
        const name = director.name || director.email || 'Diretor';
        return <article className="activity-item" key={director._id}>
          <div className="activity-item__icon"><ShieldCheck size={20}/></div>
          <div><strong>{name}</strong><p>{director.email} Â· {director.institutionId?.nome || 'Escola nÃ£o informada'}</p><span className={`status-badge status-badge--${director.approvalStatus}`}>{director.approvalStatus === 'approved' ? 'Aprovado' : director.approvalStatus === 'rejected' ? 'Rejeitado' : 'Pendente'}</span></div>
          <div className="table-actions">
            <select aria-label={`Escola de ${name}`} value={selectedSchools[director._id] || ''} onChange={(event) => setSelectedSchools((current) => ({ ...current, [director._id]: event.target.value }))}>
              <option value="">Selecione a escola</option>
              {institutions.map((institution) => <option key={institution.id} value={institution.id}>{institution.nome || institution.name}</option>)}
            </select>
            <button className="secondary-button" disabled={busyId === director._id} onClick={() => void reallocate(director._id)}><Save size={16}/> Realocar</button>
            {director.approvalStatus !== 'approved' && <button className="primary-button" disabled={busyId === director._id} onClick={() => void updateStatus(director._id, 'approved')}><Check size={16}/> Aprovar</button>}
            {director.approvalStatus !== 'rejected' && <button className="secondary-button" disabled={busyId === director._id} onClick={() => void updateStatus(director._id, 'rejected')}><X size={16}/> Rejeitar</button>}
            <button className="icon-button icon-button--danger" aria-label={`Excluir ${name}`} disabled={busyId === director._id} onClick={() => void remove(director._id, name)}><Trash2 size={17}/></button>
          </div>
        </article>;
      })}
    </section>
  </div>;
}
