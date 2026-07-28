import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { Save, X } from "lucide-react";

import type {
  CrudEntity,
  CrudField,
} from "../../types/crud";

interface EntityFormModalProps {
  open: boolean;
  singular: string;
  fields: CrudField[];
  entity: CrudEntity | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
}

function getInitialValues(
  fields: CrudField[],
  entity: CrudEntity | null,
): Record<string, string> {
  return fields.reduce<Record<string, string>>((values, field) => {
    const currentValue = entity?.[field.key];

    values[field.key] =
      currentValue === undefined || currentValue === null
        ? ""
        : String(currentValue);

    return values;
  }, {});
}

function EntityFormModal({
  open,
  singular,
  fields,
  entity,
  submitting,
  onClose,
  onSubmit,
}: EntityFormModalProps) {
  const initialValues = useMemo(
    () => getInitialValues(fields, entity),
    [entity, fields],
  );

  const [values, setValues] = useState(initialValues);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues, open]);

  if (!open) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = fields.reduce<Record<string, unknown>>(
      (result, field) => {
        const value = values[field.key]?.trim() ?? "";

        if (field.type === "number") {
          result[field.key] = value ? Number(value) : undefined;
        } else {
          result[field.key] = value || undefined;
        }

        return result;
      },
      {},
    );

    await onSubmit(payload);
  }

  return (
    <div className="crud-modal-backdrop" role="presentation">
      <section
        className="crud-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="crud-modal-title"
      >
        <header className="crud-modal__header">
          <div>
            <span className="dashboard__eyebrow">
              {entity ? "Editar cadastro" : "Novo cadastro"}
            </span>
            <h2 id="crud-modal-title">
              {entity ? `Editar ${singular}` : `Cadastrar ${singular}`}
            </h2>
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

        <form className="crud-form" onSubmit={handleSubmit}>
          <div className="crud-form__fields">
            {fields.map((field) => (
              <label className="crud-form-field" key={field.key}>
                <span>{field.label}</span>

                {field.type === "textarea" ? (
                  <textarea
                    value={values[field.key] ?? ""}
                    placeholder={field.placeholder}
                    required={field.required}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        [field.key]: event.target.value,
                      }))
                    }
                  />
                ) : (
                  <input
                    type={field.type || "text"}
                    value={values[field.key] ?? ""}
                    placeholder={field.placeholder}
                    required={field.required}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        [field.key]: event.target.value,
                      }))
                    }
                  />
                )}
              </label>
            ))}
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
              className="primary-button crud-modal-button"
              type="submit"
              disabled={submitting}
            >
              {submitting ? (
                <span className="button-spinner" />
              ) : (
                <Save size={17} />
              )}
              {submitting ? "Salvando..." : "Salvar"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

export default EntityFormModal;
