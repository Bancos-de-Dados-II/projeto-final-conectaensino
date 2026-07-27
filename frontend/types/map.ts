export type MapEntityType = "monitor" | "student";

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
  raw?: unknown;
}

export interface NearbySearchParams {
  latitude: number;
  longitude: number;
  radiusKm?: number;
}
