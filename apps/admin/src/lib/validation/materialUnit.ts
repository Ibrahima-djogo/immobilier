import { z } from "zod";

import { slugifyUnitName } from "@/lib/materiaux/units";

import { optionalTrimmedText, trimmedText } from "./common";

export const materialUnitNameSchema = trimmedText("Le nom", 1, 40).refine(
  (value) => slugifyUnitName(value).length >= 1,
  {
    message:
      "Le nom doit contenir des lettres ou des chiffres pour générer un slug.",
  },
);

export const materialUnitSymbolSchema = optionalTrimmedText("Le symbole", 16);

export const materialUnitFormSchema = z.object({
  name: materialUnitNameSchema,
  symbol: materialUnitSymbolSchema,
  active: z.boolean(),
});
