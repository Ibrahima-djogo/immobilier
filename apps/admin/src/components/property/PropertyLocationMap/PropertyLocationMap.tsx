"use client";

import dynamic from "next/dynamic";
import {
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Search,
  Trash2,
} from "lucide-react";
import {
  useCallback,
  useMemo,
  useState,
} from "react";

import { MAPS_CONFIG } from "@/lib/maps/config";
import { displayValue } from "@/lib/property/display";
import {
  checkLocationConsistency,
  reverseGeocode,
  searchPlaces,
  type GeocodeResult,
} from "@/lib/maps/geocoding";
import {
  getCityNames,
  getCommunesForCity,
  getQuartersForCommune,
} from "@/lib/maps/locations";
import styles from "./PropertyLocationMap.module.css";

const MapCanvas = dynamic(
  () => import("./MapCanvas").then((mod) => mod.MapCanvas),
  {
    ssr: false,
    loading: () => (
      <div style={{ height: "100%", display: "grid", placeItems: "center" }}>
        Chargement de la carte…
      </div>
    ),
  },
);

export type PropertyLocationValue = {
  city: string;
  commune: string;
  quarter: string;
  landmark: string;
  latitude: number | null;
  longitude: number | null;
  locationLabel: string | null;
  locationDisplayName: string | null;
  locationConfirmed: boolean;
};

type PropertyLocationMapProps = {
  value: PropertyLocationValue;
  onChange: (next: PropertyLocationValue) => void;
  /** Mode lecture seule (admin) */
  readOnly?: boolean;
};

function mergeGeocodeFields(
  current: PropertyLocationValue,
  geo?: {
    city?: string;
    commune?: string;
    quarter?: string;
    shortLabel?: string;
    displayName?: string;
  } | null,
): PropertyLocationValue {
  if (!geo) return current;
  return {
    ...current,
    city: current.city.trim() || geo.city || current.city,
    commune: current.commune.trim() || geo.commune || current.commune,
    quarter: current.quarter.trim() || geo.quarter || current.quarter,
    locationLabel: geo.shortLabel || current.locationLabel,
    locationDisplayName: geo.displayName || current.locationDisplayName,
  };
}

export function PropertyLocationMap({
  value,
  onChange,
  readOnly = false,
}: PropertyLocationMapProps) {
  const cities = useMemo(() => getCityNames(), []);
  const communes = useMemo(
    () => getCommunesForCity(value.city),
    [value.city],
  );
  const quarters = useMemo(
    () => getQuartersForCommune(value.city, value.commune),
    [value.city, value.commune],
  );

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [reversing, setReversing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consistencyWarning, setConsistencyWarning] = useState(false);
  const [mapCenter, setMapCenter] = useState({
    lat: value.latitude ?? MAPS_CONFIG.defaults.center.lat,
    lng: value.longitude ?? MAPS_CONFIG.defaults.center.lng,
  });
  const [mapZoom, setMapZoom] = useState<number>(
    value.latitude != null ? MAPS_CONFIG.defaults.selectZoom : MAPS_CONFIG.defaults.zoom,
  );
  const [advancedLat, setAdvancedLat] = useState(
    value.latitude != null ? String(value.latitude) : "",
  );
  const [advancedLng, setAdvancedLng] = useState(
    value.longitude != null ? String(value.longitude) : "",
  );

  const patch = useCallback(
    (partial: Partial<PropertyLocationValue>) => {
      onChange({ ...value, ...partial });
    },
    [onChange, value],
  );

  function onCityChange(city: string) {
    const nextCommunes = getCommunesForCity(city);
    const communeOk = nextCommunes.includes(value.commune);
    const nextCommune = communeOk ? value.commune : "";
    patch({
      city,
      commune: nextCommune,
      // Quartier libre : on conserve la saisie manuelle.
    });
  }

  function onCommuneChange(commune: string) {
    patch({ commune });
  }

  async function runSearch() {
    if (readOnly) return;
    setError(null);
    setSearching(true);
    try {
      const found = await searchPlaces(query, {
        city: value.city,
        commune: value.commune,
        quarter: value.quarter,
      });
      setResults(found);
      if (found.length === 0) {
        setError("Aucun lieu trouvé en Guinée pour cette recherche.");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "La recherche de lieu a échoué. Réessayez dans un instant.",
      );
    } finally {
      setSearching(false);
    }
  }

  async function applyCoordinates(
    lat: number,
    lng: number,
    options?: {
      zoom?: number;
      provisionalLabel?: string;
      base?: PropertyLocationValue;
    },
  ) {
    const source = options?.base ?? value;
    setMapCenter({ lat, lng });
    setMapZoom(options?.zoom ?? MAPS_CONFIG.defaults.selectZoom);
    const pending: PropertyLocationValue = {
      ...source,
      latitude: lat,
      longitude: lng,
      locationConfirmed: false,
      locationLabel: options?.provisionalLabel ?? source.locationLabel,
      locationDisplayName:
        options?.provisionalLabel ?? source.locationDisplayName,
    };
    onChange(pending);
    setAdvancedLat(String(lat));
    setAdvancedLng(String(lng));
    setConsistencyWarning(false);
    setReversing(true);
    try {
      const reversed = await reverseGeocode(lat, lng);
      if (reversed) {
        const consistent = checkLocationConsistency(
          {
            city: pending.city,
            commune: pending.commune,
            quarter: pending.quarter,
          },
          reversed,
        );
        setConsistencyWarning(!consistent);
        onChange(
          mergeGeocodeFields(
            {
              ...pending,
              locationLabel: reversed.shortLabel,
              locationDisplayName: reversed.displayName,
            },
            reversed,
          ),
        );
      }
    } catch {
      // reverse optional for UX — keep coords
    } finally {
      setReversing(false);
    }
  }

  function selectResult(result: GeocodeResult) {
    const merged = mergeGeocodeFields(value, result);
    onChange(merged);
    void applyCoordinates(result.lat, result.lng, {
      zoom: MAPS_CONFIG.defaults.selectZoom,
      provisionalLabel: result.shortLabel,
      base: merged,
    });
  }

  function confirmLocation() {
    if (value.latitude == null || value.longitude == null) return;
    patch({ locationConfirmed: true });
    setConsistencyWarning(false);
  }

  function clearLocation() {
    patch({
      latitude: null,
      longitude: null,
      locationLabel: null,
      locationDisplayName: null,
      locationConfirmed: false,
    });
    setResults([]);
    setConsistencyWarning(false);
    setAdvancedLat("");
    setAdvancedLng("");
    setMapZoom(MAPS_CONFIG.defaults.zoom);
  }

  function applyAdvancedCoords() {
    const lat = Number(advancedLat);
    const lng = Number(advancedLng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setError("Coordonnées invalides.");
      return;
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setError("Coordonnées hors plage.");
      return;
    }
    setError(null);
    void applyCoordinates(lat, lng);
  }

  return (
    <section className={styles.section} aria-label="Position précise du bien">
      <div>
        <p className={styles.eyebrow}>Localisation</p>
        <h3 className={styles.title}>Position précise du bien</h3>
        <p className={styles.lead}>
          Recherchez un lieu ou placez directement le marqueur sur la parcelle.
          La position enregistrée concerne uniquement le bien, jamais celle de
          l’utilisateur.
        </p>
      </div>

      {!readOnly ? (
        <div className={styles.fields}>
          <label>
            Ville
            <select
              value={value.city}
              onChange={(e) => onCityChange(e.target.value)}
            >
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </label>
          <label>
            Commune
            <select
              value={value.commune}
              onChange={(e) => onCommuneChange(e.target.value)}
            >
              <option value="">Sélectionner…</option>
              {communes.map((commune) => (
                <option key={commune} value={commune}>
                  {commune}
                </option>
              ))}
            </select>
          </label>
          <label>
            Quartier
            <select
              value={value.quarter}
              onChange={(e) => patch({ quarter: e.target.value })}
              disabled={!value.commune}
            >
              <option value="">Sélectionner…</option>
              {quarters.map((quarter) => (
                <option key={quarter} value={quarter}>
                  {quarter}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.full}>
            Repère / indication
            <textarea
              value={value.landmark}
              onChange={(e) => patch({ landmark: e.target.value })}
              placeholder="Ex. à 100 m de la station, deuxième rue à droite…"
            />
          </label>
        </div>
      ) : (
        <div className={styles.fields}>
          <div>
            <small>Ville</small>
            <strong>{displayValue(value.city)}</strong>
          </div>
          <div>
            <small>Commune</small>
            <strong>{displayValue(value.commune)}</strong>
          </div>
          <div>
            <small>Quartier</small>
            <strong>{displayValue(value.quarter)}</strong>
          </div>
          <div className={styles.full}>
            <small>Repère</small>
            <strong>{displayValue(value.landmark)}</strong>
          </div>
        </div>
      )}

      {!readOnly ? (
        <div className={styles.searchBlock}>
          <label htmlFor="property-place-search">
            Rechercher un lieu, une rue ou un repère
          </label>
          <div className={styles.searchRow}>
            <input
              id="property-place-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void runSearch();
                }
              }}
              placeholder="Ex. école Kipé, mosquée, station…"
              autoComplete="off"
            />
            <button
              type="button"
              disabled={searching || !query.trim()}
              onClick={() => void runSearch()}
            >
              <Search size={15} aria-hidden="true" />
              {searching ? "Recherche…" : "Rechercher"}
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      {results.length > 0 && !readOnly ? (
        <ul className={styles.results} aria-label="Résultats de recherche">
          {results.map((result, index) => (
            <li key={result.id}>
              <div>
                <strong>
                  {index + 1}. {result.shortLabel}
                </strong>
                <small>{result.displayName}</small>
              </div>
              <button
                type="button"
                className={styles.ghostBtn}
                onClick={() => selectResult(result)}
              >
                Voir sur la carte
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className={styles.mapFrame}>
        {value.latitude == null && value.longitude == null && readOnly ? (
          <div
            style={{
              height: "100%",
              display: "grid",
              placeItems: "center",
              color: "#647169",
              fontSize: "0.82rem",
              padding: "1rem",
              textAlign: "center",
            }}
          >
            Position précise non renseignée
          </div>
        ) : (
          <MapCanvas
            latitude={value.latitude}
            longitude={value.longitude}
            centerLat={mapCenter.lat}
            centerLng={mapCenter.lng}
            zoom={mapZoom}
            readOnly={readOnly}
            onMapClick={(lat, lng) => {
              void applyCoordinates(lat, lng);
            }}
            onMarkerDragEnd={(lat, lng) => {
              void applyCoordinates(lat, lng);
            }}
          />
        )}
      </div>
      <p className={styles.mapHint}>
        {readOnly
          ? "Carte de contrôle — lecture seule."
          : "Cliquez sur la carte ou déplacez le marqueur pour ajuster le point exact du bien."}
      </p>

      {value.latitude != null && value.longitude != null ? (
        <div className={styles.selection}>
          <div className={styles.selectionHeader}>
            <MapPin size={16} aria-hidden="true" />
            <div>
              <div>
                {reversing
                  ? "Identification du lieu…"
                  : value.locationLabel || "Position sélectionnée"}
              </div>
              {value.locationDisplayName &&
              value.locationDisplayName !== value.locationLabel ? (
                <small style={{ color: "#647169", fontWeight: 500 }}>
                  {value.locationDisplayName}
                </small>
              ) : null}
            </div>
          </div>

          {!value.locationConfirmed && !readOnly ? (
            <p className={styles.mapHint}>
              Vérifiez que le marqueur correspond bien à l’emplacement réel du
              bien. Nominatim indique un lieu proche, pas une preuve du bien.
            </p>
          ) : null}

          {value.locationConfirmed ? (
            <span className={styles.confirmed}>
              <CheckCircle2 size={16} aria-hidden="true" />
              {readOnly
                ? "Position confirmée par l’annonceur"
                : "Emplacement du bien confirmé"}
            </span>
          ) : null}

          <div className={styles.coords}>
            <span>Latitude : {value.latitude.toFixed(6)}</span>
            <span>Longitude : {value.longitude.toFixed(6)}</span>
          </div>

          {!readOnly ? (
            <div className={styles.actions}>
              {!value.locationConfirmed ? (
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={confirmLocation}
                >
                  Confirmer cet emplacement
                </button>
              ) : null}
              <button
                type="button"
                className={styles.dangerBtn}
                onClick={clearLocation}
              >
                <Trash2 size={14} aria-hidden="true" />
                Effacer la position
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {consistencyWarning && !readOnly ? (
        <div className={styles.warning} role="status">
          <p>
            <AlertTriangle size={15} aria-hidden="true" />
            Vérifiez la localisation — la position choisie semble différente de
            la ville/commune renseignée.
          </p>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.ghostBtn}
              onClick={() => setConsistencyWarning(false)}
            >
              Modifier la carte
            </button>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => {
                setConsistencyWarning(false);
                confirmLocation();
              }}
            >
              Conserver cette position
            </button>
          </div>
        </div>
      ) : null}

      {!readOnly ? (
        <details className={styles.advanced}>
          <summary>Options avancées — je connais les coordonnées</summary>
          <div className={styles.advancedBody}>
            <label>
              Latitude
              <input
                value={advancedLat}
                onChange={(e) => setAdvancedLat(e.target.value)}
                inputMode="decimal"
                placeholder="9.64"
              />
            </label>
            <label>
              Longitude
              <input
                value={advancedLng}
                onChange={(e) => setAdvancedLng(e.target.value)}
                inputMode="decimal"
                placeholder="-13.57"
              />
            </label>
            <button
              type="button"
              className={styles.ghostBtn}
              onClick={applyAdvancedCoords}
            >
              Positionner sur la carte
            </button>
          </div>
        </details>
      ) : null}

      <p className={styles.attribution}>
        Données cartographiques{" "}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
        >
          © OpenStreetMap
        </a>
        {" · "}
        géocodage{" "}
        <a href="https://nominatim.org/" target="_blank" rel="noreferrer">
          Nominatim
        </a>
        . Usage démo conforme à la politique publique — un fournisseur dédié
        sera requis en production à trafic élevé.
      </p>
    </section>
  );
}
