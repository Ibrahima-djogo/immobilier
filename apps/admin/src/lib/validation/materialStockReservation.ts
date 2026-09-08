import { z } from "zod";

import { DEFAULT_RESERVATION_HOURS } from "@/lib/materiaux/reservations";

import { stockQuantitySchema } from "./materialStock";

export const materialStockReservationFormSchema = z.object({
  productId: z
    .string({ error: "Choisissez un matériau." })
    .trim()
    .min(1, "Choisissez un matériau."),
  quantity: stockQuantitySchema("La quantité").refine((value) => value > 0, {
    message: "La quantité réservée doit être strictement positive.",
  }),
  durationHours: z
    .union([z.string(), z.number()])
    .transform((value) => {
      const n = typeof value === "number" ? value : Number(value);
      return Number.isFinite(n) ? n : Number.NaN;
    })
    .refine((value) => Number.isInteger(value) && value > 0, {
      message: "Choisissez une durée d’expiration.",
    })
    .refine((value) => value <= 24 * 30, {
      message: "La durée d’expiration est trop longue.",
    })
    .catch(DEFAULT_RESERVATION_HOURS),
});
