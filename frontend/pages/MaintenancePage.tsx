import { Construction, RefreshCw } from "lucide-react";

export default function MaintenancePage() {
  return (
    <main className="system-state-page">
      <div className="system-state-card">
        <span className="system-state-card__icon">
          <Construction size={37} />
        </span>

        <span className="dashboard__eyebrow">Manutenção programada</span>
        <h1>Estamos preparando melhorias</h1>
        <p>
          O Conecta Ensino está temporariamente indisponível. Tente novamente
          em alguns instantes.
        </p>

        <button
          className="primary-button"
          type="button"
          onClick={() => window.location.reload()}
        >
          <RefreshCw size={17} />
          Verificar novamente
        </button>
      </div>
    </main>
  );
}
