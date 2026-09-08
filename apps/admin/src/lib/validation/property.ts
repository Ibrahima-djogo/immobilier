import { z } from "zod";

import {
  compactSpaces,
  latitudeSchema,
  longitudeSchema,
  MAX_TITLE,
  positiveAmountSchema,
  positiveAreaSchema,
  positiveIntSchema,
  safeParseFields,
  trimmedText,
} from "./common";

export const PROPERTY_TYPES = [
  "VILLA",
  "APPARTEMENT",
  "MAISON",
  "TERRAIN",
  "BUREAU",
  "COMMERCE",
] as const;

export const PROPERTY_OPERATIONS = ["VENTE", "LOCATION"] as const;

export function roomsApply(type: string, kind: "bedrooms" | "bathrooms") {
  if (type === "TERRAIN") return false;
  if ((type === "BUREAU" || type === "COMMERCE") && kind === "bedrooms") {
    return false;
  }
  return true;
}

export const propertyLocationSchema = z.object({
  city: z
    .string()
    .transform(compactSpaces)
    .pipe(z.string().min(2, "Indiquez la ville.")),
  commune: z.string().transform(compactSpaces).optional(),
  quarter: z.string().transform(compactSpaces).optional(),
  landmark: z.string().transform(compactSpaces).optional(),
  latitude: latitudeSchema,
  longitude: longitudeSchema,
});

export function normalizeValidatedPropertyType(type: string): string {
  const raw = String(type || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (raw.includes("TERRAIN")) return "TERRAIN";
  if (raw.includes("APPART")) return "APPARTEMENT";
  if (raw.includes("VILLA")) return "VILLA";
  if (raw.includes("MAISON")) return "MAISON";
  if (raw.includes("BUREAU")) return "BUREAU";
  if (raw.includes("COMMERCE") || raw.includes("LOCAL")) return "COMMERCE";
  return raw;
}

export const propertyFormSchema = z
  .object({
    type: z.enum(PROPERTY_TYPES, {
      error: "Choisissez un type de bien.",
    }),
    operation: z.enum(PROPERTY_OPERATIONS, {
      error: "Choisissez une opération.",
    }),
    title: trimmedText("Le titre", 3, MAX_TITLE),
    price: positiveAmountSchema("Le prix", "GNF"),
    area: positiveAreaSchema,
    bedrooms: z.union([z.string(), z.number()]).optional(),
    bathrooms: z.union([z.string(), z.number()]).optional(),
    description: z
      .string()
      .transform(compactSpaces)
      .pipe(
        z
          .string()
          .max(4000, "La description ne peut pas dépasser 4000 caractères."),
      ),
    city: z
      .string()
      .transform(compactSpaces)
      .pipe(z.string().min(2, "Indiquez la ville.")),
    commune: z.string().optional(),
    quarter: z.string().optional(),
    landmark: z.string().optional(),
    latitude: latitudeSchema.optional(),
    longitude: longitudeSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (roomsApply(value.type, "bedrooms") && value.bedrooms !== "" && value.bedrooms != null) {
      const parsed = positiveIntSchema("Le nombre de chambres").safeParse(
        value.bedrooms,
      );
      if (!parsed.success) {
        ctx.addIssue({
          code: "custom",
          path: ["bedrooms"],
          message: parsed.error.issues[0]?.message ?? "Nombre de chambres invalide.",
        });
      }
    }
    if (roomsApply(value.type, "bathrooms") && value.bathrooms !== "" && value.bathrooms != null) {
      const parsed = positiveIntSchema("Le nombre de salles de bain").safeParse(
        value.bathrooms,
      );
      if (!parsed.success) {
        ctx.addIssue({
          code: "custom",
          path: ["bathrooms"],
          message:
            parsed.error.issues[0]?.message ?? "Nombre de salles de bain invalide.",
        });
      }
    }
  });

export type PropertyFormInput = z.input<typeof propertyFormSchema>;

export function validatePropertyPublish(input: {
  type: string;
  operation: string;
  title: string;
  price: string | number;
  area: string | number;
  bedrooms?: string | number;
  bathrooms?: string | number;
  description?: string;
  city?: string;
  commune?: string;
  quarter?: string;
  landmark?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
}) {
  const type = normalizeValidatedPropertyType(input.type);
  const operation =
    String(input.operation || "").toUpperCase() === "LOCATION"
      ? "LOCATION"
      : String(input.operation || "").toUpperCase() === "VENTE"
        ? "VENTE"
        : input.operation;
  return safeParseFields(propertyFormSchema, { ...input, type, operation });
}

export function propertyErrorStep(field: string): number {
  if (["type", "operation", "title", "price"].includes(field)) return 1;
  if (["city", "commune", "quarter", "landmark", "latitude", "longitude"].includes(field)) {
    return 2;
  }
  if (["area", "bedrooms", "bathrooms", "description"].includes(field)) return 3;
  return 1;
}
