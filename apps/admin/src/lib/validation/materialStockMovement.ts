import { z } from "zod";

import {
  MANUAL_STOCK_MOVEMENT_TYPES,
  isTargetQuantityType,
} from "@/lib/materiaux/movements";

import {
  allowedValue,
  optionalTrimmedText,
  trimmedText,
} from "./common";
import { stockQuantitySchema } from "./materialStock";

export const movementQuantitySchema = stockQuantitySchema("La quantité").refine(
  (value) => value > 0,
  { message: "La quantité du mouvement doit être strictement positive." },
);

export const materialStockMovementFormSchema = z
  .object({
    productId: z
      .string({ error: "Choisissez un matériau." })
      .trim()
      .min(1, "Choisissez un matériau."),
    type: allowedValue(
      MANUAL_STOCK_MOVEMENT_TYPES,
      "Choisissez un type de mouvement.",
    ),
    quantity: z.string().optional(),
    adjustmentTargetQuantity: z.string().optional(),
    reason: trimmedText("Le motif", 2, 120),
    note: optionalTrimmedText("La note", 500),
    supplierId: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (isTargetQuantityType(value.type)) {
      const parsed = stockQuantitySchema("La quantité constatée").safeParse(
        value.adjustmentTargetQuantity,
      );
      if (!parsed.success) {
        ctx.addIssue({
          code: "custom",
          path: ["adjustmentTargetQuantity"],
          message:
            parsed.error.issues[0]?.message ??
            "Indiquez la quantité constatée.",
        });
      }
      return;
    }

    const parsed = movementQuantitySchema.safeParse(value.quantity);
    if (!parsed.success) {
      ctx.addIssue({
        code: "custom",
        path: ["quantity"],
        message:
          parsed.error.issues[0]?.message ??
          "La quantité du mouvement doit être strictement positive.",
      });
    }
  });
