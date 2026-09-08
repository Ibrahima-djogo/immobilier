import { z } from "zod";

import {
  MATERIAL_SUPPLIER_TYPES,
  slugifySupplierName,
} from "@/lib/materiaux/suppliers";

import {
  MAX_TEXT,
  MAX_TITLE,
  allowedValue,
  optionalEmailSchema,
  optionalPhoneSchema,
  optionalTrimmedText,
  trimmedText,
} from "./common";

export const materialSupplierNameSchema = trimmedText(
  "Le nom",
  2,
  MAX_TITLE,
).refine((value) => slugifySupplierName(value).length >= 2, {
  message:
    "Le nom doit contenir des lettres ou des chiffres pour générer un slug.",
});

export const materialSupplierFormSchema = z.object({
  type: allowedValue(
    MATERIAL_SUPPLIER_TYPES,
    "Choisissez un type de fournisseur.",
  ),
  name: materialSupplierNameSchema,
  phone: optionalPhoneSchema,
  email: optionalEmailSchema,
  address: optionalTrimmedText("L’adresse", 160),
  city: optionalTrimmedText("La ville", 80),
  district: optionalTrimmedText("Le quartier", 80),
  description: optionalTrimmedText("La description", MAX_TEXT),
  active: z.boolean(),
});
