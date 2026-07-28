import {
  Download,
  FileText,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  deleteDocument,
  getDocuments,
  uploadDocument,
} from "../../services/preferences.service";
import type { UserDocument } from "../../types/preferences";

function formatSize(size: number) {
  if (!size) return "Tamanho não informado";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export default function DocumentsManager() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    void getDocuments().then(setDocuments);
  }, []);

  async function handleFile(file?: File) {
    if (!file) return;

    setUploading(true);

    try {
      const document = await uploadDocument(file);
      setDocuments((current) => [document, ...current]);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete(id: string) {
    await deleteDocument(id);
    setDocuments((current) =>
      current.filter((document) => document.id !== id),
    );
  }

  return (
    <div className="documents-manager">
      <input
        ref={inputRef}
        type="file"
        hidden
        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />

      <button
        className="document-upload"
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        <UploadCloud size={27} />
        <strong>
          {uploading ? "Enviando documento..." : "Adicionar documento"}
        </strong>
        <small>PDF, DOC, DOCX, PNG ou JPG</small>
      </button>

      <div className="document-list">
        {documents.length === 0 && (
          <div className="document-empty">
            <FileText size={28} />
            <strong>Nenhum documento enviado</strong>
            <p>Seus documentos aparecerão nesta área.</p>
          </div>
        )}

        {documents.map((document) => (
          <article className="document-item" key={document.id}>
            <span className="document-item__icon">
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

            <div className="document-item__actions">
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
                onClick={() => void handleDelete(document.id)}
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
