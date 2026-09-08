import { z } from "zod";

import {
  compactSpaces,
  emailSchema,
  optionalPhoneSchema,
  personNameSchema,
  phoneSchema,
  referenceSchema,
  urlSchema,
} from "./common";

export const agencyProfileSchema = z.object({
  name: z
    .string()
    .transform(compactSpaces)
    .pipe(
      z
        .string()
        .min(2, "Indiquez le nom de l’agence.")
        .max(160, "Le nom de l’agence est trop long."),
    ),
  rccm: referenceSchema("Le RCCM"),
  email: emailSchema,
  phone: phoneSchema,
  city: z
    .string()
    .transform(compactSpaces)
    .pipe(z.string().min(2, "Indiquez la ville.")),
  address: z
    .string()
    .transform(compactSpaces)
    .pipe(z.string().min(4, "Indiquez l’adresse.").max(240, "L’adresse est trop longue.")),
  website: z
    .string()
    .optional()
    .transform((value) => String(value ?? "").trim())
    .pipe(z.union([z.literal(""), urlSchema])),
  managerName: personNameSchema("nom du responsable").or(z.literal("")),
  managerPhone: optionalPhoneSchema,
});
