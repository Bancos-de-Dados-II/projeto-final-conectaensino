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
import { api } from "../../api/axios";
import { getAdminInstitutions, getInstitutions } from "../../services/map.service";
import { getOwnAccountProfile } from "../../services/monitor-profile.service";
import { useAuth } from "../../hooks/useAuth";
import { getApplicationRole } from "../../utils/auth-role";

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
): Record<string, unknown> {
  return fields.reduce<Record<string, unknown>>((values, field) => {
    const currentValue = entity?.[field.key];

    if (field.type === "checkbox-group") {
      values[field.key] = Array.isArray(currentValue)
        ? currentValue.map(String)
        : [];
      return values;
    }

    if (field.key === "institutionId" && typeof currentValue === "object" && currentValue !== null) {
      const institution = currentValue as Record<string, unknown>;
      values[field.key] = String(institution._id ?? institution.id ?? "");
      return values;
    }

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
  const { user } = useAuth();
  const initialValues = useMemo(
    () => getInitialValues(fields, entity),
    [entity, fields],
  );

  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loadingInstitutions, setLoadingInstitutions] = useState(false);
  const [dynamicOptions, setDynamicOptions] = useState<Record<string, any[]>>({});

  // Carrega Instituições (apenas para o campo institutionId)
  useEffect(() => {
    if (open) {
      setLoadingInstitutions(true);
      const role = getApplicationRole(user);
      (role === "admin" ? getAdminInstitutions() : getInstitutions())
        .then(async (data) => {
          if (role !== "director") {
            setInstitutions(data);
            return;
          }
          const profile = await getOwnAccountProfile();
          const linked = profile.institutionId;
          const linkedId =
            linked && typeof linked === "object"
              ? linked._id ?? linked.id
              : linked;
          const allowed = data.filter(
            (institution) => String(institution.id) === String(linkedId),
          );
          setInstitutions(allowed);
          if (allowed[0]) {
            setValues((current) => ({
              ...current,
              institutionId: allowed[0].id,
            }));
          }
        })
        .catch((err) => console.error("Erro ao carregar instituições:", err))
        .finally(() => setLoadingInstitutions(false));
    }
  }, [open, user]);

  // Carrega opções dinâmicas para outros selects (ex: /disciplinas/catalog)
  useEffect(() => {
    if (open) {
      fields.forEach((field) => {
        if (field.type === "select" && field.key !== "institutionId" && field.optionsEndpoint) {
          api
            .get(field.optionsEndpoint)
            .then((res) => {
              setDynamicOptions((prev) => ({
                ...prev,
                [field.key]: Array.isArray(res.data) ? res.data : [],
              }));
            })
            .catch((err) =>
              console.error(`Erro ao carregar opções de ${field.key}:`, err)
            );
        }
      });
    }
  }, [open, fields]);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues, open]);

  if (!open) {
    return null;
  }

  const handleCheckboxToggle = (fieldKey: string, optionValue: string) => {
    setValues((current) => {
      const existing = Array.isArray(current[fieldKey])
        ? (current[fieldKey] as string[])
        : [];
      const updated = existing.includes(optionValue)
        ? existing.filter((val) => val !== optionValue)
        : [...existing, optionValue];
      return { ...current, [fieldKey]: updated };
    });
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const rawValues = fields.reduce<Record<string, unknown>>(
      (result, field) => {
        const val = values[field.key];

        if (field.type === "checkbox-group") {
          result[field.key] = Array.isArray(val) ? val : [];
          return result;
        }

        const value = typeof val === "string" ? val.trim() : val ?? "";

        if (field.type === "number") {
          result[field.key] = value !== "" ? Number(value) : undefined;
        } else {
          result[field.key] = value !== "" ? value : undefined;
        }

        return result;
      },
      {},
    );

    const selectedInst = institutions.find(
      (inst, index) => String(inst._id || inst.id || inst.codigo_escola || index) === String(rawValues.institutionId)
    );

    let lat = 0;
    let lng = 0;

    if (selectedInst) {
      if (selectedInst._id) {
        rawValues.institutionId = selectedInst._id;
      } else {
        rawValues.institutionId = String(selectedInst.codigo_escola || selectedInst.id || "csv-inst");
        lat = Number(selectedInst.latitude || 0);
        lng = Number(selectedInst.longitude || 0);
      }
    }

    const emailStr = String(rawValues.email || "monitor@email.com");
    const fallbackName = emailStr.split("@")[0];
    const formattedFallbackName = fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1);
    
    const finalName = rawValues.name || rawValues.nome || rawValues.fullName || formattedFallbackName;

    const payload = {
      ...rawValues,
      name: finalName, 
      userId: rawValues.userId || "temp-user-id",
      disciplinas: typeof rawValues.disciplinas === "string" 
        ? rawValues.disciplinas.split(",").map((d: string) => d.trim()).filter(Boolean)
        : Array.isArray(rawValues.disciplinas) ? rawValues.disciplinas : [rawValues.disciplinas].filter(Boolean),
      disponibilidade: typeof rawValues.disponibilidade === "string"
        ? rawValues.disponibilidade.split(",").map((d: string) => d.trim()).filter(Boolean)
        : rawValues.disponibilidade,
      habilidadesPcd: Array.isArray(rawValues.habilidadesPcd)
        ? rawValues.habilidadesPcd
        : [],
      location: {
        type: "Point",
        coordinates: [lng, lat],
      },
    };

    console.log("Payload formatado para envio:", payload);

    try {
      await onSubmit(payload);
    } catch (err: any) {
      console.error("Erro capturado no envio:", err.response?.data || err.message);
    }
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
              <div className="crud-form-field" key={field.key}>
                <span>{field.label}</span>

                  {field.type === "checkbox-group" ? (
                    <div className="crud-checkbox-grid">
                      {field.options?.map((option) => {
                        const optionVal = String(option.value);
                        const currentSelected = Array.isArray(values[field.key])
                          ? (values[field.key] as string[])
                          : [];
                        const isChecked = currentSelected.includes(optionVal);

                        return (
                          <label key={optionVal} className="crud-checkbox-card">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleCheckboxToggle(field.key, optionVal)}
                            />
                            <span>{option.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : field.key === "institutionId" ? (
                  <select
                    value={String(values[field.key] ?? "")}
                    required={field.required}
                    disabled={loadingInstitutions}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        [field.key]: event.target.value,
                      }))
                    }
                  >
                    <option value="">
                      {loadingInstitutions ? "Carregando instituições..." : field.placeholder || "Selecione a instituição"}
                    </option>
                    {institutions.map((inst, index) => {
                      const instId = inst._id || inst.id || inst.codigo_escola || index;
                      const instName = inst.nome || inst.name || "Instituição";
                      return (
                        <option key={instId} value={instId}>
                          {instName} {inst.cidade ? `- ${inst.cidade}` : ""}
                        </option>
                      );
                    })}
                  </select>
                ) : field.type === "select" ? (
                  <select
                    value={String(values[field.key] ?? "")}
                    required={field.required}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        [field.key]: event.target.value,
                      }))
                    }
                  >
                    <option value="">{field.placeholder || "Selecione..."}</option>

                    {field.options?.map((opt) => (
                      <option key={String(opt.value)} value={String(opt.value)}>
                        {opt.label}
                      </option>
                    ))}

                    {dynamicOptions[field.key]?.map((item: any) => {
                      const val = typeof item === "string" ? item : (item.nome || item.name || item.id);
                      const label = typeof item === "string" ? item : (item.nome || item.name || item.label);
                      return (
                        <option key={val} value={val}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                ) : field.type === "textarea" ? (
                  <textarea
                    value={String(values[field.key] ?? "")}
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
                    value={String(values[field.key] ?? "")}
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
              </div>
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