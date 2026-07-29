import { AlertTriangle, Trash2, X } from "lucide-react";

interface DeleteConfirmModalProps {
  open: boolean;
  singular: string;
  entityName: string;
  submitting: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

function DeleteConfirmModal({
  open,
  singular,
  entityName,
  submitting,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="crud-modal-backdrop" role="presentation">
      <section
        className="crud-modal crud-modal--small"
        role="alertdialog"
        aria-modal="true"
      >
        <header className="crud-modal__header">
          <div className="delete-modal-heading">
            <span className="delete-modal-icon">
              <AlertTriangle size={21} />
            </span>

            <div>
              <span className="dashboard__eyebrow">Confirmar exclusão</span>
              <h2>Excluir {singular}</h2>
            </div>
          </div>

          <button
            className="icon-button"
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            disabled={submitting}
          >
            <X size={20} />
          </button>
        </header>

        <div className="delete-modal-content">
          <p>
            Tem certeza que deseja excluir <strong>{entityName}</strong>?
            Esta ação não poderá ser desfeita.
          </p>
        </div>

        <footer className="crud-modal__footer">
          <button
            className="secondary-button crud-modal-button"
            type="button"
            onClick={onClose}
            disabled={submitting}
          >
            Cancelar
          </button>

          <button
            className="danger-button crud-modal-button"
            type="button"
            onClick={() => void onConfirm()}
            disabled={submitting}
          >
            {submitting ? (
              <span className="button-spinner" />
            ) : (
              <Trash2 size={17} />
            )}
            {submitting ? "Excluindo..." : "Excluir"}
          </button>
        </footer>
      </section>
    </div>
  );
}

export default DeleteConfirmModal;
