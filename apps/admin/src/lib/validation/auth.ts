import { z } from "zod";

import {
  emailSchema,
  identifierSchema,
  isoDateSchema,
  optionalPhoneSchema,
  passwordSchema,
  personNameSchema,
  phoneSchema,
  strongPasswordSchema,
} from "./common";

export const loginSchema = z.object({
  identifier: identifierSchema,
  password: passwordSchema,
});

export const adminLoginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = z
  .object({
    firstName: personNameSchema("prénom"),
    lastName: personNameSchema("nom"),
    email: emailSchema,
    phone: phoneSchema,
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, "Confirmez votre mot de passe."),
    acceptTerms: z.literal(true, {
      error: "Vous devez accepter les conditions pour créer un compte.",
    }),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Les deux mots de passe ne correspondent pas.",
  });

export const forgotPasswordSchema = z.object({
  identifier: identifierSchema,
});

export const resetPasswordSchema = z
  .object({
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, "Confirmez votre mot de passe."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Les deux mots de passe ne correspondent pas.",
  });

export const profileSchema = z.object({
  firstName: personNameSchema("prénom"),
  lastName: personNameSchema("nom"),
  email: emailSchema,
  phone: phoneSchema,
  city: z.string().transform((value) => value.trim()).pipe(
    z.string().max(80, "La ville est trop longue."),
  ),
  neighborhood: z.string().transform((value) => value.trim()).pipe(
    z.string().max(80, "Le quartier est trop long."),
  ),
  bio: z.string().transform((value) => value.trim()).pipe(
    z
      .string()
      .max(220, "La présentation ne doit pas dépasser 220 caractères."),
  ),
});

export const changePasswordSchema = z
  .object({
    currentPassword: passwordSchema,
    newPassword: strongPasswordSchema,
    confirmPassword: z.string().min(1, "Confirmez votre mot de passe."),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Les deux mots de passe ne correspondent pas.",
  })
  .refine((value) => value.newPassword !== value.currentPassword, {
    path: ["newPassword"],
    message: "Le nouveau mot de passe doit être différent de l’ancien.",
  });

export const adminCreateSchema = z.object({
  name: personNameSchema("nom"),
  email: emailSchema,
  demoPassword: strongPasswordSchema,
});

export const adminProfileSchema = z.object({
  name: personNameSchema("nom"),
  phone: optionalPhoneSchema,
});

export const contactSchema = z.object({
  name: personNameSchema("nom"),
  email: emailSchema,
  phone: phoneSchema.or(z.literal("")),
  subject: z
    .string()
    .min(1, "Choisissez un sujet.")
    .refine(
      (value) =>
        [
          "Problème de compte",
          "Annonce ou recherche",
          "Demande de rôle",
          "Signalement",
          "Question juridique",
          "Autre demande",
        ].includes(value),
      "Choisissez un sujet dans la liste.",
    ),
  message: z
    .string()
    .transform((value) => value.trim())
    .pipe(
      z
        .string()
        .min(20, "Le message doit contenir au moins 20 caractères.")
        .max(2000, "Le message ne peut pas dépasser 2000 caractères."),
    ),
  consent: z.literal(true, {
    error: "Acceptez le traitement de vos informations pour envoyer la demande.",
  }),
});

export const visitSchema = z.object({
  name: personNameSchema("nom"),
  phone: phoneSchema,
  email: emailSchema.or(z.literal("")),
  date: isoDateSchema("la date de visite", { notPast: true }),
  timeSlot: z.string().min(1, "Choisissez un créneau."),
  message: z
    .string()
    .transform((value) => value.trim())
    .pipe(z.string().max(1000, "Le message est trop long.")),
});

export const visitRequestSchema = z.object({
  date: isoDateSchema("la date de visite", { notPast: true }),
  timeSlot: z.string().min(1, "Choisissez un créneau."),
  message: z
    .string()
    .transform((value) => value.trim())
    .pipe(
      z
        .string()
        .min(10, "Le message doit contenir au moins 10 caractères.")
        .max(1000, "Le message est trop long."),
    ),
});

export const reportSchema = z.object({
  reference: z
    .string()
    .transform((value) => value.trim())
    .pipe(
      z
        .string()
        .min(3, "Indiquez le lien ou la référence de l’annonce.")
        .max(240, "Cette référence est trop longue."),
    ),
  reason: z
    .string()
    .min(1, "Choisissez un motif.")
    .refine(
      (value) =>
        [
          "Contenu trompeur",
          "Fausse identité ou fraude présumée",
          "Prix incohérent",
          "Annonce dupliquée",
          "Contenu interdit ou dangereux",
          "Mauvaise catégorie",
          "Autre motif",
        ].includes(value),
      "Choisissez un motif dans la liste.",
    ),
  description: z
    .string()
    .transform((value) => value.trim())
    .pipe(
      z
        .string()
        .min(20, "Décrivez les faits en au moins 20 caractères.")
        .max(2000, "La description est trop longue."),
    ),
  email: emailSchema.or(z.literal("")),
  consent: z.literal(true, {
    error: "Confirmez que les informations fournies sont sincères.",
  }),
});
