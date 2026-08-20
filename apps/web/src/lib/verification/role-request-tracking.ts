import type { RoleRequest, RoleRequestStatus } from "@/lib/demo-api/role-requests";
import { formatStatusLabel } from "@/lib/ui/status";

export type RoleRequestNextStep = {
  eyebrow: string;
  title: string;
  description: string;
  actionLabel: string | null;
  actionHref: string | null;
  variant: "default" | "closed" | "correction" | "approved";
};

/** Correction demandée : le dossier reste ouvert. */
export function isRoleRequestCorrectionOpen(item: {
  status: RoleRequestStatus | string;
}) {
  return item.status === "A_CORRIGER" || item.status === "BROUILLON";
}

export function refusalTargetLabel(item: {
  correctionTarget?: string | null;
  sectionReviews?: RoleRequest["sectionReviews"];
  documents?: Array<{
    label: string;
    verificationStatus: string;
    rejectionReason?: string | null;
  }>;
}) {
  const resolved = resolveCorrectionFocus(item);
  if (resolved.focus) return labelForCorrectionFocus(resolved.focus);
  return null;
}

/** Refus avec nouvelle soumission autorisée — distinct de A_CORRIGER. */
export function canResubmitRefusedRoleRequest(item: {
  status: RoleRequestStatus | string;
  canResubmit?: boolean;
}) {
  return item.status === "REFUSEE" && item.canResubmit === true;
}

export function isRoleRequestFinallyClosed(item: {
  status: RoleRequestStatus | string;
  canResubmit?: boolean;
}) {
  return item.status === "REFUSEE" && item.canResubmit !== true;
}

export function canEditRoleRequest(item: {
  status: RoleRequestStatus | string;
  canResubmit?: boolean;
}) {
  return (
    isRoleRequestCorrectionOpen(item) || canResubmitRefusedRoleRequest(item)
  );
}

export function shouldLockRoleRequestForm(item: {
  status: RoleRequestStatus | string;
  canResubmit?: boolean;
}) {
  if (item.status === "APPROUVEE") return true;
  if (item.status === "EN_ATTENTE" || item.status === "EN_VERIFICATION") {
    return true;
  }
  return isRoleRequestFinallyClosed(item);
}

export function correctionFormHref(requestId: string) {
  return `/demande-role?id=${encodeURIComponent(requestId)}`;
}

export type CorrectionFocus =
  | "identity"
  | "informations"
  | "documents"
  | "company"
  | "experience"
  | "declarations";

export type RoleRequestFormStep = 1 | 2 | 3 | 4 | 5;

const CORRECTION_TARGET_ALIASES: Record<string, CorrectionFocus> = {
  identity: "identity",
  identite: "identity",
  identité: "identity",
  documents: "documents",
  document: "documents",
  informations: "informations",
  information: "informations",
  declaredprofile: "informations",
  declared_profile: "informations",
  profile: "informations",
  company: "company",
  entreprise: "company",
  agence: "company",
  experience: "experience",
  expérience: "experience",
  declarations: "declarations",
  déclarations: "declarations",
};

export function normalizeCorrectionTarget(
  raw?: string | null,
): CorrectionFocus | null {
  if (!raw) return null;
  const key = raw.trim().toLowerCase().replace(/[\s_-]+/g, "");
  return CORRECTION_TARGET_ALIASES[key] ?? null;
}

export function stepForCorrectionFocus(
  focus: CorrectionFocus | null,
): RoleRequestFormStep {
  switch (focus) {
    case "identity":
      return 2;
    case "informations":
    case "company":
    case "experience":
      return 3;
    case "documents":
      return 4;
    case "declarations":
      return 5;
    default:
      return 4;
  }
}

export function labelForCorrectionFocus(focus: CorrectionFocus) {
  switch (focus) {
    case "identity":
      return "Identité";
    case "informations":
      return "Informations";
    case "documents":
      return "Documents";
    case "company":
      return "Entreprise";
    case "experience":
      return "Expérience";
    case "declarations":
      return "Déclarations";
  }
}

export function isCorrectionFlow(item: {
  status: RoleRequestStatus | string;
  canResubmit?: boolean;
}) {
  return item.status === "A_CORRIGER" || canResubmitRefusedRoleRequest(item);
}

export function resolveCorrectionFocus(item: {
  correctionTarget?: string | null;
  sectionReviews?: RoleRequest["sectionReviews"];
  documents?: Array<{
    label: string;
    verificationStatus: string;
    rejectionReason?: string | null;
  }>;
}): { focus: CorrectionFocus | null; items: string[] } {
  const items: string[] = [];
  const flaggedDocs = (item.documents || []).filter(
    (d) =>
      d.verificationStatus === "A_CORRIGER" ||
      d.verificationStatus === "REFUSE",
  );
  for (const doc of flaggedDocs) {
    items.push(
      doc.rejectionReason ? `${doc.label} — ${doc.rejectionReason}` : doc.label,
    );
  }

  const reviews = item.sectionReviews || {};
  const reviewMap: Record<string, CorrectionFocus> = {
    identity: "identity",
    documents: "documents",
    declaredProfile: "informations",
    company: "company",
  };
  for (const [key, focus] of Object.entries(reviewMap)) {
    const review = reviews[key];
    if (review?.status === "A_CORRIGER" && review.message) {
      if (!items.includes(review.message)) items.push(review.message);
    }
  }

  const fromTarget = normalizeCorrectionTarget(item.correctionTarget);
  if (fromTarget) return { focus: fromTarget, items };
  if (flaggedDocs.length > 0) return { focus: "documents", items };
  for (const [key, focus] of Object.entries(reviewMap)) {
    if (reviews[key]?.status === "A_CORRIGER") {
      return { focus, items };
    }
  }
  return { focus: null, items };
}

export function resolveRoleRequestNextStep(item: Pick<
  RoleRequest,
  "id" | "status" | "canResubmit"
>): RoleRequestNextStep {
  const href = correctionFormHref(item.id);
  if (item.status === "REFUSEE") {
    if (canResubmitRefusedRoleRequest(item)) {
      return {
        eyebrow: "Prochaine étape",
        title: "Corriger votre dossier",
        description:
          "Une nouvelle soumission est autorisée. Corrigez les informations ou documents concernés, puis renvoyez le même dossier pour vérification. Il repassera alors en attente.",
        actionLabel: "Corriger mon dossier",
        actionHref: href,
        variant: "correction",
      };
    }
    return {
      eyebrow: "Décision finale",
      title: "Demande clôturée",
      description:
        "Cette demande ne peut plus être soumise. Votre compte reste un compte standard, sans rôle Propriétaire ou Agence.",
      actionLabel: null,
      actionHref: null,
      variant: "closed",
    };
  }

  if (item.status === "A_CORRIGER") {
    return {
      eyebrow: "Prochaine étape",
      title: "Compléter puis renvoyer",
      description:
        "L’administration a demandé des corrections. Le dossier reste ouvert : corrigez le même dossier, puis renvoyez-le pour vérification.",
      actionLabel: "Corriger mon dossier",
        actionHref: href,
        variant: "correction",
    };
  }

  if (item.status === "BROUILLON") {
    return {
      eyebrow: "Prochaine étape",
      title: "Compléter puis renvoyer",
      description:
        "Votre dossier n’a pas encore été transmis. Complétez-le, puis soumettez-le pour vérification.",
      actionLabel: "Reprendre le brouillon",
      actionHref: href,
      variant: "correction",
    };
  }

  if (item.status === "APPROUVEE") {
    return {
      eyebrow: "Prochaine étape",
      title: "Compte vérifié",
      description:
        "Votre compte est vérifié par Demeure Guinée. Cela ne vérifie pas automatiquement chaque bien.",
      actionLabel: null,
      actionHref: null,
      variant: "approved",
    };
  }

  return {
    eyebrow: "Prochaine étape",
    title: "Attendre le contrôle",
    description:
      "L’équipe examine les pièces. Vous pouvez actualiser cette page pour suivre l’avancement.",
    actionLabel: null,
    actionHref: null,
    variant: "default",
  };
}

export function decisionDate(item: Pick<RoleRequest, "status" | "reviewedAt" | "updatedAt">) {
  if (item.status !== "REFUSEE" && item.status !== "APPROUVEE") {
    return null;
  }
  return item.reviewedAt || item.updatedAt || null;
}

export function formatHistoryLabel(label: string) {
  return label.replace(/\b[A-Z]{2,}(?:_[A-Z]+)*\b/g, (code) =>
    formatStatusLabel(code),
  );
}

export function documentStatusClass(status: string) {
  if (status === "VALIDE" || status === "VERIFIE") return "valid";
  if (status === "REFUSE" || status === "REFUSEE" || status === "A_CORRIGER") {
    return "rejected";
  }
  return "pending";
}
