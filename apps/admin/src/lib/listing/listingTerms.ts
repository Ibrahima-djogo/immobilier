/**
 * Conditions commerciales d'une annonce (Listing).
 *
 * Property = caractéristiques permanentes du bien.
 * Listing  = conditions commerciales de publication → ce module.
 *
 * Le formulaire de publication ne branche jamais sur `if (type === …)` :
 * il lit `resolveListingFormConfig(type, operation)` et rend les sections
 * déclarées. Ajouter un couple (type × opération) = ajouter une entrée dans
 * LISTING_FORM_CONFIG.
 *
 * Contrat miroir de `listing-terms.js` (immo-demo-api) et de
 * `src/lib/listing/listingTerms.ts` (front annonceur) : un seul modèle métier,
 * l'admin contrôle et saisit avec les mêmes règles.
 */

import {
  labelPropertyType,
  normalizePropertyTypeKey,
  type PropertyTypeKey,
} from "@/lib/property/typeFields";

export type ListingOperation = "VENTE" | "LOCATION";

export type RentPeriod = "MONTHLY" | "QUARTERLY" | "YEARLY" | "OTHER";

export type LandUse =
  | "AGRICULTURE"
  | "COMMERCE"
  | "STORAGE"
  | "PARKING"
  | "PROFESSIONAL"
  | "EVENT"
  | "OTHER";

export type RentalTerms = {
  rentAmount: number | null;
  period: RentPeriod | null;
  periodLabel: string | null;
  depositRequired: boolean;
  depositAmount: number | null;
  minimumDurationMonths: number | null;
  availableFrom: string | null;
  allowedUses: LandUse[];
  allowedUsesOther: string | null;
  negotiable: boolean;
  specialConditions: string | null;
};

export type SaleTerms = {
  negotiable: boolean;
  availableFrom: string | null;
  specialConditions: string | null;
};

/* ------------------------------------------------------------------ */
/* Référentiels                                                        */
/* ------------------------------------------------------------------ */

export const RENT_PERIOD_OPTIONS: { key: RentPeriod; label: string }[] = [
  { key: "MONTHLY", label: "Mensuel" },
  { key: "QUARTERLY", label: "Trimestriel" },
  { key: "YEARLY", label: "Annuel" },
  { key: "OTHER", label: "Autre" },
];

export const LAND_USE_OPTIONS: { key: LandUse; label: string }[] = [
  { key: "AGRICULTURE", label: "Agriculture" },
  { key: "COMMERCE", label: "Commerce" },
  { key: "STORAGE", label: "Stockage / dépôt" },
  { key: "PARKING", label: "Parking" },
  { key: "PROFESSIONAL", label: "Activité professionnelle" },
  { key: "EVENT", label: "Événementiel" },
  { key: "OTHER", label: "Autre" },
];

/** Durées proposées ; « Autre » ouvre une saisie libre en mois. */
export const MIN_DURATION_OPTIONS: { key: string; label: string }[] = [
  { key: "", label: "Non précisée" },
  { key: "6", label: "6 mois" },
  { key: "12", label: "1 an" },
  { key: "24", label: "2 ans" },
  { key: "OTHER", label: "Autre" },
];

export function labelRentPeriod(period: string | null | undefined): string {
  const found = RENT_PERIOD_OPTIONS.find((o) => o.key === period);
  return found ? found.label : "—";
}

export function labelLandUse(use: string): string {
  const found = LAND_USE_OPTIONS.find((o) => o.key === use);
  return found ? found.label : use;
}

/** Suffixe affiché à côté d'un montant de loyer (« 800 000 GNF / mois »). */
export function rentPeriodSuffix(
  period: RentPeriod | null | undefined,
  periodLabel?: string | null,
): string {
  switch (period) {
    case "MONTHLY":
      return "/ mois";
    case "QUARTERLY":
      return "/ trimestre";
    case "YEARLY":
      return "/ an";
    case "OTHER":
      return periodLabel ? `/ ${periodLabel}` : "";
    default:
      return "";
  }
}

export function labelMinimumDuration(
  months: number | null | undefined,
): string {
  if (months == null || !Number.isFinite(months) || months <= 0) return "—";
  if (months === 12) return "1 an";
  if (months % 12 === 0) return `${months / 12} ans`;
  return `${months} mois`;
}

/* ------------------------------------------------------------------ */
/* Configuration des sections par (type × opération)                   */
/* ------------------------------------------------------------------ */

export type ListingFormConfig = {
  /** Sections spécifiques à rendre après les champs communs. */
  sections: {
    rentalTerms: boolean;
    allowedUses: boolean;
    saleTerms: boolean;
  };
  /** Champs exigés à la soumission. */
  required: {
    rentAmount: boolean;
    period: boolean;
    allowedUses: boolean;
    availableFrom: boolean;
    salePrice: boolean;
  };
  labels: {
    sectionTitle: string;
    sectionHint: string;
    priceLabel: string;
  };
};

const GENERIC_SALE: ListingFormConfig = {
  sections: { rentalTerms: false, allowedUses: false, saleTerms: false },
  required: {
    rentAmount: false,
    period: false,
    allowedUses: false,
    availableFrom: false,
    salePrice: false,
  },
  labels: {
    sectionTitle: "Conditions de vente",
    sectionHint: "",
    priceLabel: "Prix de vente",
  },
};

const GENERIC_RENT: ListingFormConfig = {
  ...GENERIC_SALE,
  labels: {
    sectionTitle: "Conditions de location",
    sectionHint: "",
    priceLabel: "Loyer demandé",
  },
};

const TERRAIN_RENT: ListingFormConfig = {
  sections: { rentalTerms: true, allowedUses: true, saleTerms: false },
  required: {
    rentAmount: true,
    period: true,
    allowedUses: true,
    availableFrom: false,
    salePrice: false,
  },
  labels: {
    sectionTitle: "Conditions de location du terrain",
    sectionHint:
      "Ces conditions sont celles que vous proposez dans l’annonce. Elles ne valent pas validation juridique de l’usage du terrain.",
    priceLabel: "Loyer demandé",
  },
};

const TERRAIN_SALE: ListingFormConfig = {
  sections: { rentalTerms: false, allowedUses: false, saleTerms: true },
  required: {
    rentAmount: false,
    period: false,
    allowedUses: false,
    availableFrom: false,
    salePrice: true,
  },
  labels: {
    sectionTitle: "Conditions de vente du terrain",
    sectionHint: "",
    priceLabel: "Prix de vente",
  },
};

const LISTING_FORM_CONFIG: Partial<
  Record<PropertyTypeKey, Partial<Record<ListingOperation, ListingFormConfig>>>
> = {
  TERRAIN: { LOCATION: TERRAIN_RENT, VENTE: TERRAIN_SALE },
};

export function normalizeListingOperation(
  operation: string | null | undefined,
): ListingOperation {
  const raw = String(operation || "").trim().toUpperCase();
  if (raw === "LOCATION" || raw === "RENT" || raw === "LOUER") return "LOCATION";
  return "VENTE";
}

export function resolveListingFormConfig(
  propertyType: string,
  operation: string,
): ListingFormConfig {
  const type = normalizePropertyTypeKey(propertyType);
  const op = normalizeListingOperation(operation);
  const configured = LISTING_FORM_CONFIG[type]?.[op];
  if (configured) return configured;
  return op === "LOCATION" ? GENERIC_RENT : GENERIC_SALE;
}

/* ------------------------------------------------------------------ */
/* Valeurs de formulaire                                               */
/* ------------------------------------------------------------------ */

/** Toutes les valeurs sont des chaînes : état de formulaire contrôlé. */
export type ListingTermsFormValues = {
  rentAmount: string;
  period: RentPeriod | "";
  periodLabel: string;
  depositRequired: boolean;
  depositAmount: string;
  minimumDurationChoice: string;
  minimumDurationCustom: string;
  availableFrom: string;
  allowedUses: LandUse[];
  allowedUsesOther: string;
  negotiable: boolean;
  specialConditions: string;
};

export function createEmptyListingTerms(): ListingTermsFormValues {
  return {
    rentAmount: "",
    period: "MONTHLY",
    periodLabel: "",
    depositRequired: false,
    depositAmount: "",
    minimumDurationChoice: "",
    minimumDurationCustom: "",
    availableFrom: "",
    allowedUses: [],
    allowedUsesOther: "",
    negotiable: false,
    specialConditions: "",
  };
}

function parseAmount(raw: string): number | null {
  if (raw.trim() === "") return null;
  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
}

export function resolveMinimumDurationMonths(
  values: ListingTermsFormValues,
): number | null {
  if (values.minimumDurationChoice === "") return null;
  if (values.minimumDurationChoice === "OTHER") {
    return parseAmount(values.minimumDurationCustom);
  }
  return parseAmount(values.minimumDurationChoice);
}

/* ------------------------------------------------------------------ */
/* Validation conditionnelle                                           */
/* ------------------------------------------------------------------ */

export type ListingTermsErrors = Partial<
  Record<keyof ListingTermsFormValues | "price", string>
>;

export function validateListingTerms(
  config: ListingFormConfig,
  values: ListingTermsFormValues,
  price: string,
): ListingTermsErrors {
  const errors: ListingTermsErrors = {};

  if (config.sections.rentalTerms) {
    const rent = parseAmount(values.rentAmount);
    if (config.required.rentAmount && !(rent !== null && rent > 0)) {
      errors.rentAmount = "Indiquez le loyer demandé.";
    }
    if (config.required.period && !values.period) {
      errors.period = "Choisissez une périodicité.";
    }
    if (values.period === "OTHER" && !values.periodLabel.trim()) {
      errors.periodLabel = "Précisez la périodicité.";
    }
    if (values.depositRequired) {
      const deposit = parseAmount(values.depositAmount);
      if (!(deposit !== null && deposit > 0)) {
        errors.depositAmount = "Indiquez le montant de la caution.";
      }
    }
    const duration = resolveMinimumDurationMonths(values);
    if (values.minimumDurationChoice === "OTHER" && !(duration && duration > 0)) {
      errors.minimumDurationCustom = "Indiquez une durée en mois.";
    }
    if (config.required.availableFrom && !values.availableFrom) {
      errors.availableFrom = "Indiquez la date de disponibilité.";
    }
  }

  if (config.sections.allowedUses) {
    if (config.required.allowedUses && values.allowedUses.length === 0) {
      errors.allowedUses = "Sélectionnez au moins un usage autorisé.";
    }
    if (
      values.allowedUses.includes("OTHER") &&
      !values.allowedUsesOther.trim()
    ) {
      errors.allowedUsesOther = "Précisez l’usage « Autre ».";
    }
  }

  if (config.required.salePrice) {
    const amount = parseAmount(price);
    if (!(amount !== null && amount > 0)) {
      errors.price = "Indiquez le prix de vente.";
    }
  }

  return errors;
}

/* ------------------------------------------------------------------ */
/* Payload API                                                         */
/* ------------------------------------------------------------------ */

/**
 * En location, `rentAmount` est la source de vérité et l'API recopie le
 * montant dans `listing.price` (aucun champ prix concurrent).
 */
export function buildListingTermsPayload(
  config: ListingFormConfig,
  values: ListingTermsFormValues,
): { rentalTerms?: RentalTerms; saleTerms?: SaleTerms; price?: number } {
  if (config.sections.rentalTerms) {
    const rentAmount = parseAmount(values.rentAmount);
    const rentalTerms: RentalTerms = {
      rentAmount,
      period: values.period || null,
      periodLabel:
        values.period === "OTHER" ? values.periodLabel.trim() || null : null,
      depositRequired: values.depositRequired,
      depositAmount: values.depositRequired
        ? parseAmount(values.depositAmount)
        : null,
      minimumDurationMonths: resolveMinimumDurationMonths(values),
      availableFrom: values.availableFrom || null,
      allowedUses: config.sections.allowedUses ? values.allowedUses : [],
      allowedUsesOther: values.allowedUses.includes("OTHER")
        ? values.allowedUsesOther.trim() || null
        : null,
      negotiable: values.negotiable,
      specialConditions: values.specialConditions.trim() || null,
    };
    return {
      rentalTerms,
      ...(rentAmount !== null ? { price: rentAmount } : {}),
    };
  }

  if (config.sections.saleTerms) {
    return {
      saleTerms: {
        negotiable: values.negotiable,
        availableFrom: values.availableFrom || null,
        specialConditions: values.specialConditions.trim() || null,
      },
    };
  }

  return {};
}

/* ------------------------------------------------------------------ */
/* Lecture / affichage                                                 */
/* ------------------------------------------------------------------ */

export type RentalTermsRow = { label: string; value: string };

/** Lignes prêtes à afficher (admin, fiche publique). */
export function describeRentalTerms(
  terms: RentalTerms | null | undefined,
  formatAmount: (value: number) => string,
): RentalTermsRow[] {
  if (!terms) return [];
  const rows: RentalTermsRow[] = [];
  if (terms.rentAmount != null) {
    rows.push({
      label: "Loyer demandé",
      value: `${formatAmount(terms.rentAmount)} ${rentPeriodSuffix(
        terms.period,
        terms.periodLabel,
      )}`.trim(),
    });
  }
  rows.push({
    label: "Périodicité",
    value:
      terms.period === "OTHER"
        ? terms.periodLabel || "Autre"
        : labelRentPeriod(terms.period),
  });
  rows.push({
    label: "Caution",
    value: terms.depositRequired
      ? terms.depositAmount != null
        ? formatAmount(terms.depositAmount)
        : "Demandée"
      : "Aucune caution demandée",
  });
  rows.push({
    label: "Durée minimale",
    value: labelMinimumDuration(terms.minimumDurationMonths),
  });
  rows.push({
    label: "Disponible à partir du",
    value: formatAvailability(terms.availableFrom),
  });
  rows.push({
    label: "Usages autorisés",
    value: formatAllowedUses(terms),
  });
  rows.push({
    label: "Loyer négociable",
    value: terms.negotiable ? "Oui" : "Non",
  });
  if (terms.specialConditions) {
    rows.push({
      label: "Conditions particulières",
      value: terms.specialConditions,
    });
  }
  return rows;
}

export function formatAllowedUses(
  terms: Pick<RentalTerms, "allowedUses" | "allowedUsesOther">,
): string {
  if (!terms.allowedUses?.length) return "Non précisé";
  return terms.allowedUses
    .map((use) =>
      use === "OTHER" && terms.allowedUsesOther
        ? terms.allowedUsesOther
        : labelLandUse(use),
    )
    .join(", ");
}

export function formatAvailability(value: string | null | undefined): string {
  if (!value) return "Non précisée";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

const DEMONSTRATIVE: Record<PropertyTypeKey, string> = {
  TERRAIN: "ce terrain",
  MAISON: "cette maison",
  VILLA: "cette villa",
  APPARTEMENT: "cet appartement",
  BUREAU: "ce bureau",
  COMMERCE: "ce local commercial",
};

/** Libellé du choix d'opération : « Louer ce terrain ». */
export function operationChoiceLabel(
  propertyType: string,
  operation: string,
): string {
  const target = DEMONSTRATIVE[normalizePropertyTypeKey(propertyType)];
  return normalizeListingOperation(operation) === "LOCATION"
    ? `Louer ${target}`
    : `Vendre ${target}`;
}

/** Titre public d'une annonce : « Terrain à louer ». */
export function listingKindLabel(
  propertyType: string,
  operation: string,
): string {
  const type = labelPropertyType(propertyType);
  return normalizeListingOperation(operation) === "LOCATION"
    ? `${type} à louer`
    : `${type} à vendre`;
}
