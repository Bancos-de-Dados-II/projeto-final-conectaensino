import {
  Download,
  FileText,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  getAccountDocuments,
  removeAccountDocument,
  uploadAccountDocument,
} from "../../services/settings.service";
import type { AccountDocument } from "../../types/settings";

function formatSize(size: number) {
  if (!size) return "Tamanho não informado";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export default function DocumentManager() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<AccountDocument[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    void getAccountDocuments().then(setDocuments);
  }, []);

  async function handleUpload(file?: File) {
    if (!file) return;
    setUploading(true);

    try {
      const document = await uploadAccountDocument(file);
      setDocuments((current) => [document, ...current]);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove(id: string) {
    await removeAccountDocument(id);
    setDocuments((current) =>
      current.filter((document) => document.id !== id),
    );
  }

  return (
    <div className="prototype-documents">
      <input
        ref={inputRef}
        hidden
        type="file"
        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
        onChange={(event) =>
          void handleUpload(event.target.files?.[0])
        }
      />

      <button
        className="prototype-upload-zone"
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        <UploadCloud size={28} />
        <strong>
          {uploading ? "ENVIANDO ARQUIVO..." : "ADICIONAR DOCUMENTO"}
        </strong>
        <small>PDF, DOC, DOCX, PNG OU JPG</small>
      </button>

      <div className="prototype-document-list">
        {documents.length === 0 && (
          <div className="prototype-empty-state">
            <FileText size={28} />
            <strong>NENHUM DOCUMENTO</strong>
            <p>Os arquivos enviados aparecerão aqui.</p>
          </div>
        )}

        {documents.map((document) => (
          <article className="prototype-document" key={document.id}>
            <span className="prototype-document__icon">
              <FileText size={19} />
            </span>
            <div>
              <strong>{document.name}</strong>
              <small>
                {formatSize(document.size)} ·{" "}
                {new Intl.DateTimeFormat("pt-BR").format(
                  new Date(document.createdAt),
                )}
              </small>
            </div>
            <div className="prototype-document__actions">
              {document.url && (
                <a
                  href={document.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Abrir documento"
                >
                  <Download size={17} />
                </a>
              )}
              <button
                type="button"
                aria-label="Excluir documento"
                onClick={() => void handleRemove(document.id)}
              >
                <Trash2 size={17} />
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
