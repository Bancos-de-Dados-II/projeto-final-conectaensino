import { api } from "../api/axios";
import type { CrudEntity } from "../types/crud";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function getCollection(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!isRecord(payload)) {
    return [];
  }

  const candidates = [
    payload.data,
    payload.items,
    payload.results,
    payload.students,
    payload.alunos,
    payload.monitors,
    payload.institutions,
    payload.instituicoes,
    payload.disciplinas,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }

    if (isRecord(candidate)) {
      const nested = getCollection(candidate);

      if (nested.length) {
        return nested;
      }
    }
  }

  return [];
}

function normalizeId(record: UnknownRecord, index = 0): string {
  const candidate =
    record.id ??
    record._id ??
    record.uuid ??
    record.user_id ??
    (isRecord(record.user) ? record.user.id : undefined);

  return typeof candidate === "string" || typeof candidate === "number"
    ? String(candidate)
    : `temporary-${index}`;
}

export function normalizeEntity(
  value: unknown,
  index = 0,
): CrudEntity | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    ...value,
    id: normalizeId(value, index),
  };
}

export async function listEntities(
  endpoint: string,
): Promise<CrudEntity[]> {
  const { data } = await api.get(endpoint);

  return getCollection(data)
    .map((item, index) => normalizeEntity(item, index))
    .filter((item): item is CrudEntity => item !== null);
}

export async function createEntity(
  endpoint: string,
  payload: Record<string, unknown>,
): Promise<CrudEntity> {
  const { data } = await api.post(endpoint, payload);
  const normalized = normalizeEntity(
    isRecord(data) && "data" in data ? data.data : data,
  );

  return normalized ?? {
    id: `created-${Date.now()}`,
    ...payload,
  };
}

export async function updateEntity(
  endpoint: string,
  id: string,
  payload: Record<string, unknown>,
): Promise<CrudEntity> {
  const { data } = await api.put(`${endpoint}/${id}`, payload);
  const normalized = normalizeEntity(
    isRecord(data) && "data" in data ? data.data : data,
  );

  return normalized ?? {
    id,
    ...payload,
  };
}

export async function deleteEntity(
  endpoint: string,
  id: string,
): Promise<void> {
  await api.delete(`${endpoint}/${id}`);
}
