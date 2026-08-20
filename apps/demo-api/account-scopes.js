/**
 * Scopes de compte (OwnerProfile / Agency) — Demo API.
 * Types & opérations canoniques alignés sur le frontend immobilier.
 */

const PROPERTY_TYPE_KEYS = [
  "TERRAIN",
  "MAISON",
  "VILLA",
  "APPARTEMENT",
  "BUREAU",
  "COMMERCE",
];

const PROPERTY_TYPE_LABELS = {
  TERRAIN: "Terrain",
  MAISON: "Maison",
  VILLA: "Villa",
  APPARTEMENT: "Appartement",
  BUREAU: "Bureau",
  COMMERCE: "Commerce",
};

const OPERATIONS = ["VENTE", "LOCATION"];

const PORTFOLIO_SIZES = ["ONE", "TWO_TO_FIVE", "MORE_THAN_FIVE"];

const PROFILE_TYPES = ["PARTICULIER", "MULTI_BIENS", "PROFESSIONNEL"];

const SECTION_STATUSES = new Set([
  "EN_ATTENTE",
  "VERIFIE",
  "A_CORRIGER",
  "REFUSE",
]);

const CAPABILITY_PRESETS = {
  PROPRIETAIRE_PARTICULIER: {
    createOwnProperty: true,
    editOwnProperty: true,
    createOwnListing: true,
    submitListingForModeration: true,
    directPublish: false,
    manageOtherUsers: false,
    editOtherProperties: false,
  },
  PROPRIETAIRE_MULTI_BIENS: {
    createOwnProperty: true,
    editOwnProperty: true,
    createOwnListing: true,
    submitListingForModeration: true,
    directPublish: false,
    manageOtherUsers: false,
    editOtherProperties: false,
  },
  PROPRIETAIRE_PROFESSIONNEL: {
    createOwnProperty: true,
    editOwnProperty: true,
    createOwnListing: true,
    submitListingForModeration: true,
    directPublish: false,
    manageOtherUsers: false,
    editOtherProperties: false,
  },
  AGENCE_IMMOBILIERE: {
    createOwnProperty: true,
    editOwnProperty: true,
    createOwnListing: true,
    submitListingForModeration: true,
    directPublish: false,
    manageOtherUsers: false,
    editOtherProperties: true,
    agencyStats: true,
    agencyContacts: true,
  },
  PROMOTEUR_IMMOBILIER: {
    createOwnProperty: true,
    editOwnProperty: true,
    createOwnListing: true,
    submitListingForModeration: true,
    directPublish: false,
    manageOtherUsers: false,
    editOtherProperties: true,
    agencyStats: true,
  },
  AMENAGEUR_LOTISSEUR: {
    createOwnProperty: true,
    editOwnProperty: true,
    createOwnListing: true,
    submitListingForModeration: true,
    directPublish: false,
    manageOtherUsers: false,
    editOtherProperties: true,
  },
  AUTRE_PROFESSIONNEL: {
    createOwnProperty: true,
    editOwnProperty: true,
    createOwnListing: true,
    submitListingForModeration: true,
    directPublish: false,
    manageOtherUsers: false,
    editOtherProperties: false,
  },
};

function nowIso() {
  return new Date().toISOString();
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizePropertyTypeKey(type) {
  const raw = String(type || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (!raw) return null;
  if (raw.includes("TERRAIN") || raw === "LAND") return "TERRAIN";
  if (raw.includes("APPART")) return "APPARTEMENT";
  if (raw.includes("VILLA")) return "VILLA";
  if (raw.includes("MAISON") || raw.includes("HOUSE")) return "MAISON";
  if (raw.includes("BUREAU") || raw.includes("OFFICE")) return "BUREAU";
  if (
    raw.includes("COMMERCE") ||
    raw.includes("LOCAL") ||
    raw.includes("ENTREPOT") ||
    raw.includes("WAREHOUSE")
  ) {
    return "COMMERCE";
  }
  if (raw.includes("IMMEUBLE")) return "APPARTEMENT";
  if (PROPERTY_TYPE_KEYS.includes(raw)) return raw;
  return null;
}

function normalizeOperation(op) {
  const raw = String(op || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (!raw) return null;
  if (raw === "VENTE" || raw === "SALE" || raw === "SELL" || raw.includes("VEND")) {
    return "VENTE";
  }
  if (raw === "LOCATION" || raw === "RENT" || raw.includes("LOUER") || raw.includes("LOCAT")) {
    return "LOCATION";
  }
  return null;
}

function normalizeTypeList(list) {
  const out = [];
  for (const item of list || []) {
    const key = normalizePropertyTypeKey(item);
    if (key && !out.includes(key)) out.push(key);
  }
  return out;
}

function normalizeOperationList(list) {
  const out = [];
  for (const item of list || []) {
    const key = normalizeOperation(item);
    if (key && !out.includes(key)) out.push(key);
  }
  return out;
}

function normalizePortfolioSize(value) {
  const raw = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[-\s]+/g, "_");
  if (PORTFOLIO_SIZES.includes(raw)) return raw;
  if (raw === "1" || raw === "UN" || raw === "ONE_BIEN") return "ONE";
  if (raw.includes("2") || raw.includes("TWO") || raw.includes("CINQ")) {
    return "TWO_TO_FIVE";
  }
  if (raw.includes("MORE") || raw.includes("PLUS") || raw.includes("5")) {
    return "MORE_THAN_FIVE";
  }
  return null;
}

/** Aliases used by server routes */
const normalizePropertyTypes = normalizeTypeList;
const normalizeOperations = normalizeOperationList;

const PORTFOLIO_WEIGHT = { ONE: 1, TWO_TO_FIVE: 2, MORE_THAN_FIVE: 3 };

/**
 * Modèle relationnel déclaré : un intent = un type de bien + ses opérations
 * + le volume annoncé. Les listes plates restent dérivées pour compatibilité.
 */
function normalizeIntentList(list) {
  const out = [];
  for (const raw of list || []) {
    const typeKey = normalizePropertyTypeKey(
      raw?.propertyType ?? raw?.type ?? raw,
    );
    if (!typeKey) continue;
    const operations = normalizeOperationList(
      raw?.operations || raw?.operation ? [].concat(raw.operations || raw.operation) : [],
    );
    const quantityRange =
      normalizePortfolioSize(raw?.quantityRange ?? raw?.portfolioSize) || null;
    const existing = out.find((i) => i.propertyType === typeKey);
    if (existing) {
      for (const op of operations) {
        if (!existing.operations.includes(op)) existing.operations.push(op);
      }
      if (
        quantityRange &&
        (PORTFOLIO_WEIGHT[quantityRange] || 0) >
          (PORTFOLIO_WEIGHT[existing.quantityRange] || 0)
      ) {
        existing.quantityRange = quantityRange;
      }
      continue;
    }
    out.push({ propertyType: typeKey, operations, quantityRange });
  }
  return out;
}

/** Construit les intents depuis les anciens champs plats (formulaire public V1). */
function intentsFromFlat(types, operations, portfolioSize) {
  const typeKeys = normalizeTypeList(types);
  const ops = normalizeOperationList(operations);
  const size = normalizePortfolioSize(portfolioSize);
  return typeKeys.map((propertyType) => ({
    propertyType,
    operations: [...ops],
    quantityRange: size,
  }));
}

/** Dérive les champs plats depuis les intents (aucune perte pour l’existant). */
function flatFromIntents(intents) {
  const list = normalizeIntentList(intents);
  const types = [];
  const operations = [];
  let portfolioSize = null;
  for (const intent of list) {
    if (!types.includes(intent.propertyType)) types.push(intent.propertyType);
    for (const op of intent.operations) {
      if (!operations.includes(op)) operations.push(op);
    }
    if (
      intent.quantityRange &&
      (PORTFOLIO_WEIGHT[intent.quantityRange] || 0) >
        (PORTFOLIO_WEIGHT[portfolioSize] || 0)
    ) {
      portfolioSize = intent.quantityRange;
    }
  }
  return { types, operations, portfolioSize };
}

/** Scopes accordés : un type + les opérations réellement autorisées dessus. */
function normalizeScopeList(list) {
  const out = [];
  for (const raw of list || []) {
    const typeKey = normalizePropertyTypeKey(raw?.propertyType ?? raw?.type ?? raw);
    if (!typeKey) continue;
    const operations = normalizeOperationList(
      raw?.operations || raw?.operation ? [].concat(raw.operations || raw.operation) : [],
    );
    const existing = out.find((s) => s.propertyType === typeKey);
    if (existing) {
      for (const op of operations) {
        if (!existing.operations.includes(op)) existing.operations.push(op);
      }
      continue;
    }
    out.push({ propertyType: typeKey, operations });
  }
  return out;
}

function scopesFromFlat(types, operations) {
  const ops = normalizeOperationList(operations);
  return normalizeTypeList(types).map((propertyType) => ({
    propertyType,
    operations: [...ops],
  }));
}

function scopesFromIntents(intents, fallbackOperations) {
  const fallback = normalizeOperationList(fallbackOperations);
  return normalizeIntentList(intents).map((intent) => ({
    propertyType: intent.propertyType,
    operations: intent.operations.length > 0 ? [...intent.operations] : [...fallback],
  }));
}

/**
 * Scopes retenus pour une configuration : explicites si fournis,
 * sinon produit croisé types × opérations (comportement V1).
 */
function resolveConfigScopes(config) {
  const explicit = normalizeScopeList(config?.allowedPropertyScopes || []);
  if (explicit.length > 0) return explicit;
  return scopesFromFlat(
    config?.allowedPropertyTypes || [],
    config?.allowedOperations || [],
  );
}

/** Union de deux jeux de scopes (extension de compte). */
function mergeScopeLists(current, added) {
  const out = normalizeScopeList(current);
  for (const scope of normalizeScopeList(added)) {
    const existing = out.find((s) => s.propertyType === scope.propertyType);
    if (!existing) {
      out.push({ propertyType: scope.propertyType, operations: [...scope.operations] });
      continue;
    }
    for (const op of scope.operations) {
      if (!existing.operations.includes(op)) existing.operations.push(op);
    }
  }
  return out;
}

/**
 * Delta d'une demande d'extension : ce qui est demandé moins ce qui est déjà
 * accordé. Un type dont toutes les opérations sont déjà actives disparaît.
 */
function subtractScopeLists(requested, granted) {
  const base = normalizeScopeList(granted);
  const out = [];
  for (const scope of normalizeScopeList(requested)) {
    const existing = base.find((s) => s.propertyType === scope.propertyType);
    const missing = scope.operations.filter(
      (op) => !existing || !existing.operations.includes(op),
    );
    if (missing.length > 0) {
      out.push({ propertyType: scope.propertyType, operations: missing });
    }
  }
  return out;
}

/** Égalité stricte de deux jeux de scopes (détection de doublon). */
function sameScopeLists(a, b) {
  const key = (list) =>
    normalizeScopeList(list)
      .map((s) => `${s.propertyType}:${[...s.operations].sort().join("+")}`)
      .sort()
      .join("|");
  return key(a) === key(b);
}

function scopesToFlat(scopes) {
  const list = normalizeScopeList(scopes);
  const types = [];
  const operations = [];
  for (const scope of list) {
    if (!types.includes(scope.propertyType)) types.push(scope.propertyType);
    for (const op of scope.operations) {
      if (!operations.includes(op)) operations.push(op);
    }
  }
  return { types, operations };
}

function ensureAccountScopeCollections(db) {
  db.ownerProfiles = db.ownerProfiles || [];
  db.accountScopeRequests = db.accountScopeRequests || [];
  db.accountScopeHistory = db.accountScopeHistory || [];
  return db;
}

function defaultSectionReviews() {
  return {
    identity: { status: "EN_ATTENTE", message: null, updatedAt: null },
    documents: { status: "EN_ATTENTE", message: null, updatedAt: null },
    declaredProfile: { status: "EN_ATTENTE", message: null, updatedAt: null },
    company: { status: "EN_ATTENTE", message: null, updatedAt: null },
  };
}

function proposeConfigFromRequest(item) {
  const intents = normalizeIntentList(
    item.declaredPropertyIntents && item.declaredPropertyIntents.length > 0
      ? item.declaredPropertyIntents
      : intentsFromFlat(
          item.declaredPropertyTypes,
          item.declaredOperations,
          item.declaredPortfolioSize,
        ),
  );
  const flat = flatFromIntents(intents);
  const declaredTypes =
    flat.types.length > 0
      ? flat.types
      : normalizeTypeList(item.declaredPropertyTypes || []);
  const declaredOps =
    flat.operations.length > 0
      ? flat.operations
      : normalizeOperationList(item.declaredOperations || []);
  const size = flat.portfolioSize || item.declaredPortfolioSize || "ONE";

  if (item.requestedRole === "AGENCE") {
    const activity = item.activityType || "AGENCE_IMMOBILIERE";
    let preset = "AGENCE_IMMOBILIERE";
    if (activity === "PROMOTEUR_IMMOBILIER") preset = "PROMOTEUR_IMMOBILIER";
    else if (activity === "AMENAGEUR_LOTISSEUR") preset = "AMENAGEUR_LOTISSEUR";
    else if (
      activity === "AUTRE_PROFESSIONNEL_IMMOBILIER" ||
      activity === "AUTRE"
    ) {
      preset = "AUTRE_PROFESSIONNEL";
    }
    const agencyTypes =
      declaredTypes.length > 0
        ? declaredTypes
        : ["TERRAIN", "MAISON", "VILLA", "APPARTEMENT"];
    const agencyOps =
      declaredOps.length > 0 ? declaredOps : ["VENTE", "LOCATION"];
    return {
      role: "AGENCE",
      profileType: null,
      activityType: activity,
      preset,
      allowedPropertyTypes: agencyTypes,
      allowedOperations: agencyOps,
      allowedPropertyScopes:
        intents.length > 0
          ? scopesFromIntents(intents, agencyOps)
          : scopesFromFlat(agencyTypes, agencyOps),
      capabilities: { ...CAPABILITY_PRESETS[preset] },
    };
  }

  let profileType = "PARTICULIER";
  let preset = "PROPRIETAIRE_PARTICULIER";
  if (size === "MORE_THAN_FIVE") {
    profileType = "PROFESSIONNEL";
    preset = "PROPRIETAIRE_PROFESSIONNEL";
  } else if (size === "TWO_TO_FIVE" || declaredTypes.length > 1) {
    profileType = "MULTI_BIENS";
    preset = "PROPRIETAIRE_MULTI_BIENS";
  }

  const ownerTypes = declaredTypes.length > 0 ? declaredTypes : ["TERRAIN"];
  const ownerOps = declaredOps.length > 0 ? declaredOps : ["VENTE"];
  return {
    role: "PROPRIETAIRE",
    profileType,
    activityType: null,
    preset,
    allowedPropertyTypes: ownerTypes,
    allowedOperations: ownerOps,
    allowedPropertyScopes:
      intents.length > 0
        ? scopesFromIntents(intents, ownerOps)
        : scopesFromFlat(ownerTypes, ownerOps),
    capabilities: { ...CAPABILITY_PRESETS[preset] },
  };
}

function findOwnerProfile(db, userId) {
  ensureAccountScopeCollections(db);
  return (db.ownerProfiles || []).find((p) => p.userId === userId) || null;
}

function pushScopeHistory(db, entry) {
  ensureAccountScopeCollections(db);
  db.accountScopeHistory.unshift({
    id: uid("scope-hist"),
    createdAt: nowIso(),
    ...entry,
  });
}

function upsertOwnerProfile(db, userId, config, admin) {
  ensureAccountScopeCollections(db);
  let profile = findOwnerProfile(db, userId);
  const stamp = nowIso();
  const scopes = resolveConfigScopes(config);
  const flat = scopesToFlat(scopes);
  const next = {
    profileType: config.profileType || "PARTICULIER",
    verificationStatus: "VERIFIE",
    allowedPropertyTypes:
      flat.types.length > 0
        ? flat.types
        : normalizeTypeList(config.allowedPropertyTypes || []),
    allowedOperations:
      flat.operations.length > 0
        ? flat.operations
        : normalizeOperationList(config.allowedOperations || []),
    allowedPropertyScopes: scopes,
    capabilities:
      config.capabilities ||
      CAPABILITY_PRESETS[config.preset || "PROPRIETAIRE_PARTICULIER"],
    preset: config.preset || "PROPRIETAIRE_PARTICULIER",
    configuredByAdminId: config.configuredByAdminId || admin?.id || null,
    configuredAt: config.configuredAt || stamp,
    approvedByAdminId: config.approvedByAdminId || admin?.id || null,
    approvedAt: config.approvedAt || stamp,
    updatedAt: stamp,
  };

  if (!profile) {
    profile = {
      id: uid("owner-profile"),
      userId,
      createdAt: stamp,
      ...next,
    };
    db.ownerProfiles.unshift(profile);
    pushScopeHistory(db, {
      userId,
      adminId: admin?.id || null,
      action: "OWNER_PROFILE_CREATED",
      before: null,
      after: {
        allowedPropertyTypes: profile.allowedPropertyTypes,
        allowedOperations: profile.allowedOperations,
        allowedPropertyScopes: profile.allowedPropertyScopes,
        profileType: profile.profileType,
      },
      reason: "Validation demande de rôle",
    });
  } else {
    const before = {
      allowedPropertyTypes: [...(profile.allowedPropertyTypes || [])],
      allowedOperations: [...(profile.allowedOperations || [])],
      allowedPropertyScopes: normalizeScopeList(profile.allowedPropertyScopes || []),
      profileType: profile.profileType,
    };
    Object.assign(profile, next);
    pushScopeHistory(db, {
      userId,
      adminId: admin?.id || null,
      action: "OWNER_PROFILE_UPDATED",
      before,
      after: {
        allowedPropertyTypes: profile.allowedPropertyTypes,
        allowedOperations: profile.allowedOperations,
        allowedPropertyScopes: profile.allowedPropertyScopes,
        profileType: profile.profileType,
      },
      reason: config.reason || "Configuration compte",
    });
  }
  return profile;
}

function applyAgencyConfiguration(db, agency, config, admin) {
  const stamp = nowIso();
  const before = {
    allowedPropertyTypes: [...(agency.allowedPropertyTypes || [])],
    allowedOperations: [...(agency.allowedOperations || [])],
    allowedPropertyScopes: normalizeScopeList(agency.allowedPropertyScopes || []),
    activityType: agency.activityType || null,
  };
  const scopes = resolveConfigScopes(config);
  const flat = scopesToFlat(scopes);
  agency.verificationStatus = "VERIFIE";
  agency.verified = true;
  agency.documentsVerified = true;
  agency.activityType = config.activityType || agency.activityType;
  agency.allowedPropertyTypes =
    flat.types.length > 0
      ? flat.types
      : normalizeTypeList(config.allowedPropertyTypes || []);
  agency.allowedOperations =
    flat.operations.length > 0
      ? flat.operations
      : normalizeOperationList(config.allowedOperations || []);
  agency.allowedPropertyScopes = scopes;
  agency.capabilities =
    config.capabilities ||
    CAPABILITY_PRESETS[config.preset || "AGENCE_IMMOBILIERE"];
  agency.preset = config.preset || "AGENCE_IMMOBILIERE";
  agency.configuredByAdminId = admin?.id || null;
  agency.configuredAt = config.configuredAt || stamp;
  agency.approvedByAdminId = config.approvedByAdminId || admin?.id || null;
  agency.approvedAt = config.approvedAt || stamp;
  agency.updatedAt = stamp;
  pushScopeHistory(db, {
    userId: agency.userId || null,
    agencyId: agency.id,
    adminId: admin?.id || null,
    action: "AGENCY_SCOPE_CONFIGURED",
    before,
    after: {
      allowedPropertyTypes: agency.allowedPropertyTypes,
      allowedOperations: agency.allowedOperations,
      allowedPropertyScopes: agency.allowedPropertyScopes,
      activityType: agency.activityType,
    },
    reason: config.reason || "Validation demande de rôle",
  });
  return agency;
}

function resolveAccountScope(db, { ownerId, agencyId }) {
  ensureAccountScopeCollections(db);
  if (agencyId) {
    const agency = (db.agencies || []).find((a) => a.id === agencyId);
    if (!agency) return null;
    if (
      !agency.allowedPropertyTypes ||
      agency.allowedPropertyTypes.length === 0
    ) {
      return null; // pas encore scopé → laisser passer (legacy) sauf si explicitement vide après migration
    }
    const agencyOps = agency.allowedOperations || ["VENTE", "LOCATION"];
    return {
      kind: "AGENCY",
      allowedPropertyTypes: agency.allowedPropertyTypes,
      allowedOperations: agencyOps,
      allowedPropertyScopes:
        normalizeScopeList(agency.allowedPropertyScopes || []).length > 0
          ? normalizeScopeList(agency.allowedPropertyScopes)
          : scopesFromFlat(agency.allowedPropertyTypes, agencyOps),
      verificationStatus: agency.verificationStatus || (agency.verified ? "VERIFIE" : null),
    };
  }
  if (ownerId) {
    const profile = findOwnerProfile(db, ownerId);
    if (!profile) return null;
    const ownerOps = profile.allowedOperations || [];
    return {
      kind: "OWNER",
      allowedPropertyTypes: profile.allowedPropertyTypes || [],
      allowedOperations: ownerOps,
      allowedPropertyScopes:
        normalizeScopeList(profile.allowedPropertyScopes || []).length > 0
          ? normalizeScopeList(profile.allowedPropertyScopes)
          : scopesFromFlat(profile.allowedPropertyTypes || [], ownerOps),
      verificationStatus: profile.verificationStatus,
    };
  }
  return null;
}

function assertScopeAllowsProperty(db, { ownerId, agencyId, type, operation }) {
  const scope = resolveAccountScope(db, { ownerId, agencyId });
  // Legacy sans profil : autoriser (migration progressive)
  if (!scope) return { ok: true, legacy: true };

  const typeKey = normalizePropertyTypeKey(type);
  const opKey = normalizeOperation(operation || "VENTE");

  if (
    typeKey &&
    scope.allowedPropertyTypes?.length > 0 &&
    !scope.allowedPropertyTypes.includes(typeKey)
  ) {
    return {
      ok: false,
      status: 403,
      error: "PROPERTY_TYPE_NOT_ALLOWED",
      message: `Type de bien non autorisé pour ce profil (${typeKey}).`,
      allowedPropertyTypes: scope.allowedPropertyTypes,
    };
  }

  if (
    opKey &&
    scope.allowedOperations?.length > 0 &&
    !scope.allowedOperations.includes(opKey)
  ) {
    return {
      ok: false,
      status: 403,
      error: "OPERATION_NOT_ALLOWED",
      message: `Opération non autorisée pour ce profil (${opKey}).`,
      allowedOperations: scope.allowedOperations,
    };
  }

  // Contrôle relationnel : l’opération doit être autorisée sur CE type de bien.
  const typeScope = (scope.allowedPropertyScopes || []).find(
    (s) => s.propertyType === typeKey,
  );
  if (typeScope && opKey && typeScope.operations.length > 0) {
    if (!typeScope.operations.includes(opKey)) {
      return {
        ok: false,
        status: 403,
        error: "OPERATION_NOT_ALLOWED_FOR_TYPE",
        message: `Opération ${opKey} non autorisée sur le type ${typeKey} pour ce profil.`,
        allowedOperations: typeScope.operations,
        propertyType: typeKey,
      };
    }
  }

  return { ok: true, scope };
}

function migrateDemoAccountScopes(db) {
  ensureAccountScopeCollections(db);
  const users = db.users || [];
  const properties = db.properties || [];

  // Les scopes sont lus par userId : une agence dont le compte utilisateur
  // n'existe pas renvoie un périmètre vide côté espace agence.
  for (const agency of db.agencies || []) {
    if (!agency.userId) continue;
    if (users.some((u) => u.id === agency.userId)) continue;
    users.push({
      id: agency.userId,
      firstName: agency.managerName || agency.name,
      lastName: "",
      name: agency.managerName || agency.name,
      email: agency.managerEmail || agency.email,
      phone: agency.managerPhone || agency.phone || "",
      role: "AGENCE",
      status: "ACTIF",
      roleVerified: Boolean(agency.verified),
      documentsVerified: Boolean(agency.documentsVerified),
      verificationStatus: agency.verificationStatus || "VERIFIE",
      password: "Demo1234!",
      createdAt: nowIso(),
      updatedAt: nowIso(),
      demo: true,
      demoScenario: "AGENCY_ACCOUNT_BACKFILL",
    });
  }

  for (const user of users) {
    if (user.role !== "PROPRIETAIRE") continue;
    if (findOwnerProfile(db, user.id)) continue;
    const owned = properties.filter((p) => p.ownerId === user.id);
    const types = normalizeTypeList(owned.map((p) => p.type));
    const ops = normalizeOperationList(owned.map((p) => p.operation));
    upsertOwnerProfile(
      db,
      user.id,
      {
        profileType: types.length > 1 ? "MULTI_BIENS" : "PARTICULIER",
        preset:
          types.length > 1
            ? "PROPRIETAIRE_MULTI_BIENS"
            : "PROPRIETAIRE_PARTICULIER",
        allowedPropertyTypes: types.length > 0 ? types : ["TERRAIN", "MAISON", "VILLA"],
        allowedOperations: ops.length > 0 ? ops : ["VENTE", "LOCATION"],
        reason: "Migration Demo depuis biens existants",
      },
      { id: "system-migration" },
    );
  }

  for (const agency of db.agencies || []) {
    if (agency.allowedPropertyTypes && agency.allowedPropertyTypes.length) {
      continue;
    }
    const owned = properties.filter((p) => p.agencyId === agency.id);
    const types = normalizeTypeList(owned.map((p) => p.type));
    const ops = normalizeOperationList(owned.map((p) => p.operation));
    agency.allowedPropertyTypes =
      types.length > 0
        ? types
        : ["TERRAIN", "MAISON", "VILLA", "APPARTEMENT", "BUREAU", "COMMERCE"];
    agency.allowedOperations =
      ops.length > 0 ? ops : ["VENTE", "LOCATION"];
    agency.verificationStatus =
      agency.verificationStatus || (agency.verified ? "VERIFIE" : "EN_ATTENTE");
    agency.preset = agency.preset || "AGENCE_IMMOBILIERE";
    agency.capabilities =
      agency.capabilities || CAPABILITY_PRESETS.AGENCE_IMMOBILIERE;
  }

  // Scopes relationnels : dérivés des listes plates si absents.
  for (const agency of db.agencies || []) {
    if (normalizeScopeList(agency.allowedPropertyScopes || []).length > 0) {
      continue;
    }
    const scopes = scopesFromFlat(
      agency.allowedPropertyTypes || [],
      agency.allowedOperations || [],
    );
    if (scopes.length > 0) agency.allowedPropertyScopes = scopes;
  }
  for (const profile of db.ownerProfiles || []) {
    if (normalizeScopeList(profile.allowedPropertyScopes || []).length > 0) {
      continue;
    }
    const scopes = scopesFromFlat(
      profile.allowedPropertyTypes || [],
      profile.allowedOperations || [],
    );
    if (scopes.length > 0) profile.allowedPropertyScopes = scopes;
  }
}

function previewAccess(config) {
  const scopes = resolveConfigScopes(config);
  const flat = scopesToFlat(scopes);
  const types =
    flat.types.length > 0
      ? flat.types
      : normalizeTypeList(config.allowedPropertyTypes || []);
  const ops =
    flat.operations.length > 0
      ? flat.operations
      : normalizeOperationList(config.allowedOperations || []);
  const typeLabels = types.map((t) => PROPERTY_TYPE_LABELS[t] || t);
  const allowed = [
    config.role === "AGENCE" ? "Espace Agence" : "Espace Propriétaire",
    config.role === "AGENCE" ? "Portefeuille biens" : "Mes biens",
    ...scopes.map((scope) => {
      const label = PROPERTY_TYPE_LABELS[scope.propertyType] || scope.propertyType;
      const scopeOps = scope.operations.length > 0 ? scope.operations : ops;
      const opLabels = scopeOps
        .map((o) => (o === "VENTE" ? "Vente" : "Location"))
        .join(" + ");
      return `Ajouter / gérer : ${label}${opLabels ? ` (${opLabels})` : ""}`;
    }),
    "Soumettre une annonce à modération",
  ];
  const denied = [
    ...PROPERTY_TYPE_KEYS.filter((t) => !types.includes(t)).map(
      (t) => `Type ${PROPERTY_TYPE_LABELS[t]}`,
    ),
    ...scopes
      .filter(
        (scope) => scope.operations.length > 0 && scope.operations.length < OPERATIONS.length,
      )
      .flatMap((scope) =>
        OPERATIONS.filter((o) => !scope.operations.includes(o)).map(
          (o) =>
            `${o === "VENTE" ? "Vente" : "Location"} sur ${
              PROPERTY_TYPE_LABELS[scope.propertyType] || scope.propertyType
            }`,
        ),
      ),
    "Publication directe sans modération",
  ];
  return { allowed, denied, typeLabels, operations: ops, scopes };
}

function canFinalizeApproval(item, documents, requiredDocsOkFn) {
  const sections = item.sectionReviews || defaultSectionReviews();
  if (sections.identity?.status !== "VERIFIE") {
    return { ok: false, error: "La section Identité doit être marquée VERIFIE." };
  }
  if (!requiredDocsOkFn(item, documents)) {
    return {
      ok: false,
      error:
        "Tous les documents obligatoires doivent être VALIDÉS avant approbation.",
    };
  }
  return { ok: true };
}

module.exports = {
  PROPERTY_TYPE_KEYS,
  PROPERTY_TYPE_LABELS,
  OPERATIONS,
  PORTFOLIO_SIZES,
  PROFILE_TYPES,
  SECTION_STATUSES,
  CAPABILITY_PRESETS,
  normalizePropertyTypeKey,
  normalizeOperation,
  normalizeTypeList,
  normalizeOperationList,
  normalizePropertyTypes,
  normalizeOperations,
  normalizePortfolioSize,
  normalizeIntentList,
  normalizeScopeList,
  intentsFromFlat,
  flatFromIntents,
  scopesFromFlat,
  scopesFromIntents,
  scopesToFlat,
  mergeScopeLists,
  subtractScopeLists,
  sameScopeLists,
  resolveConfigScopes,
  ensureAccountScopeCollections,
  defaultSectionReviews,
  proposeConfigFromRequest,
  findOwnerProfile,
  upsertOwnerProfile,
  applyAgencyConfiguration,
  resolveAccountScope,
  assertScopeAllowsProperty,
  migrateDemoAccountScopes,
  previewAccess,
  canFinalizeApproval,
  pushScopeHistory,
  nowIso,
  uid,
};
