"use client";

import { useEffect, useRef } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";

import { MAPS_CONFIG } from "@/lib/maps/config";

import "leaflet/dist/leaflet.css";
import styles from "./MapCanvas.module.css";

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

type MapCanvasProps = {
  latitude: number | null;
  longitude: number | null;
  centerLat: number;
  centerLng: number;
  zoom: number;
  readOnly?: boolean;
  onMapClick: (lat: number, lng: number) => void;
  onMarkerDragEnd: (lat: number, lng: number) => void;
};

/**
 * Recentre uniquement quand le parent demande un nouveau point
 * (recherche / clic / coords avancées) — jamais à chaque pan utilisateur.
 */
function MapController({
  centerLat,
  centerLng,
  zoom,
}: {
  centerLat: number;
  centerLng: number;
  zoom: number;
}) {
  const map = useMap();
  const lastApplied = useRef<{
    lat: number;
    lng: number;
    zoom: number;
  } | null>(null);

  useEffect(() => {
    const prev = lastApplied.current;
    const same =
      prev != null &&
      Math.abs(prev.lat - centerLat) < 1e-9 &&
      Math.abs(prev.lng - centerLng) < 1e-9 &&
      prev.zoom === zoom;
    if (same) return;

    lastApplied.current = { lat: centerLat, lng: centerLng, zoom };
    map.setView([centerLat, centerLng], zoom, { animate: true });
  }, [map, centerLat, centerLng, zoom]);

  return null;
}

/** Garantit pan / zoom actifs (édition et admin lecture seule). */
function MapInteractions() {
  const map = useMap();

  useEffect(() => {
    map.dragging.enable();
    map.touchZoom.enable();
    map.doubleClickZoom.enable();
    map.scrollWheelZoom.enable();
    map.boxZoom.enable();
    map.keyboard.enable();

    const invalidate = () => {
      map.invalidateSize({ animate: false });
      map.dragging.enable();
    };

    invalidate();
    const t = window.setTimeout(invalidate, 120);
    window.addEventListener("resize", invalidate);

    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", invalidate);
    };
  }, [map]);

  return null;
}

function ClickHandler({
  enabled,
  onMapClick,
}: {
  enabled: boolean;
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(event) {
      if (!enabled) return;
      // Leaflet n’émet déjà pas de click après un drag de carte significatif
      onMapClick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

export function MapCanvas({
  latitude,
  longitude,
  centerLat,
  centerLng,
  zoom,
  readOnly = false,
  onMapClick,
  onMarkerDragEnd,
}: MapCanvasProps) {
  const hasMarker =
    latitude !== null &&
    longitude !== null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  return (
    <MapContainer
      className={styles.map}
      center={[centerLat, centerLng]}
      zoom={zoom}
      dragging
      touchZoom
      doubleClickZoom
      scrollWheelZoom
      keyboard
      boxZoom
      style={{ width: "100%", height: "100%" }}
    >
      <TileLayer
        attribution={MAPS_CONFIG.osm.attribution}
        url={MAPS_CONFIG.osm.tileUrl}
      />
      <MapInteractions />
      <MapController centerLat={centerLat} centerLng={centerLng} zoom={zoom} />
      <ClickHandler enabled={!readOnly} onMapClick={onMapClick} />
      {hasMarker ? (
        <Marker
          position={[latitude!, longitude!]}
          icon={markerIcon}
          draggable={!readOnly}
          eventHandlers={{
            dragend: (event) => {
              if (readOnly) return;
              const marker = event.target as L.Marker;
              const pos = marker.getLatLng();
              onMarkerDragEnd(pos.lat, pos.lng);
            },
          }}
        />
      ) : null}
    </MapContainer>
  );
}
