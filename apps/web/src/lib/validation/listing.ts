import { z } from "zod";

import { compactSpaces, optionalIsoDateSchema, positiveAmountSchema } from "./common";

const RENT_PERIODS = ["MONTHLY", "QUARTERLY", "YEARLY", "OTHER"] as const;
const LAND_USES = [
  "AGRICULTURE",
  "COMMERCE",
  "STORAGE",
  "PARKING",
  "PROFESSIONAL",
  "EVENT",
  "OTHER",
] as const;

export const listingPriceSchema = positiveAmountSchema("Le prix", "GNF");
export const listingRentSchema = positiveAmountSchema("Le loyer", "GNF");
export const listingDepositSchema = positiveAmountSchema("La caution", "GNF");

export const listingTermsInputSchema = z.object({
  rentAmount: z.string().optional(),
  period: z.string().optional(),
  periodLabel: z.string().optional(),
  depositRequired: z.boolean().optional(),
  depositAmount: z.string().optional(),
  minimumDurationChoice: z.string().optional(),
  minimumDurationCustom: z.string().optional(),
  availableFrom: z.string().optional(),
  allowedUses: z.array(z.string()).optional(),
  allowedUsesOther: z.string().optional(),
  salePrice: z.string().optional(),
});

export function listingFieldMessages(input: {
  requireRent?: boolean;
  requirePeriod?: boolean;
  requireSalePrice?: boolean;
  requireAvailableFrom?: boolean;
  requireAllowedUses?: boolean;
  values: z.infer<typeof listingTermsInputSchema>;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  const values = input.values;

  if (input.requireRent) {
    const rent = listingRentSchema.safeParse(values.rentAmount);
    if (!rent.success) {
      errors.rentAmount =
        rent.error.issues[0]?.message ?? "Le loyer doit être supérieur à 0 GNF.";
    }
  }

  if (input.requirePeriod) {
    if (!values.period) errors.period = "Choisissez une périodicité.";
    else if (!RENT_PERIODS.includes(values.period as (typeof RENT_PERIODS)[number])) {
      errors.period = "Choisissez une périodicité dans la liste.";
    }
  }

  if (values.period === "OTHER" && !compactSpaces(values.periodLabel ?? "")) {
    errors.periodLabel = "Précisez la périodicité.";
  }

  if (values.depositRequired) {
    const deposit = listingDepositSchema.safeParse(values.depositAmount);
    if (!deposit.success) {
      errors.depositAmount =
        deposit.error.issues[0]?.message ??
        "La caution doit être supérieure à 0 GNF.";
    }
  }

  if (values.minimumDurationChoice === "OTHER") {
    const months = Number(String(values.minimumDurationCustom ?? "").trim());
    if (!Number.isInteger(months) || months <= 0) {
      errors.minimumDurationCustom = "Indiquez une durée minimale supérieure à 0.";
    }
  }

  if (input.requireAvailableFrom) {
    const date = optionalIsoDateSchema("La date de disponibilité").safeParse(
      values.availableFrom,
    );
    if (!values.availableFrom?.trim()) {
      errors.availableFrom = "Indiquez la date de disponibilité.";
    } else if (!date.success) {
      errors.availableFrom = "Indiquez une date de disponibilité valide.";
    }
  } else if (values.availableFrom?.trim()) {
    const date = optionalIsoDateSchema("La date de disponibilité").safeParse(
      values.availableFrom,
    );
    if (!date.success) {
      errors.availableFrom = "Indiquez une date de disponibilité valide.";
    }
  }

  if (input.requireAllowedUses && !(values.allowedUses || []).length) {
    errors.allowedUses = "Sélectionnez au moins un usage autorisé.";
  }
  for (const use of values.allowedUses || []) {
    if (!LAND_USES.includes(use as (typeof LAND_USES)[number])) {
      errors.allowedUses = "Un usage sélectionné n’est pas autorisé.";
    }
  }
  if (
    (values.allowedUses || []).includes("OTHER") &&
    !compactSpaces(values.allowedUsesOther ?? "")
  ) {
    errors.allowedUsesOther = "Précisez l’usage « Autre ».";
  }

  if (input.requireSalePrice) {
    const price = listingPriceSchema.safeParse(values.salePrice);
    if (!price.success) {
      errors.price =
        price.error.issues[0]?.message ?? "Le prix doit être supérieur à 0 GNF.";
    }
  }

  return errors;
}
