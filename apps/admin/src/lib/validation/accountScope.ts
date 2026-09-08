import { z } from "zod";

import { compactSpaces, positiveIntSchema } from "./common";
import { PROPERTY_OPERATIONS, PROPERTY_TYPES } from "./property";

export const accountScopeRequestSchema = z.object({
  requestedScopes: z
    .array(
      z.object({
        propertyType: z.enum(PROPERTY_TYPES),
        operations: z
          .array(z.enum(PROPERTY_OPERATIONS))
          .min(1, "Choisissez au moins une opération."),
      }),
    )
    .min(1, "Sélectionnez au moins un type de bien à ajouter."),
  reason: z
    .string()
    .optional()
    .transform((value) => compactSpaces(value ?? ""))
    .pipe(
      z
        .string()
        .max(500, "Le motif ne peut pas dépasser 500 caractères."),
    ),
});

export const platformSettingsSchema = z
  .object({
    minImages: positiveIntSchema("Le nombre minimal d’images", 50),
    maxImages: positiveIntSchema("Le nombre maximal d’images", 50),
    maxImageSize: positiveIntSchema("La taille maximale", 50),
    adDuration: positiveIntSchema("La durée de publication", 3650),
    contactsPerHour: positiveIntSchema("Le nombre de contacts", 1000),
    roleReviewDays: positiveIntSchema("Le délai de vérification", 365),
  })
  .superRefine((value, ctx) => {
    if (value.minImages > value.maxImages) {
      ctx.addIssue({
        code: "custom",
        path: ["maxImages"],
        message: "Le maximum d’images doit être supérieur ou égal au minimum.",
      });
    }
  });
