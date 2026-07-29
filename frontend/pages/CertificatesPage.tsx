import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Award,
  Download,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import {
  deleteCertificate,
  issueCertificate,
  listCertificates,
} from "../services/domain.service";
import type { CertificateRecord } from "../types/domain";

function CertificatesPage() {
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      setCertificates(await listCertificates());
    } catch {
      setErrorMessage("Não foi possível carregar os certificados.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase("pt-BR");

    if (!query) {
      return certificates;
    }

    return certificates.filter((certificate) =>
      [
        certificate.title,
        certificate.studentName,
        certificate.subjectName,
        certificate.code,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLocaleLowerCase("pt-BR").includes(query),
        ),
    );
  }, [certificates, searchTerm]);

  async function handleIssue() {
    const title = window.prompt("Título do certificado:");

    if (!title) {
      return;
    }

    const studentName = window.prompt("Nome do aluno:") || undefined;

    setSubmitting(true);

    try {
      await issueCertificate({
        title,
        student_name: studentName,
      });

      setSuccessMessage("Certificado emitido com sucesso.");
      await loadData();
    } catch {
      setErrorMessage("Não foi possível emitir o certificado.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(certificate: CertificateRecord) {
    if (!window.confirm(`Excluir o certificado "${certificate.title}"?`)) {
      return;
    }

    try {
      await deleteCertificate(certificate.id);
      setCertificates((current) =>
        current.filter((item) => item.id !== certificate.id),
      );
      setSuccessMessage("Certificado excluído com sucesso.");
    } catch {
      setErrorMessage("Não foi possível excluir o certificado.");
    }
  }

  return (
    <div className="domain-page">
      <section className="crud-page__heading">
        <div>
          <span className="dashboard__eyebrow">Documentos</span>
          <h1>Certificados</h1>
          <p>Emita e acompanhe certificados gerados pela plataforma.</p>
        </div>

        <button
          className="primary-button"
          type="button"
          onClick={() => void handleIssue()}
          disabled={submitting}
        >
          <Plus size={18} />
          Emitir certificado
        </button>
      </section>

      {errorMessage && (
        <div className="crud-feedback crud-feedback--error">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="crud-feedback crud-feedback--success">
          {successMessage}
        </div>
      )}

      <section className="domain-toolbar">
        <div className="crud-search">
          <Search size={17} />
          <input
            type="search"
            placeholder="Pesquisar certificados..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <button
          className="icon-button"
          type="button"
          aria-label="Atualizar"
          onClick={() => void loadData()}
          disabled={loading}
        >
          <RefreshCw
            size={18}
            className={loading ? "icon-spinning" : ""}
          />
        </button>
      </section>

      <section className="certificate-grid">
        {loading && (
          <div className="domain-empty">
            <span className="route-loader__spinner" />
            <p>Carregando certificados...</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="domain-empty">
            <Award size={34} />
            <strong>Nenhum certificado encontrado</strong>
            <p>Emita o primeiro certificado para começar.</p>
          </div>
        )}

        {!loading &&
          filtered.map((certificate) => (
            <article className="certificate-card" key={certificate.id}>
              <div className="certificate-card__watermark">
                <Award size={110} />
              </div>

              <header>
                <span className="certificate-card__icon">
                  <Award size={23} />
                </span>

                <span className="certificate-card__status">
                  <ShieldCheck size={14} />
                  {certificate.status || "Válido"}
                </span>
              </header>

              <div className="certificate-card__content">
                <span className="dashboard__eyebrow">Certificado</span>
                <h2>{certificate.title}</h2>
                <p>
                  {certificate.studentName || "Aluno não informado"}
                </p>

                {certificate.subjectName && (
                  <small>{certificate.subjectName}</small>
                )}
              </div>

              <footer>
                <div>
                  <span>Emitido em</span>
                  <strong>{certificate.issuedAt || "Data não informada"}</strong>
                </div>

                <div>
                  <span>Código</span>
                  <strong>{certificate.code || "—"}</strong>
                </div>

                <div className="certificate-card__actions">
                  <button type="button" aria-label="Baixar">
                    <Download size={16} />
                  </button>

                  <button
                    type="button"
                    aria-label="Excluir"
                    onClick={() => void handleDelete(certificate)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </footer>
            </article>
          ))}
      </section>
    </div>
  );
}

export default CertificatesPage;
