import { useCallback, useEffect, useState } from 'react';
import { Building2, Check, Download, GraduationCap, UserRound, UsersRound, X } from 'lucide-react';
import { api } from '../../api/axios';

type AdminData = {
  city: { name: string; stateCode: string };
  counts: { institutions: number; students: number; monitors: number; pendingDirectors: number; approvedDirectors: number };
};
type Director = { _id: string; name?: string; email?: string; approvalStatus: string; institutionId?: { nome?: string } };

export default function AdminDashboard() {
  const [data, setData] = useState<AdminData | null>(null);
  const [directors, setDirectors] = useState<Director[]>([]);
  const [message, setMessage] = useState('');
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [dashboard, directorList] = await Promise.all([
        api.get<AdminData>('/admins/dashboard'),
        api.get<Director[]>('/admins/directors'),
      ]);
      setData(dashboard.data);
      setDirectors(directorList.data);
    } catch {
      setMessage('Nao foi possivel carregar o painel municipal.');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function decide(id: string, status: 'approved' | 'rejected') {
    await api.patch(`/admins/directors/${id}/status`, { status });
    setMessage(status === 'approved' ? 'Diretor aprovado com sucesso.' : 'Cadastro recusado.');
    await load();
  }

  async function exportReport() {
    setExporting(true);
    setMessage('');
    try {
      const response = await api.get('/admins/report.pdf', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `relatorio-conecta-ensino-${data?.city.name.toLowerCase() || 'municipal'}-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setMessage('Relatorio atualizado e exportado com sucesso.');
    } catch {
      setMessage('Nao foi possivel exportar o relatorio.');
    } finally {
      setExporting(false);
    }
  }

  if (!data) {
    return <div className="dashboard"><p>{message || 'Carregando painel municipal...'}</p></div>;
  }

  const cards = [
    ['Escolas', data.counts.institutions, Building2],
    ['Alunos', data.counts.students, UserRound],
    ['Monitores', data.counts.monitors, GraduationCap],
    ['Diretores aprovados', data.counts.approvedDirectors, UsersRound],
  ] as const;
  const pendingDirectors = directors.filter((item) => item.approvalStatus === 'pending');

  return <div className="dashboard dashboard--analytics">
    <header className="page-heading">
      <div>
        <span className="eyebrow">ADMINISTRACAO MUNICIPAL</span>
        <h1>{data.city.name} / {data.city.stateCode}</h1>
        <p>Gerencie as escolas e os usuarios exclusivamente desta cidade.</p>
      </div>
      <div className="table-actions">
        <button className="secondary-button" type="button" disabled={exporting} onClick={() => void exportReport()}>
          <Download size={18}/> {exporting ? 'Gerando PDF...' : 'RELATORIO'}
        </button>
      </div>
    </header>

    <section className="stats-grid stats-grid--four">
      {cards.map(([label, value, Icon]) => <article className="stat-card" key={label}><Icon size={22}/><span>{label}</span><strong>{value}</strong></article>)}
    </section>

    <section className="dashboard-panel">
      <div className="dashboard-panel__header"><div><span className="eyebrow">APROVACOES</span><h2>Diretores aguardando analise</h2></div></div>
      {message && <p>{message}</p>}
      {pendingDirectors.length === 0
        ? <p>Sem pendencias.</p>
        : pendingDirectors.map((director) => <article className="activity-item" key={director._id}>
            <div><strong>{director.name || director.email}</strong><p>{director.institutionId?.nome || 'Escola nao informada'} - {director.email}</p></div>
            <div className="table-actions">
              <button className="primary-button" onClick={() => void decide(director._id, 'approved')}><Check size={16}/> Aprovar</button>
              <button className="secondary-button" onClick={() => void decide(director._id, 'rejected')}><X size={16}/> Recusar</button>
            </div>
          </article>)}
    </section>
  </div>;
}
