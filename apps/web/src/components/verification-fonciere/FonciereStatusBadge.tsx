import {
  FONCIERE_DOCUMENT_STATUS_LABELS,
  FONCIERE_VERIFICATION_STATUS_LABELS,
} from "@/lib/verification-fonciere/constants";
import type {
  FonciereDocumentStatus,
  FonciereVerificationStatus,
} from "@/lib/verification-fonciere/types";
import type { StatusTone } from "@/lib/ui/status";

import badgeStyles from "@/components/ui/StatusBadge.module.css";

import styles from "./FonciereStatusBadge.module.css";

const STATUS_TONES: Record<FonciereVerificationStatus, StatusTone> = {
  DRAFT: "warning",
  PENDING_OWNER: "warning",
  OWNER_ACCEPTED: "info",
  OWNER_REFUSED: "danger",
  DOCUMENTS_REQUIRED: "warning",
  READY_FOR_SUBMISSION: "info",
  SUBMITTED: "info",
  UNDER_OFFICIAL_REVIEW: "warning",
  OFFICIAL_VERIFIED: "success",
  OFFICIAL_NOT_CONFIRMED: "danger",
  CANCELLED: "neutral",
  EXPIRED: "warning",
};

const DOCUMENT_TONES: Record<FonciereDocumentStatus, StatusTone> = {
  REQUESTED: "warning",
  UPLOADED: "info",
  VALIDATED: "success",
  REJECTED: "danger",
};

type BadgeProps = {
  status: FonciereVerificationStatus;
};

export function FonciereStatusBadge({ status }: BadgeProps) {
  return (
    <span
      className={`${badgeStyles.badge} ${badgeStyles[STATUS_TONES[status]]} ${styles.wrap}`}
    >
      {FONCIERE_VERIFICATION_STATUS_LABELS[status]}
    </span>
  );
}

type DocumentBadgeProps = {
  status: FonciereDocumentStatus;
};

export function FonciereDocumentStatusBadge({ status }: DocumentBadgeProps) {
  return (
    <span
      className={`${badgeStyles.badge} ${badgeStyles[DOCUMENT_TONES[status]]} ${styles.wrap}`}
    >
      {FONCIERE_DOCUMENT_STATUS_LABELS[status]}
    </span>
  );
}
