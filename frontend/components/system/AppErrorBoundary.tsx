import { AlertTriangle, RefreshCw } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";

export default class AppErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Erro no Conecta Ensino:", error, info);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <main className="prototype-system-state">
        <section className="prototype-card prototype-system-card">
          <span className="prototype-icon">
            <AlertTriangle size={31} />
          </span>
          <small className="prototype-kicker">ERRO DO SISTEMA</small>
          <h1>Não foi possível carregar esta página</h1>
          <p>Atualize a aplicação para tentar novamente.</p>
          <button type="button" onClick={() => window.location.reload()}>
            <RefreshCw size={16} />
            Atualizar
          </button>
        </section>
      </main>
    );
  }
}
