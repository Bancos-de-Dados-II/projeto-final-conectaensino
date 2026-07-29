export type MapEntityType =
  | "monitor"
  | "institution";

export interface MapCoordinates {
  latitude: number;
  longitude: number;
}

export interface MapEntity {
  id: string;
  name: string;
  email?: string;
  type: MapEntityType;

  latitude: number;
  longitude: number;

  distanceKm?: number;
  institution?: string;
  subject?: string;
  rating?: number;
  available?: boolean;
  monitorCount?: number;

  address?: string;
  city?: string;

  raw?: unknown;
}

export interface NearbySearchParams {
  latitude: number;
  longitude: number;
  radiusKm?: number;
}
