/**
 * Demeure Guinée — Demo API (TEMPORAIRE)
 * Remplacée par Spring Boot + PostgreSQL.
 * Port: 4000
 */
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const https = require("https");
const dns = require("dns");
const multer = require("multer");

try {
  dns.setDefaultResultOrder("ipv4first");
} catch {
  /* Node ancien */
}

const PORT = process.env.PORT || 4000;
const DB_PATH = path.join(__dirname, "data", "db.json");
const PUBLIC_STATUSES = new Set(["PUBLIEE"]);
const NOMINATIM_UA = "DemeureGuinee-DemoAPI/1.0";
const { execFile } = require("child_process");
const {
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
  publicDocView,
  uid: verificationUid,
  refRole,
} = require("./role-verification");
const accountScopes = require("./account-scopes");
const listingTerms = require("./listing-terms");
const {
  ensureDemoVerificationScenarios,
} = require("./demo-verification-scenarios");

function httpsGetJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          Accept: "application/json",
          "Accept-Language": "fr",
          "User-Agent": NOMINATIM_UA,
        },
        timeout: 15000,
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`Nominatim ${res.statusCode}`));
            return;
          }
          try {
            resolve(JSON.parse(body || "null"));
          } catch (err) {
            reject(err);
          }
        });
      },
    );
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Nominatim timeout"));
    });
    req.on("error", reject);
  });
}

/** Repli Windows : curl.exe résout parfois DNS là où Node échoue (ENOTFOUND). */
function curlGetJson(url) {
  return new Promise((resolve, reject) => {
    execFile(
      "curl.exe",
      [
        "-sS",
        "--fail",
        "--max-time",
        "25",
        "--user-agent",
        NOMINATIM_UA,
        "-H",
        "Accept: application/json",
        "-H",
        "Accept-Language: fr",
        url,
      ],
      { windowsHide: true, maxBuffer: 4 * 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err) {
          reject(
            new Error(
              `curl Nominatim failed: ${err.message}${stderr ? ` ${stderr}` : ""}`,
            ),
          );
          return;
        }
        try {
          resolve(JSON.parse(String(stdout || "null")));
        } catch (parseErr) {
          reject(parseErr);
        }
      },
    );
  });
}

async function nominatimGetJson(url) {
  // Sur Windows, curl.exe est souvent plus fiable que le DNS Node pour Nominatim.
  if (process.platform === "win32") {
    try {
      return await curlGetJson(url);
    } catch (curlErr) {
      console.warn(
        "[geocoding] curl.exe failed, try Node HTTPS:",
        curlErr instanceof Error ? curlErr.message : curlErr,
      );
    }
  }
  return httpsGetJson(url);
}

function isDefinitiveRefusalNote(note) {
  return /fraude|ill[eé]gal|interdit|d[eé]finitif|supprim[eé]/i.test(
    String(note || ""),
  );
}

function normalizeListingRecord(listing) {
  let changed = false;
  if (listing.status === "REJETEE") {
    listing.status = "REFUSEE";
    changed = true;
  }
  if (listing.status === "REFUSEE") {
    if (listing.canResubmit === undefined) {
      listing.canResubmit = !isDefinitiveRefusalNote(listing.moderationNote);
      changed = true;
    }
    if (
      listing.resubmitRequiresVerifiedAdvertiser === undefined &&
      /non v[eé]rifi/i.test(String(listing.moderationNote || ""))
    ) {
      listing.resubmitRequiresVerifiedAdvertiser = true;
      changed = true;
    }
    if (listing.rejectionReason == null && listing.moderationNote) {
      listing.rejectionReason = listing.moderationNote;
      changed = true;
    }
  }
  if (listing.status === "A_CORRIGER" && listing.canResubmit === undefined) {
    listing.canResubmit = true;
    changed = true;
  }
  if (listingTerms.normalizeListingTermsRecord(listing)) changed = true;
  return changed;
}

const DEFAULT_ADMINS = [
  {
    id: "adm-1",
    email: "admin@demeureguinee.com",
    name: "Ibrahima Bah",
    role: "SUPER_ADMIN",
    permissions: ["TOUTES"],
    status: "ACTIF",
  },
  {
    id: "adm-2",
    email: "moderateur@demeureguinee.com",
    name: "Aïssatou Camara",
    role: "MODERATEUR",
    permissions: ["MODERATION", "SIGNALEMENTS", "ANNONCES"],
    status: "ACTIF",
  },
  {
    id: "adm-3",
    email: "support@demeureguinee.com",
    name: "Mamadou Diallo",
    role: "SUPPORT",
    permissions: ["UTILISATEURS_LECTURE", "UTILISATEURS_ECRITURE", "CONTACTS", "VERIFICATIONS"],
    status: "ACTIF",
  },
  {
    id: "adm-4",
    email: "contenu@demeureguinee.com",
    name: "Fatoumata Sylla",
    role: "CONTENT_ADMIN",
    permissions: ["CONTENUS", "FAQ", "GUIDES"],
    status: "ACTIF",
  },
  {
    id: "adm-6",
    email: "admin.ops@demeureguinee.com",
    name: "Sékou Touré",
    role: "ADMIN",
    permissions: [
      "MODERATION",
      "SIGNALEMENTS",
      "ANNONCES",
      "ANNONCES_ECRITURE",
      "ANNONCES_PUBLICATION",
      "BIENS_ECRITURE",
      "UTILISATEURS_LECTURE",
      "UTILISATEURS_ECRITURE",
      "CONTACTS",
      "VERIFICATIONS",
      "STATISTIQUES",
      "AUDIT",
    ],
    status: "ACTIF",
  },
  {
    id: "adm-7",
    email: "immobilier@demeureguinee.com",
    name: "Aminata Condé",
    role: "ADMIN",
    permissions: [
      "ANNONCES",
      "ANNONCES_ECRITURE",
      "ANNONCES_PUBLICATION",
      "BIENS_ECRITURE",
      "MODERATION",
      "SIGNALEMENTS",
      "CONTACTS",
      "VERIFICATIONS",
    ],
    status: "ACTIF",
  },
];

function ensureAdmins(db) {
  if (!Array.isArray(db.admins)) db.admins = [];
  let changed = false;
  for (const seed of DEFAULT_ADMINS) {
    const existing = db.admins.find(
      (a) => a.email === seed.email || a.id === seed.id,
    );
    if (!existing) {
      db.admins.push({ ...seed });
      changed = true;
      continue;
    }
    const same =
      existing.role === seed.role &&
      existing.status === seed.status &&
      existing.name === seed.name &&
      JSON.stringify(existing.permissions || []) ===
        JSON.stringify(seed.permissions);
    if (!same) {
      existing.role = seed.role;
      existing.permissions = [...seed.permissions];
      existing.name = seed.name;
      existing.status = seed.status;
      changed = true;
    }
  }
  return changed;
}

function buildLocationParts(property) {
  const city = String(property.city || "").trim();
  const commune = String(property.commune || "").trim();
  const district = String(
    property.district || property.quarter || "",
  ).trim();
  const landmark = String(property.landmark || property.repere || "").trim();
  return { city, commune, district, landmark };
}

function deriveLocationLabel(property) {
  const existing = String(property.locationLabel || "").trim();
  if (existing) return existing;
  const { city, commune, district } = buildLocationParts(property);
  return [district, commune, city].filter(Boolean).join(", ") || null;
}

function deriveAdminAddress(property) {
  const existing = String(
    property.adminAddress || property.administrativeAddress || "",
  ).trim();
  if (existing) return existing;
  const { city, commune, district } = buildLocationParts(property);
  return [district, commune, city].filter(Boolean).join(", ");
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

function nestedLocation(body) {
  return body && typeof body.location === "object" && body.location
    ? body.location
    : {};
}

function bodyHasAny(body, keys) {
  const loc = nestedLocation(body);
  return keys.some((key) => body[key] !== undefined || loc[key] !== undefined);
}

/** Convertit tous les alias historiques vers le modèle canonique. */
function readCanonicalLocation(body) {
  const loc = nestedLocation(body || {});
  const src = body || {};
  return {
    city: firstNonEmpty(src.city, src.ville, loc.city, loc.ville),
    commune: firstNonEmpty(
      src.commune,
      src.municipality,
      loc.commune,
      loc.municipality,
    ),
    district: firstNonEmpty(
      src.district,
      src.quarter,
      src.quartier,
      src.neighborhood,
      loc.district,
      loc.quarter,
      loc.quartier,
      loc.neighborhood,
    ),
    landmark: firstNonEmpty(
      src.landmark,
      src.repere,
      src.landmarkLabel,
      loc.landmark,
      loc.repere,
    ),
    adminAddress: firstNonEmpty(
      src.adminAddress,
      src.administrativeAddress,
      src.adresseAdministrative,
      src.address,
      loc.adminAddress,
    ),
    locationLabel: firstNonEmpty(
      src.locationLabel,
      src.mapLabel,
      src.libelleCarte,
      loc.locationLabel,
    ),
    coordinates: resolveCoordinates({ ...loc, ...src }),
  };
}

const LOCATION_ALIAS_KEYS = [
  "ville",
  "cityName",
  "municipality",
  "quarter",
  "quartier",
  "neighborhood",
  "repere",
  "landmarkLabel",
  "administrativeAddress",
  "adresseAdministrative",
  "address",
  "mapLabel",
  "libelleCarte",
  "latitude",
  "longitude",
  "lat",
  "lng",
  "lon",
  "surface",
  "surfaceArea",
  "propertyDescription",
  "photos",
  "location",
];

function omitUndefined(obj) {
  const out = {};
  for (const [key, value] of Object.entries(obj || {})) {
    if (value !== undefined) out[key] = value;
  }
  return out;
}

function stripAliasKeys(obj) {
  const out = { ...obj };
  for (const key of LOCATION_ALIAS_KEYS) delete out[key];
  return out;
}

function logPropertyTrace(stage, payload) {
  const loc = readCanonicalLocation(payload || {});
  console.log(`[${stage}]`, {
    id: payload?.id,
    title: payload?.title,
    city: loc.city || payload?.city,
    commune: loc.commune || payload?.commune,
    district: loc.district || payload?.district,
    landmark: loc.landmark || payload?.landmark,
    adminAddress: loc.adminAddress || payload?.adminAddress,
    locationLabel: loc.locationLabel || payload?.locationLabel,
    coordinates: loc.coordinates || payload?.coordinates,
    area: payload?.area ?? payload?.surface,
    description: String(payload?.description || payload?.propertyDescription || "").slice(0, 80),
    ownerId: payload?.ownerId,
    agencyId: payload?.agencyId,
    images: Array.isArray(payload?.images) ? payload.images.length : 0,
  });
}

function mergePropertyPatch(prev, body) {
  const loc = readCanonicalLocation(body);
  const safeBody = stripAliasKeys(omitUndefined(body));
  return {
    ...prev,
    ...safeBody,
    id: prev.id,
    slug: body.slug ? slugify(body.slug) : prev.slug,
    city: bodyHasAny(body, ["city", "ville"]) ? loc.city : prev.city,
    commune: bodyHasAny(body, ["commune", "municipality"])
      ? loc.commune
      : prev.commune,
    district: bodyHasAny(body, ["district", "quarter", "quartier", "neighborhood"])
      ? loc.district
      : prev.district,
    landmark: bodyHasAny(body, ["landmark", "repere", "landmarkLabel"])
      ? loc.landmark
      : prev.landmark,
    adminAddress: bodyHasAny(body, [
      "adminAddress",
      "administrativeAddress",
      "adresseAdministrative",
      "address",
    ])
      ? loc.adminAddress
      : prev.adminAddress,
    locationLabel: bodyHasAny(body, ["locationLabel", "mapLabel", "libelleCarte"])
      ? loc.locationLabel || null
      : prev.locationLabel,
    area:
      body.area !== undefined
        ? Number(body.area) || 0
        : body.surface !== undefined
          ? Number(body.surface) || 0
          : body.surfaceArea !== undefined
            ? Number(body.surfaceArea) || 0
            : prev.area,
    description:
      body.description !== undefined
        ? body.description
        : body.propertyDescription !== undefined
          ? body.propertyDescription
          : prev.description,
    coordinates:
      body.coordinates !== undefined
        ? body.coordinates
        : body.latitude != null && body.longitude != null
          ? { lat: Number(body.latitude), lng: Number(body.longitude) }
          : prev.coordinates,
    updatedAt: nowIso(),
  };
}

function resolveCoordinates(property) {
  if (
    property.coordinates &&
    typeof property.coordinates === "object" &&
    property.coordinates.lat != null &&
    property.coordinates.lng != null
  ) {
    const lat = Number(property.coordinates.lat);
    const lng = Number(property.coordinates.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
  }
  if (property.latitude != null && property.longitude != null) {
    const lat = Number(property.latitude);
    const lng = Number(property.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
  }
  return null;
}

/** Guess demo location from title/district for incomplete seed records. */
function guessDemoLocation(property) {
  const hay = `${property.title || ""} ${property.district || ""} ${property.commune || ""}`.toLowerCase();
  if (/lambanyi/.test(hay)) {
    return {
      city: "Conakry",
      commune: "Ratoma",
      district: "Lambanyi",
      landmark: "Près du Lycée Français",
      coordinates: { lat: 9.64, lng: -13.57 },
    };
  }
  if (/kaporo/.test(hay)) {
    return {
      city: "Conakry",
      commune: "Ratoma",
      district: "Kaporo Rails",
      landmark: "Près de Kaporo Rails",
      coordinates: { lat: 9.65, lng: -13.58 },
    };
  }
  if (/kip[eé]/.test(hay)) {
    return {
      city: "Conakry",
      commune: "Ratoma",
      district: "Kipé",
      landmark: "Secteur Kipé",
      coordinates: { lat: 9.635, lng: -13.575 },
    };
  }
  if (/mini[eè]re/.test(hay)) {
    return {
      city: "Conakry",
      commune: "Dixinn",
      district: "Minière",
      landmark: "Quartier Minière",
      coordinates: { lat: 9.545, lng: -13.677 },
    };
  }
  if (/dixinn/.test(hay)) {
    return {
      city: "Conakry",
      commune: "Dixinn",
      district: "Dixinn",
      landmark: "Centre Dixinn",
      coordinates: { lat: 9.55, lng: -13.68 },
    };
  }
  if (/nongo/.test(hay)) {
    return {
      city: "Conakry",
      commune: "Ratoma",
      district: "Nongo",
      landmark: "Secteur Nongo",
      coordinates: { lat: 9.62, lng: -13.61 },
    };
  }
  return {
    city: "Conakry",
    commune: "Ratoma",
    district: "Lambanyi",
    landmark: "Repère de démonstration",
    coordinates: { lat: 9.64, lng: -13.57 },
  };
}

/**
 * Canonical Property shape:
 * city, commune, district, landmark, adminAddress, locationLabel,
 * coordinates:{lat,lng}, area, description, images[], media[{id,type,url}]
 */
function normalizePropertyRecord(property, { enrichIncomplete = false } = {}) {
  if (!property || typeof property !== "object") return false;
  let changed = false;

    if (!property.city && (property.ville || property.cityName)) {
    property.city = property.ville || property.cityName;
    changed = true;
  }
  if (!property.commune && property.municipality) {
    property.commune = property.municipality;
    changed = true;
  }
  if (!property.district && (property.quarter || property.quartier || property.neighborhood)) {
    property.district = property.quarter || property.quartier || property.neighborhood;
    changed = true;
  }
  if (!property.adminAddress && property.administrativeAddress) {
    property.adminAddress = property.administrativeAddress;
    changed = true;
  }
  if ((!property.area || property.area === 0) && property.surface) {
    property.area = Number(property.surface) || 0;
    changed = true;
  }
  if (!property.landmark && property.repere) {
    property.landmark = property.repere;
    changed = true;
  }

  const coords = resolveCoordinates(property);
  if (
    JSON.stringify(coords) !== JSON.stringify(property.coordinates || null)
  ) {
    property.coordinates = coords;
    changed = true;
  }
  // Drop flat duplicates after nesting
  if ("latitude" in property || "longitude" in property) {
    delete property.latitude;
    delete property.longitude;
    changed = true;
  }
  if ("quarter" in property) {
    delete property.quarter;
    changed = true;
  }
  if ("administrativeAddress" in property) {
    delete property.administrativeAddress;
    changed = true;
  }
  if ("surface" in property) {
    delete property.surface;
    changed = true;
  }
  if ("repere" in property) {
    delete property.repere;
    changed = true;
  }

  // INTERDIT d’inventer Conakry/Ratoma sans source réelle.
  // enrichIncomplete reste disponible uniquement pour un script de seed explicite.
  if (enrichIncomplete) {
    const { city, commune, district } = buildLocationParts(property);
    const incomplete =
      !city || !commune || !district || !property.coordinates;
    if (incomplete) {
      const guess = guessDemoLocation(property);
      if (!city) {
        property.city = guess.city;
        changed = true;
      }
      if (!commune) {
        property.commune = guess.commune;
        changed = true;
      }
      if (!district) {
        property.district = guess.district;
        changed = true;
      }
      if (!String(property.landmark || "").trim()) {
        property.landmark = guess.landmark;
        changed = true;
      }
      if (!property.coordinates) {
        property.coordinates = guess.coordinates;
        property.locationConfirmed = true;
        changed = true;
      }
      if (!String(property.description || "").trim()) {
        property.description = `${property.title || "Bien"} — fiche enrichie pour la démonstration (Demo API).`;
        changed = true;
      }
      if (!property.area || Number(property.area) === 0) {
        const t = String(property.type || "").toLowerCase();
        property.area = t.includes("terrain")
          ? 300
          : t.includes("appart")
            ? 120
            : 180;
        changed = true;
      }
      const onlyPlaceholder =
        Array.isArray(property.images) &&
        property.images.length > 0 &&
        property.images.every(
          (u) =>
            String(u).includes("property-placeholder") ||
            String(u).includes("example.com"),
        );
      if (!property.images || property.images.length === 0 || onlyPlaceholder) {
        property.images = [
          "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=86",
        ];
        changed = true;
      }
    }
  }

  const nextLabel = deriveLocationLabel(property);
  if ((property.locationLabel || null) !== nextLabel) {
    property.locationLabel = nextLabel;
    changed = true;
  }
  const nextAdmin = deriveAdminAddress(property);
  if (String(property.adminAddress || "") !== nextAdmin) {
    property.adminAddress = nextAdmin;
    changed = true;
  }

  if (normalizeMediaRecord(property)) changed = true;
  return changed;
}

function readDb() {
  const db = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
  let changed = ensureAdmins(db);
  for (const listing of db.listings || []) {
    if (normalizeListingRecord(listing)) changed = true;
    if (normalizeMediaRecord(listing)) changed = true;
  }
  for (const property of db.properties || []) {
    if (normalizePropertyRecord(property, { enrichIncomplete: false })) {
      changed = true;
    }
  }
  if (!Array.isArray(db.auditLogs)) {
    db.auditLogs = [];
    changed = true;
  }
  if (!Array.isArray(db.contactRequests)) {
    db.contactRequests = [];
    changed = true;
  }
  if (!Array.isArray(db.contactEvents)) {
    db.contactEvents = [];
    changed = true;
  }
  if (ensureVerificationCollections(db)) changed = true;
  if (accountScopes.ensureAccountScopeCollections(db)) changed = true;
  if (ensureStandardDemoUsers(db)) changed = true;
  const beforeProfiles = (db.ownerProfiles || []).length;
  const beforeUsers = (db.users || []).length;
  accountScopes.migrateDemoAccountScopes(db);
  if ((db.ownerProfiles || []).length !== beforeProfiles) changed = true;
  if ((db.users || []).length !== beforeUsers) changed = true;
  if (
    ensureDemoVerificationScenarios(db, {
      demoPassword: DEMO_USER_PASSWORD,
    })
  ) {
    changed = true;
  }
  if (changed) writeDb(db);
  return db;
}

function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

const PROPERTY_PLACEHOLDER = "/images/properties/property-placeholder.jpg";

function sanitizeImageUrl(url) {
  if (typeof url !== "string" || !url.trim()) return PROPERTY_PLACEHOLDER;
  const src = url.trim();
  if (src.startsWith("/") && !src.startsWith("//")) return src;
  // Demo API: no persisted base64 blobs
  // Demo : conserver les images uploadées (data URL) pour le round-trip fiche.
  if (src.startsWith("data:image/")) return src;
  if (src.startsWith("blob:")) {
    return PROPERTY_PLACEHOLDER;
  }
  try {
    const parsed = new URL(src);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return PROPERTY_PLACEHOLDER;
    }
    const host = parsed.hostname.toLowerCase();
    if (host === "example.com" || host === "www.example.com") {
      return PROPERTY_PLACEHOLDER;
    }
    if (host === "images.unsplash.com") return src;
    // Unknown remote hosts are rejected in demo to protect Next.js image config
    return PROPERTY_PLACEHOLDER;
  } catch {
    return PROPERTY_PLACEHOLDER;
  }
}

function sanitizeImages(images) {
  if (!Array.isArray(images) || images.length === 0) {
    return [PROPERTY_PLACEHOLDER];
  }
  const cleaned = images.map(sanitizeImageUrl);
  const real = cleaned.filter((url) => url !== PROPERTY_PLACEHOLDER);
  // Plusieurs URLs invalides / placeholders → un seul placeholder.
  if (real.length === 0) return [PROPERTY_PLACEHOLDER];
  return real;
}

function ensureMediaList(record) {
  const ownerId = record.id || "x";
  const urls = sanitizeImages(record.images);
  const previous = Array.isArray(record.media) ? record.media : [];
  const byUrlIndex = new Map();
  for (const item of previous) {
    if (item && item.url && item.id && !byUrlIndex.has(item.url)) {
      byUrlIndex.set(item.url, item.id);
    }
  }
  return urls.map((url, index) => ({
    id:
      byUrlIndex.get(url) ||
      previous[index]?.id ||
      `media-${ownerId}-${String(index + 1).padStart(3, "0")}`,
    type: "IMAGE",
    url,
  }));
}

function normalizeMediaRecord(record) {
  if (!record || typeof record !== "object") return false;
  let changed = false;
  const nextImages = sanitizeImages(record.images);
  if (JSON.stringify(nextImages) !== JSON.stringify(record.images || [])) {
    record.images = nextImages;
    changed = true;
  } else if (!Array.isArray(record.images)) {
    record.images = nextImages;
    changed = true;
  }
  const nextMedia = ensureMediaList(record);
  if (JSON.stringify(nextMedia) !== JSON.stringify(record.media || [])) {
    record.media = nextMedia;
    changed = true;
  }
  return changed;
}

function advertiserIsVerified(db, listing) {
  if (listing.advertiserType === "AGENCE" && listing.agencyId) {
    const agency = (db.agencies || []).find((a) => a.id === listing.agencyId);
    return Boolean(agency && agency.verified);
  }
  if (listing.ownerId) {
    const user = (db.users || []).find((u) => u.id === listing.ownerId);
    return Boolean(user && (user.roleVerified || user.documentsVerified));
  }
  return false;
}

function initialsFromName(name) {
  return (
    String(name || "")
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "DG"
  );
}

/**
 * Annonceur public (jamais createdByAdminId).
 * Résout ownerId / agencyId → nom réel ; sinon missing.
 */
function resolvePublicAdvertiser(db, listing) {
  const type =
    listing.advertiserType === "AGENCE"
      ? "AGENCE"
      : listing.advertiserType === "PROPRIETAIRE"
        ? "PROPRIETAIRE"
        : listing.agencyId
          ? "AGENCE"
          : listing.ownerId
            ? "PROPRIETAIRE"
            : null;

  if (type === "AGENCE") {
    const agency = listing.agencyId
      ? (db.agencies || []).find((a) => a.id === listing.agencyId)
      : null;
    if (!agency) {
      return {
        id: listing.agencyId || null,
        type: "AGENCE",
        name: null,
        verified: false,
        initials: "?",
        logo: null,
        missing: true,
      };
    }
    return {
      id: agency.id,
      type: "AGENCE",
      name: agency.name,
      verified: Boolean(agency.verified),
      initials: agency.initials || initialsFromName(agency.name),
      logo: agency.logo || agency.avatarUrl || null,
      missing: false,
    };
  }

  if (type === "PROPRIETAIRE") {
    const user = listing.ownerId
      ? (db.users || []).find((u) => u.id === listing.ownerId)
      : null;
    if (!user) {
      return {
        id: listing.ownerId || null,
        type: "PROPRIETAIRE",
        name: null,
        verified: false,
        initials: "?",
        logo: null,
        missing: true,
      };
    }
    return {
      id: user.id,
      type: "PROPRIETAIRE",
      name: user.name,
      verified: Boolean(user.roleVerified || user.documentsVerified),
      initials: initialsFromName(user.name),
      logo: user.avatarUrl || null,
      missing: false,
    };
  }

  return {
    id: null,
    type: null,
    name: null,
    verified: false,
    initials: "?",
    logo: null,
    missing: true,
  };
}

function withPublicAdvertiser(db, listing) {
  const advertiser = resolvePublicAdvertiser(db, listing);
  return {
    ...listing,
    // Garder owner synchronisé au nom réel (jamais un id technique)
    owner: advertiser.missing ? listing.owner : advertiser.name,
    advertiser,
  };
}

function nowIso() {
  return new Date().toISOString();
}

function slugify(input) {
  return (
    String(input || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || `annonce-${Date.now()}`
  );
}

function uniqueListingSlug(db, base) {
  let slug = base;
  let i = 2;
  while (db.listings.some((l) => l.slug === slug)) {
    slug = `${base}-${i}`;
    i += 1;
  }
  return slug;
}

function refAd() {
  return `DG-A-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
}

function refProperty() {
  return `DG-B-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
}

function isSuperAdmin(admin) {
  return (
    admin &&
    (admin.role === "SUPER_ADMIN" ||
      (Array.isArray(admin.permissions) &&
        admin.permissions.includes("TOUTES")))
  );
}

function adminHasPermission(admin, permission) {
  if (!admin) return false;
  if (isSuperAdmin(admin)) return true;
  return (
    Array.isArray(admin.permissions) && admin.permissions.includes(permission)
  );
}

function resolveAdminFromRequest(req) {
  const email = String(
    req.headers["x-admin-email"] || req.body?.adminEmail || "",
  )
    .trim()
    .toLowerCase();
  if (!email) return null;
  const db = readDb();
  const admin = (db.admins || []).find(
    (a) => String(a.email || "").toLowerCase() === email,
  );
  if (!admin || admin.status !== "ACTIF") return null;
  return admin;
}

function requireAdminPermission(permission) {
  return (req, res, next) => {
    const admin = resolveAdminFromRequest(req);
    if (!admin) {
      return res.status(401).json({
        error: "Authentification administrateur requise (X-Admin-Email).",
      });
    }
    if (!adminHasPermission(admin, permission)) {
      return res.status(403).json({
        error: `Permission insuffisante : ${permission} requis.`,
        required: permission,
        adminEmail: admin.email,
        role: admin.role,
      });
    }
    req.admin = admin;
    return next();
  };
}

function pushAudit(db, entry) {
  db.auditLogs = db.auditLogs || [];
  db.auditLogs.unshift({
    id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: nowIso(),
    ...entry,
  });
}

function buildPropertyFromBody(db, body, admin) {
  const id = body.id || `prop-${Date.now()}`;
  let slug = slugify(body.slug || body.title);
  let i = 2;
  while (db.properties.some((p) => p.slug === slug)) {
    slug = `${slugify(body.slug || body.title)}-${i}`;
    i += 1;
  }

  function optionalInt(value) {
    if (value === null || value === undefined || value === "") return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  const ownerId = body.ownerId ?? null;
  const agencyId = body.agencyId ?? null;
  if (!ownerId && !agencyId) {
    return { error: "ownerId ou agencyId requis (l’admin n’est jamais propriétaire)." };
  }
  if (ownerId && agencyId) {
    return { error: "Choisir soit ownerId soit agencyId, pas les deux." };
  }

  const loc = readCanonicalLocation(body);
  const property = {
    id,
    slug,
    reference: body.reference || refProperty(),
    title: body.title || "Bien sans titre",
    type: body.type || "Villa",
    operation: body.operation || "VENTE",
    price: Number(body.price) || 0,
    area: Number(body.area ?? body.surface ?? body.surfaceArea) || 0,
    bedrooms: optionalInt(body.bedrooms),
    bathrooms: optionalInt(body.bathrooms),
    amenities: body.amenities || [],
    city: loc.city,
    commune: loc.commune,
    district: loc.district,
    landmark: loc.landmark,
    adminAddress: loc.adminAddress,
    coordinates: loc.coordinates,
    locationLabel: loc.locationLabel || null,
    locationConfirmed: Boolean(body.locationConfirmed),
    ownerId,
    agencyId,
    images: sanitizeImages(body.images || []),
    media: [],
    videos: body.videos || [],
    description: body.description || body.propertyDescription || "",
    status: body.status || "ACTIF",
    mandateType: body.mandateType || null,
    clientDisplayName: body.clientDisplayName || null,
    clientReference: body.clientReference || null,
    views: Number(body.views) || 0,
    contacts: Number(body.contacts) || 0,
    completeness: Number(body.completeness) || 0,
    createdByAdminId: admin ? admin.id : null,
    updatedByAdminId: admin ? admin.id : null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  property.media = ensureMediaList(property);
  normalizePropertyRecord(property, { enrichIncomplete: false });
  return { property };
}

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "8mb" }));

/** Placeholders démo pour fileUrl des documents de vérification (jamais publics côté annonces). */
app.get("/demo-docs/:file", (req, res) => {
  const file = String(req.params.file || "document.pdf");
  const safe = file.replace(/[^\w.\-]+/g, "_").slice(0, 120);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${safe}"`);
  res.status(200).send(
    Buffer.from(
      `%PDF-1.1\n1 0 obj<< /Type /Catalog >>endobj\ntrailer<<>>\n%%EOF\n%% DEMO PLACEHOLDER ${safe} — Demeure Guinée\n`,
      "utf8",
    ),
  );
});

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "immo-demo-api",
    note: "DEMO ONLY — remplacé par Spring Boot",
  });
});

const DEMO_USER_PASSWORD = "Demo1234!";
/** Demo API : OTP SMS désactivé par défaut. Passer DEMO_MODE=false pour forcer OTP plus tard. */
const DEMO_MODE = String(process.env.DEMO_MODE || "true").toLowerCase() !== "false";

function publicUserView(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    firstName: user.firstName || null,
    lastName: user.lastName || null,
    email: user.email,
    phone: user.phone || "",
    role: user.role || "USER",
    status: user.status || "ACTIF",
    roleVerified: Boolean(user.roleVerified),
    documentsVerified: Boolean(user.documentsVerified),
    phoneVerified: Boolean(user.phoneVerified),
    verificationMethod: user.verificationMethod || null,
    verificationStatus: user.verificationStatus || null,
    reportsCount: user.reportsCount || 0,
  };
}

/** Session Demo API partagée — login classique et demo-login. */
function createAuthSessionForUser(user) {
  return {
    user: publicUserView(user),
    token: user.id,
    demoMode: DEMO_MODE,
    otpRequired: !DEMO_MODE,
    note: "DEMO ONLY — session token = user.id",
  };
}

/** Comptes autorisés pour POST /auth/demo-login uniquement. */
const DEMO_LOGIN_WHITELIST = new Set([
  "user-demo-1",
  "user-demo-2",
  "user-demo-pending",
  "user-demo-correction",
  "user-demo-owner",
  "user-demo-agence",
]);


function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function findUserByIdentifier(db, identifier) {
  const raw = String(identifier || "").trim();
  if (!raw) return null;
  const email = normalizeEmail(raw);
  const phoneDigits = raw.replace(/\D/g, "");
  return (db.users || []).find((u) => {
    if (normalizeEmail(u.email) === email) return true;
    if (u.id === raw) return true;
    const uPhone = String(u.phone || "").replace(/\D/g, "");
    return phoneDigits.length >= 6 && uPhone === phoneDigits;
  });
}

/**
 * Seeds ADDITIFS uniquement — ne réécrit / ne purge jamais les users créés via UI.
 * Pour les emails Demo connus : garantit password/status utilisables à chaque démarrage
 * (sans toucher aux roleRequests de user1/user2).
 */
function ensureStandardDemoUsers(db) {
  return ensureDemoAccounts(db);
}

function ensureDemoAccounts(db) {
  db.users = Array.isArray(db.users) ? db.users : [];
  db.agencies = Array.isArray(db.agencies) ? db.agencies : [];
  db.roleRequests = Array.isArray(db.roleRequests) ? db.roleRequests : [];
  let changed = false;
  const stamp = nowIso();

  const seeds = [
    {
      id: "user-demo-1",
      firstName: "Awa",
      lastName: "Diallo",
      name: "Awa Diallo",
      email: "user1@demo.demeureguinee.com",
      phone: "+224 620 11 11 11",
      role: "USER",
      status: "ACTIF",
      roleVerified: false,
      documentsVerified: false,
      phoneVerified: true,
      verificationMethod: "DEMO",
      verificationStatus: null,
      reportsCount: 0,
      password: DEMO_USER_PASSWORD,
    },
    {
      id: "user-demo-2",
      firstName: "Moussa",
      lastName: "Keita",
      name: "Moussa Keita",
      email: "user2@demo.demeureguinee.com",
      phone: "+224 620 22 22 22",
      role: "USER",
      status: "ACTIF",
      roleVerified: false,
      documentsVerified: false,
      phoneVerified: true,
      verificationMethod: "DEMO",
      verificationStatus: null,
      reportsCount: 0,
      password: DEMO_USER_PASSWORD,
    },
    {
      id: "user-demo-pending",
      firstName: "Mariama",
      lastName: "Sow",
      name: "Mariama Sow",
      email: "pending.owner@demo.demeureguinee.com",
      phone: "+224 620 33 33 33",
      role: "USER",
      status: "ACTIF",
      roleVerified: false,
      documentsVerified: false,
      phoneVerified: true,
      verificationMethod: "DEMO",
      verificationStatus: null,
      reportsCount: 0,
      password: DEMO_USER_PASSWORD,
    },
    {
      id: "user-demo-correction",
      firstName: "Lamine",
      lastName: "Camara",
      name: "Lamine Camara",
      email: "correction@demo.demeureguinee.com",
      phone: "+224 620 44 44 44",
      role: "USER",
      status: "ACTIF",
      roleVerified: false,
      documentsVerified: false,
      phoneVerified: true,
      verificationMethod: "DEMO",
      verificationStatus: null,
      reportsCount: 0,
      password: DEMO_USER_PASSWORD,
    },
    {
      id: "user-demo-owner",
      firstName: "Sékou",
      lastName: "Touré",
      name: "Sékou Touré",
      email: "owner@demo.demeureguinee.com",
      phone: "+224 620 55 55 55",
      role: "PROPRIETAIRE",
      status: "ACTIF",
      roleVerified: true,
      documentsVerified: true,
      phoneVerified: true,
      verificationMethod: "DEMO",
      verificationStatus: "VERIFIE",
      reportsCount: 0,
      password: DEMO_USER_PASSWORD,
    },
    {
      id: "user-demo-agence",
      firstName: "Fatoumata",
      lastName: "Bah",
      name: "Fatoumata Bah",
      email: "agence@demo.demeureguinee.com",
      phone: "+224 620 66 66 66",
      role: "AGENCE",
      status: "ACTIF",
      roleVerified: true,
      documentsVerified: true,
      phoneVerified: true,
      verificationMethod: "DEMO",
      verificationStatus: "VERIFIE",
      reportsCount: 0,
      password: DEMO_USER_PASSWORD,
    },
  ];

  const seedEmails = new Set(seeds.map((s) => normalizeEmail(s.email)));
  const seedIds = new Set(seeds.map((s) => s.id));

  for (const seed of seeds) {
    const existing = db.users.find(
      (u) => u.id === seed.id || normalizeEmail(u.email) === seed.email,
    );
    if (!existing) {
      db.users.push({ ...seed, createdAt: stamp, updatedAt: stamp });
      changed = true;
      continue;
    }

    // Répare uniquement les comptes Demo connus (jamais les comptes UI).
    let patched = false;
    if (existing.id !== seed.id) {
      existing.id = seed.id;
      patched = true;
    }
    if (normalizeEmail(existing.email) !== seed.email) {
      existing.email = seed.email;
      patched = true;
    }
    if (String(existing.password || "") !== DEMO_USER_PASSWORD) {
      existing.password = DEMO_USER_PASSWORD;
      patched = true;
    }
    if (existing.status === "BLOQUE" || existing.status === "DESACTIVE") {
      existing.status = "ACTIF";
      patched = true;
    }
    if (!existing.phoneVerified) {
      existing.phoneVerified = true;
      patched = true;
    }
    if (existing.verificationMethod !== "DEMO") {
      existing.verificationMethod = "DEMO";
      patched = true;
    }
    // Rôles seed stables (owner/agence) — user1/user2 restent USER.
    // Exception : un compte dont une demande a été APPROUVÉE garde le rôle
    // accordé par l’administration (sinon un test d’approbation serait annulé
    // au redémarrage).
    const approvedRequest = db.roleRequests.find(
      (r) => r.userId === seed.id && r.status === "APPROUVEE",
    );
    if (!approvedRequest) {
      if (existing.role !== seed.role) {
        existing.role = seed.role;
        patched = true;
      }
      if (Boolean(existing.roleVerified) !== Boolean(seed.roleVerified)) {
        existing.roleVerified = seed.roleVerified;
        patched = true;
      }
      if (
        Boolean(existing.documentsVerified) !== Boolean(seed.documentsVerified)
      ) {
        existing.documentsVerified = seed.documentsVerified;
        patched = true;
      }
    }
    if (patched) {
      existing.updatedAt = stamp;
      changed = true;
    }
  }

  // Mot de passe démo uniquement si absent — hors comptes Demo déjà gérés ci-dessus
  for (const user of db.users) {
    const email = normalizeEmail(user.email);
    if (seedEmails.has(email) || seedIds.has(user.id)) continue;
    if (!user.password) {
      user.password = DEMO_USER_PASSWORD;
      changed = true;
    }
  }

  // Jamais de roleRequest pour user1 / user2 (formulaire depuis zéro)
  const protectedUserIds = new Set(["user-demo-1", "user-demo-2"]);
  const beforeRr = db.roleRequests.length;
  db.roleRequests = db.roleRequests.filter(
    (r) => !protectedUserIds.has(String(r.userId || "")),
  );
  if (db.roleRequests.length !== beforeRr) changed = true;

  // Agence liée au compte agence@demo
  if (!db.agencies.some((a) => a.id === "ag-demo-1" || a.userId === "user-demo-agence")) {
    db.agencies.push({
      id: "ag-demo-1",
      userId: "user-demo-agence",
      name: "Demeure Demo Agence",
      initials: "DA",
      email: "agence@demo.demeureguinee.com",
      phone: "+224 620 66 66 66",
      city: "Conakry",
      verified: true,
      documentsVerified: true,
      activityType: "AGENCE_IMMOBILIERE",
      reportsCount: 0,
    });
    changed = true;
  }

  // Les dossiers de vérification Demo (complets, avec pièces jointes) sont
  // gérés par demo-verification-scenarios.js → ensureDemoVerificationScenarios().

  return changed;
}

function registerAuthRoutes(pathPrefix = "") {
  const base = pathPrefix || "";

  app.post(`${base}/auth/register`, (req, res) => {
    const db = readDb();
    const body = req.body || {};
    const firstName = String(body.firstName || "").trim();
    const lastName = String(body.lastName || "").trim();
    const email = normalizeEmail(body.email);
    const phone = String(body.phone || "").trim();
    const password = String(body.password || "");

    if (!firstName || !lastName) {
      return res.status(400).json({ error: "Prénom et nom requis." });
    }
    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "E-mail invalide." });
    }
    if (!phone) {
      return res.status(400).json({ error: "Téléphone requis." });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Mot de passe trop court (8 min)." });
    }
    if (findUserByIdentifier(db, email)) {
      return res.status(409).json({
        error: "Un compte existe déjà avec cette adresse e-mail.",
        code: "EMAIL_EXISTS",
      });
    }

    const stamp = nowIso();
    const user = {
      id: verificationUid("user"),
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(),
      email,
      phone,
      password,
      role: "USER",
      status: "ACTIF",
      roleVerified: false,
      documentsVerified: false,
      phoneVerified: DEMO_MODE,
      verificationMethod: DEMO_MODE ? "DEMO" : null,
      verificationStatus: null,
      reportsCount: 0,
      createdAt: stamp,
      updatedAt: stamp,
    };
    db.users.push(user);
    writeDb(db);
    // Aucune roleRequest créée à l'inscription
    res.status(201).json({
      user: publicUserView(user),
      token: user.id,
      demoMode: DEMO_MODE,
      otpRequired: !DEMO_MODE,
      note: DEMO_MODE
        ? "DEMO ONLY — OTP SMS désactivé ; phoneVerified=true"
        : "OTP requis (DEMO_MODE=false)",
    });
  });

  app.post(`${base}/auth/login`, (req, res) => {
    const db = readDb();
    const identifier = String(req.body?.identifier || req.body?.email || "").trim();
    const password = String(req.body?.password || "");
    const user = findUserByIdentifier(db, identifier);
    if (!user || user.status === "BLOQUE" || user.status === "DESACTIVE") {
      return res.status(401).json({ error: "Identifiant ou mot de passe incorrect." });
    }
    // Demo : plain text uniquement (pas de bcrypt / passwordHash)
    if (String(user.password || "") !== password) {
      return res.status(401).json({ error: "Identifiant ou mot de passe incorrect." });
    }
    res.json(createAuthSessionForUser(user));
  });

  /**
   * Accès Démo — DEV uniquement.
   * Pas de mot de passe : whitelist stricte + DEMO_MODE.
   */
  app.post(`${base}/auth/demo-login`, (req, res) => {
    if (!DEMO_MODE) {
      return res.status(404).json({ error: "NOT_FOUND" });
    }
    const userId = String(req.body?.userId || "").trim();
    if (!userId || !DEMO_LOGIN_WHITELIST.has(userId)) {
      return res.status(403).json({ error: "Compte Demo non autorisé." });
    }
    const db = readDb();
    const user = (db.users || []).find((u) => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: "Compte Demo introuvable." });
    }
    if (user.status === "BLOQUE" || user.status === "DESACTIVE") {
      return res.status(403).json({ error: "Compte Demo indisponible." });
    }
    res.json(createAuthSessionForUser(user));
  });

  app.get(`${base}/auth/me`, (req, res) => {
    const db = readDb();
    const token =
      String(req.headers["x-user-id"] || "").trim() ||
      String(req.query.userId || "").trim() ||
      String(req.headers.authorization || "")
        .replace(/^Bearer\s+/i, "")
        .trim();
    if (!token) {
      return res.status(401).json({ error: "Non authentifié." });
    }
    const user = (db.users || []).find((u) => u.id === token);
    if (!user) {
      return res.status(401).json({ error: "Session invalide." });
    }
    res.json({
      user: publicUserView(user),
      demoMode: DEMO_MODE,
      otpRequired: !DEMO_MODE,
    });
  });

  app.get(`${base}/auth/config`, (_req, res) => {
    res.json({
      demoMode: DEMO_MODE,
      otpRequired: !DEMO_MODE,
      otpChannel: DEMO_MODE ? null : "SMS",
      note: DEMO_MODE
        ? "Mode démonstration — vérification SMS désactivée."
        : "OTP SMS obligatoire.",
    });
  });

  app.post(`${base}/auth/logout`, (_req, res) => {
    res.json({ ok: true });
  });
}

registerAuthRoutes("");
registerAuthRoutes("/api");

app.get("/users", (_req, res) => {
  res.json(readDb().users);
});

app.get("/users/:id", (req, res) => {
  const user = readDb().users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });
  return res.json(user);
});

app.get("/agencies", (_req, res) => {
  res.json(readDb().agencies);
});

app.get("/agencies/:id", (req, res) => {
  const agency = readDb().agencies.find((a) => a.id === req.params.id);
  if (!agency) return res.status(404).json({ error: "Agence introuvable" });
  return res.json(agency);
});

app.get("/properties", (req, res) => {
  const db = readDb();
  let list = db.properties;
  if (req.query.ownerId) {
    list = list.filter((p) => p.ownerId === req.query.ownerId);
  }
  if (req.query.agencyId) {
    list = list.filter((p) => p.agencyId === req.query.agencyId);
  }
  res.json(list);
});

app.get("/properties/:id", (req, res) => {
  const property = readDb().properties.find(
    (p) => p.id === req.params.id || p.slug === req.params.id,
  );
  if (!property) return res.status(404).json({ error: "Bien introuvable" });
  return res.json(property);
});

app.post("/properties", (req, res) => {
  const db = readDb();
  const body = req.body || {};
  const id = body.id || `prop-${Date.now()}`;
  let slug = slugify(body.slug || body.title);
  let i = 2;
  while (db.properties.some((p) => p.slug === slug)) {
    slug = `${slugify(body.slug || body.title)}-${i}`;
    i += 1;
  }

  function optionalInt(value) {
    if (value === null || value === undefined || value === "") return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  const ownerId = body.ownerId ?? null;
  const agencyId = body.agencyId ?? null;
  const type = body.type || "Villa";
  const operation = body.operation || "VENTE";
  const scopeCheck = accountScopes.assertScopeAllowsProperty(db, {
    ownerId,
    agencyId,
    type,
    operation,
  });
  if (!scopeCheck.ok) {
    return res.status(scopeCheck.status || 403).json({
      error: scopeCheck.error,
      code: scopeCheck.error,
      message: scopeCheck.message,
      allowedPropertyTypes: scopeCheck.allowedPropertyTypes,
      allowedOperations: scopeCheck.allowedOperations,
    });
  }

  const loc = readCanonicalLocation(body);
  logPropertyTrace("PROPERTY RECEIVED", body);
  const property = {
    id,
    slug,
    reference: body.reference || refProperty(),
    title: body.title || "Bien sans titre",
    type,
    operation,
    price: Number(body.price) || 0,
    area: Number(body.area ?? body.surface ?? body.surfaceArea) || 0,
    bedrooms: optionalInt(body.bedrooms),
    bathrooms: optionalInt(body.bathrooms),
    amenities: body.amenities || [],
    city: loc.city,
    commune: loc.commune,
    district: loc.district,
    landmark: loc.landmark,
    adminAddress: loc.adminAddress,
    coordinates: loc.coordinates,
    locationLabel: loc.locationLabel || null,
    locationConfirmed: Boolean(body.locationConfirmed),
    ownerId,
    agencyId,
    images: sanitizeImages(body.images || []),
    media: [],
    videos: body.videos || [],
    description: body.description || body.propertyDescription || "",
    status: body.status || "ACTIF",
    mandateType: body.mandateType || null,
    clientDisplayName: body.clientDisplayName || null,
    clientReference: body.clientReference || null,
    views: Number(body.views) || 0,
    contacts: Number(body.contacts) || 0,
    completeness: Number(body.completeness) || 0,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  property.media = ensureMediaList(property);
  normalizePropertyRecord(property, { enrichIncomplete: false });
  db.properties.unshift(property);
  writeDb(db);
  logPropertyTrace("PROPERTY SAVED", property);
  res.status(201).json(property);
});

app.patch("/properties/:id", (req, res) => {
  const db = readDb();
  const index = db.properties.findIndex(
    (p) => p.id === req.params.id || p.slug === req.params.id,
  );
  if (index < 0) return res.status(404).json({ error: "Bien introuvable" });
  const body = req.body || {};
  const prev = db.properties[index];
  logPropertyTrace("PROPERTY PATCH RECEIVED", { ...body, id: prev.id });

  function optionalInt(value, fallback) {
    if (value === undefined) return fallback;
    if (value === null || value === "") return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  const next = mergePropertyPatch(prev, body);
  next.bedrooms = optionalInt(body.bedrooms, prev.bedrooms);
  next.bathrooms = optionalInt(body.bathrooms, prev.bathrooms);
  if (body.images) {
    next.images = sanitizeImages(body.images);
  }
  normalizePropertyRecord(next, { enrichIncomplete: false });
  db.properties[index] = next;
  writeDb(db);
  logPropertyTrace("PROPERTY PATCH SAVED", next);
  res.json(next);
});

app.delete("/properties/:id", (req, res) => {
  const db = readDb();
  const index = db.properties.findIndex(
    (p) => p.id === req.params.id || p.slug === req.params.id,
  );
  if (index < 0) return res.status(404).json({ error: "Bien introuvable" });
  const [removed] = db.properties.splice(index, 1);
  writeDb(db);
  res.json({ ok: true, id: removed.id });
});

/** Proxy Nominatim — évite CORS navigateur + User-Agent correct. */
app.get("/geocoding/search", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) return res.json([]);
    const relax = req.query.relax === "1" || req.query.relax === "true";
    const limit = String(Math.min(Number(req.query.limit) || 5, 10));

    function foldAscii(input) {
      return String(input)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    }

    function buildVariants(raw) {
      const parts = raw.split(",").map((p) => p.trim()).filter(Boolean);
      const head = parts[0] || raw;
      const variants = [];
      const push = (v) => {
        const s = String(v || "").trim();
        if (!s) return;
        if (!variants.some((x) => x.toLowerCase() === s.toLowerCase())) {
          variants.push(s);
        }
      };
      push(raw);
      if (parts.length > 2) push(parts.slice(0, Math.max(2, parts.length - 1)).join(", "));
      if (parts.length > 1) push([head, parts[parts.length - 2], "Guinée"].filter(Boolean).join(", "));
      push([head, "Conakry", "Guinée"].join(", "));
      push([head, "Guinée"].join(", "));
      push(head);
      const ascii = foldAscii(head);
      if (ascii !== head) {
        push([ascii, "Conakry", "Guinée"].join(", "));
        push(ascii);
      }
      const hay = foldAscii(raw).toLowerCase();
      if (/lycee|francais|albert\s*camus/.test(hay)) {
        push("Lycée Français Albert Camus, Conakry, Guinée");
        push("Lycee Francais, Conakry, Guinée");
        push("Albert Camus, Conakry, Guinée");
      }
      return variants.slice(0, relax ? 8 : 1);
    }

    function mapItem(item) {
      const address = item.address || {};
      const city =
        address.city || address.town || address.village || address.state || "";
      const commune =
        address.municipality || address.county || address.city_district || "";
      const quarter = address.suburb || address.neighbourhood || "";
      const shortParts = [quarter, commune, city, address.country || "Guinée"]
        .filter(Boolean)
        .filter((v, i, arr) => arr.indexOf(v) === i);
      return {
        id: String(item.place_id || `${item.lat},${item.lon}`),
        latitude: Number(item.lat),
        longitude: Number(item.lon),
        label: shortParts.join(", ") || item.display_name,
        displayName: item.display_name,
        city: city || undefined,
        commune: commune || undefined,
        quarter: quarter || undefined,
        country: address.country,
      };
    }

    // Repères démo d’abord pour les POI souvent absents d’OSM (évite 8 timeouts).
    const hayEarly = foldAscii(q).toLowerCase();
    if (/lycee|francais|albert camus|camus/.test(hayEarly)) {
      return res.json([
        {
          id: "demo-lycee-francais-conakry",
          latitude: 9.5358,
          longitude: -13.6775,
          label: "Lycée Français Albert Camus, Conakry",
          displayName:
            "Lycée Français Albert Camus (repère démo), Dixinn, Conakry, Guinée",
          city: "Conakry",
          commune: "Dixinn",
          country: "Guinée",
        },
      ]);
    }

    let results = [];
    let lastGeoError = null;
    for (const variant of buildVariants(q)) {
      try {
        const params = new URLSearchParams({
          format: "jsonv2",
          addressdetails: "1",
          countrycodes: "gn",
          limit,
          q: variant,
        });
        const data = await nominatimGetJson(
          `https://nominatim.openstreetmap.org/search?${params}`,
        );
        results = (Array.isArray(data) ? data : []).map(mapItem);
        if (results.length > 0) break;
      } catch (err) {
        lastGeoError = err;
        console.warn(
          "[geocoding] variant failed:",
          variant,
          err instanceof Error ? err.message : err,
        );
      }
    }

    // Repères démo Conakry restants si Nominatim ne répond rien.
    if (results.length === 0) {
      const hay = hayEarly;
      const demoPois = [
        {
          keys: ["nongo"],
          item: {
            id: "demo-nongo",
            latitude: 9.6257,
            longitude: -13.6342,
            label: "Nongo, Ratoma, Conakry, Guinée",
            displayName: "Nongo, Ratoma, Conakry, Guinée",
            city: "Conakry",
            commune: "Ratoma",
            quarter: "Nongo",
            country: "Guinée",
          },
        },
      ];
      for (const poi of demoPois) {
        if (poi.keys.some((k) => hay.includes(k))) {
          results = [poi.item];
          break;
        }
      }
    }

    if (results.length === 0 && lastGeoError) {
      return res.status(502).json({
        error:
          lastGeoError instanceof Error
            ? lastGeoError.message
            : "Géocodage indisponible",
      });
    }
    res.json(results);
  } catch (err) {
    res.status(502).json({
      error: err instanceof Error ? err.message : "Géocodage indisponible",
    });
  }
});

app.get("/geocoding/reverse", async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon ?? req.query.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return res.status(400).json({ error: "lat/lon requis" });
    }
    const params = new URLSearchParams({
      format: "jsonv2",
      addressdetails: "1",
      lat: String(lat),
      lon: String(lon),
    });
    const item = await nominatimGetJson(
      `https://nominatim.openstreetmap.org/reverse?${params}`,
    );
    if (!item || item.error || !item.lat) return res.json(null);
    const address = item.address || {};
    const city =
      address.city || address.town || address.village || address.state || "";
    const commune =
      address.municipality || address.county || address.city_district || "";
    const quarter = address.suburb || address.neighbourhood || "";
    const shortParts = [quarter, commune, city, address.country || "Guinée"]
      .filter(Boolean)
      .filter((v, i, arr) => arr.indexOf(v) === i);
    res.json({
      id: String(item.place_id || `${item.lat},${item.lon}`),
      latitude: Number(item.lat),
      longitude: Number(item.lon),
      label: shortParts.join(", ") || item.display_name,
      displayName: item.display_name,
      city: city || undefined,
      commune: commune || undefined,
      quarter: quarter || undefined,
      country: address.country,
    });
  } catch (err) {
    res.status(502).json({
      error: err instanceof Error ? err.message : "Géocodage indisponible",
    });
  }
});

app.get("/listings", (req, res) => {
  const db = readDb();
  let list = [...db.listings];
  if (req.query.public === "1" || req.query.public === "true") {
    list = list.filter((l) => PUBLIC_STATUSES.has(l.status));
  }
  if (req.query.status) {
    const statuses = String(req.query.status).split(",");
    list = list.filter((l) => statuses.includes(l.status));
  }
  if (req.query.ownerId) {
    list = list.filter((l) => l.ownerId === req.query.ownerId);
  }
  if (req.query.agencyId) {
    list = list.filter((l) => l.agencyId === req.query.agencyId);
  }
  if (req.query.advertiserType) {
    list = list.filter((l) => l.advertiserType === req.query.advertiserType);
  }
  list.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  res.json(list.map((listing) => withPublicAdvertiser(db, listing)));
});

app.get("/listings/:id", (req, res) => {
  const db = readDb();
  const listing = db.listings.find(
    (l) => l.id === req.params.id || l.slug === req.params.id,
  );
  if (!listing) return res.status(404).json({ error: "Annonce introuvable" });
  return res.json(withPublicAdvertiser(db, listing));
});

app.get("/listings/:id/bundle", (req, res) => {
  const db = readDb();
  const listing = db.listings.find(
    (l) => l.id === req.params.id || l.slug === req.params.id,
  );
  if (!listing) {
    return res.status(404).json({
      listing: null,
      property: null,
      owner: null,
      agency: null,
      advertiser: null,
      propertyMissing: false,
      advertiserMissing: false,
    });
  }
  const property =
    db.properties.find((p) => p.id === listing.propertyId) || null;
  const owner = listing.ownerId
    ? db.users.find((u) => u.id === listing.ownerId) || null
    : null;
  const agency = listing.agencyId
    ? db.agencies.find((a) => a.id === listing.agencyId) || null
    : null;
  const enriched = withPublicAdvertiser(db, listing);
  const advertiserMissing = Boolean(enriched.advertiser?.missing);
  return res.json({
    listing: enriched,
    property,
    owner,
    agency,
    advertiser: enriched.advertiser,
    propertyMissing: !property,
    advertiserMissing,
  });
});

app.post("/listings", (req, res) => {
  const db = readDb();
  const body = req.body || {};
  const stamp = nowIso();
  let propertyId = body.propertyId || null;

  if (body.property && typeof body.property === "object") {
    const p = body.property;
    const nestedOwnerId = body.ownerId || p.ownerId || null;
    const nestedAgencyId = body.agencyId || p.agencyId || null;
    const nestedType = p.type || "Villa";
    const nestedOp = p.operation || body.operation || "VENTE";
    const nestedScope = accountScopes.assertScopeAllowsProperty(db, {
      ownerId: nestedOwnerId,
      agencyId: nestedAgencyId,
      type: nestedType,
      operation: nestedOp,
    });
    if (!nestedScope.ok) {
      return res.status(nestedScope.status || 403).json({
        error: nestedScope.error,
        code: nestedScope.error,
        message: nestedScope.message,
        allowedPropertyTypes: nestedScope.allowedPropertyTypes,
        allowedOperations: nestedScope.allowedOperations,
      });
    }
    propertyId = p.id || `prop-${Date.now()}`;
    if (!db.properties.some((x) => x.id === propertyId)) {
    const loc = readCanonicalLocation(p);
    const nested = {
        id: propertyId,
        slug: slugify(p.slug || p.title || propertyId),
        reference: p.reference || refProperty(),
        title: p.title || "Bien",
        type: nestedType,
        operation: nestedOp,
        price: Number(p.price ?? body.price) || 0,
        area: Number(p.area ?? p.surface ?? p.surfaceArea) || 0,
        bedrooms: p.bedrooms == null || p.bedrooms === "" ? null : Number(p.bedrooms),
        bathrooms: p.bathrooms == null || p.bathrooms === "" ? null : Number(p.bathrooms),
        amenities: p.amenities || [],
        city: loc.city,
        commune: loc.commune,
        district: loc.district,
        landmark: loc.landmark,
        adminAddress: loc.adminAddress,
        coordinates: loc.coordinates,
        locationLabel: loc.locationLabel || null,
        locationConfirmed: Boolean(p.locationConfirmed),
        ownerId: nestedOwnerId,
        agencyId: nestedAgencyId,
        images: sanitizeImages(p.images || body.images || []),
        videos: p.videos || body.videos || [],
        description: p.description || p.propertyDescription || "",
      };
    nested.media = ensureMediaList(nested);
    normalizePropertyRecord(nested, { enrichIncomplete: false });
    db.properties.unshift(nested);
    }
  }

  if (!propertyId) {
    return res.status(400).json({ error: "propertyId ou property requis" });
  }

  const property = db.properties.find((p) => p.id === propertyId);
  const advertiserType = body.advertiserType || "PROPRIETAIRE";
  const ownerName =
    body.owner ||
    (advertiserType === "AGENCE"
      ? db.agencies.find((a) => a.id === body.agencyId)?.name
      : db.users.find((u) => u.id === body.ownerId)?.name) ||
    "Annonceur";

  // Création : seuls BROUILLON / EN_ATTENTE autorisés (jamais PUBLIEE).
  const requestedStatus = body.status || "EN_ATTENTE";
  const status =
    requestedStatus === "BROUILLON" ? "BROUILLON" : "EN_ATTENTE";

  const listingType = body.type || property?.type || "Villa";
  const listingOperation = body.operation || property?.operation || "VENTE";
  const listingScope = accountScopes.assertScopeAllowsProperty(db, {
    ownerId: body.ownerId || property?.ownerId || null,
    agencyId: body.agencyId || property?.agencyId || null,
    type: listingType,
    operation: listingOperation,
  });
  if (!listingScope.ok) {
    return res.status(listingScope.status || 403).json({
      error: listingScope.error,
      code: listingScope.error,
      message: listingScope.message,
      allowedPropertyTypes: listingScope.allowedPropertyTypes,
      allowedOperations: listingScope.allowedOperations,
    });
  }

  const terms = listingTerms.resolveListingTerms({
    type: listingType,
    operation: listingOperation,
    body,
    fallbackPrice: property?.price,
  });
  if (!terms.ok) {
    return res.status(terms.status).json({
      error: terms.error,
      code: terms.error,
      message: terms.message,
      fields: terms.fields,
    });
  }

  const listing = {
    id: body.id || `ad-${Date.now()}`,
    reference: body.reference || refAd(),
    slug: uniqueListingSlug(db, slugify(body.slug || body.title)),
    propertyId,
    title: body.title || property?.title || "Annonce",
    owner: ownerName,
    advertiserType,
    ownerId: body.ownerId || null,
    agencyId: body.agencyId || null,
    type: listingType,
    operation: listingOperation,
    price: terms.price,
    rentalTerms: terms.rentalTerms,
    saleTerms: terms.saleTerms,
    description: body.description || body.summary || "",
    status,
    createdAt: stamp,
    submittedAt: status === "BROUILLON" ? null : stamp,
    updatedAt: stamp,
    publishedAt: null,
    moderationNote: body.moderationNote || null,
    views: 0,
    favorites: 0,
    contacts: 0,
    reports: 0,
    risk: Number(body.risk) || 20,
    images: sanitizeImages(body.images || property?.images || []),
    media: [],
    videos: body.videos || property?.videos || [],
    history: [
      { id: `h-${Date.now()}-1`, date: stamp, label: "Annonce créée" },
      ...(status === "BROUILLON"
        ? []
        : [
            {
              id: `h-${Date.now()}-2`,
              date: stamp,
              label: "Annonce soumise",
            },
          ]),
    ],
  };
  listing.media = ensureMediaList(listing);

  db.listings.unshift(listing);
  writeDb(db);
  res.status(201).json(listing);
});

app.patch("/listings/:id", (req, res) => {
  const db = readDb();
  const index = db.listings.findIndex(
    (l) => l.id === req.params.id || l.slug === req.params.id,
  );
  if (index < 0) return res.status(404).json({ error: "Annonce introuvable" });
  const stamp = nowIso();
  const prev = db.listings[index];
  const body = req.body || {};
  // Interdit de changer le workflow via PATCH (status / publishedAt / history).
  const {
    status: _status,
    publishedAt: _publishedAt,
    submittedAt: _submittedAt,
    history: _history,
    id: _id,
    ...safe
  } = body;
  const termsPatch = listingTerms.mergeListingTermsPatch(prev, safe);
  db.listings[index] = {
    ...prev,
    ...safe,
    ...termsPatch,
    id: prev.id,
    status: prev.status,
    publishedAt: prev.publishedAt,
    submittedAt: prev.submittedAt,
    history: prev.history,
    updatedAt: stamp,
  };
  writeDb(db);
  res.json(db.listings[index]);
});

const ADMIN_ACTORS = new Set([
  "ADMIN",
  "SUPER_ADMIN",
  "MODERATEUR",
  "admin",
  "super_admin",
]);

function applyListingStatus(
  listing,
  {
    status,
    note,
    actor,
    canResubmit,
    resubmitRequiresVerifiedAdvertiser,
    historyLabel,
  },
  stamp,
) {
  // Alias legacy → canonique
  if (status === "REJETEE") status = "REFUSEE";

  const labels = {
    PUBLIEE: "Annonce approuvée",
    REFUSEE: "Annonce refusée",
    A_CORRIGER: "Correction demandée",
    SUSPENDUE: "Annonce suspendue",
    EN_ATTENTE: "Annonce soumise",
    BROUILLON: "Annonce repassée en brouillon",
    ARCHIVEE: "Annonce archivée",
  };

  listing.status = status;
  listing.updatedAt = stamp;
  if (note !== undefined) {
    listing.moderationNote = note || null;
    if (status === "REFUSEE") listing.rejectionReason = note || null;
  }
  if (status === "PUBLIEE") listing.publishedAt = stamp;
  if (status === "EN_ATTENTE") {
    listing.submittedAt = stamp;
    listing.publishedAt = null;
  }
  if (status === "BROUILLON") listing.publishedAt = null;

  if (status === "A_CORRIGER") {
    listing.canResubmit = true;
    listing.resubmitRequiresVerifiedAdvertiser = false;
  }
  if (status === "REFUSEE") {
    const defaultCan =
      canResubmit !== undefined
        ? Boolean(canResubmit)
        : !isDefinitiveRefusalNote(note || listing.moderationNote);
    listing.canResubmit = defaultCan;
    listing.resubmitRequiresVerifiedAdvertiser =
      resubmitRequiresVerifiedAdvertiser !== undefined
        ? Boolean(resubmitRequiresVerifiedAdvertiser)
        : /non v[eé]rifi/i.test(String(note || listing.moderationNote || ""));
  }
  if (canResubmit !== undefined && status !== "REFUSEE" && status !== "A_CORRIGER") {
    listing.canResubmit = Boolean(canResubmit);
  }

  listing.history = [
    ...(listing.history || []),
    {
      id: `h-${Date.now()}`,
      date: stamp,
      label: `${historyLabel || labels[status] || `Statut ${status}`}${
        actor ? ` (${actor})` : ""
      }`,
    },
  ];
  return listing;
}

/** Seule voie EN_ATTENTE → PUBLIEE (modération). */
app.post(
  "/listings/:id/approve",
  requireAdminPermission("MODERATION"),
  (req, res) => {
    const db = readDb();
    const index = db.listings.findIndex(
      (l) => l.id === req.params.id || l.slug === req.params.id,
    );
    if (index < 0) return res.status(404).json({ error: "Annonce introuvable" });

    const listing = db.listings[index];
    if (listing.status !== "EN_ATTENTE") {
      return res.status(409).json({
        error: `Approbation impossible depuis le statut ${listing.status}`,
      });
    }

    const property = (db.properties || []).find((p) => p.id === listing.propertyId);
    if (
      REQUIRE_PROPERTY_LEGAL_VERIFICATION_FOR_PUBLICATION &&
      property &&
      property.legalVerificationStatus !== "VERIFIE"
    ) {
      return res.status(409).json({
        error:
          "Publication refusée : le bien n’est pas juridiquement vérifié (legalVerificationStatus ≠ VERIFIE).",
        legalVerificationStatus: property.legalVerificationStatus || "NON_SOUMIS",
      });
    }

    const stamp = nowIso();
    const actor = req.admin.email;
    applyListingStatus(
      listing,
      {
        status: "PUBLIEE",
        note: req.body?.note,
        actor,
        historyLabel: "Annonce approuvée (modération)",
      },
      stamp,
    );
    listing.approvedByAdminId = req.admin.id;
    listing.publishedByAdminId = req.admin.id;
    db.listings[index] = listing;
    pushAudit(db, {
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: "LISTING_APPROVE",
      entityType: "listing",
      entityId: listing.id,
      targetOwnerId: listing.ownerId || null,
      targetAgencyId: listing.agencyId || null,
      message: "Annonce approuvée après soumission",
    });
    writeDb(db);
    res.json(listing);
  },
);

/** Publication admin directe : BROUILLON → PUBLIEE (sans file d’attente). */
app.post(
  "/listings/:id/publish",
  requireAdminPermission("ANNONCES_PUBLICATION"),
  (req, res) => {
    const db = readDb();
    const index = db.listings.findIndex(
      (l) => l.id === req.params.id || l.slug === req.params.id,
    );
    if (index < 0) return res.status(404).json({ error: "Annonce introuvable" });

    const listing = db.listings[index];
    if (listing.status !== "BROUILLON" && listing.status !== "SUSPENDUE") {
      return res.status(409).json({
        error: `Publication directe impossible depuis ${listing.status}. Utilisez la modération pour EN_ATTENTE.`,
      });
    }

    const property = (db.properties || []).find((p) => p.id === listing.propertyId);
    if (
      REQUIRE_PROPERTY_LEGAL_VERIFICATION_FOR_PUBLICATION &&
      property &&
      property.legalVerificationStatus !== "VERIFIE"
    ) {
      return res.status(409).json({
        error:
          "Publication refusée : le bien n’est pas juridiquement vérifié (legalVerificationStatus ≠ VERIFIE).",
        legalVerificationStatus: property.legalVerificationStatus || "NON_SOUMIS",
      });
    }

    const stamp = nowIso();
    applyListingStatus(
      listing,
      {
        status: "PUBLIEE",
        note: req.body?.note,
        actor: req.admin.email,
        historyLabel: "Annonce publiée directement par administrateur",
      },
      stamp,
    );
    listing.publishedByAdminId = req.admin.id;
    listing.publishedAt = stamp;
    db.listings[index] = listing;
    pushAudit(db, {
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: "LISTING_PUBLISH_DIRECT",
      entityType: "listing",
      entityId: listing.id,
      targetOwnerId: listing.ownerId || null,
      targetAgencyId: listing.agencyId || null,
      message: "Annonce publiée directement par administrateur",
    });
    writeDb(db);
    res.json(listing);
  },
);

app.post(
  "/listings/:id/request-correction",
  requireAdminPermission("MODERATION"),
  (req, res) => {
    const note = String(req.body?.note || "").trim();
    if (!note) {
      return res.status(400).json({ error: "Un motif de correction est obligatoire." });
    }
    const db = readDb();
    const index = db.listings.findIndex(
      (l) => l.id === req.params.id || l.slug === req.params.id,
    );
    if (index < 0) return res.status(404).json({ error: "Annonce introuvable" });
    const listing = db.listings[index];
    if (listing.status !== "EN_ATTENTE" && listing.status !== "PUBLIEE") {
      return res.status(409).json({
        error: `Correction impossible depuis ${listing.status}`,
      });
    }
    const stamp = nowIso();
    applyListingStatus(
      listing,
      {
        status: "A_CORRIGER",
        note,
        actor: req.admin.email,
      },
      stamp,
    );
    db.listings[index] = listing;
    pushAudit(db, {
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: "LISTING_REQUEST_CORRECTION",
      entityType: "listing",
      entityId: listing.id,
      targetOwnerId: listing.ownerId || null,
      targetAgencyId: listing.agencyId || null,
      message: note,
    });
    writeDb(db);
    res.json(listing);
  },
);

app.post(
  "/listings/:id/reject",
  requireAdminPermission("MODERATION"),
  (req, res) => {
    const note = String(req.body?.note || "").trim();
    if (!note) {
      return res.status(400).json({ error: "Un motif de refus est obligatoire." });
    }
    const db = readDb();
    const index = db.listings.findIndex(
      (l) => l.id === req.params.id || l.slug === req.params.id,
    );
    if (index < 0) return res.status(404).json({ error: "Annonce introuvable" });
    const listing = db.listings[index];
    if (listing.status !== "EN_ATTENTE") {
      return res.status(409).json({
        error: `Refus impossible depuis ${listing.status}`,
      });
    }
    const stamp = nowIso();
    applyListingStatus(
      listing,
      {
        status: "REFUSEE",
        note,
        actor: req.admin.email,
        canResubmit: req.body?.canResubmit,
        resubmitRequiresVerifiedAdvertiser:
          req.body?.resubmitRequiresVerifiedAdvertiser,
      },
      stamp,
    );
    db.listings[index] = listing;
    pushAudit(db, {
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: "LISTING_REJECT",
      entityType: "listing",
      entityId: listing.id,
      targetOwnerId: listing.ownerId || null,
      targetAgencyId: listing.agencyId || null,
      message: note,
    });
    writeDb(db);
    res.json(listing);
  },
);

app.post("/listings/:id/status", (req, res) => {
  const db = readDb();
  const index = db.listings.findIndex(
    (l) => l.id === req.params.id || l.slug === req.params.id,
  );
  if (index < 0) return res.status(404).json({ error: "Annonce introuvable" });

  let {
    status,
    note,
    actor,
    canResubmit,
    resubmitRequiresVerifiedAdvertiser,
  } = req.body || {};
  if (!status) return res.status(400).json({ error: "status requis" });
  if (status === "REJETEE") status = "REFUSEE";

  const current = db.listings[index];
  const admin = resolveAdminFromRequest(req);

  // Transitions admin sensibles → permissions
  if (status === "PUBLIEE") {
    const property = (db.properties || []).find(
      (p) => p.id === current.propertyId,
    );
    if (
      REQUIRE_PROPERTY_LEGAL_VERIFICATION_FOR_PUBLICATION &&
      property &&
      property.legalVerificationStatus !== "VERIFIE"
    ) {
      return res.status(409).json({
        error:
          "Publication refusée : le bien n’est pas juridiquement vérifié (legalVerificationStatus ≠ VERIFIE). Vérification interne Demeure Guinée requise.",
        legalVerificationStatus: property.legalVerificationStatus || "NON_SOUMIS",
        requirePropertyLegalVerificationForPublication: true,
      });
    }
    if (current.status === "EN_ATTENTE") {
      if (!admin || !adminHasPermission(admin, "MODERATION")) {
        return res.status(403).json({
          error: "MODERATION requis pour approuver une soumission. Utilisez /approve.",
        });
      }
    } else if (current.status === "BROUILLON" || current.status === "SUSPENDUE") {
      if (!admin || !adminHasPermission(admin, "ANNONCES_PUBLICATION")) {
        return res.status(403).json({
          error:
            "ANNONCES_PUBLICATION requis pour publier directement. Utilisez /publish.",
        });
      }
    } else {
      return res.status(409).json({
        error: `Publication impossible depuis le statut ${current.status}`,
      });
    }
  }

  if (
    (status === "A_CORRIGER" || status === "REFUSEE" || status === "SUSPENDUE") &&
    (!admin || !adminHasPermission(admin, "MODERATION"))
  ) {
    return res.status(403).json({
      error: "MODERATION requis pour cette décision.",
    });
  }

  // Compat ancienne : PUBLIEE via actor string uniquement si admin authentifié déjà validé.
  if (status === "PUBLIEE" && !admin && !ADMIN_ACTORS.has(actor || "")) {
    return res.status(403).json({
      error:
        "Seule l’administration peut publier une annonce. Utilisez POST /listings/:id/approve ou /publish.",
    });
  }

  // Renvoi A_CORRIGER / REFUSEE → EN_ATTENTE via /resubmit uniquement.
  if (
    status === "EN_ATTENTE" &&
    (current.status === "A_CORRIGER" ||
      current.status === "REFUSEE" ||
      current.status === "REJETEE")
  ) {
    return res.status(400).json({
      error: "Utilisez POST /listings/:id/resubmit pour renvoyer l’annonce.",
    });
  }

  if (status === "A_CORRIGER" && !String(note || "").trim()) {
    return res.status(400).json({
      error: "Un motif de correction est obligatoire.",
    });
  }
  if (status === "REFUSEE" && !String(note || "").trim()) {
    return res.status(400).json({
      error: "Un motif de refus est obligatoire.",
    });
  }

  const stamp = nowIso();
  const resolvedActor = admin?.email || actor;
  const previousStatus = current.status;
  let historyLabel;
  if (status === "PUBLIEE" && previousStatus !== "EN_ATTENTE") {
    historyLabel = "Annonce publiée directement par administrateur";
  }

  const listing = applyListingStatus(
    current,
    {
      status,
      note,
      actor: resolvedActor,
      canResubmit,
      resubmitRequiresVerifiedAdvertiser,
      historyLabel,
    },
    stamp,
  );
  if (admin && status === "PUBLIEE") {
    if (previousStatus === "EN_ATTENTE") {
      listing.approvedByAdminId = admin.id;
    }
    listing.publishedByAdminId = admin.id;
  }
  db.listings[index] = listing;
  if (admin) {
    pushAudit(db, {
      adminId: admin.id,
      adminEmail: admin.email,
      action: `LISTING_STATUS_${status}`,
      entityType: "listing",
      entityId: listing.id,
      targetOwnerId: listing.ownerId || null,
      targetAgencyId: listing.agencyId || null,
    });
  }
  writeDb(db);
  res.json(listing);
});

/** Renvoi annonceur : A_CORRIGER | REFUSEE(canResubmit) → EN_ATTENTE */
app.post("/listings/:id/resubmit", (req, res) => {
  const db = readDb();
  const index = db.listings.findIndex(
    (l) => l.id === req.params.id || l.slug === req.params.id,
  );
  if (index < 0) return res.status(404).json({ error: "Annonce introuvable" });

  const listing = db.listings[index];
  const from = listing.status === "REJETEE" ? "REFUSEE" : listing.status;

  if (from === "A_CORRIGER") {
    // ok
  } else if (from === "REFUSEE") {
    if (listing.canResubmit !== true) {
      return res.status(409).json({
        error: "Cette annonce ne peut pas être renvoyée.",
      });
    }
  } else {
    return res.status(409).json({
      error: `Renvoi impossible depuis le statut ${listing.status}`,
    });
  }

  if (listing.resubmitRequiresVerifiedAdvertiser) {
    if (!advertiserIsVerified(db, listing)) {
      return res.status(403).json({
        error:
          "Votre compte doit être vérifié avant de pouvoir renvoyer cette annonce.",
      });
    }
  }

  const stamp = nowIso();
  const actor = (req.body && req.body.actor) || "ANNONCEUR";
  applyListingStatus(
    listing,
    {
      status: "EN_ATTENTE",
      actor,
      historyLabel: "Annonce renvoyée pour validation",
    },
    stamp,
  );
  db.listings[index] = listing;
  writeDb(db);

  db.notifications = db.notifications || [];
  db.notifications.unshift({
    id: `n-${Date.now()}`,
    type: "LISTING_RESUBMITTED",
    listingId: listing.id,
    createdAt: stamp,
    message: `Annonce ${listing.reference} renvoyée pour validation`,
  });
  db.auditLogs = db.auditLogs || [];
  db.auditLogs.unshift({
    id: `audit-${Date.now()}`,
    action: "LISTING_RESUBMIT",
    target: listing.id,
    actor,
    date: stamp,
  });
  writeDb(db);

  res.json(listing);
});

/** Admin — création bien pour propriétaire/agence (jamais owner = admin). */
app.post(
  "/admin/properties",
  requireAdminPermission("BIENS_ECRITURE"),
  (req, res) => {
    const db = readDb();
    const body = req.body || {};
    logPropertyTrace("PROPERTY RECEIVED", body);
    const built = buildPropertyFromBody(db, body, req.admin);
    if (built.error) return res.status(400).json({ error: built.error });
    const { property } = built;
    // Jamais rattacher le bien à l’admin
    if (
      property.ownerId === req.admin.id ||
      property.ownerId === req.admin.email
    ) {
      return res.status(400).json({
        error: "L’administrateur ne peut pas être propriétaire du bien.",
      });
    }
    db.properties.unshift(property);
    pushAudit(db, {
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: property.agencyId
        ? "PROPERTY_CREATE_FOR_AGENCY"
        : "PROPERTY_CREATE_FOR_OWNER",
      entityType: "property",
      entityId: property.id,
      targetOwnerId: property.ownerId || null,
      targetAgencyId: property.agencyId || null,
      message: property.agencyId
        ? "Bien créé pour une agence"
        : "Bien créé pour un propriétaire",
    });
    writeDb(db);
    logPropertyTrace("PROPERTY SAVED", property);
    res.status(201).json(property);
  },
);

app.patch(
  "/admin/properties/:id",
  requireAdminPermission("BIENS_ECRITURE"),
  (req, res) => {
    const db = readDb();
    const index = db.properties.findIndex(
      (p) => p.id === req.params.id || p.slug === req.params.id,
    );
    if (index < 0) return res.status(404).json({ error: "Bien introuvable" });
    const body = req.body || {};
    const prev = db.properties[index];

    logPropertyTrace("PROPERTY PATCH RECEIVED", { ...body, id: prev.id });

    function optionalInt(value, fallback) {
      if (value === undefined) return fallback;
      if (value === null || value === "") return null;
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    }

    // Empêcher de transformer l’admin en propriétaire
    if (body.ownerId === req.admin.id || body.ownerId === req.admin.email) {
      return res.status(400).json({
        error: "L’administrateur ne peut pas être propriétaire du bien.",
      });
    }

    const next = mergePropertyPatch(prev, body);
    next.bedrooms = optionalInt(body.bedrooms, prev.bedrooms);
    next.bathrooms = optionalInt(body.bathrooms, prev.bathrooms);
    next.ownerId = body.ownerId !== undefined ? body.ownerId : prev.ownerId;
    next.agencyId = body.agencyId !== undefined ? body.agencyId : prev.agencyId;
    next.updatedByAdminId = req.admin.id;
    if (body.images) {
      next.images = sanitizeImages(body.images);
      next.media = ensureMediaList(next);
    }
    normalizePropertyRecord(next, { enrichIncomplete: false });
    db.properties[index] = next;
    pushAudit(db, {
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: "PROPERTY_UPDATE",
      entityType: "property",
      entityId: next.id,
      targetOwnerId: next.ownerId || null,
      targetAgencyId: next.agencyId || null,
    });
    writeDb(db);
    logPropertyTrace("PROPERTY PATCH SAVED", next);
    res.json(next);
  },
);

app.post(
  "/admin/listings",
  requireAdminPermission("ANNONCES_ECRITURE"),
  (req, res) => {
    const db = readDb();
    const body = req.body || {};
    const stamp = nowIso();
    const propertyId = body.propertyId;
    if (!propertyId) {
      return res.status(400).json({ error: "propertyId requis" });
    }
    const property = db.properties.find((p) => p.id === propertyId);
    if (!property) {
      return res.status(404).json({ error: "Bien introuvable" });
    }

    const advertiserType =
      body.advertiserType ||
      (property.agencyId ? "AGENCE" : "PROPRIETAIRE");
    const ownerId =
      body.ownerId !== undefined ? body.ownerId : property.ownerId || null;
    const agencyId =
      body.agencyId !== undefined ? body.agencyId : property.agencyId || null;
    const ownerName =
      body.owner ||
      (advertiserType === "AGENCE"
        ? db.agencies.find((a) => a.id === agencyId)?.name
        : db.users.find((u) => u.id === ownerId)?.name) ||
      "Annonceur";

    // Création admin : brouillon par défaut (publication via /publish).
    const status = body.status === "EN_ATTENTE" ? "EN_ATTENTE" : "BROUILLON";

    const adminListingType = body.type || property.type || "Villa";
    const adminListingOperation =
      body.operation || property.operation || "VENTE";
    // L'admin saisit au nom de l'annonceur : mêmes règles métier.
    const terms = listingTerms.resolveListingTerms({
      type: adminListingType,
      operation: adminListingOperation,
      body,
      fallbackPrice: property.price,
    });
    if (!terms.ok) {
      return res.status(terms.status).json({
        error: terms.error,
        code: terms.error,
        message: terms.message,
        fields: terms.fields,
      });
    }

    const listing = {
      id: body.id || `ad-${Date.now()}`,
      reference: body.reference || refAd(),
      slug: uniqueListingSlug(db, slugify(body.slug || body.title || property.title)),
      propertyId,
      title: body.title || property.title || "Annonce",
      owner: ownerName,
      advertiserType,
      ownerId,
      agencyId,
      type: adminListingType,
      operation: adminListingOperation,
      price: terms.price,
      rentalTerms: terms.rentalTerms,
      saleTerms: terms.saleTerms,
      description: body.description || body.summary || "",
      status,
      createdAt: stamp,
      submittedAt: status === "EN_ATTENTE" ? stamp : null,
      updatedAt: stamp,
      publishedAt: null,
      moderationNote: null,
      createdByAdminId: req.admin.id,
      updatedByAdminId: req.admin.id,
      views: 0,
      favorites: 0,
      contacts: 0,
      reports: 0,
      risk: Number(body.risk) || 20,
      images: sanitizeImages(body.images || property.images || []),
      media: [],
      videos: body.videos || property.videos || [],
      history: [
        {
          id: `h-${Date.now()}-1`,
          date: stamp,
          label: `Annonce créée par administrateur (${req.admin.email})`,
        },
      ],
    };
    listing.media = ensureMediaList(listing);
    db.listings.unshift(listing);
    pushAudit(db, {
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: "LISTING_CREATE_ADMIN",
      entityType: "listing",
      entityId: listing.id,
      targetOwnerId: listing.ownerId || null,
      targetAgencyId: listing.agencyId || null,
      message: "Annonce créée administrativement",
    });
    writeDb(db);
    res.status(201).json(listing);
  },
);

app.get("/admin/admins", (_req, res) => {
  res.json(readDb().admins || []);
});

app.get("/admin/audit", requireAdminPermission("AUDIT"), (req, res) => {
  const logs = readDb().auditLogs || [];
  res.json(logs.slice(0, Number(req.query.limit) || 100));
});

/* ——— Demandes de rôle / vérification documentaire ——— */

function findRoleRequest(db, id) {
  return (db.roleRequests || []).find((r) => r.id === id || r.reference === id);
}

function isUsableApplicantReason(reason) {
  const value = String(reason || "")
    .trim()
    .replace(/\s+/g, " ");
  if (!value || value.length < 24) return false;
  if (value.split(/\s+/).filter(Boolean).length < 3) return false;
  const compact = value.replace(/\s/g, "");
  if (/^(.)\1+$/.test(compact)) return false;
  return true;
}

/** REFUSEE n’est clôturée que si canResubmit !== true. */
function isRoleRequestClosed(item) {
  if (!item) return true;
  if (item.status === "APPROUVEE") return true;
  return item.status === "REFUSEE" && item.canResubmit !== true;
}

function canSubmitRoleRequest(item) {
  if (!item) return false;
  if (["BROUILLON", "A_CORRIGER"].includes(item.status)) return true;
  return item.status === "REFUSEE" && item.canResubmit === true;
}

app.get("/role-requests", (req, res) => {
  const db = readDb();
  let list = [...(db.roleRequests || [])];
  if (req.query.userId) {
    list = list.filter((r) => r.userId === req.query.userId);
  }
  if (req.query.status) {
    list = list.filter((r) => r.status === req.query.status);
  }
  list.sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
  res.json(list);
});

app.get("/role-requests/:id", (req, res) => {
  const db = readDb();
  const item = findRoleRequest(db, req.params.id);
  if (!item) return res.status(404).json({ error: "Demande introuvable" });
  const documents = docsForRequest(db, item).map((d) => publicDocView(d, item));
  res.json({ ...item, documents, completeness: computeCompleteness(item, documents) });
});

/**
 * Projet déclaré : modèle relationnel (un type + ses opérations + volume).
 * Les listes plates restent dérivées pour les clients V1.
 */
function syncDeclaredIntents(item, rawIntents) {
  const provided = accountScopes.normalizeIntentList(rawIntents || []);
  const intents =
    provided.length > 0
      ? provided
      : accountScopes.intentsFromFlat(
          item.declaredPropertyTypes,
          item.declaredOperations,
          item.declaredPortfolioSize,
        );
  item.declaredPropertyIntents = intents;
  const flat = accountScopes.flatFromIntents(intents);
  item.declaredPropertyTypes = flat.types;
  item.declaredOperations = flat.operations;
  item.declaredPortfolioSize = flat.portfolioSize;
  return intents;
}

app.post("/role-requests", (req, res) => {
  const db = readDb();
  const body = req.body || {};
  const userId = String(body.userId || "").trim();
  if (!userId) return res.status(400).json({ error: "userId requis" });
  const requestedRole = body.requestedRole === "AGENCE" ? "AGENCE" : "PROPRIETAIRE";
  const stamp = nowIso();
  const item = {
    id: verificationUid("rr"),
    reference: refRole(),
    userId,
    requestedRole,
    activityType: body.activityType || null,
    status: "BROUILLON",
    verificationLevel: "STRUCTURED_V1",
    personalInformation: body.personalInformation || {},
    companyInformation: body.companyInformation || null,
    representative: body.representative || null,
    declarations: body.declarations || {
      accuracy: false,
      authorization: false,
      processing: false,
      privacy: false,
    },
    declaredPropertyTypes: accountScopes.normalizePropertyTypes(body.declaredPropertyTypes || []),
    declaredOperations: accountScopes.normalizeOperations(body.declaredOperations || []),
    declaredPortfolioSize: accountScopes.normalizePortfolioSize(body.declaredPortfolioSize),
    sectionReviews: accountScopes.defaultSectionReviews(),
    proposedConfiguration: null,
    appliedConfiguration: null,
    documentIds: [],
    correctionMessage: null,
    risk: "FAIBLE",
    completeness: 0,
    createdAt: stamp,
    updatedAt: stamp,
    submittedAt: null,
    reviewedAt: null,
    reviewedByAdminId: null,
    history: [],
  };
  syncDeclaredIntents(item, body.declaredPropertyIntents);
  item.proposedConfiguration = accountScopes.proposeConfigFromRequest(item);
  pushHistory(item, "Demande créée");
  item.completeness = computeCompleteness(item, []);
  db.roleRequests.unshift(item);
  writeDb(db);
  res.status(201).json(item);
});

app.patch("/role-requests/:id", (req, res) => {
  const db = readDb();
  const item = findRoleRequest(db, req.params.id);
  if (!item) return res.status(404).json({ error: "Demande introuvable" });
  if (isRoleRequestClosed(item)) {
    return res.status(409).json({ error: "Demande clôturée — non modifiable." });
  }
  const body = req.body || {};
  if (body.personalInformation) {
    item.personalInformation = { ...item.personalInformation, ...body.personalInformation };
  }
  if (body.companyInformation !== undefined) {
    item.companyInformation = body.companyInformation
      ? { ...(item.companyInformation || {}), ...body.companyInformation }
      : null;
  }
  if (body.representative !== undefined) {
    item.representative = body.representative
      ? { ...(item.representative || {}), ...body.representative }
      : null;
  }
  if (body.activityType !== undefined) item.activityType = body.activityType;
  if (body.declarations) {
    item.declarations = { ...item.declarations, ...body.declarations };
  }
  if (body.requestedRole === "AGENCE" || body.requestedRole === "PROPRIETAIRE") {
    item.requestedRole = body.requestedRole;
  }
  if (body.declaredPropertyTypes !== undefined) {
    item.declaredPropertyTypes = accountScopes.normalizePropertyTypes(body.declaredPropertyTypes);
  }
  if (body.declaredOperations !== undefined) {
    item.declaredOperations = accountScopes.normalizeOperations(body.declaredOperations);
  }
  if (body.declaredPortfolioSize !== undefined) {
    item.declaredPortfolioSize = accountScopes.normalizePortfolioSize(body.declaredPortfolioSize);
  }
  if (!item.sectionReviews) item.sectionReviews = accountScopes.defaultSectionReviews();
  syncDeclaredIntents(item, body.declaredPropertyIntents);
  item.proposedConfiguration = accountScopes.proposeConfigFromRequest(item);
  item.updatedAt = nowIso();
  const documents = docsForRequest(db, item);
  item.completeness = computeCompleteness(item, documents);
  pushHistory(item, "Dossier mis à jour");
  writeDb(db);
  res.json({ ...item, documents: documents.map((d) => publicDocView(d, item)) });
});

app.post("/role-requests/:id/documents", (req, res) => {
  const db = readDb();
  const item = findRoleRequest(db, req.params.id);
  if (!item) return res.status(404).json({ error: "Demande introuvable" });
  if (isRoleRequestClosed(item)) {
    return res.status(409).json({ error: "Demande clôturée." });
  }
  const body = req.body || {};
  const documentType = String(body.documentType || "").trim();
  if (!documentType) return res.status(400).json({ error: "documentType requis" });
  const stamp = nowIso();
  const doc = {
    id: verificationUid("doc"),
    ownerType: item.requestedRole === "AGENCE" ? "AGENCY" : "USER",
    ownerId: item.userId,
    roleRequestId: item.id,
    propertyId: null,
    documentType,
    label: body.label || documentType,
    side: body.side || null,
    reference: body.reference || null,
    issuer: body.issuer || null,
    issuedAt: body.issuedAt || null,
    expiresAt: body.expiresAt || null,
    holderName: body.holderName || null,
    fileName: body.fileName || null,
    mimeType: body.mimeType || null,
    fileSize: body.fileSize || null,
    // Simulation metadata-only : chemin placeholder (préférer /documents/upload)
    fileUrl: body.fileUrl || `/demo-docs/${documentType.toLowerCase()}.pdf`,
    verificationStatus: "EN_ATTENTE",
    verifiedByAdminId: null,
    verifiedAt: null,
    rejectionReason: null,
    required: body.required !== false,
    createdAt: stamp,
    updatedAt: stamp,
  };
  db.verificationDocuments.unshift(doc);
  item.documentIds = item.documentIds || [];
  item.documentIds.push(doc.id);
  item.updatedAt = stamp;
  pushHistory(item, `Document ajouté : ${doc.label}`);
  item.completeness = computeCompleteness(item, docsForRequest(db, item));
  writeDb(db);
  res.status(201).json(publicDocView(doc, item));
});

const VERIFICATION_UPLOAD_DIR = path.join(__dirname, "uploads", "verification");
const VERIFICATION_MAX_BYTES = 5 * 1024 * 1024;
const VERIFICATION_ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "application/pdf",
]);

fs.mkdirSync(VERIFICATION_UPLOAD_DIR, { recursive: true });

const verificationUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, VERIFICATION_UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const ext =
        file.mimetype === "application/pdf"
          ? ".pdf"
          : file.mimetype === "image/png"
            ? ".png"
            : ".jpg";
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`);
    },
  }),
  limits: { fileSize: VERIFICATION_MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!VERIFICATION_ALLOWED_MIME.has(file.mimetype)) {
      return cb(new Error("Format non accepté."));
    }
    cb(null, true);
  },
});

app.post(
  "/role-requests/:id/documents/upload",
  (req, res, next) => {
    verificationUpload.single("file")(req, res, (err) => {
      if (err) {
        const message =
          err.code === "LIMIT_FILE_SIZE"
            ? "Le fichier dépasse la taille maximale autorisée (5 Mo)."
            : err.message || "Impossible d’envoyer ce document. Réessayez.";
        return res.status(400).json({ error: message });
      }
      next();
    });
  },
  (req, res) => {
    const db = readDb();
    const item = findRoleRequest(db, req.params.id);
    if (!item) return res.status(404).json({ error: "Demande introuvable" });
    if (isRoleRequestClosed(item)) {
      return res.status(409).json({ error: "Demande clôturée." });
    }
    const userId = String(req.headers["x-user-id"] || "").trim();
    if (userId && userId !== item.userId) {
      return res.status(403).json({ error: "Accès refusé." });
    }
    if (!req.file) {
      return res.status(400).json({ error: "Fichier requis." });
    }
    const documentType = String(req.body?.documentType || "").trim();
    if (!documentType) {
      try {
        fs.unlinkSync(req.file.path);
      } catch {
        /* ignore */
      }
      return res.status(400).json({ error: "documentType requis" });
    }
    if (
      documentType === "SELFIE_VERIFICATION" &&
      !["image/jpeg", "image/png"].includes(req.file.mimetype)
    ) {
      try {
        fs.unlinkSync(req.file.path);
      } catch {
        /* ignore */
      }
      return res
        .status(400)
        .json({ error: "Format non accepté. Utilisez JPG ou PNG." });
    }

    // Remplacer un document du même type s’il existe déjà
    const existingDocs = docsForRequest(db, item).filter(
      (d) => d.documentType === documentType,
    );
    for (const old of existingDocs) {
      if (old.storedFileName) {
        const oldPath = path.join(VERIFICATION_UPLOAD_DIR, old.storedFileName);
        try {
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        } catch {
          /* ignore */
        }
      }
      db.verificationDocuments = (db.verificationDocuments || []).filter(
        (d) => d.id !== old.id,
      );
      item.documentIds = (item.documentIds || []).filter((id) => id !== old.id);
    }

    const stamp = nowIso();
    const storedFileName = req.file.filename;
    const doc = {
      id: verificationUid("doc"),
      ownerType: item.requestedRole === "AGENCE" ? "AGENCY" : "USER",
      ownerId: item.userId,
      roleRequestId: item.id,
      propertyId: null,
      documentType,
      label: req.body?.label || documentType,
      side: req.body?.side || null,
      reference: req.body?.reference || null,
      issuer: req.body?.issuer || null,
      issuedAt: req.body?.issuedAt || null,
      expiresAt: req.body?.expiresAt || null,
      holderName: req.body?.holderName || null,
      fileName: req.file.originalname || storedFileName,
      storedFileName,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      fileUrl: `/verification-files/${storedFileName}`,
      verificationStatus: "EN_ATTENTE",
      verifiedByAdminId: null,
      verifiedAt: null,
      rejectionReason: null,
      required: String(req.body?.required || "true") !== "false",
      createdAt: stamp,
      updatedAt: stamp,
    };
    db.verificationDocuments.unshift(doc);
    item.documentIds = item.documentIds || [];
    item.documentIds.push(doc.id);
    item.updatedAt = stamp;
    pushHistory(item, `Document uploadé : ${doc.label}`);
    item.completeness = computeCompleteness(item, docsForRequest(db, item));
    writeDb(db);
    res.status(201).json(publicDocView(doc, item));
  },
);

app.delete("/role-requests/:id/documents/:docId", (req, res) => {
  const db = readDb();
  const item = findRoleRequest(db, req.params.id);
  if (!item) return res.status(404).json({ error: "Demande introuvable" });
  if (isRoleRequestClosed(item)) {
    return res.status(409).json({ error: "Demande clôturée." });
  }
  const userId = String(req.headers["x-user-id"] || "").trim();
  if (userId && userId !== item.userId) {
    return res.status(403).json({ error: "Accès refusé." });
  }
  const doc = (db.verificationDocuments || []).find(
    (d) => d.id === req.params.docId && d.roleRequestId === item.id,
  );
  if (!doc) return res.status(404).json({ error: "Document introuvable" });
  if (doc.storedFileName) {
    const filePath = path.join(VERIFICATION_UPLOAD_DIR, doc.storedFileName);
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {
      /* ignore */
    }
  }
  db.verificationDocuments = (db.verificationDocuments || []).filter(
    (d) => d.id !== doc.id,
  );
  item.documentIds = (item.documentIds || []).filter((id) => id !== doc.id);
  item.updatedAt = nowIso();
  pushHistory(item, `Document supprimé : ${doc.label || doc.documentType}`);
  item.completeness = computeCompleteness(item, docsForRequest(db, item));
  writeDb(db);
  res.json({ ok: true });
});

/** Fichiers privés de vérification — accès contrôlé via X-User-Id (Demo). */
app.get("/verification-files/:file", (req, res) => {
  const safe = String(req.params.file || "").replace(/[^\w.\-]+/g, "");
  if (!safe) return res.status(400).json({ error: "Fichier invalide" });
  const filePath = path.join(VERIFICATION_UPLOAD_DIR, safe);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Fichier introuvable" });
  }
  const db = readDb();
  const doc = (db.verificationDocuments || []).find(
    (d) => d.storedFileName === safe,
  );
  const userId = String(
    req.headers["x-user-id"] || req.query.userId || "",
  ).trim();
  if (doc && userId && userId !== doc.ownerId) {
    // Demo admin bypass simple
    const admin = (db.admins || []).find((a) => a.id === userId);
    if (!admin) return res.status(403).json({ error: "Accès refusé." });
  }
  res.sendFile(filePath);
});

app.post("/role-requests/:id/submit", (req, res) => {
  const db = readDb();
  const item = findRoleRequest(db, req.params.id);
  if (!item) return res.status(404).json({ error: "Demande introuvable" });
  if (!canSubmitRoleRequest(item)) {
    return res.status(409).json({ error: "Soumission impossible dans cet état." });
  }
  const decls = item.declarations || {};
  if (!decls.accuracy || !decls.authorization || !decls.processing || !decls.privacy) {
    return res.status(400).json({ error: "Déclarations obligatoires incomplètes." });
  }
  const documents = docsForRequest(db, item);
  const p = item.personalInformation || {};
  const hasFile = (type) =>
    documents.some((d) => d.documentType === type && d.fileName && d.fileUrl);
  const hasIdentity =
    p.idType === "PASSEPORT"
      ? hasFile("PASSEPORT")
      : hasFile("CNI_RECTO") && hasFile("CNI_VERSO");
  if (!hasIdentity) {
    return res.status(400).json({
      error:
        p.idType === "PASSEPORT"
          ? "Le scan du passeport est obligatoire."
          : "Le recto et le verso de la pièce d’identité sont obligatoires.",
    });
  }
  if (!hasFile("SELFIE_VERIFICATION")) {
    return res
      .status(400)
      .json({ error: "La photo de vérification est obligatoire." });
  }
  if (item.requestedRole === "AGENCE") {
    if (!item.activityType) {
      return res.status(400).json({ error: "Type d’activité requis." });
    }
    if (!hasFile("RCCM")) {
      return res.status(400).json({ error: "RCCM obligatoire." });
    }
    if (!hasFile("STATUTS_SOCIETE")) {
      return res.status(400).json({ error: "Statuts de la société obligatoires." });
    }
    if (item.activityType === "PROMOTEUR_IMMOBILIER") {
      if (!hasFile("AGREMENT_PROMOTEUR")) {
        return res.status(400).json({ error: "Agrément promoteur obligatoire." });
      }
      if (!hasFile("QUALIFICATIONS_REPRESENTANT")) {
        return res
          .status(400)
          .json({ error: "Qualifications du représentant obligatoires." });
      }
    }
  }
  const previousStatus = item.status;
  const resubmitted =
    previousStatus === "A_CORRIGER" || previousStatus === "REFUSEE";
  const stamp = nowIso();
  item.status = "EN_ATTENTE";
  if (resubmitted) {
    item.resubmittedAt = stamp;
    item.updatedAt = stamp;
  } else {
    item.submittedAt = stamp;
    item.updatedAt = stamp;
  }
  item.correctionMessage = null;
  item.correctionTarget = null;
  item.canResubmit = false;
  item.completeness = computeCompleteness(item, documents);
  pushHistory(
    item,
    resubmitted
      ? "Demande renvoyée pour vérification"
      : "Demande soumise pour vérification",
    resubmitted
      ? { previousStatus, resubmittedAt: stamp }
      : undefined,
  );
  pushNotification(db, {
    userId: item.userId,
    type: resubmitted ? "ROLE_REQUEST_RESUBMITTED" : "ROLE_REQUEST_SUBMITTED",
    title: resubmitted
      ? "Dossier renvoyé pour vérification"
      : "Demande de rôle reçue",
    message: resubmitted
      ? `Votre dossier ${item.reference} a été renvoyé. Il est de nouveau en attente.`
      : `Votre demande ${item.requestedRole} (${item.reference}) a été reçue.`,
  });
  if (resubmitted) {
    pushNotification(db, {
      audience: "ADMIN",
      type: "ROLE_REQUEST_RESUBMITTED",
      roleRequestId: item.id,
      title: "Dossier renvoyé pour vérification",
      message: `${item.reference} a été corrigé et renvoyé. Statut : EN_ATTENTE.`,
    });
  }
  writeDb(db);
  res.json({ ...item, documents: documents.map((d) => publicDocView(d, item)) });
});

app.get(
  "/admin/role-requests",
  requireAdminPermission("VERIFICATIONS"),
  (req, res) => {
    const db = readDb();
    let list = [...(db.roleRequests || [])];
    if (req.query.status && req.query.status !== "TOUS") {
      list = list.filter((r) => r.status === req.query.status);
    }
    if (req.query.role && req.query.role !== "TOUS") {
      list = list.filter((r) => r.requestedRole === req.query.role);
    }
    list.sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
    res.json(
      list.map((item) => {
        const documents = docsForRequest(db, item);
        return {
          ...item,
          documentsCount: documents.length,
          completeness: computeCompleteness(item, documents),
        };
      }),
    );
  },
);

app.get(
  "/admin/role-requests/:id",
  requireAdminPermission("VERIFICATIONS"),
  (req, res) => {
    const db = readDb();
    const item = findRoleRequest(db, req.params.id);
    if (!item) return res.status(404).json({ error: "Demande introuvable" });
    const documents = docsForRequest(db, item).map((d) => publicDocView(d, item));
    if (!item.sectionReviews) item.sectionReviews = accountScopes.defaultSectionReviews();
    if (
      !Array.isArray(item.declaredPropertyIntents) ||
      item.declaredPropertyIntents.length === 0
    ) {
      item.declaredPropertyIntents = accountScopes.intentsFromFlat(
        item.declaredPropertyTypes,
        item.declaredOperations,
        item.declaredPortfolioSize,
      );
    }
    if (!item.proposedConfiguration) {
      item.proposedConfiguration = accountScopes.proposeConfigFromRequest(item);
    }
    const draftConfig =
      item.appliedConfiguration ||
      item.savedConfiguration ||
      item.proposedConfiguration;
    res.json({
      ...item,
      documents,
      completeness: computeCompleteness(item, documents),
      accessPreview: draftConfig
        ? accountScopes.previewAccess(draftConfig)
        : null,
      canFinalize: accountScopes.canFinalizeApproval(
        item,
        docsForRequest(db, item),
        requiredDocsOk,
      ),
      verificationNotice:
        "Vérification interne Demeure Guinée — aucune certification ministérielle automatique.",
    });
  },
);

app.patch(
  "/admin/role-requests/:id/documents/:docId",
  requireAdminPermission("VERIFICATIONS"),
  (req, res) => {
    const db = readDb();
    const item = findRoleRequest(db, req.params.id);
    if (!item) return res.status(404).json({ error: "Demande introuvable" });
    const doc = (db.verificationDocuments || []).find((d) => d.id === req.params.docId);
    if (!doc || doc.roleRequestId !== item.id) {
      return res.status(404).json({ error: "Document introuvable" });
    }
    const status = String(req.body?.verificationStatus || "").trim();
    if (!DOC_STATUSES.has(status)) {
      return res.status(400).json({ error: "Statut document invalide" });
    }
    doc.verificationStatus = status;
    doc.rejectionReason = req.body?.rejectionReason || null;
    doc.verifiedByAdminId = req.admin?.id || null;
    doc.verifiedAt = nowIso();
    doc.updatedAt = doc.verifiedAt;
    item.updatedAt = doc.updatedAt;
    if (item.status === "EN_ATTENTE") item.status = "EN_VERIFICATION";
    pushHistory(item, `Document ${doc.label} → ${status}`);
    pushAudit(db, {
      adminId: req.admin?.id || null,
      adminEmail: req.admin?.email || null,
      action: "ROLE_DOC_REVIEW",
      entityType: "verificationDocument",
      entityId: doc.id,
      message: `${doc.documentType} → ${status}`,
    });
    writeDb(db);
    res.json(publicDocView(doc, item));
  },
);

/**
 * Enregistrement explicite de la configuration préparée par l’admin.
 * N’approuve rien : la demande garde son statut, seuls les droits envisagés
 * sont persistés (source de vérité unique pour la décision finale).
 */
app.patch(
  "/admin/role-requests/:id/account-configuration",
  requireAdminPermission("VERIFICATIONS"),
  (req, res) => {
    const db = readDb();
    const item = findRoleRequest(db, req.params.id);
    if (!item) return res.status(404).json({ error: "Demande introuvable" });
    if (item.status === "APPROUVEE" || item.status === "REFUSEE") {
      return res.status(409).json({
        error:
          "Dossier clôturé : modifiez la configuration depuis la fiche du compte.",
      });
    }

    const body = req.body || {};
    const role = item.requestedRole === "AGENCE" ? "AGENCE" : "PROPRIETAIRE";
    const preset = String(body.preset || "").trim();
    if (!preset || !accountScopes.CAPABILITY_PRESETS[preset]) {
      return res.status(400).json({ error: "preset invalide ou manquant." });
    }
    const profileType = body.profileType ? String(body.profileType).trim() : null;
    if (role === "PROPRIETAIRE" && !profileType) {
      return res.status(400).json({ error: "profileType requis." });
    }

    const scopes = accountScopes.normalizeScopeList(
      body.allowedPropertyScopes || [],
    );
    if (scopes.length === 0) {
      return res.status(400).json({
        error: "allowedPropertyScopes : au moins un type de bien requis.",
      });
    }
    const incomplete = scopes.find((scope) => scope.operations.length === 0);
    if (incomplete) {
      return res.status(400).json({
        error: `Au moins une opération requise pour ${incomplete.propertyType}.`,
      });
    }

    const flat = accountScopes.scopesToFlat(scopes);
    const stamp = nowIso();
    const before = item.savedConfiguration || null;
    const configuration = {
      role,
      profileType: role === "PROPRIETAIRE" ? profileType : null,
      activityType:
        role === "AGENCE"
          ? String(body.activityType || item.activityType || "").trim() || null
          : null,
      preset,
      allowedPropertyScopes: scopes,
      allowedPropertyTypes: flat.types,
      allowedOperations: flat.operations,
      capabilities: { ...accountScopes.CAPABILITY_PRESETS[preset] },
      configuredAt: stamp,
      configuredByAdminId: req.admin?.id || null,
      configuredByAdminName: req.admin?.name || req.admin?.email || null,
    };

    item.savedConfiguration = configuration;
    item.updatedAt = stamp;
    pushHistory(item, "Configuration du compte enregistrée", {
      configuration,
    });
    pushAudit(db, {
      adminId: req.admin?.id || null,
      adminEmail: req.admin?.email || null,
      action: "ACCOUNT_CONFIGURATION_UPDATED",
      entityType: "roleRequest",
      entityId: item.id,
      message: `${item.reference} configuration enregistrée`,
      meta: { before, after: configuration },
    });
    writeDb(db);

    const documents = docsForRequest(db, item).map((d) => publicDocView(d, item));
    res.json({
      ...item,
      documents,
      completeness: computeCompleteness(item, documents),
      accessPreview: accountScopes.previewAccess(configuration),
      canFinalize: accountScopes.canFinalizeApproval(
        item,
        docsForRequest(db, item),
        requiredDocsOk,
      ),
    });
  },
);

app.post(
  "/admin/role-requests/:id/decision",
  requireAdminPermission("VERIFICATIONS"),
  (req, res) => {
    const db = readDb();
    const item = findRoleRequest(db, req.params.id);
    if (!item) return res.status(404).json({ error: "Demande introuvable" });
    if (!item.sectionReviews) item.sectionReviews = accountScopes.defaultSectionReviews();
    const decision = String(req.body?.decision || "").trim().toUpperCase();
    const reason = String(req.body?.reason || "").trim();
    const documents = docsForRequest(db, item);
    const body = req.body || {};

    if (decision === "APPROUVER") {
      const gate = accountScopes.canFinalizeApproval(item, documents, requiredDocsOk);
      if (!gate.ok) {
        return res.status(400).json({ error: gate.error });
      }

      // Activation impossible sans configuration : ni enregistrée par l’admin,
      // ni transmise avec la décision.
      if (!item.savedConfiguration && !body.configuration) {
        return res.status(400).json({
          error: "Enregistrez d’abord la configuration du compte.",
          code: "ACCOUNT_CONFIGURATION_REQUIRED",
        });
      }

      // Priorité : configuration envoyée > configuration enregistrée par
      // l’admin > proposition système. Les scopes ne sont jamais recalculés
      // depuis la déclaration du demandeur quand l’admin a tranché.
      // Activation impossible sans configuration : ni enregistrée par
      // l'admin, ni transmise avec la décision.
      if (!item.savedConfiguration && !body.configuration) {
        return res.status(400).json({
          error: "Enregistrez d'abord la configuration du compte.",
          code: "ACCOUNT_CONFIGURATION_REQUIRED",
        });
      }

      const proposed =
        item.savedConfiguration ||
        item.proposedConfiguration ||
        accountScopes.proposeConfigFromRequest(item);
      const rawConfig = body.configuration || {};
      const configuration = {
        role: item.requestedRole === "AGENCE" ? "AGENCE" : "PROPRIETAIRE",
        profileType:
          rawConfig.profileType ||
          proposed.profileType ||
          "PARTICULIER",
        activityType:
          rawConfig.activityType ||
          proposed.activityType ||
          item.activityType ||
          null,
        preset:
          rawConfig.preset ||
          proposed.preset ||
          (item.requestedRole === "AGENCE"
            ? "AGENCE_IMMOBILIERE"
            : "PROPRIETAIRE_PARTICULIER"),
        allowedPropertyTypes: accountScopes.normalizePropertyTypes(
          rawConfig.allowedPropertyTypes || proposed.allowedPropertyTypes || [],
        ),
        allowedOperations: accountScopes.normalizeOperations(
          rawConfig.allowedOperations || proposed.allowedOperations || [],
        ),
        allowedPropertyScopes: accountScopes.normalizeScopeList(
          rawConfig.allowedPropertyScopes ||
            (rawConfig.allowedPropertyTypes || rawConfig.allowedOperations
              ? []
              : proposed.allowedPropertyScopes) ||
            [],
        ),
        capabilities:
          rawConfig.capabilities ||
          accountScopes.CAPABILITY_PRESETS[
            rawConfig.preset || proposed.preset || "PROPRIETAIRE_PARTICULIER"
          ],
        reason: reason || "Validation demande de rôle",
      };

      if (!configuration.allowedPropertyTypes.length) {
        return res.status(400).json({
          error: "allowedPropertyTypes : au moins un type requis.",
        });
      }
      if (!configuration.allowedOperations.length) {
        return res.status(400).json({
          error: "allowedOperations : au moins une opération requise.",
        });
      }
      if (
        configuration.role === "PROPRIETAIRE" &&
        !configuration.profileType
      ) {
        return res.status(400).json({ error: "profileType requis." });
      }

      // Scopes relationnels explicites (dérivés si l’admin n’a envoyé que les listes plates).
      configuration.allowedPropertyScopes =
        accountScopes.resolveConfigScopes(configuration);

      item.status = "APPROUVEE";
      item.reviewedAt = nowIso();
      item.reviewedByAdminId = req.admin?.id || null;
      item.updatedAt = item.reviewedAt;
      item.correctionMessage = null;
      // Traçabilité : qui a préparé la configuration, qui l'a activée.
      configuration.configuredAt =
        item.savedConfiguration?.configuredAt || item.reviewedAt;
      configuration.configuredByAdminId =
        item.savedConfiguration?.configuredByAdminId || req.admin?.id || null;
      configuration.configuredByAdminName =
        item.savedConfiguration?.configuredByAdminName ||
        req.admin?.name ||
        req.admin?.email ||
        null;
      configuration.approvedAt = item.reviewedAt;
      configuration.approvedByAdminId = req.admin?.id || null;
      configuration.approvedByAdminName =
        req.admin?.name || req.admin?.email || null;
      item.appliedConfiguration = configuration;
      pushHistory(item, "Demande approuvée et compte configuré", {
        configuration,
      });

      const user = (db.users || []).find((u) => u.id === item.userId);
      if (user) {
        user.role = configuration.role;
        user.roleVerified = true;
        user.documentsVerified = true;
      }

      if (configuration.role === "AGENCE") {
        const c = item.companyInformation || {};
        let agency = (db.agencies || []).find(
          (a) => a.userId === item.userId || a.email === c.professionalEmail,
        );
        if (!agency) {
          agency = {
            id: verificationUid("ag"),
            userId: item.userId,
            name: c.tradeName || c.legalName || "Agence",
            initials: String(c.tradeName || c.legalName || "AG")
              .split(/\s+/)
              .map((w) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase(),
            email: c.professionalEmail || item.personalInformation?.email || null,
            phone: c.professionalPhone || item.personalInformation?.phone || null,
            city: c.city || null,
            address: c.address || null,
            verified: true,
            documentsVerified: true,
            activityType: configuration.activityType,
            rccm: c.rccm || null,
            reportsCount: 0,
          };
          db.agencies.push(agency);
        }
        accountScopes.applyAgencyConfiguration(
          db,
          agency,
          configuration,
          req.admin,
        );
      } else {
        accountScopes.upsertOwnerProfile(
          db,
          item.userId,
          configuration,
          req.admin,
        );
      }

      pushNotification(db, {
        userId: item.userId,
        type: "ROLE_REQUEST_APPROVED",
        title: `Demande ${item.requestedRole} approuvée`,
        message:
          "Votre compte est désormais vérifié et configuré par Demeure Guinée. Cela ne vérifie pas automatiquement chaque bien.",
      });
      pushAudit(db, {
        adminId: req.admin?.id || null,
        adminEmail: req.admin?.email || null,
        action: "ACCOUNT_CONFIGURED",
        entityType: "user",
        entityId: item.userId,
        message: `${item.reference} scopes configurés`,
        meta: configuration,
      });
    } else if (decision === "CORRIGER" || decision === "A_CORRIGER") {
      if (!reason) return res.status(400).json({ error: "Motif de correction requis." });
      item.status = "A_CORRIGER";
      item.correctionMessage = reason;
      item.correctionTarget = body.correctionTarget || null;
      item.reviewedAt = nowIso();
      item.reviewedByAdminId = req.admin?.id || null;
      item.updatedAt = item.reviewedAt;
      pushHistory(item, "Corrections demandées", {
        reason,
        correctionTarget: body.correctionTarget || null,
      });
      pushNotification(db, {
        userId: item.userId,
        type: "ROLE_REQUEST_CORRECTION",
        title: "Des corrections sont nécessaires",
        message: reason,
      });
    } else if (decision === "REFUSER") {
      if (!isUsableApplicantReason(reason)) {
        return res.status(400).json({
          error:
            "Le motif de refus doit expliquer clairement au demandeur ce qui a été refusé et pourquoi (au moins 24 caractères, plusieurs mots).",
        });
      }
      item.status = "REFUSEE";
      item.correctionMessage = reason;
      item.canResubmit = body.canResubmit !== false;
      item.reviewedAt = nowIso();
      item.reviewedByAdminId = req.admin?.id || null;
      item.updatedAt = item.reviewedAt;
      pushHistory(item, "Demande refusée", {
        reason,
        canResubmit: item.canResubmit,
      });
      pushNotification(db, {
        userId: item.userId,
        type: "ROLE_REQUEST_REJECTED",
        title: "Demande de rôle refusée",
        message: reason,
      });
    } else {
      return res.status(400).json({ error: "Décision invalide." });
    }

    pushAudit(db, {
      adminId: req.admin?.id || null,
      adminEmail: req.admin?.email || null,
      action:
        decision === "APPROUVER"
          ? "ROLE_REQUEST_APPROVED"
          : "ROLE_REQUEST_DECISION",
      entityType: "roleRequest",
      entityId: item.id,
      message: `${item.reference} → ${item.status}`,
    });
    writeDb(db);
    res.json({
      ...item,
      documents: docsForRequest(db, item).map((d) => publicDocView(d, item)),
      accessPreview: item.appliedConfiguration
        ? accountScopes.previewAccess(item.appliedConfiguration)
        : null,
    });
  },
);

app.patch(
  "/admin/role-requests/:id/sections/:sectionKey",
  requireAdminPermission("VERIFICATIONS"),
  (req, res) => {
    const db = readDb();
    const item = findRoleRequest(db, req.params.id);
    if (!item) return res.status(404).json({ error: "Demande introuvable" });
    const key = String(req.params.sectionKey || "").trim();
    if (!item.sectionReviews) item.sectionReviews = accountScopes.defaultSectionReviews();
    if (!item.sectionReviews[key]) {
      return res.status(400).json({ error: "Section inconnue" });
    }
    const status = String(req.body?.status || "").trim().toUpperCase();
    if (!accountScopes.SECTION_STATUSES.has(status)) {
      return res.status(400).json({ error: "Statut section invalide" });
    }
    item.sectionReviews[key] = {
      status,
      message: req.body?.message || null,
      updatedAt: nowIso(),
      updatedByAdminId: req.admin?.id || null,
    };
    item.updatedAt = nowIso();
    if (item.status === "EN_ATTENTE") item.status = "EN_VERIFICATION";
    pushHistory(item, `Section ${key} → ${status}`, {
      message: req.body?.message || null,
    });
    writeDb(db);
    res.json(item.sectionReviews[key]);
  },
);

/* Account scopes — lecture publique / propriétaire */
app.get("/users/:userId/account-scope", (req, res) => {
  const db = readDb();
  const userId = req.params.userId;
  const user = (db.users || []).find((u) => u.id === userId);
  if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });
  const ownerProfile = accountScopes.findOwnerProfile(db, userId);
  const agency = (db.agencies || []).find((a) => a.userId === userId) || null;
  const history = (db.accountScopeHistory || [])
    .filter((h) => h.userId === userId || (agency && h.agencyId === agency.id))
    .slice(0, 50);
  const scopeRequests = (db.accountScopeRequests || [])
    .filter((r) => r.userId === userId)
    .slice(0, 20);
  const adminName = (adminId) => {
    if (!adminId) return null;
    const found = (db.admins || []).find((a) => a.id === adminId);
    return found?.name || found?.email || adminId;
  };
  res.json({
    userId,
    role: user.role,
    ownerProfile: ownerProfile
      ? {
          ...ownerProfile,
          configuredByAdminName: adminName(ownerProfile.configuredByAdminId),
          approvedByAdminName: adminName(ownerProfile.approvedByAdminId),
        }
      : null,
    agency: agency
      ? {
          id: agency.id,
          activityType: agency.activityType,
          verificationStatus: agency.verificationStatus,
          preset: agency.preset,
          approvedAt: agency.approvedAt || null,
          approvedByAdminId: agency.approvedByAdminId || null,
          configuredByAdminName: adminName(agency.configuredByAdminId),
          approvedByAdminName: adminName(agency.approvedByAdminId),
          allowedPropertyTypes: agency.allowedPropertyTypes,
          allowedOperations: agency.allowedOperations,
          allowedPropertyScopes:
            accountScopes.normalizeScopeList(agency.allowedPropertyScopes || [])
              .length > 0
              ? accountScopes.normalizeScopeList(agency.allowedPropertyScopes)
              : accountScopes.scopesFromFlat(
                  agency.allowedPropertyTypes || [],
                  agency.allowedOperations || [],
                ),
          capabilities: agency.capabilities,
          configuredAt: agency.configuredAt,
          configuredByAdminId: agency.configuredByAdminId,
        }
      : null,
    history,
    scopeRequests,
  });
});

app.post("/account-scope-requests", (req, res) => {
  const db = readDb();
  accountScopes.ensureAccountScopeCollections(db);
  const body = req.body || {};
  const userId = String(body.userId || "").trim();
  if (!userId) return res.status(400).json({ error: "userId requis" });
  const stamp = nowIso();

  const ownedAgency = (db.agencies || []).find((a) => a.userId === userId);
  const currentScope = accountScopes.resolveAccountScope(db, {
    ownerId: userId,
    agencyId: ownedAgency ? ownedAgency.id : null,
  });
  const granted = currentScope ? currentScope.allowedPropertyScopes || [] : [];
  const grantedFlat = accountScopes.scopesToFlat(granted);

  // Modèle canonique : des scopes couplés type × opérations. Les anciennes
  // listes plates restent acceptées ; une liste omise y est complétée par le
  // périmètre déjà accordé (sémantique V1 « ajouter ce type à mes droits »).
  const flatTypes = accountScopes.normalizePropertyTypes(
    body.requestedPropertyTypes || [],
  );
  const flatOperations = accountScopes.normalizeOperations(
    body.requestedOperations || [],
  );
  const useFlatFallback =
    !Array.isArray(body.requestedScopes) &&
    (flatTypes.length > 0 || flatOperations.length > 0);
  const rawScopes = accountScopes.normalizeScopeList(
    useFlatFallback
      ? accountScopes.scopesFromFlat(
          flatTypes.length ? flatTypes : grantedFlat.types,
          flatOperations.length ? flatOperations : grantedFlat.operations,
        )
      : body.requestedScopes || [],
  );

  if (rawScopes.length === 0) {
    return res.status(400).json({
      error: "SCOPE_REQUEST_EMPTY",
      code: "SCOPE_REQUEST_EMPTY",
      message: "Sélectionnez au moins un type de bien à ajouter.",
    });
  }
  const withoutOperation = rawScopes.find(
    (scope) => scope.operations.length === 0,
  );
  if (withoutOperation) {
    const label =
      accountScopes.PROPERTY_TYPE_LABELS[withoutOperation.propertyType] ||
      withoutOperation.propertyType;
    return res.status(400).json({
      error: "SCOPE_REQUEST_TYPE_WITHOUT_OPERATION",
      code: "SCOPE_REQUEST_TYPE_WITHOUT_OPERATION",
      message: `Sélectionnez Vente et/ou Location pour ${label}.`,
      propertyType: withoutOperation.propertyType,
    });
  }

  // Ce qui est déjà accordé ne peut pas être redemandé.
  const requestedScopes = accountScopes.subtractScopeLists(rawScopes, granted);
  if (requestedScopes.length === 0) {
    return res.status(409).json({
      error: "SCOPE_ALREADY_GRANTED",
      code: "SCOPE_ALREADY_GRANTED",
      message: "Cette autorisation est déjà active sur votre compte.",
    });
  }

  const duplicate = (db.accountScopeRequests || []).find(
    (r) =>
      r.userId === userId &&
      (r.status === "EN_ATTENTE" || r.status === "A_CORRIGER") &&
      accountScopes.sameScopeLists(r.requestedScopes || [], requestedScopes),
  );
  if (duplicate) {
    return res.status(409).json({
      error: "SCOPE_REQUEST_DUPLICATE",
      code: "SCOPE_REQUEST_DUPLICATE",
      message: "Une demande d’extension similaire est déjà en cours d’examen.",
      requestId: duplicate.id,
    });
  }

  const flat = accountScopes.scopesToFlat(requestedScopes);
  const item = {
    id: accountScopes.uid("asr"),
    userId,
    requestedScopes,
    // Listes plates dérivées : compatibilité avec l'admin existant.
    requestedPropertyTypes: flat.types,
    requestedOperations: flat.operations,
    reason: String(body.reason || "").trim() || null,
    status: "EN_ATTENTE",
    createdAt: stamp,
    updatedAt: stamp,
    reviewedByAdminId: null,
    reviewedAt: null,
    adminMessage: null,
  };
  db.accountScopeRequests.unshift(item);
  writeDb(db);
  res.status(201).json(item);
});

app.get(
  "/admin/account-scope-requests",
  requireAdminPermission("VERIFICATIONS"),
  (req, res) => {
    const db = readDb();
    accountScopes.ensureAccountScopeCollections(db);
    res.json(db.accountScopeRequests || []);
  },
);

app.post(
  "/admin/account-scope-requests/:id/decision",
  requireAdminPermission("VERIFICATIONS"),
  (req, res) => {
    const db = readDb();
    accountScopes.ensureAccountScopeCollections(db);
    const item = (db.accountScopeRequests || []).find(
      (r) => r.id === req.params.id,
    );
    if (!item) return res.status(404).json({ error: "Demande introuvable" });
    const decision = String(req.body?.decision || "").trim().toUpperCase();
    const adminMessage = String(req.body?.adminMessage || "").trim() || null;
    const stamp = nowIso();

    if (decision === "APPROUVER") {
      const user = (db.users || []).find((u) => u.id === item.userId);
      if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });
      // Scopes couplés demandés ; repli produit croisé pour les demandes V1.
      const addedScopes = accountScopes.normalizeScopeList(
        item.requestedScopes && item.requestedScopes.length
          ? item.requestedScopes
          : accountScopes.scopesFromFlat(
              item.requestedPropertyTypes || [],
              item.requestedOperations || [],
            ),
      );
      if (user.role === "AGENCE") {
        const agency = (db.agencies || []).find((a) => a.userId === item.userId);
        if (!agency) return res.status(404).json({ error: "Agence introuvable" });
        const nextScopes = accountScopes.mergeScopeLists(
          accountScopes.resolveConfigScopes(agency),
          addedScopes,
        );
        const nextFlat = accountScopes.scopesToFlat(nextScopes);
        accountScopes.applyAgencyConfiguration(
          db,
          agency,
          {
            activityType: agency.activityType,
            preset: agency.preset || "AGENCE_IMMOBILIERE",
            allowedPropertyTypes: nextFlat.types,
            allowedOperations: nextFlat.operations,
            allowedPropertyScopes: nextScopes,
            reason: adminMessage || "Extension de scope approuvée",
          },
          req.admin,
        );
      } else {
        const profile = accountScopes.findOwnerProfile(db, item.userId);
        const nextScopes = accountScopes.mergeScopeLists(
          accountScopes.resolveConfigScopes(profile || {}),
          addedScopes,
        );
        const nextFlat = accountScopes.scopesToFlat(nextScopes);
        accountScopes.upsertOwnerProfile(
          db,
          item.userId,
          {
            profileType: profile?.profileType || "PARTICULIER",
            preset: profile?.preset || "PROPRIETAIRE_PARTICULIER",
            allowedPropertyTypes: nextFlat.types,
            allowedOperations: nextFlat.operations,
            allowedPropertyScopes: nextScopes,
            capabilities: profile?.capabilities,
            reason: adminMessage || "Extension de scope approuvée",
          },
          req.admin,
        );
      }
      item.appliedScopes = addedScopes;
      item.status = "APPROUVEE";
    } else if (decision === "CORRIGER" || decision === "A_CORRIGER") {
      item.status = "A_CORRIGER";
    } else if (decision === "REFUSER") {
      item.status = "REFUSEE";
    } else {
      return res.status(400).json({ error: "Décision invalide" });
    }

    item.adminMessage = adminMessage;
    item.reviewedByAdminId = req.admin?.id || null;
    item.reviewedAt = stamp;
    item.updatedAt = stamp;
    pushAudit(db, {
      adminId: req.admin?.id || null,
      adminEmail: req.admin?.email || null,
      action: "ACCOUNT_SCOPE_REQUEST_DECISION",
      entityType: "accountScopeRequest",
      entityId: item.id,
      message: `${item.id} → ${item.status}`,
    });
    writeDb(db);
    res.json(item);
  },
);

app.patch(
  "/admin/users/:userId/account-scope",
  requireAdminPermission("UTILISATEURS_ECRITURE"),
  (req, res) => {
    const db = readDb();
    const user = (db.users || []).find((u) => u.id === req.params.userId);
    if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });
    const body = req.body || {};
    const configuration = {
      profileType: body.profileType,
      preset: body.preset,
      activityType: body.activityType,
      allowedPropertyTypes: accountScopes.normalizePropertyTypes(
        body.allowedPropertyTypes || [],
      ),
      allowedOperations: accountScopes.normalizeOperations(
        body.allowedOperations || [],
      ),
      allowedPropertyScopes: accountScopes.normalizeScopeList(
        body.allowedPropertyScopes || [],
      ),
      capabilities: body.capabilities,
      reason: body.reason || "Modification admin de la configuration",
    };
    if (!configuration.allowedPropertyTypes.length) {
      return res.status(400).json({ error: "allowedPropertyTypes requis" });
    }
    if (!configuration.allowedOperations.length) {
      return res.status(400).json({ error: "allowedOperations requis" });
    }

    if (user.role === "AGENCE") {
      const agency = (db.agencies || []).find((a) => a.userId === user.id);
      if (!agency) return res.status(404).json({ error: "Agence introuvable" });
      accountScopes.applyAgencyConfiguration(db, agency, configuration, req.admin);
      writeDb(db);
      return res.json({ kind: "AGENCY", agency });
    }

    const profile = accountScopes.upsertOwnerProfile(
      db,
      user.id,
      configuration,
      req.admin,
    );
    writeDb(db);
    res.json({ kind: "OWNER", ownerProfile: profile });
  },
);

/* Documents juridiques d’un Property */
app.post("/properties/:id/legal-documents", (req, res) => {
  const db = readDb();
  const property = (db.properties || []).find((p) => p.id === req.params.id);
  if (!property) return res.status(404).json({ error: "Bien introuvable" });
  const body = req.body || {};
  const stamp = nowIso();
  const doc = {
    id: verificationUid("pdoc"),
    ownerType: "PROPERTY",
    ownerId: property.ownerId || property.agencyId || property.id,
    roleRequestId: null,
    propertyId: property.id,
    documentType: body.documentType || "AUTRE_JUSTIFICATIF",
    label: body.label || body.documentType || "Justificatif foncier",
    reference: body.reference || null,
    issuer: body.issuer || null,
    issuedAt: body.issuedAt || null,
    expiresAt: body.expiresAt || null,
    holderName: body.holderName || null,
    fileName: body.fileName || null,
    fileUrl: body.fileUrl || `/demo-docs/property-${property.id}.pdf`,
    mimeType: body.mimeType || null,
    fileSize: Number(body.fileSize) || null,
    verificationStatus: "EN_ATTENTE",
    verifiedByAdminId: null,
    verifiedAt: null,
    rejectionReason: null,
    // Mandat agence
    agencyCapacity: body.agencyCapacity || null,
    mandateReference: body.mandateReference || null,
    legalOwnerName: body.legalOwnerName || null,
    required: true,
    createdAt: stamp,
    updatedAt: stamp,
  };
  db.verificationDocuments.unshift(doc);
  property.legalDocumentIds = property.legalDocumentIds || [];
  property.legalDocumentIds.push(doc.id);
  property.legalVerificationStatus = "EN_ATTENTE";
  property.updatedAt = stamp;
  writeDb(db);
  res.status(201).json(publicDocView(doc));
});

app.get(
  "/admin/properties/:id/legal-documents",
  requireAdminPermission("VERIFICATIONS"),
  (req, res) => {
    const db = readDb();
    const property = (db.properties || []).find((p) => p.id === req.params.id);
    if (!property) return res.status(404).json({ error: "Bien introuvable" });
    const ids = new Set(property.legalDocumentIds || []);
    const docs = (db.verificationDocuments || [])
      .filter((d) => ids.has(d.id) || d.propertyId === property.id)
      .map(publicDocView);
    res.json({
      propertyId: property.id,
      legalVerificationStatus: property.legalVerificationStatus || "NON_SOUMIS",
      requireLegalVerificationForPublication:
        REQUIRE_PROPERTY_LEGAL_VERIFICATION_FOR_PUBLICATION,
      documents: docs,
      notice: "Vérification interne Demeure Guinée — non ministérielle.",
    });
  },
);

app.patch(
  "/admin/properties/:id/legal-status",
  requireAdminPermission("VERIFICATIONS"),
  (req, res) => {
    const db = readDb();
    const property = (db.properties || []).find((p) => p.id === req.params.id);
    if (!property) return res.status(404).json({ error: "Bien introuvable" });
    const status = String(req.body?.legalVerificationStatus || "").trim();
    if (!PROPERTY_LEGAL_STATUSES.has(status)) {
      return res.status(400).json({ error: "Statut juridique invalide" });
    }
    property.legalVerificationStatus = status;
    property.updatedAt = nowIso();
    pushAudit(db, {
      adminId: req.admin?.id || null,
      adminEmail: req.admin?.email || null,
      action: "PROPERTY_LEGAL_STATUS",
      entityType: "property",
      entityId: property.id,
      message: `legalVerificationStatus → ${status}`,
    });
    writeDb(db);
    res.json({
      id: property.id,
      legalVerificationStatus: property.legalVerificationStatus,
      requireLegalVerificationForPublication:
        REQUIRE_PROPERTY_LEGAL_VERIFICATION_FOR_PUBLICATION,
    });
  },
);

app.get("/meta/verification-rules", (_req, res) => {
  res.json({
    requirePropertyLegalVerificationForPublication:
      REQUIRE_PROPERTY_LEGAL_VERIFICATION_FOR_PUBLICATION,
    roleRequestStatuses: [...ROLE_REQUEST_STATUSES],
    documentStatuses: [...DOC_STATUSES],
    propertyLegalStatuses: [...PROPERTY_LEGAL_STATUSES],
    verificationAuthority: "Demeure Guinée (vérification interne)",
  });
});

app.listen(PORT, () => {
  console.log(`[immo-demo-api] DEMO ONLY — http://localhost:${PORT}`);
  console.log(`[immo-demo-api] DB: ${DB_PATH}`);
  console.log("[immo-demo-api] Remplacer par Spring Boot en production.");
});
