export interface CitySearchResult {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
  addresstype?: string;
}

const CITY_TYPES = new Set([
  "city",
  "town",
  "municipality",
  "village",
  "administrative",
]);

export async function searchCities(
  query: string,
): Promise<CitySearchResult[]> {
  const normalizedQuery = query.trim();

  if (normalizedQuery.length < 2) {
    return [];
  }

  const params = new URLSearchParams({
    q: `${normalizedQuery}, Brasil`,
    format: "jsonv2",
    addressdetails: "1",
    countrycodes: "br",
    limit: "8",
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${params.toString()}`,
    {
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error("Não foi possível consultar as cidades.");
  }

  const results = (await response.json()) as NominatimResult[];
  const cityResults = results.filter((result) =>
    CITY_TYPES.has(result.addresstype ?? result.type ?? ""),
  );
  const selectedResults = cityResults.length > 0 ? cityResults : results;

  return selectedResults.flatMap((result) => {
    const latitude = Number(result.lat);
    const longitude = Number(result.lon);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return [];
    }

    return [
      {
        id: String(result.place_id),
        name: result.display_name,
        latitude,
        longitude,
      },
    ];
  });
}
