import { Construction, RefreshCw } from "lucide-react";

export default function MaintenancePage() {
  return (
    <main className="prototype-system-page">
      <section className="prototype-system-card">
        <span className="prototype-system-icon">
          <Construction size={36} />
        </span>
        <span className="prototype-kicker">STATUS // MANUTENÇÃO</span>
        <h1>SISTEMA TEMPORARIAMENTE INDISPONÍVEL</h1>
        <p>
          Estamos aplicando melhorias no Conecta Ensino. Tente novamente em
          alguns instantes.
        </p>
        <button
          className="prototype-primary-button"
          type="button"
          onClick={() => window.location.reload()}
        >
          <RefreshCw size={17} />
          VERIFICAR NOVAMENTE
        </button>
      </section>
    </main>
  );
}
