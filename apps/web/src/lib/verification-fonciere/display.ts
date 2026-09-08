import {
  FONCIERE_VERIFICATION_STATUS_LABELS,
} from "./constants";
import type { FonciereClientRecord } from "./storage";
import {
  FonciereVerificationStatus,
  type VerificationHistoryItem,
} from "./types";

const HISTORY_TITLES: Partial<Record<FonciereVerificationStatus, string>> = {
  DRAFT: "Demande créée",
  PENDING_OWNER: "Propriétaire informé",
  OWNER_ACCEPTED: "Propriétaire accepté",
  OWNER_REFUSED: "Refusée par le propriétaire",
  DOCUMENTS_REQUIRED: "Documents demandés",
  READY_FOR_SUBMISSION: "Dossier prêt à transmettre",
  SUBMITTED: "Transmission au service compétent",
  UNDER_OFFICIAL_REVIEW: "Examen officiel en cours",
  OFFICIAL_VERIFIED: "Résultat disponible",
  OFFICIAL_NOT_CONFIRMED: "Résultat disponible",
  CANCELLED: "Demande annulée",
  EXPIRED: "Demande expirée",
};

export function formatFonciereDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatFonciereDateTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fonciereHistoryTitle(item: VerificationHistoryItem) {
  return HISTORY_TITLES[item.status] ?? FONCIERE_VERIFICATION_STATUS_LABELS[item.status];
}

export function sortedFonciereHistory(items: VerificationHistoryItem[] | undefined) {
  return [...(items ?? [])].sort((left, right) =>
    left.createdAt.localeCompare(right.createdAt),
  );
}

export function requestBelongsToSession(
  item: FonciereClientRecord,
  sessionId?: string,
) {
  if (!sessionId) return true;
  return (
    item.requesterId === sessionId ||
    item.requester?.userId === sessionId ||
    item.requesterId.startsWith("invite-")
  );
}

function holderTypeOf(item: FonciereClientRecord) {
  if (item.recipientType === "AGENCY" || item.recipientType === "OWNER") {
    return item.recipientType;
  }
  if (item.propertyHolderType === "AGENCY" || item.propertyHolderType === "OWNER") {
    return item.propertyHolderType;
  }
  if (item.agencyId) return "AGENCY" as const;
  return "OWNER" as const;
}

function holderIdOf(item: FonciereClientRecord) {
  if (item.recipientId) return item.recipientId;
  if (item.propertyHolderId) return item.propertyHolderId;
  if (holderTypeOf(item) === "AGENCY") return item.agencyId || "";
  return item.ownerId || item.owner?.ownerId || "";
}

export function fonciereRecipient(item: FonciereClientRecord) {
  return {
    type: holderTypeOf(item),
    id: holderIdOf(item),
    name:
      item.recipientName ||
      item.propertyHolderName ||
      item.agencyName ||
      item.ownerName ||
      "",
  };
}

export function requestBelongsToOwner(
  item: FonciereClientRecord,
  ownerId?: string,
) {
  if (!ownerId) return false;
  return item.recipientType === "OWNER" && item.recipientId === ownerId;
}

export function requestBelongsToAgency(
  item: FonciereClientRecord,
  agencyId?: string,
) {
  if (!agencyId) return false;
  return item.recipientType === "AGENCY" && item.recipientId === agencyId;
}

export function canOwnerRespondToFonciere(status: FonciereVerificationStatus) {
  return (
    status === FonciereVerificationStatus.DRAFT ||
    status === FonciereVerificationStatus.PENDING_OWNER
  );
}

export function fonciereAdminStats(items: FonciereClientRecord[]) {
  return {
    open: items.filter(
      (item) =>
        item.status !== FonciereVerificationStatus.OFFICIAL_VERIFIED &&
        item.status !== FonciereVerificationStatus.OFFICIAL_NOT_CONFIRMED &&
        item.status !== FonciereVerificationStatus.CANCELLED &&
        item.status !== FonciereVerificationStatus.EXPIRED,
    ).length,
    pendingOwner: items.filter(
      (item) => item.status === FonciereVerificationStatus.PENDING_OWNER,
    ).length,
    documentsRequired: items.filter(
      (item) => item.status === FonciereVerificationStatus.DOCUMENTS_REQUIRED,
    ).length,
    completed: items.filter(
      (item) =>
        item.status === FonciereVerificationStatus.OFFICIAL_VERIFIED ||
        item.status === FonciereVerificationStatus.OFFICIAL_NOT_CONFIRMED,
    ).length,
  };
}
