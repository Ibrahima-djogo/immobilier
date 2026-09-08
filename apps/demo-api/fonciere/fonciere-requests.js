/**
 * Vérification foncière officielle — stockage mock Demo API.
 * Source unique des dossiers. Remplacée par Spring Boot en production.
 *
 * Distinct de :
 * - vérification d’annonce
 * - demandes de rôle
 * - legalVerificationStatus
 */

const STATUSES = {
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
};

const OWNER_RESPONSES = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  REFUSED: "REFUSED",
};

const DOCUMENT_STATUSES = {
  REQUESTED: "REQUESTED",
  UPLOADED: "UPLOADED",
  VALIDATED: "VALIDATED",
  REJECTED: "REJECTED",
};

const ALLOWED_STATUSES = new Set(Object.values(STATUSES));
const COLLECTION = "fonciereVerifications";

function nowIso() {
  return new Date().toISOString();
}

function compact(value) {
  return String(value == null ? "" : value).trim();
}

function ensureFonciereCollections(db) {
  let changed = false;
  if (!Array.isArray(db[COLLECTION])) {
    db[COLLECTION] = [];
    changed = true;
  }
  for (const item of db[COLLECTION]) {
    if (backfillHolder(db, item)) changed = true;
  }
  return changed;
}

function listRequests(db) {
  ensureFonciereCollections(db);
  return [...db[COLLECTION]].sort((left, right) =>
    String(right.createdAt || "").localeCompare(String(left.createdAt || "")),
  );
}

function findRequest(db, id) {
  const value = compact(id);
  if (!value) return null;
  return (
    listRequests(db).find(
      (item) => item.id === value || item.reference === value,
    ) || null
  );
}

function publicRequest(item) {
  return {
    id: item.id,
    reference: item.reference,
    propertyId: item.propertyId,
    propertyTitle: item.propertyTitle,
    propertyType: item.propertyType,
    requesterId: item.requesterId,
    requesterName: item.requesterName,
    ownerId: item.ownerId,
    ownerName: item.ownerName,
    requestMode: item.requestMode,
    status: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    requester: item.requester || undefined,
    owner: item.owner || undefined,
    documents: (item.documents || []).map((document) => ({
      id: document.id,
      name: document.name,
      type: document.type,
      url: "",
      status: document.status,
      uploadedAt: document.uploadedAt || "",
    })),
    history: item.history || [],
    propertyLocation: item.propertyLocation,
    propertyImage: item.propertyImage,
    propertySlug: item.propertySlug,
    propertyReference: item.propertyReference,
    assignedAgentName: item.assignedAgentName || "",
    internalNotes: item.internalNotes || "",
    propertyHolderType: item.propertyHolderType,
    propertyHolderId: item.propertyHolderId,
    propertyHolderName: item.propertyHolderName,
    recipientType: item.recipientType || item.propertyHolderType,
    recipientId: item.recipientId || item.propertyHolderId,
    recipientName: item.recipientName || item.propertyHolderName,
    agencyId: item.agencyId || "",
    agencyName: item.agencyName || "",
  };
}

function findRelatedListing(db, propertyId) {
  const matches = (db.listings || []).filter(
    (item) =>
      item.propertyId === propertyId ||
      item.id === propertyId ||
      item.slug === propertyId,
  );
  return (
    matches.find((item) => item.status === "PUBLIEE") ||
    matches[0] ||
    null
  );
}

function findAgency(db, agencyId) {
  const id = compact(agencyId);
  if (!id) return null;
  return (db.agencies || []).find((item) => item.id === id) || null;
}

function findUser(db, userId) {
  const id = compact(userId);
  if (!id) return null;
  return (db.users || []).find((item) => item.id === id) || null;
}

function resolveHolderFromDb(db, body) {
  const propertyId = compact(body.propertyId);
  const property = (db.properties || []).find(
    (item) => item.id === propertyId || item.slug === propertyId,
  );
  const listing = findRelatedListing(db, propertyId);
  const agencyId =
    compact(body.agencyId) ||
    compact(property && property.agencyId) ||
    compact(listing && listing.agencyId);
  const advertiserType = compact(
    body.advertiserType ||
      (listing && listing.advertiserType) ||
      (listing && listing.advertiser && listing.advertiser.type),
  ).toUpperCase();
  const isAgency = advertiserType === "AGENCE" || Boolean(agencyId);
  const agency = findAgency(db, agencyId);
  const ownerId =
    compact(body.ownerId) ||
    compact(property && property.ownerId) ||
    compact(listing && listing.ownerId);
  const owner = findUser(db, ownerId);
  const agencyName =
    compact(body.agencyName) ||
    compact(agency && agency.name) ||
    compact(listing && listing.owner) ||
    compact(listing && listing.advertiser && listing.advertiser.name);
  const ownerName =
    compact(body.ownerName) ||
    compact(owner && owner.name) ||
    compact(listing && listing.owner) ||
    compact(listing && listing.advertiser && listing.advertiser.name);

  if (isAgency) {
    return {
      ownerId,
      ownerName: ownerName || agencyName,
      propertyTitle:
        compact(body.propertyTitle) ||
        compact(property && property.title) ||
        compact(listing && listing.title) ||
        "Terrain",
      propertyHolderType: "AGENCY",
      propertyHolderId: agencyId,
      propertyHolderName: agencyName || "Agence",
      recipientType: "AGENCY",
      recipientId: agencyId,
      recipientName: agencyName || "Agence",
      agencyId,
      agencyName,
    };
  }

  return {
    ownerId,
    ownerName,
    propertyTitle:
      compact(body.propertyTitle) ||
      compact(property && property.title) ||
      compact(listing && listing.title) ||
      "Terrain",
    propertyHolderType: "OWNER",
    propertyHolderId: ownerId,
    propertyHolderName: ownerName || "Propriétaire",
    recipientType: "OWNER",
    recipientId: ownerId,
    recipientName: ownerName || "Propriétaire",
    agencyId: "",
    agencyName: "",
  };
}

function applyRecipient(item, resolved) {
  item.propertyHolderType = resolved.propertyHolderType;
  item.propertyHolderId = resolved.propertyHolderId;
  item.propertyHolderName = resolved.propertyHolderName;
  item.recipientType = resolved.recipientType;
  item.recipientId = resolved.recipientId;
  item.recipientName = resolved.recipientName;
  item.agencyId = resolved.agencyId;
  item.agencyName = resolved.agencyName;
}

function backfillHolder(db, item) {
  if (!item) return false;
  if (
    item.propertyHolderType &&
    item.propertyHolderId &&
    item.recipientType &&
    item.recipientId
  ) {
    return false;
  }
  const resolved = resolveHolderFromDb(db, item);
  applyRecipient(item, resolved);
  if (!item.ownerId) item.ownerId = resolved.ownerId;
  if (!item.ownerName) item.ownerName = resolved.ownerName;
  return true;
}

function createRequest(db, body) {
  const payload = body && typeof body === "object" ? body : {};
  const resolved = resolveHolderFromDb(db, payload);
  const requester = payload.requester && typeof payload.requester === "object"
    ? payload.requester
    : {};
  const now = nowIso();
  const stamp = Date.now();
  const requesterId = compact(payload.requesterId) || compact(requester.userId) || `invite-${stamp}`;
  const requesterName =
    compact(payload.requesterName) || compact(requester.fullName) || "Demandeur";
  const requestMode = compact(payload.requestMode);
  if (!compact(payload.propertyId) || !requestMode) {
    const error = new Error("propertyId et requestMode sont requis.");
    error.status = 400;
    throw error;
  }

  const request = {
    id: compact(payload.id) || `vf-${stamp}`,
    reference: compact(payload.reference) || `DG-VF-${stamp}`,
    propertyId: compact(payload.propertyId),
    propertyTitle: resolved.propertyTitle,
    propertyType: compact(payload.propertyType) || "TERRAIN",
    requesterId,
    requesterName,
    ownerId: resolved.ownerId,
    ownerName: resolved.ownerName,
    propertyHolderType: resolved.propertyHolderType,
    propertyHolderId: resolved.propertyHolderId,
    propertyHolderName: resolved.propertyHolderName,
    recipientType: resolved.recipientType,
    recipientId: resolved.recipientId,
    recipientName: resolved.recipientName,
    agencyId: resolved.agencyId,
    agencyName: resolved.agencyName,
    requestMode,
    status: STATUSES.DRAFT,
    createdAt: now,
    updatedAt: now,
    requester: {
      userId: compact(requester.userId) || requesterId,
      fullName: compact(requester.fullName) || requesterName,
      phone: compact(requester.phone),
      email: compact(requester.email),
      city: compact(requester.city),
      message: compact(requester.message),
    },
    owner: resolved.ownerId
      ? {
          ownerId: resolved.ownerId,
          name: resolved.ownerName || "Propriétaire",
          phone: "",
          email: "",
          responseStatus: OWNER_RESPONSES.PENDING,
        }
      : undefined,
    documents: [],
    history: [
      {
        id: `vfh-${stamp}`,
        status: STATUSES.DRAFT,
        message: "Brouillon créé.",
        createdAt: now,
        createdBy: requesterId,
      },
    ],
    propertyLocation: compact(payload.propertyLocation),
    propertyImage: compact(payload.propertyImage),
    propertySlug: compact(payload.propertySlug),
    propertyReference: compact(payload.propertyReference),
    assignedAgentName: "",
    internalNotes: "",
  };

  ensureFonciereCollections(db);
  db[COLLECTION].unshift(request);
  return request;
}

function applyOwnerResponse(request, rawAction, actorId) {
  const normalized = compact(rawAction).toUpperCase();
  const accepted =
    normalized === "ACCEPTED" || normalized === "ACCEPT";
  const refused =
    normalized === "REFUSED" || normalized === "REFUSE";
  if (!accepted && !refused) {
    const error = new Error("Réponse propriétaire invalide.");
    error.status = 400;
    throw error;
  }

  const now = nowIso();
  const status = accepted ? STATUSES.OWNER_ACCEPTED : STATUSES.OWNER_REFUSED;
  request.status = status;
  request.updatedAt = now;
  request.owner = {
    ownerId: (request.owner && request.owner.ownerId) || request.ownerId || actorId,
    name: (request.owner && request.owner.name) || request.ownerName || "Propriétaire",
    phone: (request.owner && request.owner.phone) || "",
    email: (request.owner && request.owner.email) || "",
    responseStatus: accepted ? OWNER_RESPONSES.ACCEPTED : OWNER_RESPONSES.REFUSED,
  };
  if (!Array.isArray(request.history)) request.history = [];
  request.history.push({
    id: `vfh-${Date.now()}`,
    status,
    message: accepted
      ? "Le propriétaire a accepté la demande"
      : "Le propriétaire a refusé la demande",
    createdAt: now,
    createdBy: actorId,
  });
  return request;
}

function applyAdminStatus(request, rawStatus, message, actorId) {
  const status = compact(rawStatus);
  if (!ALLOWED_STATUSES.has(status)) {
    const error = new Error("Statut administratif invalide.");
    error.status = 400;
    throw error;
  }

  const now = nowIso();
  request.status = status;
  request.updatedAt = now;
  if (!Array.isArray(request.documents)) request.documents = [];
  if (
    status === STATUSES.DOCUMENTS_REQUIRED &&
    !request.documents.some((item) => item.status === DOCUMENT_STATUSES.REQUESTED)
  ) {
    request.documents.push({
      id: `vfd-${Date.now()}`,
      name: "Pièces complémentaires",
      type: "Demande administrative",
      url: "",
      status: DOCUMENT_STATUSES.REQUESTED,
      uploadedAt: "",
    });
  }
  if (!Array.isArray(request.history)) request.history = [];
  request.history.push({
    id: `vfh-${Date.now()}`,
    status,
    message: compact(message) || `Statut mis à jour : ${status}`,
    createdAt: now,
    createdBy: actorId,
  });
  return request;
}

function applyAdminMeta(request, patch) {
  if (!patch || typeof patch !== "object") return request;
  if (Object.prototype.hasOwnProperty.call(patch, "assignedAgentName")) {
    request.assignedAgentName = compact(patch.assignedAgentName);
  }
  if (Object.prototype.hasOwnProperty.call(patch, "internalNotes")) {
    request.internalNotes = String(patch.internalNotes ?? "");
  }
  request.updatedAt = nowIso();
  return request;
}

module.exports = {
  COLLECTION,
  STATUSES,
  OWNER_RESPONSES,
  DOCUMENT_STATUSES,
  ensureFonciereCollections,
  listRequests,
  findRequest,
  publicRequest,
  createRequest,
  applyOwnerResponse,
  applyAdminStatus,
  applyAdminMeta,
};
