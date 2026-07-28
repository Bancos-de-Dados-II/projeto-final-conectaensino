import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";
import {
  Edit3,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserRound,
} from "lucide-react";

import {
  createEntity,
  deleteEntity,
  listEntities,
  updateEntity,
} from "../../services/crud.service";
import type {
  CrudEntity,
  CrudResourceConfig,
} from "../../types/crud";
import DeleteConfirmModal from "./DeleteConfirmModal";
import EntityFormModal from "./EntityFormModal";

interface EntityManagerProps {
  config: CrudResourceConfig;
}

function getDisplayValue(
  entity: CrudEntity,
  keys: string[],
  fallback = "—",
): string {
  for (const key of keys) {
    const value = entity[key];

    if (typeof value === "string" || typeof value === "number") {
      return String(value);
    }

    if (Array.isArray(value)) {
      return value.map(v => typeof v === 'object' && v !== null ? (v.nome || v.name || '') : String(v)).filter(Boolean).join(", ");
    }

    if (value && typeof value === "object") {
      const objValue = value as Record<string, unknown>;
      const resolved = objValue.nome || objValue.name || objValue.title || objValue.email;
      if (typeof resolved === "string") {
        return resolved;
      }
    }
  }

  return fallback;
}

function getEntityName(entity: CrudEntity): string {
  return getDisplayValue(
    entity,
    ["name", "nome", "fullName", "nomeCompleto", "email"],
    "Monitor",
  );
}

function EntityManager({ config }: EntityManagerProps) {
  const [entities, setEntities] = useState<CrudEntity[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingEntity, setEditingEntity] =
    useState<CrudEntity | null>(null);
  const [deletingEntity, setDeletingEntity] =
    useState<CrudEntity | null>(null);

 const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const data = await listEntities(config.endpoint);
      console.log("Dados REAIS retornados do endpoint:", data);
      setEntities(data);
    } catch (error) {
      setErrorMessage(
        axios.isAxiosError(error)
          ? "Não foi possível carregar os dados deste módulo."
          : "Ocorreu um erro inesperado.",
      );
    } finally {
      setLoading(false);
    }
  }, [config.endpoint]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    setSearchTerm("");
    setSuccessMessage("");
    setErrorMessage("");
    setEditingEntity(null);
    setDeletingEntity(null);
    setFormOpen(false);
  }, [config.endpoint]);

  const filteredEntities = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase("pt-BR");

    if (!query) {
      return entities;
    }

    return entities.filter((entity) =>
      config.searchableFields.some((field) => {
        const value = entity[field];

        return (
          value !== undefined &&
          value !== null &&
          String(value).toLocaleLowerCase("pt-BR").includes(query)
        );
      }),
    );
  }, [config.searchableFields, entities, searchTerm]);

  function openCreateForm() {
    setEditingEntity(null);
    setFormOpen(true);
  }

  function openEditForm(entity: CrudEntity) {
    setEditingEntity(entity);
    setFormOpen(true);
  }

  async function handleSave(payload: Record<string, unknown>) {
    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (editingEntity) {
        const updated = await updateEntity(
          config.endpoint,
          editingEntity.id,
          payload,
        );

        setEntities((current) =>
          current.map((entity) =>
            entity.id === editingEntity.id
              ? { ...entity, ...updated }
              : entity,
          ),
        );

        setSuccessMessage("Cadastro atualizado com sucesso.");
      } else {
        const created = await createEntity(config.endpoint, payload);
        setEntities((current) => [created, ...current]);
        setSuccessMessage("Cadastro realizado com sucesso.");
      }

      setFormOpen(false);
      setEditingEntity(null);
    } catch (error) {
      setErrorMessage(
        axios.isAxiosError(error)
          ? String(
              (error.response?.data as { message?: string } | undefined)
                ?.message || "Não foi possível salvar o cadastro.",
            )
          : "Não foi possível salvar o cadastro.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deletingEntity) {
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await deleteEntity(config.endpoint, deletingEntity.id);

      setEntities((current) =>
        current.filter((entity) => entity.id !== deletingEntity.id),
      );

      setSuccessMessage("Cadastro excluído com sucesso.");
      setDeletingEntity(null);
    } catch (error) {
      setErrorMessage(
        axios.isAxiosError(error)
          ? String(
              (error.response?.data as { message?: string } | undefined)
                ?.message || "Não foi possível excluir o cadastro.",
            )
          : "Não foi possível excluir o cadastro.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="crud-page">
      <section className="crud-page__heading">
        <div>
          <span className="dashboard__eyebrow">Gerenciamento</span>
          <h1>{config.title}</h1>
          <p>{config.description}</p>
        </div>

        <button
          className="primary-button"
          type="button"
          onClick={openCreateForm}
        >
          <Plus size={18} />
          Cadastrar {config.singular}
        </button>
      </section>

      {errorMessage && (
        <div className="crud-feedback crud-feedback--error" role="alert">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="crud-feedback crud-feedback--success" role="status">
          {successMessage}
        </div>
      )}

      <section className="crud-panel">
        <header className="crud-panel__toolbar">
          <div className="crud-search">
            <Search size={17} />
            <input
              type="search"
              placeholder={`Pesquisar ${config.title.toLocaleLowerCase("pt-BR")}...`}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <div className="crud-toolbar-meta">
            <span>
              {filteredEntities.length} de {entities.length} registros
            </span>

            <button
              className="icon-button"
              type="button"
              aria-label="Atualizar lista"
              onClick={() => void loadData()}
              disabled={loading}
            >
              <RefreshCw
                size={18}
                className={loading ? "icon-spinning" : ""}
              />
            </button>
          </div>
        </header>

        <div className="crud-table-wrapper">
          <table className="crud-table">
            <thead>
              <tr>
                <th>Cadastro</th>
                {config.fields.slice(1, 4).map((field) => (
                  <th key={field.key}>{field.label}</th>
                ))}
                <th className="crud-table__actions-heading">
                  <MoreHorizontal size={18} />
                </th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5}>
                    <div className="crud-empty-state">
                      <span className="route-loader__spinner" />
                      <p>Carregando registros...</p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && filteredEntities.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="crud-empty-state">
                      <UserRound size={30} />
                      <strong>Nenhum cadastro encontrado</strong>
                      <p>
                        Cadastre o primeiro registro ou altere sua pesquisa.
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                filteredEntities.map((entity) => (
                  <tr key={entity.id}>
                    <td>
                      <div className="crud-primary-cell">
                        <span className="crud-avatar">
                          {getEntityName(entity)
                            .split(" ")
                            .slice(0, 2)
                            .map((part) => part.charAt(0).toUpperCase())
                            .join("") || "CE"}
                        </span>

                        <div>
                          <strong>{getEntityName(entity)}</strong>
                          <small>
                            {getDisplayValue(entity, ["email", "code", "codigo"])}
                          </small>
                        </div>
                      </div>
                    </td>

                  {config.fields.slice(1, 4).map((field) => (
                  <td key={field.key}>
                    {field.key === "email" ? (
                      getDisplayValue(entity, ["email", "eMail", "userEmail"])
                    ) : field.key === "institutionId" ? (
                      getDisplayValue(entity, ["institutionId", "institution", "instituicao", "nomeInstituicao"])
                    ) : (
                      getDisplayValue(entity, [field.key, "disciplinas", "subject", "course", "curso", "disponibilidade"])
                    )}
                  </td>
                ))}

                    <td>
                      <div className="crud-row-actions">
                        <button
                          type="button"
                          aria-label="Editar"
                          onClick={() => openEditForm(entity)}
                        >
                          <Edit3 size={16} />
                        </button>

                        <button
                          className="crud-row-actions__delete"
                          type="button"
                          aria-label="Excluir"
                          onClick={() => setDeletingEntity(entity)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      <EntityFormModal
        open={formOpen}
        singular={config.singular}
        fields={config.fields}
        entity={editingEntity}
        submitting={submitting}
        onClose={() => {
          setFormOpen(false);
          setEditingEntity(null);
        }}
        onSubmit={handleSave}
      />

      <DeleteConfirmModal
        open={Boolean(deletingEntity)}
        singular={config.singular}
        entityName={deletingEntity ? getEntityName(deletingEntity) : ""}
        submitting={submitting}
        onClose={() => setDeletingEntity(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default EntityManager;
