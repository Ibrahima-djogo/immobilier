/**
 * Vérification documentaire — demandes de rôle + documents privés.
 * DEMO ONLY — pas d’intégration ministérielle.
 */

const ROLE_REQUEST_STATUSES = new Set([
  "BROUILLON",
  "EN_ATTENTE",
  "EN_VERIFICATION",
  "A_CORRIGER",
  "APPROUVEE",
  "REFUSEE",
]);

const DOC_STATUSES = new Set([
  "NON_VERIFIE",
  "EN_ATTENTE",
  "VALIDE",
  "A_CORRIGER",
  "REFUSE",
]);

const PROPERTY_LEGAL_STATUSES = new Set([
  "NON_SOUMIS",
  "EN_ATTENTE",
  "VERIFIE",
  "A_CORRIGER",
  "REFUSE",
]);

/** Règle métier explicite : publication publique exige bien juridiquement vérifié. */
const REQUIRE_PROPERTY_LEGAL_VERIFICATION_FOR_PUBLICATION = true;

function nowIso() {
  return new Date().toISOString();
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function refRole() {
  return `ROLE-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
}

function ensureVerificationCollections(db) {
  let changed = false;
  if (!Array.isArray(db.roleRequests)) {
    db.roleRequests = [];
    changed = true;
  }
  if (!Array.isArray(db.verificationDocuments)) {
    db.verificationDocuments = [];
    changed = true;
  }
  if (!Array.isArray(db.notifications)) {
    db.notifications = [];
    changed = true;
  }

  // Migration legacy seed → structure enrichie
  if (db.roleRequests.length === 0) {
    const legacy = buildLegacyRoleRequests(db);
    db.roleRequests.push(...legacy.requests);
    db.verificationDocuments.push(...legacy.documents);
    changed = true;
  } else {
    for (const req of db.roleRequests) {
      if (!req.verificationLevel) {
        req.verificationLevel = "STRUCTURED_V1";
        changed = true;
      }
      if (!Array.isArray(req.documentIds)) {
        req.documentIds = [];
        changed = true;
      }
      if (!Array.isArray(req.history)) {
        req.history = [
          {
            id: uid("hist"),
            at: req.createdAt || nowIso(),
            label: "Dossier initialisé",
          },
        ];
        changed = true;
      }
      // Map anciens statuts → nouveaux
      const map = {
        SOUMISE: "EN_ATTENTE",
        EN_EXAMEN: "EN_VERIFICATION",
        COMPLEMENT_REQUIS: "A_CORRIGER",
      };
      if (map[req.status]) {
        req.status = map[req.status];
        changed = true;
      }
    }
  }

  for (const property of db.properties || []) {
    if (!property.legalVerificationStatus) {
      property.legalVerificationStatus = "NON_SOUMIS";
      changed = true;
    }
    if (!Array.isArray(property.legalDocumentIds)) {
      property.legalDocumentIds = [];
      changed = true;
    }
  }

  return changed;
}

function buildLegacyRoleRequests(db) {
  const stamp = nowIso();
  const docs = [];
  const requests = [
    {
      id: "rr1",
      reference: "ROLE-2026-00081",
      userId: "u-pending-1",
      requestedRole: "PROPRIETAIRE",
      activityType: null,
      status: "EN_ATTENTE",
      verificationLevel: "LEGACY_DEMO",
      personalInformation: {
        firstName: "Aïssatou",
        lastName: "Camara",
        email: "aissatou@example.com",
        phone: "+224 620 11 00 44",
        city: "Conakry",
        district: "Dixinn",
      },
      companyInformation: null,
      representative: null,
      declarations: {
        accuracy: true,
        authorization: true,
        processing: true,
        privacy: true,
      },
      documentIds: [],
      correctionMessage: null,
      risk: "FAIBLE",
      completeness: 60,
      createdAt: stamp,
      updatedAt: stamp,
      submittedAt: stamp,
      reviewedAt: null,
      reviewedByAdminId: null,
      history: [
        { id: uid("hist"), at: stamp, label: "Dossier legacy importé" },
        { id: uid("hist"), at: stamp, label: "Demande soumise (legacy)" },
      ],
    },
    {
      id: "rr2",
      reference: "ROLE-2026-00079",
      userId: "u-pending-2",
      requestedRole: "AGENCE",
      activityType: "AGENCE_IMMOBILIERE",
      status: "EN_VERIFICATION",
      verificationLevel: "LEGACY_DEMO",
      personalInformation: {
        firstName: "Contact",
        lastName: "Immo Plus",
        email: "contact@immoplus.example",
        phone: "+224 621 00 00 10",
        city: "Conakry",
      },
      companyInformation: {
        legalName: "Immo Plus Guinée SARL",
        tradeName: "Immo Plus Guinée",
        rccm: "GN.CKY.2024.B.00123",
        city: "Conakry",
      },
      representative: {
        firstName: "Sékou",
        lastName: "Touré",
        function: "Gérant",
      },
      declarations: {
        accuracy: true,
        authorization: true,
        processing: true,
        privacy: true,
      },
      documentIds: [],
      correctionMessage: null,
      risk: "MOYEN",
      completeness: 70,
      createdAt: stamp,
      updatedAt: stamp,
      submittedAt: stamp,
      reviewedAt: null,
      reviewedByAdminId: null,
      history: [
        { id: uid("hist"), at: stamp, label: "Dossier legacy importé" },
        { id: uid("hist"), at: stamp, label: "Contrôle commencé (legacy)" },
      ],
    },
  ];

  // Ensure placeholder users exist for pending requests
  db.users = db.users || [];
  if (!db.users.some((u) => u.id === "u-pending-1")) {
    db.users.push({
      id: "u-pending-1",
      name: "Aïssatou Camara",
      email: "aissatou@example.com",
      phone: "+224 620 11 00 44",
      role: "USER",
      status: "ACTIF",
      roleVerified: false,
      documentsVerified: false,
      reportsCount: 0,
    });
  }
  if (!db.users.some((u) => u.id === "u-pending-2")) {
    db.users.push({
      id: "u-pending-2",
      name: "Immo Plus Guinée",
      email: "contact@immoplus.example",
      phone: "+224 621 00 00 10",
      role: "USER",
      status: "ACTIF",
      roleVerified: false,
      documentsVerified: false,
      reportsCount: 0,
    });
  }
  if (!db.users.some((u) => u.id === "u-client")) {
    db.users.push({
      id: "u-client",
      name: "Ibrahima Camara",
      email: "client@demeureguinee.demo",
      phone: "+224 620 99 88 77",
      role: "USER",
      status: "ACTIF",
      roleVerified: false,
      documentsVerified: false,
      reportsCount: 0,
    });
  }

  return { requests, documents: docs };
}

function pushHistory(req, label, meta) {
  req.history = req.history || [];
  req.history.unshift({
    id: uid("hist"),
    at: nowIso(),
    label,
    ...(meta || {}),
  });
}

function pushNotification(db, entry) {
  db.notifications = db.notifications || [];
  db.notifications.unshift({
    id: uid("notif"),
    createdAt: nowIso(),
    read: false,
    ...entry,
  });
}

function computeCompleteness(req, docs) {
  let score = 5;
  const p = req.personalInformation || {};
  if (p.firstName && p.lastName) score += 10;
  if (p.birthDate && p.nationality) score += 8;
  if (p.phone && p.email) score += 8;
  if (p.idType && p.idNumber) score += 8;
  if (p.address && p.city && p.commune) score += 10;
  if (p.district || p.profession || p.whatsapp) score += 4;

  if (req.requestedRole === "AGENCE") {
    const c = req.companyInformation || {};
    if (c.legalName && c.rccm) score += 10;
    if (req.representative?.lastName) score += 6;
    if (req.activityType) score += 4;
    if (c.experienceYears || c.experienceStartYear) score += 4;
    if (c.experienceSummary) score += 2;
  } else {
    score += 8;
  }

  const hasFile = (type) =>
    docs.some((d) => d.documentType === type && d.fileName && d.fileUrl);

  // Identité (obligatoire)
  if (p.idType === "PASSEPORT") {
    if (hasFile("PASSEPORT") && p.idNumber) score += 12;
  } else if (hasFile("CNI_RECTO") && hasFile("CNI_VERSO") && p.idNumber) {
    score += 14;
  }

  // Selfie (obligatoire — politique interne)
  if (hasFile("SELFIE_VERIFICATION")) score += 8;

  // Facultatif propriétaire
  if (hasFile("JUSTIFICATIF_DOMICILE")) score += 2;

  if (req.requestedRole === "AGENCE") {
    if (hasFile("RCCM")) score += 6;
    if (hasFile("STATUTS_SOCIETE")) score += 4;
    if (hasFile("EXPERIENCE_PROOF")) score += 2;
    if (hasFile("JUSTIFICATIF_SIEGE") || hasFile("LOGO_AGENCE")) score += 1;

    // Conditionnels promoteur (comptent seulement si activité = promoteur)
    if (req.activityType === "PROMOTEUR_IMMOBILIER") {
      if (hasFile("AGREMENT_PROMOTEUR")) score += 6;
      if (hasFile("QUALIFICATIONS_REPRESENTANT")) score += 4;
      if (
        hasFile("CASIER_JUDICIAIRE_REP") ||
        hasFile("ASSURANCE_RCP") ||
        hasFile("GARANTIE_FINANCIERE")
      ) {
        score += 2;
      }
    }
  }

  const decls = req.declarations || {};
  if (
    decls.accuracy &&
    decls.authorization &&
    decls.processing &&
    decls.privacy
  ) {
    score += 8;
  }

  return Math.min(100, score);
}

function docsForRequest(db, req) {
  const ids = new Set(req.documentIds || []);
  return (db.verificationDocuments || []).filter((d) => ids.has(d.id));
}

function requiredDocsOk(req, docs) {
  const hasIdentity = docs.some((d) =>
    ["CNI_RECTO", "CNI_VERSO", "PASSEPORT"].includes(d.documentType),
  );
  if (!hasIdentity) return false;
  if (req.requestedRole === "AGENCE") {
    const hasRccm = docs.some((d) => d.documentType === "RCCM");
    const hasRepId = docs.some((d) =>
      ["CNI_RECTO", "PASSEPORT", "REP_CNI", "REP_PASSEPORT"].includes(
        d.documentType,
      ),
    );
    if (!hasRccm || !hasRepId) return false;
    if (req.activityType === "PROMOTEUR_IMMOBILIER") {
      if (!docs.some((d) => d.documentType === "AGREMENT_PROMOTEUR")) {
        return false;
      }
    }
  }
  // Seules les pièces réellement exigées bloquent : une pièce facultative
  // laissée EN_ATTENTE n’empêche pas la validation du compte.
  const allValidated = docs
    .filter((d) => isMandatoryDoc(d, req))
    .every((d) => d.verificationStatus === "VALIDE");
  return allValidated;
}

function isMandatoryDoc(doc, req) {
  if (doc.required === false) return false;
  return documentClassification(doc.documentType, req || {}).mandatory;
}

function documentClassification(documentType, req) {
  const role = req?.requestedRole;
  const activity = req?.activityType;
  const map = {
    CNI_RECTO: { level: "OBLIGATOIRE", reason: "Identité" },
    CNI_VERSO: { level: "OBLIGATOIRE", reason: "Identité" },
    PASSEPORT: { level: "OBLIGATOIRE", reason: "Identité" },
    SELFIE_VERIFICATION: {
      level: "OBLIGATOIRE",
      reason: "Contrôle interne Demeure Guinée",
    },
    JUSTIFICATIF_DOMICILE: { level: "FACULTATIF", reason: "Adresse" },
    RCCM: { level: "OBLIGATOIRE", reason: "Entreprise" },
    STATUTS_SOCIETE: { level: "OBLIGATOIRE", reason: "Entreprise" },
    JUSTIFICATIF_SIEGE: { level: "FACULTATIF", reason: "Siège" },
    LOGO_AGENCE: { level: "FACULTATIF", reason: "Présentation" },
    EXPERIENCE_PROOF: { level: "FACULTATIF", reason: "Expérience professionnelle" },
    AGREMENT_PROMOTEUR: {
      level: "CONDITIONNEL",
      reason: "Requis car l’activité déclarée est PROMOTEUR_IMMOBILIER.",
      mandatoryWhenActive: true,
    },
    QUALIFICATIONS_REPRESENTANT: {
      level: "CONDITIONNEL",
      reason: "Requis car l’activité déclarée est PROMOTEUR_IMMOBILIER.",
      mandatoryWhenActive: true,
    },
    CASIER_JUDICIAIRE_REP: {
      level: "CONDITIONNEL",
      reason:
        "Demandé à titre complémentaire car l’activité déclarée est PROMOTEUR_IMMOBILIER.",
      mandatoryWhenActive: false,
    },
    ASSURANCE_RCP: {
      level: "CONDITIONNEL",
      reason:
        "Demandé à titre complémentaire car l’activité déclarée est PROMOTEUR_IMMOBILIER.",
      mandatoryWhenActive: false,
    },
    GARANTIE_FINANCIERE: {
      level: "CONDITIONNEL",
      reason:
        "Demandé à titre complémentaire car l’activité déclarée est PROMOTEUR_IMMOBILIER.",
      mandatoryWhenActive: false,
    },
  };
  const base = map[documentType] || {
    level: "FACULTATIF",
    reason: "Pièce complémentaire",
  };
  const withMandatory = (entry) => ({
    level: entry.level,
    reason: entry.reason,
    mandatory:
      entry.level === "OBLIGATOIRE" ||
      (entry.level === "CONDITIONNEL" && entry.mandatoryWhenActive === true),
  });
  if (
    base.level === "CONDITIONNEL" &&
    activity !== "PROMOTEUR_IMMOBILIER"
  ) {
    return withMandatory({ level: "NON_APPLICABLE", reason: "Non applicable" });
  }
  if (role === "PROPRIETAIRE" && ["RCCM", "STATUTS_SOCIETE"].includes(documentType)) {
    return withMandatory({ level: "NON_APPLICABLE", reason: "Non applicable" });
  }
  return withMandatory(base);
}

function publicDocView(doc, req) {
  const classification = documentClassification(doc.documentType, req || {});
  return {
    id: doc.id,
    ownerType: doc.ownerType,
    ownerId: doc.ownerId,
    roleRequestId: doc.roleRequestId || null,
    propertyId: doc.propertyId || null,
    documentType: doc.documentType,
    label: doc.label || doc.documentType,
    side: doc.side || null,
    reference: doc.reference || null,
    issuer: doc.issuer || null,
    issuedAt: doc.issuedAt || null,
    expiresAt: doc.expiresAt || null,
    holderName: doc.holderName || null,
    fileName: doc.fileName || null,
    fileUrl: doc.fileUrl || null,
    mimeType: doc.mimeType || null,
    fileSize: doc.fileSize || null,
    verificationStatus: doc.verificationStatus || "EN_ATTENTE",
    verifiedByAdminId: doc.verifiedByAdminId || null,
    verifiedAt: doc.verifiedAt || null,
    rejectionReason: doc.rejectionReason || null,
    requirementLevel: classification.level,
    requirementReason: classification.reason,
    requirementMandatory: classification.mandatory && doc.required !== false,
    demo: doc.demo === true,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

module.exports = {
  ROLE_REQUEST_STATUSES,
  DOC_STATUSES,
  PROPERTY_LEGAL_STATUSES,
  REQUIRE_PROPERTY_LEGAL_VERIFICATION_FOR_PUBLICATION,
  ensureVerificationCollections,
  pushHistory,
  pushNotification,
  computeCompleteness,
  docsForRequest,
  requiredDocsOk,
  isMandatoryDoc,
  publicDocView,
  documentClassification,
  nowIso,
  uid,
  refRole,
};
