import { z } from "zod";

import {
  optionalEmailSchema,
  optionalTrimmedText,
  personNameSchema,
  phoneSchema,
  safeParseFields,
  trimmedText,
} from "@/lib/validation/common";

import { FonciereRequestMode, type FonciereRequestMode as Mode } from "./types";

export const fonciereRequesterSchema = z.object({
  fullName: personNameSchema("nom complet"),
  phone: phoneSchema,
  email: optionalEmailSchema,
  city: trimmedText("la ville", 2, 80),
  message: optionalTrimmedText("Le message", 2000),
  requestMode: z.enum(
    [
      FonciereRequestMode.ORIENTATION_SERVICE,
      FonciereRequestMode.ACCOMPAGNEMENT_DEMEURE,
    ],
    { error: "Choisissez un mode d’accompagnement." },
  ),
});

export type FonciereRequesterFormValues = z.infer<
  typeof fonciereRequesterSchema
> & {
  requestMode: Mode;
};

export function parseFonciereRequesterForm(data: unknown) {
  return safeParseFields(fonciereRequesterSchema, data);
}
