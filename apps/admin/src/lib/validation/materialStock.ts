import { z } from "zod";

import { optionalTrimmedText } from "./common";

export const MAX_STOCK_QUANTITY = 1_000_000_000;

export const stockQuantitySchema = (label: string) =>
  z
    .union([z.string(), z.number()])
    .transform((value) => {
      if (typeof value === "number") return value;
      const compact = String(value).replace(/\s/g, "").replace(",", ".");
      if (!compact) return Number.NaN;
      if (!/^\d+(\.\d+)?$/.test(compact)) return Number.NaN;
      return Number(compact);
    })
    .refine((value) => Number.isFinite(value), {
      message: `${label} doit être un nombre.`,
    })
    .refine((value) => value >= 0, {
      message: `${label} ne peut pas être négative.`,
    })
    .refine((value) => value <= MAX_STOCK_QUANTITY, {
      message: `${label} est trop élevée.`,
    });

export const materialStockFormSchema = z.object({
  quantity: stockQuantitySchema("La quantité"),
  minimumQuantity: stockQuantitySchema("Le seuil minimum"),
  location: optionalTrimmedText("La localisation", 120),
  active: z.boolean(),
});
