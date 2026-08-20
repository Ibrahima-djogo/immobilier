import { DEMO_API_URL } from "@/lib/demo-api/config";
import { demoApiFetch } from "@/lib/demo-api/client";
import { MAPS_CONFIG } from "@/lib/maps/config";

export type GeocodeResult = {
  id: string;
  lat: number;
  lng: number;
  displayName: string;
  shortLabel: string;
  city?: string;
  commune?: string;
  quarter?: string;
  country?: string;
};

type DemoGeocodeItem = {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  displayName: string;
  city?: string;
  commune?: string;
  quarter?: string;
  country?: string;
};

type NominatimItem = {
  place_id?: number | string;
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    suburb?: string;
    neighbourhood?: string;
    city_district?: string;
    country?: string;
  };
  error?: string;
};

type LocationContext = { city?: string; commune?: string; quarter?: string };

function mapDemoItem(item: DemoGeocodeItem): GeocodeResult {
  return {
    id: item.id,
    lat: item.latitude,
    lng: item.longitude,
    displayName: item.displayName,
    shortLabel: item.label,
    city: item.city,
    commune: item.commune,
    quarter: item.quarter,
    country: item.country,
  };
}

function mapNominatimItem(item: NominatimItem): GeocodeResult {
  const address = item.address ?? {};
  const city =
    address.city || address.town || address.village || address.state || "";
  const commune =
    address.municipality || address.county || address.city_district || "";
  const quarter = address.suburb || address.neighbourhood || "";
  const shortParts = [quarter, commune, city, address.country || "Guinée"]
    .filter(Boolean)
    .filter((value, index, arr) => arr.indexOf(value) === index);
  return {
    id: String(item.place_id ?? `${item.lat},${item.lon}`),
    lat: Number(item.lat),
    lng: Number(item.lon),
    displayName: item.display_name,
    shortLabel: shortParts.join(", ") || item.display_name,
    city: city || undefined,
    commune: commune || undefined,
    quarter: quarter || undefined,
    country: address.country,
  };
}

function foldAscii(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/’/g, "'");
}

export function buildContextualQuery(
  query: string,
  context?: LocationContext,
) {
  const parts = [
    query.trim(),
    context?.quarter?.trim(),
    context?.commune?.trim(),
    context?.city?.trim(),
    "Guinée",
  ].filter(Boolean);
  return parts.join(", ");
}

/**
 * Variantes progressives si Nominatim ne trouve rien avec le contexte complet.
 */
export function buildSearchQueryVariants(
  query: string,
  context?: LocationContext,
): string[] {
  const q = query.trim();
  if (!q) return [];
  const city = context?.city?.trim();
  const commune = context?.commune?.trim();
  const quarter = context?.quarter?.trim();
  const ascii = foldAscii(q);
  const variants: string[] = [];
  const push = (value?: string) => {
    const v = String(value || "").trim();
    if (!v) return;
    if (!variants.some((x) => x.toLowerCase() === v.toLowerCase())) {
      variants.push(v);
    }
  };

  push(buildContextualQuery(q, context));
  push([q, commune, city, "Guinée"].filter(Boolean).join(", "));
  push([q, city, "Guinée"].filter(Boolean).join(", "));
  push([q, "Conakry", "Guinée"].filter(Boolean).join(", "));
  push([q, "Guinée"].filter(Boolean).join(", "));
  push(q);
  if (ascii !== q) {
    push([ascii, city, "Guinée"].filter(Boolean).join(", "));
    push(ascii);
  }
  if (quarter) {
    push([q, quarter, "Conakry", "Guinée"].filter(Boolean).join(", "));
  }

  const hay = foldAscii(`${q} ${quarter || ""}`).toLowerCase();
  if (/lycee|francais|albert\s*camus/.test(hay)) {
    push("Lycée Français Albert Camus, Conakry, Guinée");
    push("Lycee Francais, Conakry, Guinée");
    push("Albert Camus, Conakry, Guinée");
    push("Ambassy of France, Conakry, Guinée");
  }

  return variants.slice(0, 8);
}

async function searchViaDemoApi(q: string): Promise<GeocodeResult[]> {
  const params = new URLSearchParams({ q, limit: "5", relax: "1" });
  const data = await demoApiFetch<DemoGeocodeItem[]>(
    `/geocoding/search?${params.toString()}`,
  );
  return (Array.isArray(data) ? data : []).map(mapDemoItem);
}

async function searchViaNominatimDirect(q: string): Promise<GeocodeResult[]> {
  const params = new URLSearchParams({
    format: "jsonv2",
    addressdetails: "1",
    countrycodes: MAPS_CONFIG.nominatim.countrycodes,
    limit: String(MAPS_CONFIG.nominatim.searchLimit),
    q,
  });
  const response = await fetch(
    `${MAPS_CONFIG.nominatim.baseUrl}/search?${params.toString()}`,
    { headers: { Accept: "application/json", "Accept-Language": "fr" } },
  );
  if (!response.ok) {
    throw new Error(`Géocodage indisponible (${response.status})`);
  }
  const data = (await response.json()) as NominatimItem[];
  return (Array.isArray(data) ? data : []).map(mapNominatimItem);
}

async function searchWithVariants(
  variants: string[],
  runner: (q: string) => Promise<GeocodeResult[]>,
): Promise<GeocodeResult[]> {
  let lastError: Error | null = null;
  for (const q of variants) {
    try {
      const found = await runner(q);
      if (found.length > 0) return found;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn("[geocoding] variant failed:", q, lastError.message);
    }
  }
  if (lastError && variants.length > 0) {
    // Toutes les variantes ont échoué techniquement
    throw lastError;
  }
  return [];
}

/**
 * Recherche de lieux via Demo API (proxy Nominatim),
 * variantes élargies + repli Nominatim direct navigateur.
 */
export async function searchPlaces(
  query: string,
  context?: LocationContext,
): Promise<GeocodeResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const variants = buildSearchQueryVariants(trimmed, context);

  try {
    const viaProxy = await searchWithVariants(variants, searchViaDemoApi);
    if (viaProxy.length > 0) return viaProxy;
  } catch (err) {
    console.warn("[geocoding] Demo API proxy failed, fallback Nominatim", err);
  }

  try {
    return await searchWithVariants(variants, searchViaNominatimDirect);
  } catch (fallbackErr) {
    throw fallbackErr instanceof Error
      ? fallbackErr
      : new Error(
          "La recherche de lieu a échoué. Vérifiez la Demo API (port 4000) et votre connexion.",
        );
  }
}

async function reverseViaDemoApi(
  lat: number,
  lng: number,
): Promise<GeocodeResult | null> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
  });
  const data = await demoApiFetch<DemoGeocodeItem | null>(
    `/geocoding/reverse?${params.toString()}`,
  );
  if (!data) return null;
  return mapDemoItem(data);
}

async function reverseViaNominatimDirect(
  lat: number,
  lng: number,
): Promise<GeocodeResult | null> {
  const params = new URLSearchParams({
    format: "jsonv2",
    addressdetails: "1",
    lat: String(lat),
    lon: String(lng),
  });
  const response = await fetch(
    `${MAPS_CONFIG.nominatim.baseUrl}/reverse?${params.toString()}`,
    { headers: { Accept: "application/json", "Accept-Language": "fr" } },
  );
  if (!response.ok) {
    throw new Error(`Géocodage inverse indisponible (${response.status})`);
  }
  const data = (await response.json()) as NominatimItem;
  if (!data || data.error || !data.lat) return null;
  return mapNominatimItem(data);
}

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<GeocodeResult | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  try {
    return await reverseViaDemoApi(lat, lng);
  } catch (err) {
    console.warn("[geocoding] reverse Demo API failed, fallback Nominatim", err);
    return reverseViaNominatimDirect(lat, lng);
  }
}

export function checkLocationConsistency(
  selected: LocationContext,
  geocoded?: {
    city?: string;
    commune?: string;
    quarter?: string;
    displayName?: string;
  } | null,
): boolean {
  if (!geocoded) return true;
  const haystack = [
    geocoded.city,
    geocoded.commune,
    geocoded.quarter,
    geocoded.displayName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const tokens = [selected.city, selected.commune, selected.quarter]
    .filter(Boolean)
    .map((value) =>
      String(value)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""),
    );

  if (tokens.length === 0) return true;
  if (selected.city) {
    const city = tokens[0];
    if (city && !haystack.includes(city)) return false;
  }
  return true;
}

export const geocodingService = {
  searchPlace: searchPlaces,
  reverseGeocode,
  buildContextualQuery,
  buildSearchQueryVariants,
  apiBase: DEMO_API_URL,
};
