import { z } from "zod";

import {
  digitsOnly,
  optionalEmailSchema,
  optionalTrimmedText,
  personNameSchema,
  trimmedText,
} from "./common";

export const guineaPhoneSchema = z
  .string({ error: "Saisissez un numéro de téléphone." })
  .transform((value) => String(value ?? "").replace(/\s+/g, " ").trim())
  .pipe(
    z
      .string()
      .min(1, "Saisissez un numéro de téléphone.")
      .refine((value) => {
        const digits = digitsOnly(value);
        if (digits.startsWith("224")) {
          const local = digits.slice(3);
          return local.length >= 8 && local.length <= 9;
        }
        return digits.length >= 8 && digits.length <= 9;
      }, "Saisissez un numéro guinéen, par exemple +224 620 00 00 00."),
  );

export const checkoutDeliveryModeSchema = z.enum(
  ["RETRAIT_DEPOT", "LIVRAISON"],
  {
    error: "Choisissez le retrait au magasin ou la livraison à domicile.",
  },
);

export const checkoutCustomerSchema = z.object({
  nomComplet: personNameSchema("nom complet"),
  telephone: guineaPhoneSchema,
  email: optionalEmailSchema,
  ville: trimmedText("La ville", 2, 80),
  quartier: trimmedText("Le quartier", 2, 80),
  adresse: trimmedText("L’adresse", 5, 200),
  commentaire: optionalTrimmedText("Le commentaire", 500),
});

export const checkoutLookupSchema = z.object({
  reference: trimmedText("La référence", 6, 40),
  telephone: guineaPhoneSchema,
});

export type CheckoutCustomerInput = z.input<typeof checkoutCustomerSchema>;
export type CheckoutCustomer = z.output<typeof checkoutCustomerSchema>;
