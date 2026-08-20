"use strict";

/**
 * Conditions commerciales d'une annonce (Listing), séparées du bien (Property).
 *
 * - operation LOCATION -> listing.rentalTerms
 * - operation VENTE    -> listing.saleTerms (le montant reste listing.price)
 *
 * Les annonces créées avant cette version n'ont ni rentalTerms ni saleTerms :
 * tout est optionnel côté lecture, la validation stricte ne s'applique qu'aux
 * couples type/opération déclarés dans TERMS_REQUIREMENTS.
 */

const accountScopes = require("./account-scopes");

const RENT_PERIODS = ["MONTHLY", "QUARTERLY", "YEARLY", "OTHER"];

const RENT_PERIOD_LABELS = {
  MONTHLY: "Mensuel",
  QUARTERLY: "Trimestriel",
  YEARLY: "Annuel",
  OTHER: "Autre",
};

const LAND_USES = [
  "AGRICULTURE",
  "COMMERCE",
  "STORAGE",
  "PARKING",
  "PROFESSIONAL",
  "EVENT",
  "OTHER",
];

const LAND_USE_LABELS = {
  AGRICULTURE: "Agriculture",
  COMMERCE: "Commerce",
  STORAGE: "Stockage / dépôt",
  PARKING: "Parking",
  PROFESSIONAL: "Activité professionnelle",
  EVENT: "Événementiel",
  OTHER: "Autre",
};

/**
 * Couples (type de bien × opération) qui exigent des conditions détaillées.
 * Clé : `${TYPE}:${OPERATION}`.
 */
const TERMS_REQUIREMENTS = {
  "TERRAIN:LOCATION": {
    rentalTerms: true,
    requiredFields: ["rentAmount", "period", "allowedUses"],
  },
  "TERRAIN:VENTE": {
    saleTerms: true,
    requiredFields: ["salePrice"],
  },
};

function typeKey(type) {
  return accountScopes.normalizePropertyTypeKey(type) || null;
}

function operationKey(operation) {
  return accountScopes.normalizeOperation(operation) || null;
}

function requirementFor(type, operation) {
  const key = `${typeKey(type) || ""}:${operationKey(operation) || ""}`;
  return TERMS_REQUIREMENTS[key] || null;
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : null;
}

function toText(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text ? text : null;
}

function toIsoDate(value) {
  const text = toText(value);
  if (!text) return null;
  // Conserve le format court des <input type="date"> tel quel.
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function normalizeRentPeriod(value) {
  const key = String(value || "").trim().toUpperCase();
  if (RENT_PERIODS.includes(key)) return key;
  if (key === "MENSUEL" || key === "MONTH" || key === "MOIS") return "MONTHLY";
  if (key === "TRIMESTRIEL" || key === "QUARTER") return "QUARTERLY";
  if (key === "ANNUEL" || key === "YEAR" || key === "AN") return "YEARLY";
  return null;
}

function normalizeLandUses(value) {
  const raw = Array.isArray(value) ? value : value ? [value] : [];
  const out = [];
  for (const entry of raw) {
    const key = String(entry || "").trim().toUpperCase();
    if (LAND_USES.includes(key) && !out.includes(key)) out.push(key);
  }
  return out;
}

/** Conditions de location normalisées (jamais partiellement typées). */
function normalizeRentalTerms(raw) {
  if (!raw || typeof raw !== "object") return null;
  const allowedUses = normalizeLandUses(raw.allowedUses);
  const depositAmount = toNumber(raw.depositAmount);
  const depositRequired =
    raw.depositRequired === undefined
      ? depositAmount !== null && depositAmount > 0
      : Boolean(raw.depositRequired);
  return {
    rentAmount: toNumber(raw.rentAmount),
    period: normalizeRentPeriod(raw.period),
    periodLabel: toText(raw.periodLabel),
    depositRequired,
    depositAmount: depositRequired ? depositAmount : null,
    minimumDurationMonths: toNumber(raw.minimumDurationMonths),
    availableFrom: toIsoDate(raw.availableFrom),
    allowedUses,
    allowedUsesOther: allowedUses.includes("OTHER")
      ? toText(raw.allowedUsesOther)
      : null,
    negotiable: Boolean(raw.negotiable),
    specialConditions: toText(raw.specialConditions),
  };
}

/** Conditions de vente : le prix reste `listing.price`, pas de doublon ici. */
function normalizeSaleTerms(raw) {
  if (!raw || typeof raw !== "object") return null;
  return {
    negotiable: Boolean(raw.negotiable),
    availableFrom: toIsoDate(raw.availableFrom),
    specialConditions: toText(raw.specialConditions),
  };
}

function validateRentalTerms(terms, requiredFields) {
  const fields = {};
  const required = requiredFields || [];
  if (required.includes("rentAmount") && !(terms.rentAmount > 0)) {
    fields.rentAmount = "Le loyer demandé est obligatoire.";
  }
  if (required.includes("period") && !terms.period) {
    fields.period = "La périodicité du loyer est obligatoire.";
  }
  if (terms.period === "OTHER" && !terms.periodLabel) {
    fields.periodLabel = "Précisez la périodicité choisie.";
  }
  if (terms.depositRequired && !(terms.depositAmount > 0)) {
    fields.depositAmount =
      "Indiquez le montant de la caution ou déclarez qu'aucune caution n'est demandée.";
  }
  if (
    terms.minimumDurationMonths !== null &&
    !(terms.minimumDurationMonths > 0)
  ) {
    fields.minimumDurationMonths =
      "La durée minimale doit être un nombre de mois positif.";
  }
  if (required.includes("allowedUses") && terms.allowedUses.length === 0) {
    fields.allowedUses = "Sélectionnez au moins un usage autorisé.";
  }
  if (terms.allowedUses.includes("OTHER") && !terms.allowedUsesOther) {
    fields.allowedUsesOther = "Précisez l'usage « Autre ».";
  }
  return fields;
}

/**
 * Résout les conditions commerciales d'une annonce à partir du corps de requête.
 *
 * @returns {{ok:true, rentalTerms:object|null, saleTerms:object|null, price:number}}
 *        | {ok:false, status:number, error:string, message:string, fields:object}
 */
function resolveListingTerms({ type, operation, body, fallbackPrice }) {
  const op = operationKey(operation);
  const requirement = requirementFor(type, operation);
  const source = body || {};

  const rentalTerms =
    op === "LOCATION" ? normalizeRentalTerms(source.rentalTerms) : null;
  const saleTerms = op === "VENTE" ? normalizeSaleTerms(source.saleTerms) : null;

  let price = toNumber(source.price);
  if (price === null) price = toNumber(fallbackPrice);
  // Le loyer est la source de vérité en location ; `price` reste le miroir
  // affiché par les cartes, la fiche publique et l'admin.
  if (rentalTerms && rentalTerms.rentAmount !== null) {
    price = rentalTerms.rentAmount;
  }
  price = price === null ? 0 : price;

  if (requirement && requirement.rentalTerms) {
    if (!rentalTerms) {
      return {
        ok: false,
        status: 422,
        error: "RENTAL_TERMS_REQUIRED",
        message:
          "Les conditions de location sont obligatoires pour un terrain proposé en location.",
        fields: {},
      };
    }
    const fields = validateRentalTerms(rentalTerms, requirement.requiredFields);
    if (Object.keys(fields).length > 0) {
      return {
        ok: false,
        status: 422,
        error: "RENTAL_TERMS_INVALID",
        message: "Les conditions de location sont incomplètes.",
        fields,
      };
    }
  } else if (rentalTerms) {
    // Conditions envoyées hors couple obligatoire : on valide la cohérence
    // interne sans imposer de champ.
    const fields = validateRentalTerms(rentalTerms, []);
    if (Object.keys(fields).length > 0) {
      return {
        ok: false,
        status: 422,
        error: "RENTAL_TERMS_INVALID",
        message: "Les conditions de location sont incohérentes.",
        fields,
      };
    }
  }

  if (requirement && requirement.saleTerms && !(price > 0)) {
    return {
      ok: false,
      status: 422,
      error: "SALE_PRICE_REQUIRED",
      message: "Le prix de vente est obligatoire.",
      fields: { price: "Le prix de vente est obligatoire." },
    };
  }

  return { ok: true, rentalTerms, saleTerms, price };
}

/**
 * Applique un PATCH partiel sans écraser les conditions déjà stockées quand le
 * client ne les renvoie pas.
 */
function mergeListingTermsPatch(previous, body) {
  const patch = {};
  if (body && Object.prototype.hasOwnProperty.call(body, "rentalTerms")) {
    patch.rentalTerms = normalizeRentalTerms(body.rentalTerms);
  }
  if (body && Object.prototype.hasOwnProperty.call(body, "saleTerms")) {
    patch.saleTerms = normalizeSaleTerms(body.saleTerms);
  }
  const operation = operationKey(
    (body && body.operation) || (previous && previous.operation),
  );
  // Une annonce ne porte jamais les deux jeux de conditions à la fois.
  if (operation === "LOCATION" && patch.saleTerms === undefined) {
    if (previous && previous.saleTerms) patch.saleTerms = null;
  }
  if (operation === "VENTE" && patch.rentalTerms === undefined) {
    if (previous && previous.rentalTerms) patch.rentalTerms = null;
  }
  const nextRental =
    patch.rentalTerms !== undefined
      ? patch.rentalTerms
      : previous && previous.rentalTerms;
  if (nextRental && nextRental.rentAmount !== null) {
    patch.price = nextRental.rentAmount;
  }
  return patch;
}

/** Backfill silencieux des annonces antérieures à cette version. */
function normalizeListingTermsRecord(listing) {
  let changed = false;
  if (!listing || typeof listing !== "object") return false;
  if (!Object.prototype.hasOwnProperty.call(listing, "rentalTerms")) {
    listing.rentalTerms = null;
    changed = true;
  }
  if (!Object.prototype.hasOwnProperty.call(listing, "saleTerms")) {
    listing.saleTerms = null;
    changed = true;
  }
  return changed;
}

module.exports = {
  RENT_PERIODS,
  RENT_PERIOD_LABELS,
  LAND_USES,
  LAND_USE_LABELS,
  TERMS_REQUIREMENTS,
  requirementFor,
  normalizeRentalTerms,
  normalizeSaleTerms,
  resolveListingTerms,
  mergeListingTermsPatch,
  normalizeListingTermsRecord,
};
