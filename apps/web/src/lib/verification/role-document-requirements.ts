/**
 * Exigences documentaires centralisées — demandes de rôle.
 * Ne pas dupliquer ces règles dans chaque composant UI.
 */

export type RoleKind = "PROPRIETAIRE" | "AGENCE";

export type ActivityType =
  | "AGENCE_IMMOBILIERE"
  | "PROMOTEUR_IMMOBILIER"
  | "AMENAGEUR_LOTISSEUR"
  | "GESTIONNAIRE_IMMOBILIER"
  | "AUTRE_PROFESSIONNEL_IMMOBILIER"
  | "AUTRE"
  | null;

export type DocRequirementLevel = "REQUIRED" | "OPTIONAL" | "CONDITIONAL";

export type DocumentRequirementKey =
  | "IDENTITY"
  | "SELFIE_VERIFICATION"
  | "JUSTIFICATIF_DOMICILE"
  | "RCCM"
  | "STATUTS_SOCIETE"
  | "JUSTIFICATIF_SIEGE"
  | "LOGO_AGENCE"
  | "EXPERIENCE_PROOF"
  | "AGREMENT_PROMOTEUR"
  | "QUALIFICATIONS_REPRESENTANT"
  | "CASIER_JUDICIAIRE_REP"
  | "ASSURANCE_RCP"
  | "GARANTIE_FINANCIERE";

export type DocumentRequirementDef = {
  key: DocumentRequirementKey;
  /** Types de fichiers API associés (un ou plusieurs) */
  documentTypes: string[];
  title: string;
  reason: string;
  level: DocRequirementLevel;
  /** Si CONDITIONAL : true uniquement lorsque la condition est remplie */
  activeWhen?: (ctx: RequirementContext) => boolean;
  /** Quand actif, compte comme obligatoire pour la complétude */
  requiredWhenActive?: boolean;
  acceptImagesOnly?: boolean;
  drawerKind: string;
};

export type RequirementContext = {
  role: RoleKind;
  activityType: ActivityType;
};

export const ACTIVITY_TYPE_OPTIONS: {
  value: Exclude<ActivityType, null>;
  label: string;
}[] = [
  { value: "AGENCE_IMMOBILIERE", label: "Agence immobilière" },
  { value: "PROMOTEUR_IMMOBILIER", label: "Promoteur immobilier" },
  { value: "AMENAGEUR_LOTISSEUR", label: "Aménageur / lotisseur" },
  { value: "GESTIONNAIRE_IMMOBILIER", label: "Gestionnaire immobilier" },
  {
    value: "AUTRE_PROFESSIONNEL_IMMOBILIER",
    label: "Autre professionnel immobilier",
  },
];

export const SPECIALTY_OPTIONS = [
  { id: "vente", label: "Vente" },
  { id: "location", label: "Location" },
  { id: "gestion", label: "Gestion locative" },
  { id: "terrains", label: "Terrains" },
  { id: "residentiel", label: "Résidentiel" },
  { id: "commercial", label: "Commercial" },
  { id: "promotion", label: "Promotion immobilière" },
  { id: "autres", label: "Autres" },
] as const;

const ALL_DEFS: DocumentRequirementDef[] = [
  {
    key: "IDENTITY",
    documentTypes: ["CNI_RECTO", "CNI_VERSO", "PASSEPORT"],
    title: "Pièce d’identité",
    reason: "Permet de vérifier l’identité du demandeur.",
    level: "REQUIRED",
    drawerKind: "identity",
  },
  {
    key: "SELFIE_VERIFICATION",
    documentTypes: ["SELFIE_VERIFICATION"],
    title: "Photo de vérification",
    reason:
      "Photo récente permettant à notre équipe de comparer votre identité avec la pièce transmise (contrôle interne Demeure Guinée).",
    level: "REQUIRED",
    acceptImagesOnly: true,
    drawerKind: "selfie",
  },
  {
    key: "JUSTIFICATIF_DOMICILE",
    documentTypes: ["JUSTIFICATIF_DOMICILE"],
    title: "Justificatif de domicile",
    reason:
      "Pièce complémentaire (attestation, facture, quittance) pour confirmer votre adresse.",
    level: "OPTIONAL",
    drawerKind: "domicile",
  },
  {
    key: "RCCM",
    documentTypes: ["RCCM"],
    title: "Extrait RCCM",
    reason: "Permet de vérifier l’existence déclarée de l’entreprise.",
    level: "REQUIRED",
    drawerKind: "rccm",
  },
  {
    key: "STATUTS_SOCIETE",
    documentTypes: ["STATUTS_SOCIETE"],
    title: "Statuts de la société",
    reason: "Document constitutif de la structure professionnelle.",
    level: "REQUIRED",
    drawerKind: "statuts",
  },
  {
    key: "JUSTIFICATIF_SIEGE",
    documentTypes: ["JUSTIFICATIF_SIEGE"],
    title: "Justificatif du siège",
    reason: "Confirme l’adresse professionnelle déclarée.",
    level: "OPTIONAL",
    drawerKind: "siege",
  },
  {
    key: "LOGO_AGENCE",
    documentTypes: ["LOGO_AGENCE"],
    title: "Logo",
    reason: "Élément de présentation du profil professionnel.",
    level: "OPTIONAL",
    acceptImagesOnly: true,
    drawerKind: "logo",
  },
  {
    key: "EXPERIENCE_PROOF",
    documentTypes: ["EXPERIENCE_PROOF"],
    title: "Justificatif d’expérience",
    reason:
      "Facultatif — peut faciliter la vérification de votre profil professionnel (attestation, CV, références).",
    level: "OPTIONAL",
    drawerKind: "experience",
  },
  {
    key: "AGREMENT_PROMOTEUR",
    documentTypes: ["AGREMENT_PROMOTEUR"],
    title: "Agrément promoteur",
    reason:
      "Cette pièce est demandée parce que vous avez déclaré exercer une activité de promotion immobilière.",
    level: "CONDITIONAL",
    activeWhen: (ctx) => ctx.activityType === "PROMOTEUR_IMMOBILIER",
    requiredWhenActive: true,
    drawerKind: "agrement",
  },
  {
    key: "QUALIFICATIONS_REPRESENTANT",
    documentTypes: ["QUALIFICATIONS_REPRESENTANT"],
    title: "Qualifications du représentant",
    reason:
      "Justificatif de qualification professionnelle du représentant pour l’activité de promoteur.",
    level: "CONDITIONAL",
    activeWhen: (ctx) => ctx.activityType === "PROMOTEUR_IMMOBILIER",
    requiredWhenActive: true,
    drawerKind: "qualifications",
  },
  {
    key: "CASIER_JUDICIAIRE_REP",
    documentTypes: ["CASIER_JUDICIAIRE_REP"],
    title: "Casier judiciaire (représentant)",
    reason:
      "Pièce spécifique éventuelle pour un dossier de promotion immobilière.",
    level: "CONDITIONAL",
    activeWhen: (ctx) => ctx.activityType === "PROMOTEUR_IMMOBILIER",
    requiredWhenActive: false,
    drawerKind: "casier",
  },
  {
    key: "ASSURANCE_RCP",
    documentTypes: ["ASSURANCE_RCP"],
    title: "Assurance RC professionnelle",
    reason: "Justificatif d’assurance lorsque applicable au dossier promoteur.",
    level: "CONDITIONAL",
    activeWhen: (ctx) => ctx.activityType === "PROMOTEUR_IMMOBILIER",
    requiredWhenActive: false,
    drawerKind: "assurance",
  },
  {
    key: "GARANTIE_FINANCIERE",
    documentTypes: ["GARANTIE_FINANCIERE"],
    title: "Garantie financière",
    reason: "Preuve de garantie financière lorsque applicable.",
    level: "CONDITIONAL",
    activeWhen: (ctx) => ctx.activityType === "PROMOTEUR_IMMOBILIER",
    requiredWhenActive: false,
    drawerKind: "garantie",
  },
];

const PROPRIETAIRE_KEYS: DocumentRequirementKey[] = [
  "IDENTITY",
  "SELFIE_VERIFICATION",
  "JUSTIFICATIF_DOMICILE",
];

const AGENCE_BASE_KEYS: DocumentRequirementKey[] = [
  "IDENTITY",
  "SELFIE_VERIFICATION",
  "RCCM",
  "STATUTS_SOCIETE",
  "JUSTIFICATIF_SIEGE",
  "LOGO_AGENCE",
  "EXPERIENCE_PROOF",
  "AGREMENT_PROMOTEUR",
  "QUALIFICATIONS_REPRESENTANT",
  "CASIER_JUDICIAIRE_REP",
  "ASSURANCE_RCP",
  "GARANTIE_FINANCIERE",
];

function defByKey(key: DocumentRequirementKey) {
  const found = ALL_DEFS.find((d) => d.key === key);
  if (!found) throw new Error(`Unknown document requirement: ${key}`);
  return found;
}

export function isRequirementActive(
  def: DocumentRequirementDef,
  ctx: RequirementContext,
): boolean {
  if (def.level !== "CONDITIONAL") return true;
  return def.activeWhen ? def.activeWhen(ctx) : false;
}

export function isRequirementBlocking(
  def: DocumentRequirementDef,
  ctx: RequirementContext,
): boolean {
  if (!isRequirementActive(def, ctx)) return false;
  if (def.level === "REQUIRED") return true;
  if (def.level === "OPTIONAL") return false;
  return Boolean(def.requiredWhenActive);
}

export function getDocumentRequirements(
  ctx: RequirementContext,
): DocumentRequirementDef[] {
  const keys =
    ctx.role === "PROPRIETAIRE" ? PROPRIETAIRE_KEYS : AGENCE_BASE_KEYS;
  return keys
    .map(defByKey)
    .filter((def) => isRequirementActive(def, ctx));
}

export function getBlockingRequirements(ctx: RequirementContext) {
  return getDocumentRequirements(ctx).filter((d) =>
    isRequirementBlocking(d, ctx),
  );
}

export function requirementLevelLabel(
  level: DocRequirementLevel,
  blocking: boolean,
): "OBLIGATOIRE" | "FACULTATIF" | "CONDITIONNEL" {
  if (level === "OPTIONAL") return "FACULTATIF";
  if (level === "CONDITIONAL") {
    return blocking ? "CONDITIONNEL" : "FACULTATIF";
  }
  return "OBLIGATOIRE";
}

/** Complétude documents : uniquement les pièces bloquantes actives. */
export function computeDocumentsProgress(
  ctx: RequirementContext,
  isComplete: (def: DocumentRequirementDef) => boolean,
) {
  const blocking = getBlockingRequirements(ctx);
  const total = blocking.length;
  const done = blocking.filter(isComplete).length;
  return {
    done,
    total,
    pct: total === 0 ? 100 : Math.round((done / total) * 100),
  };
}

export function hasDocumentFile(
  docs: { documentType: string; fileName?: string | null; fileUrl?: string | null }[],
  type: string,
) {
  return docs.some((d) => d.documentType === type && d.fileName && d.fileUrl);
}

export function isIdentityComplete(
  docs: { documentType: string; fileName?: string | null; fileUrl?: string | null }[],
  idType: string | undefined,
  idNumber: string | undefined,
) {
  const metaOk = Boolean(idType && idNumber?.trim());
  if (!metaOk) return false;
  if (idType === "PASSEPORT") return hasDocumentFile(docs, "PASSEPORT");
  return (
    hasDocumentFile(docs, "CNI_RECTO") && hasDocumentFile(docs, "CNI_VERSO")
  );
}

export function isDocDefComplete(
  def: DocumentRequirementDef,
  docs: { documentType: string; fileName?: string | null; fileUrl?: string | null }[],
  personal?: { idType?: string; idNumber?: string },
) {
  if (def.key === "IDENTITY") {
    return isIdentityComplete(docs, personal?.idType, personal?.idNumber);
  }
  return def.documentTypes.some((t) => hasDocumentFile(docs, t));
}
