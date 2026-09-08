import { z } from "zod";

import { slugifyCategoryName } from "@/lib/materiaux/categories";

import {
  MAX_PRICE,
  MAX_TEXT,
  MAX_TITLE,
  optionalTrimmedText,
  trimmedText,
} from "./common";

export const materialProductNameSchema = trimmedText(
  "Le nom",
  2,
  MAX_TITLE,
).refine((value) => slugifyCategoryName(value).length >= 2, {
  message:
    "Le nom doit contenir des lettres ou des chiffres pour générer un slug.",
});

export const catalogPriceSchema = z
  .union([z.string(), z.number()])
  .transform((value) => {
    if (typeof value === "number") return value;
    const compact = String(value).replace(/\s/g, "").replace(",", ".");
    if (!compact) return Number.NaN;
    if (!/^\d+(\.\d+)?$/.test(compact)) return Number.NaN;
    return Number(compact);
  })
  .refine((value) => Number.isFinite(value), {
    message: "Le prix doit être un nombre.",
  })
  .refine((value) => value >= 0, {
    message: "Le prix doit être supérieur ou égal à 0 GNF.",
  })
  .refine((value) => value <= MAX_PRICE, {
    message: "Le prix est trop élevé.",
  });

export const materialProductFormSchema = z.object({
  name: materialProductNameSchema,
  categoryId: z
    .string({ error: "Choisissez une catégorie." })
    .trim()
    .min(1, "Choisissez une catégorie."),
  brand: optionalTrimmedText("La marque", 80),
  reference: optionalTrimmedText("La référence", 80),
  description: optionalTrimmedText("La description", MAX_TEXT),
  unit: z
    .string({ error: "Choisissez une unité de vente." })
    .trim()
    .min(1, "Choisissez une unité de vente."),
  supplierId: z
    .string()
    .optional()
    .transform((value) => (value ?? "").trim()),
  price: catalogPriceSchema,
  imageUrl: z.string().optional(),
  active: z.boolean(),
});
