import { z } from 'zod';

const geoCoordinate = z.coerce.number();

export const GeoSearchSchema = z.object({
  lat: geoCoordinate.min(-90, 'A latitude deve estar entre -90 e 90.').max(90, 'A latitude deve estar entre -90 e 90.'),
  lng: geoCoordinate.min(-180, 'A longitude deve estar entre -180 e 180.').max(180, 'A longitude deve estar entre -180 e 180.'),
  raio: z.coerce.number().positive('O raio deve ser maior que zero.').optional(),
  radius: z.coerce.number().positive('O raio deve ser maior que zero.').optional(),
}).transform(({ lat, lng, raio, radius }) => ({
  lat,
  lng,
  raioKm: raio ?? radius ?? 10,
}));

export type GeoSearchQuery = z.output<typeof GeoSearchSchema>;