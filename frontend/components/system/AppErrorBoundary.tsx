import {
  Component,
  type ErrorInfo,
  type ReactNode,
} from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Erro não tratado no Conecta Ensino:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="prototype-system-page">
          <section className="prototype-system-card">
            <span className="prototype-system-icon">
              <AlertTriangle size={35} />
            </span>
            <span className="prototype-kicker">ERRO DO SISTEMA</span>
            <h1>Não foi possível carregar esta tela</h1>
            <p>
              Atualize a aplicação para tentar novamente. Seus dados não
              foram removidos.
            </p>
            <button
              className="prototype-primary-button"
              type="button"
              onClick={() => window.location.reload()}
            >
              <RefreshCw size={17} />
              Atualizar
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
