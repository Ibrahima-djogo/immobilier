/**
 * Configuration géocodage / cartes — provider interchangeable.
 *
 * NEXT_PUBLIC_GEOCODER_PROVIDER=nominatim (défaut)
 *
 * Production : pour un trafic significatif, remplacer le Nominatim public
 * par une instance dédiée ou un fournisseur professionnel via cette config.
 */

export type GeocoderProvider = "nominatim";

export const MAPS_CONFIG = {
  provider: (process.env.NEXT_PUBLIC_GEOCODER_PROVIDER ||
    "nominatim") as GeocoderProvider,
  nominatim: {
    baseUrl:
      process.env.NEXT_PUBLIC_NOMINATIM_BASE_URL ||
      "https://nominatim.openstreetmap.org",
    userAgent:
      process.env.NEXT_PUBLIC_NOMINATIM_USER_AGENT ||
      "DemeureGuinee/1.0 (demo frontend; contact@demeureguinee.local)",
    countrycodes: "gn",
    searchLimit: 5,
    minIntervalMs: 1100,
  },
  osm: {
    tileUrl: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors · <a href="https://nominatim.org/">Nominatim</a>',
  },
  defaults: {
    /** Centre Guinée */
    center: { lat: 9.6412, lng: -13.5784 } as const,
    zoom: 12,
    selectZoom: 16,
  },
} as const;
