import { z } from "zod";

import { slugifyCategoryName } from "@/lib/materiaux/categories";

import { trimmedText } from "./common";

export const materialCategoryNameSchema = trimmedText("Le nom", 2, 80).refine(
  (value) => slugifyCategoryName(value).length >= 2,
  {
    message:
      "Le nom doit contenir des lettres ou des chiffres pour générer un slug.",
  },
);

export const materialCategoryFormSchema = z.object({
  name: materialCategoryNameSchema,
  active: z.boolean(),
});
