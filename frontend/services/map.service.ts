import { api } from "../api/axios";
import type {
  MapEntity,
  MapEntityType,
  NearbySearchParams,
} from "../types/map";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (typeof value === "number") {
    return String(value);
  }

  return undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(",", "."));

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true" || value === 1 || value === "1") {
    return true;
  }

  if (value === "false" || value === 0 || value === "0") {
    return false;
  }

  return undefined;
}

function readNested(record: UnknownRecord, paths: string[]): unknown {
  for (const path of paths) {
    const keys = path.split(".");
    let current: unknown = record;

    for (const key of keys) {
      if (!isRecord(current) || !(key in current)) {
        current = undefined;
        break;
      }

      current = current[key];
    }

    if (current !== undefined && current !== null) {
      return current;
    }
  }

  return undefined;
}

function extractCollection(payload: unknown): unknown[] {
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
    payload.monitors,
    payload.monitor,
    payload.students,
    payload.alunos,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }

    if (isRecord(candidate)) {
      const nested = extractCollection(candidate);

      if (nested.length) {
        return nested;
      }
    }
  }

  return [];
}

function normalizeEntity(
  source: unknown,
  type: MapEntityType,
  index: number,
): MapEntity | null {
  if (!isRecord(source)) {
    return null;
  }

  const latitude = asNumber(
    readNested(source, [
      "latitude",
      "lat",
      "location.latitude",
      "location.lat",
      "localizacao.latitude",
      "coordinates.latitude",
      "address.latitude",
    ]),
  );

  const longitude = asNumber(
    readNested(source, [
      "longitude",
      "lng",
      "lon",
      "location.longitude",
      "location.lng",
      "localizacao.longitude",
      "coordinates.longitude",
      "address.longitude",
    ]),
  );

  if (latitude === undefined || longitude === undefined) {
    return null;
  }

  const id =
    asString(
      readNested(source, [
        "id",
        "_id",
        "user_id",
        "user.id",
        "profile.id",
      ]),
    ) || `${type}-${index}`;

  const name =
    asString(
      readNested(source, [
        "name",
        "nome",
        "full_name",
        "user.name",
        "user.nome",
        "profile.name",
        "user_metadata.name",
      ]),
    ) || (type === "monitor" ? "Monitor" : "Aluno");

  return {
    id,
    name,
    email: asString(readNested(source, ["email", "user.email"])),
    type,
    latitude,
    longitude,
    distanceKm: asNumber(
      readNested(source, [
        "distance",
        "distanceKm",
        "distance_km",
        "distancia",
        "distanciaKm",
      ]),
    ),
    institution: asString(
      readNested(source, [
        "institution.name",
        "institution",
        "instituicao.nome",
        "instituicao",
      ]),
    ),
    subject: asString(
      readNested(source, [
        "subject.name",
        "subject",
        "disciplina.nome",
        "disciplina",
        "specialty",
      ]),
    ),
    rating: asNumber(
      readNested(source, ["rating", "avaliacao", "average_rating"]),
    ),
    available: asBoolean(
      readNested(source, ["available", "disponivel", "is_available"]),
    ),
    raw: source,
  };
}

async function requestNearby(
  endpoint: string,
  type: MapEntityType,
  params: NearbySearchParams,
): Promise<MapEntity[]> {
  const { data } = await api.get(endpoint, {
    params: {
      latitude: params.latitude,
      longitude: params.longitude,
      lat: params.latitude,
      lng: params.longitude,
      radius: params.radiusKm,
      raio: params.radiusKm,
    },
  });

  return extractCollection(data)
    .map((item, index) => normalizeEntity(item, type, index))
    .filter((item): item is MapEntity => item !== null);
}

export function getNearbyMonitors(
  params: NearbySearchParams,
): Promise<MapEntity[]> {
  return requestNearby("/monitors/nearby", "monitor", params);
}

export function getNearbyStudents(
  params: NearbySearchParams,
): Promise<MapEntity[]> {
  return requestNearby("/students/proximos", "student", params);
}
