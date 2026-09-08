/**
 * Libellés frontend — vérification foncière officielle.
 * Aucun appel API. Aucun workflow.
 */

import type {
  FonciereDocumentStatus,
  FonciereNotificationType,
  FonciereRequestMode,
  FonciereVerificationStatus,
  VerificationOwnerResponseStatus,
} from "./types";
import {
  FonciereDocumentStatus as DocumentStatus,
  FonciereNotificationType as NotificationType,
  FonciereRequestMode as RequestMode,
  FonciereVerificationStatus as Status,
  VerificationOwnerResponseStatus as OwnerResponse,
} from "./types";

export const FONCIERE_VERIFICATION_MODULE = "verification-fonciere-officielle";

/** Rappel métier : la plateforme ne délivre pas de certificat de propriété. */
export const FONCIERE_VERIFICATION_DISCLAIMER =
  "Demeure Guinée ne certifie pas la propriété. Ce dossier facilite la demande, informe le propriétaire, oriente vers le service compétent et peut accompagner le suivi.";

export const FONCIERE_VERIFICATION_PUBLIC_NOTICE =
  "Demeure Guinée facilite votre démarche et vous oriente vers le service compétent ou vous accompagne. Cette démarche ne constitue pas une certification de propriété par Demeure Guinée.";

export const FONCIERE_PROPERTY_CONTEXT_KEY =
  "demeure-guinee-fonciere-property-context";

/** @deprecated Legacy local storage removed. Data source is now Demo API. */
export const FONCIERE_DRAFT_STORAGE_KEY =
  "demeure-guinee-fonciere-draft-request";

/** @deprecated Legacy local storage removed. Data source is now Demo API. */
export const FONCIERE_REQUESTS_STORAGE_KEY =
  "demeure-guinee-fonciere-requests";

/** @deprecated Legacy local storage removed. Data source is now Demo API. */
export const FONCIERE_ADMIN_META_KEY =
  "demeure-guinee-fonciere-admin-meta";

export const FONCIERE_ADMIN_AGENT_OPTIONS = [
  "Aminata Touré",
  "Mohamed Camara",
  "Fatoumata Bah",
] as const;

export const FONCIERE_ADMIN_STATUS_ACTIONS: {
  key: string;
  label: string;
  status: FonciereVerificationStatus;
  message: string;
}[] = [
  {
    key: "request-documents",
    label: "Demander documents",
    status: Status.DOCUMENTS_REQUIRED,
    message: "Documents demandés par l’administration.",
  },
  {
    key: "prepare",
    label: "Préparer dossier",
    status: Status.READY_FOR_SUBMISSION,
    message: "Dossier préparé pour transmission.",
  },
  {
    key: "submit",
    label: "Marquer transmis",
    status: Status.SUBMITTED,
    message: "Dossier marqué comme transmis au service compétent.",
  },
  {
    key: "result",
    label: "Résultat disponible",
    status: Status.OFFICIAL_VERIFIED,
    message: "Résultat officiel disponible.",
  },
];

export const FONCIERE_VERIFICATION_STATUS_VALUES = Object.values(Status);

export const FONCIERE_VERIFICATION_STATUS_LABELS: Record<
  FonciereVerificationStatus,
  string
> = {
  DRAFT: "Brouillon",
  PENDING_OWNER: "En attente du propriétaire",
  OWNER_ACCEPTED: "Propriétaire accepté",
  OWNER_REFUSED: "Refusée par le propriétaire",
  DOCUMENTS_REQUIRED: "Documents demandés",
  READY_FOR_SUBMISSION: "Prête à transmettre",
  SUBMITTED: "Transmise",
  UNDER_OFFICIAL_REVIEW: "Examen officiel en cours",
  OFFICIAL_VERIFIED: "Vérification officielle disponible",
  OFFICIAL_NOT_CONFIRMED: "Non confirmée officiellement",
  CANCELLED: "Annulée",
  EXPIRED: "Expirée",
};

export const FONCIERE_REQUEST_MODE_LABELS: Record<FonciereRequestMode, string> =
  {
    ORIENTATION_SERVICE: "Être orienté vers le service compétent",
    ACCOMPAGNEMENT_DEMEURE: "Être accompagné par Demeure Guinée",
  };

export const FONCIERE_PROPERTY_HOLDER_TYPE_LABELS = {
  OWNER: "Propriétaire",
  AGENCY: "Agence",
} as const;

export const FONCIERE_REQUEST_MODE_SHORT_LABELS: Record<
  FonciereRequestMode,
  string
> = {
  ORIENTATION_SERVICE: "Orientation service",
  ACCOMPAGNEMENT_DEMEURE: "Accompagnement Demeure Guinée",
};

export const VERIFICATION_OWNER_RESPONSE_LABELS: Record<
  VerificationOwnerResponseStatus,
  string
> = {
  PENDING: "En attente",
  ACCEPTED: "Acceptée",
  REFUSED: "Refusée",
};

export const FONCIERE_DOCUMENT_STATUS_LABELS: Record<
  FonciereDocumentStatus,
  string
> = {
  REQUESTED: "Demandé",
  UPLOADED: "Déposé",
  VALIDATED: "Validé",
  REJECTED: "Refusé",
};

export const FONCIERE_NOTIFICATION_TYPE_LABELS: Record<
  FonciereNotificationType,
  string
> = {
  NEW_REQUEST: "Nouvelle demande",
  OWNER_RESPONSE: "Réponse du propriétaire",
  DOCUMENT_REQUEST: "Documents nécessaires",
  STATUS_CHANGE: "Changement de statut",
  RESULT_AVAILABLE: "Résultat disponible",
};

export {
  DocumentStatus as FONCIERE_DOCUMENT_STATUS,
  NotificationType as FONCIERE_NOTIFICATION_TYPE,
  OwnerResponse as VERIFICATION_OWNER_RESPONSE_STATUS,
  RequestMode as FONCIERE_REQUEST_MODE,
  Status as FONCIERE_VERIFICATION_STATUS,
};
