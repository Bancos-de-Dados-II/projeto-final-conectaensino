import { useState } from "react";
import { Award, Download } from "lucide-react";

import { useAuth } from "../hooks/useAuth";
import {
  downloadCertificate,
  getMyLatestCertificateId,
} from "../services/domain.service";
import { getApplicationRole } from "../utils/auth-role";

function CertificatesPage() {
  const { user } = useAuth();
  const isMonitor = getApplicationRole(user) === "monitor";
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleIssue() {
    setLoading(true);
    setErrorMessage("");
    try {
      const certificateId = await getMyLatestCertificateId();
      await downloadCertificate(certificateId);
    } catch {
      setErrorMessage("Nenhum certificado está disponível para emissão no momento.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="domain-page">
      <section className="crud-page__heading">
        <div>
          <span className="dashboard__eyebrow">Documentos</span>
          <h1>Certificados</h1>
          <p>Emita seu certificado mensal de monitoria em PDF.</p>
        </div>

        {isMonitor && (
          <button
            className="primary-button"
            type="button"
            onClick={() => void handleIssue()}
            disabled={loading}
          >
            {loading ? <span className="route-loader__spinner" /> : <Download size={18} />}
            {loading ? "Emitindo..." : "Emitir certificado"}
          </button>
        )}
      </section>

      {errorMessage && (
        <div className="crud-feedback crud-feedback--error">{errorMessage}</div>
      )}

      {!isMonitor && (
        <div className="domain-empty">
          <Award size={34} />
          <strong>Emissão disponível para monitores</strong>
        </div>
      )}
    </div>
  );
}

export default CertificatesPage;
