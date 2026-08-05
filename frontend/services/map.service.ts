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
    payload.entities,
    payload.results,
    payload.monitors,
    payload.monitor,
    payload.institutions,
    payload.institution,
    payload.instituicoes,
    payload.instituicao,
    payload.schools,
    payload.school,
    payload.escolas,
    payload.escola,
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
      "localizacao.lat",
      "coordinates.latitude",
      "coordinates.lat",
      "address.latitude",
      "address.lat",
      "endereco.latitude",
      "endereco.lat",
    ]),
  );

  const longitude = asNumber(
    readNested(source, [
      "longitude",
      "lng",
      "lon",
      "location.longitude",
      "location.lng",
      "location.lon",
      "localizacao.longitude",
      "localizacao.lng",
      "localizacao.lon",
      "coordinates.longitude",
      "coordinates.lng",
      "coordinates.lon",
      "address.longitude",
      "address.lng",
      "address.lon",
      "endereco.longitude",
      "endereco.lng",
      "endereco.lon",
    ]),
  );

  const locationCoordinates = readNested(source, [
    "location.coordinates",
    "localizacao.coordinates",
    "coordinates",
  ]);

  const parsedCoordinates =
    Array.isArray(locationCoordinates) && locationCoordinates.length >= 2
      ? [locationCoordinates[1], locationCoordinates[0]]
      : undefined;

  const resolvedLatitude = latitude ?? asNumber(parsedCoordinates?.[0]);
  const resolvedLongitude = longitude ?? asNumber(parsedCoordinates?.[1]);

  if (resolvedLatitude === undefined || resolvedLongitude === undefined) {
    return null;
  }

  const id =
    asString(
      readNested(source, [
        "id",
        "_id",
        "uuid",
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
        "title",
        "razao_social",
        "fantasy_name",
        "nome_fantasia",
        "full_name",
        "user.name",
        "user.nome",
        "profile.name",
        "user_metadata.name",
      ]),
    ) || (type === "monitor" ? "Monitor" : "Instituição");

  return {
    id,
    name,
    email: asString(
      readNested(source, [
        "email",
        "contact_email",
        "contato.email",
        "user.email",
      ]),
    ),
    type,
    latitude: resolvedLatitude,
    longitude: resolvedLongitude,
    distanceKm: asNumber(
      readNested(source, [
        "distance",
        "distanceKm",
        "distance_km",
        "distancia",
        "distanciaKm",
        "distancia_km",
      ]),
    ),
    institution:
      type === "institution"
        ? name
        : asString(
            readNested(source, [
              "institution.name",
              "institution.nome",
              "institution",
              "instituicao.nome",
              "instituicao.name",
              "instituicao",
              "school.name",
              "school.nome",
              "escola.nome",
            ]),
          ),
    subject: asString(
      readNested(source, [
        "subject.name",
        "subject.nome",
        "subject",
        "disciplina.nome",
        "disciplina.name",
        "disciplina",
        "specialty",
        "especialidade",
      ]),
    ),
    rating: asNumber(
      readNested(source, [
        "rating",
        "avaliacao",
        "average_rating",
        "media_avaliacao",
      ]),
    ),
    available: asBoolean(
      readNested(source, [
        "available",
        "disponivel",
        "is_available",
        "ativo",
        "active",
      ]),
    ),
    monitorCount: asNumber(
      readNested(source, [
        "monitorCount",
        "monitor_count",
        "totalMonitors",
        "total_monitors",
      ]),
    ),
    relatedCount: asNumber(readNested(source, ["relatedCount", "related_count"])),
    relatedType: asString(readNested(source, ["relatedType", "related_type"])),
    address: asString(
      readNested(source, [
        "address",
        "address.street",
        "endereco",
        "endereco.logradouro",
        "logradouro",
        "street",
      ]),
    ),
    city: asString(
      readNested(source, [
        "city",
        "cidade",
        "municipio",
        "address.city",
        "endereco.cidade",
      ]),
    ),
    raw: source,
  };
}

export async function getNearbyInstitutions(
  params: NearbySearchParams,
): Promise<MapEntity[]> {
  const { data } = await api.get("/institutions/nearby", {
    params: {
      latitude: params.latitude,
      longitude: params.longitude,
      lat: params.latitude,
      lng: params.longitude,
      radiusKm: params.radiusKm,
    },
  });

  return extractCollection(data)
    .map((item, index) => normalizeEntity(item, "institution", index))
    .filter((item): item is MapEntity => item !== null);
}

export async function getInstitutions(): Promise<MapEntity[]> {
  const { data } = await api.get("/institutions");

  return extractCollection(data)
    .map((item, index) => normalizeEntity(item, "institution", index))
    .filter((item): item is MapEntity => item !== null);
}

export async function getAdminInstitutions(): Promise<MapEntity[]> {
  const { data } = await api.get('/admins/institutions');
  return extractCollection(data)
    .map((item, index) => normalizeEntity(item, 'institution', index))
    .filter((item): item is MapEntity => item !== null);
}

export type AdminMapFilter = 'all' | 'students' | 'monitors' | 'directors';

export async function getAdminMapEntities(filter: AdminMapFilter): Promise<MapEntity[]> {
  const { data } = await api.get('/admins/map', { params: { filter } });
  return extractCollection(data)
    .map((item, index) => {
      const sourceType = isRecord(item) ? asString(item.type) : undefined;
      const type: MapEntityType = sourceType === 'student' || sourceType === 'director' || sourceType === 'monitor'
        ? sourceType
        : 'institution';
      return normalizeEntity(item, type, index);
    })
    .filter((item): item is MapEntity => item !== null);
}
