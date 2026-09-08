/**
 * Vérification foncière officielle — modèles frontend uniquement.
 *
 * IMPORTANT : ce module est distinct de :
 * - `verified` / `verificationStatus` des annonces (annonce vérifiée)
 * - la vérification de rôle (`/demande-role`, `RoleRequest`, `VerificationDocument`)
 * - le contrôle juridique interne du bien (`legalVerificationStatus`, PropertyLegalSection)
 *
 * Ne jamais réutiliser ces statuts ou types existants ici.
 * Demeure Guinée ne certifie pas la propriété : la plateforme facilite,
 * informe, oriente et accompagne uniquement.
 *
 * Aucun affichage public de document sensible.
 */

/** Mode choisi par le demandeur. */
export const FonciereRequestMode = {
  ORIENTATION_SERVICE: "ORIENTATION_SERVICE",
  ACCOMPAGNEMENT_DEMEURE: "ACCOMPAGNEMENT_DEMEURE",
} as const;

export type FonciereRequestMode =
  (typeof FonciereRequestMode)[keyof typeof FonciereRequestMode];

/**
 * Statuts du dossier officiel.
 * Ne pas confondre avec EN_VERIFICATION, VERIFIE, EN_ATTENTE (rôle / annonce / bien).
 */
export const FonciereVerificationStatus = {
  DRAFT: "DRAFT",
  PENDING_OWNER: "PENDING_OWNER",
  OWNER_ACCEPTED: "OWNER_ACCEPTED",
  OWNER_REFUSED: "OWNER_REFUSED",
  DOCUMENTS_REQUIRED: "DOCUMENTS_REQUIRED",
  READY_FOR_SUBMISSION: "READY_FOR_SUBMISSION",
  SUBMITTED: "SUBMITTED",
  UNDER_OFFICIAL_REVIEW: "UNDER_OFFICIAL_REVIEW",
  OFFICIAL_VERIFIED: "OFFICIAL_VERIFIED",
  OFFICIAL_NOT_CONFIRMED: "OFFICIAL_NOT_CONFIRMED",
  CANCELLED: "CANCELLED",
  EXPIRED: "EXPIRED",
} as const;

export type FonciereVerificationStatus =
  (typeof FonciereVerificationStatus)[keyof typeof FonciereVerificationStatus];

export const VerificationOwnerResponseStatus = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  REFUSED: "REFUSED",
} as const;

export type VerificationOwnerResponseStatus =
  (typeof VerificationOwnerResponseStatus)[keyof typeof VerificationOwnerResponseStatus];

export const FonciereDocumentStatus = {
  REQUESTED: "REQUESTED",
  UPLOADED: "UPLOADED",
  VALIDATED: "VALIDATED",
  REJECTED: "REJECTED",
} as const;

export type FonciereDocumentStatus =
  (typeof FonciereDocumentStatus)[keyof typeof FonciereDocumentStatus];

export const FonciereNotificationType = {
  NEW_REQUEST: "NEW_REQUEST",
  OWNER_RESPONSE: "OWNER_RESPONSE",
  DOCUMENT_REQUEST: "DOCUMENT_REQUEST",
  STATUS_CHANGE: "STATUS_CHANGE",
  RESULT_AVAILABLE: "RESULT_AVAILABLE",
} as const;

export type FonciereNotificationType =
  (typeof FonciereNotificationType)[keyof typeof FonciereNotificationType];

/** Demandeur de la vérification officielle (client intéressé). */
export type VerificationRequester = {
  userId: string;
  fullName: string;
  phone: string;
  email: string;
  city: string;
  message: string;
};

/** Gestionnaire du bien concerné par la demande. */
export const FoncierePropertyHolderType = {
  OWNER: "OWNER",
  AGENCY: "AGENCY",
} as const;

export type FoncierePropertyHolderType =
  (typeof FoncierePropertyHolderType)[keyof typeof FoncierePropertyHolderType];

/** Destinataire de la demande (propriétaire ou agence). */
export const FonciereRecipientType = FoncierePropertyHolderType;
export type FonciereRecipientType = FoncierePropertyHolderType;

/** Propriétaire informé de la demande. */
export type VerificationOwner = {
  ownerId: string;
  name: string;
  phone: string;
  email: string;
  responseStatus: VerificationOwnerResponseStatus;
};

/**
 * Pièce du dossier officiel.
 * Structure seule — jamais exposer `url` sur une page publique.
 * Distinct de `VerificationDocument` dans `lib/demo-api/role-requests`.
 */
export type VerificationDocument = {
  id: string;
  name: string;
  type: string;
  url: string;
  status: FonciereDocumentStatus;
  uploadedAt: string;
};

/** Entrée de timeline du dossier. */
export type VerificationHistoryItem = {
  id: string;
  status: FonciereVerificationStatus;
  message: string;
  createdAt: string;
  createdBy: string;
};

/**
 * Notification liée au dossier officiel.
 * Distincte des notifications propriétaire (visites / annonces).
 */
export type VerificationNotification = {
  id: string;
  type: FonciereNotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

/** Dossier de vérification foncière officielle. */
export type FonciereVerificationRequest = {
  id: string;
  reference: string;
  propertyId: string;
  propertyTitle: string;
  propertyType: string;
  requesterId: string;
  requesterName: string;
  ownerId: string;
  ownerName: string;
  propertyHolderType?: FoncierePropertyHolderType;
  propertyHolderId?: string;
  propertyHolderName?: string;
  recipientType?: FonciereRecipientType;
  recipientId?: string;
  recipientName?: string;
  agencyId?: string;
  agencyName?: string;
  requestMode: FonciereRequestMode;
  createdAt: string;
  updatedAt: string;
  status: FonciereVerificationStatus;
  requester?: VerificationRequester;
  owner?: VerificationOwner;
  documents?: VerificationDocument[];
  history?: VerificationHistoryItem[];
};
