import type { DemoProperty } from "@/lib/demo-api/listings";
import type { PropertyLocationValue } from "@/components/property/PropertyLocationMap";
import { propertyLocationLabel as buildLocationLabel } from "@/lib/property/display";

export function demoPropertyLocation(p: DemoProperty): PropertyLocationValue {
  return {
    city: p.city || "",
    commune: p.commune || "",
    quarter: p.district || "",
    landmark: p.landmark || "",
    latitude: p.coordinates?.lat ?? null,
    longitude: p.coordinates?.lng ?? null,
    locationLabel: p.locationLabel ?? null,
    locationDisplayName: p.locationLabel ?? null,
    locationConfirmed: Boolean(p.locationConfirmed),
  };
}

export function demoPropertyLocationLabel(p: DemoProperty): string {
  return buildLocationLabel(p) || "Non renseigné";
}

export function buildPropertyApiPayload(input: {
  title: string;
  typeLabel: string;
  operation: string;
  price: number;
  area: number;
  bedrooms: number | null;
  bathrooms: number | null;
  description: string;
  images: string[];
  videos: unknown[];
  location: PropertyLocationValue;
  status: "ACTIF" | "BROUILLON";
  ownerId?: string | null;
  agencyId?: string | null;
  mandateType?: string | null;
  clientDisplayName?: string | null;
  clientReference?: string | null;
  completeness?: number;
}) {
  const { location } = input;
  return {
    title: input.title,
    type: input.typeLabel,
    operation: input.operation,
    price: input.price,
    area: input.area,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    description: input.description,
    images: input.images,
    videos: input.videos,
    city: location.city,
    commune: location.commune,
    district: location.quarter,
    landmark: location.landmark,
    latitude: location.latitude,
    longitude: location.longitude,
    coordinates:
      location.latitude != null && location.longitude != null
        ? { lat: location.latitude, lng: location.longitude }
        : null,
    locationLabel: location.locationLabel || demoLabelFromLocation(location),
    adminAddress: [location.quarter, location.commune, location.city]
      .filter(Boolean)
      .join(", "),
    locationConfirmed: location.locationConfirmed,
    status: input.status,
    ownerId: input.ownerId ?? null,
    agencyId: input.agencyId ?? null,
    mandateType: input.mandateType ?? null,
    clientDisplayName: input.clientDisplayName ?? null,
    clientReference: input.clientReference ?? null,
    completeness: input.completeness ?? 0,
  };
}

export function logPropertyTrace(stage: string, data: unknown) {
  console.log(stage, data);
}

export function compactDefined<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined),
  ) as T;
}

function demoLabelFromLocation(location: PropertyLocationValue) {
  return (
    [location.quarter, location.commune, location.city]
      .filter(Boolean)
      .join(", ") || location.city
  );
}
