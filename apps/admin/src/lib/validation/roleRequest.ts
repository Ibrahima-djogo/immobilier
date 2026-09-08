import { z } from "zod";

import {
  compactSpaces,
  emailSchema,
  isoDateSchema,
  personNameSchema,
  phoneSchema,
  referenceSchema,
} from "./common";

export const ROLE_OPTIONS = ["PROPRIETAIRE", "AGENCE"] as const;
export const ID_TYPES = ["CNI", "PASSEPORT", "PERMIS", "CARTE_CONSULAIRE", "AUTRE"] as const;

export const roleRequestIdentitySchema = z.object({
  lastName: personNameSchema("nom"),
  firstName: personNameSchema("prénom"),
  birthDate: isoDateSchema("la date de naissance", { notFuture: true }),
  nationality: z
    .string()
    .transform(compactSpaces)
    .pipe(z.string().min(2, "Indiquez la nationalité.")),
  email: emailSchema,
  phone: phoneSchema,
  idType: z
    .string()
    .min(1, "Choisissez le type de pièce.")
    .refine(
      (value) => ID_TYPES.includes(value as (typeof ID_TYPES)[number]) || value.length >= 2,
      "Choisissez un type de pièce valide.",
    ),
  idNumber: referenceSchema("Le numéro de pièce"),
});

export const roleRequestCompanySchema = z.object({
  companyName: z
    .string()
    .transform(compactSpaces)
    .pipe(
      z
        .string()
        .min(2, "Indiquez la raison sociale.")
        .max(160, "La raison sociale est trop longue."),
    ),
  rccm: referenceSchema("Le RCCM"),
});

export const roleRequestOwnerAddressSchema = z.object({
  address: z
    .string()
    .transform(compactSpaces)
    .pipe(z.string().min(4, "Indiquez l’adresse.").max(240, "L’adresse est trop longue.")),
  city: z
    .string()
    .transform(compactSpaces)
    .pipe(z.string().min(2, "Indiquez la ville.")),
  commune: z
    .string()
    .transform(compactSpaces)
    .pipe(z.string().min(2, "Indiquez la commune.")),
});

export const roleChoiceSchema = z.object({
  requestedRole: z.enum(ROLE_OPTIONS, {
    error: "Sélectionnez Propriétaire ou Agence.",
  }),
});
