import { z } from "zod";

export const cartQuantitySchema = z
  .string()
  .trim()
  .min(1, "Indiquez une quantité entière supérieure ou égale à 1.")
  .refine((value) => /^\d+$/.test(value), {
    message: "La quantité doit être un nombre.",
  })
  .transform((value) => Number(value))
  .refine((value) => Number.isInteger(value) && value >= 1, {
    message: "Indiquez une quantité entière supérieure ou égale à 1.",
  });
