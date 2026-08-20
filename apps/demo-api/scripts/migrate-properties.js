/**
 * Migration légère : alias historiques Property → modèle canonique.
 * Ne supprime pas les anciennes clés. N’invente aucune ville/commune.
 *
 * Usage: node scripts/migrate-properties.js
 */
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "..", "data", "db.json");
const BACKUP_PATH = path.join(
  __dirname,
  "..",
  "data",
  `db.backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
);

function firstNonEmpty(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

function migrateProperty(property, listings) {
  if (!property || typeof property !== "object") return { changed: false, fields: [] };
  const loc =
    property.location && typeof property.location === "object"
      ? property.location
      : {};
  const linked = (listings || []).find((l) => l.propertyId === property.id) || {};
  const listingLoc =
    linked.location && typeof linked.location === "object" ? linked.location : {};
  const fields = [];

  const nextCity = firstNonEmpty(
    property.city,
    property.ville,
    loc.city,
    loc.ville,
    linked.city,
    listingLoc.city,
  );
  const nextCommune = firstNonEmpty(
    property.commune,
    property.municipality,
    loc.commune,
    linked.commune,
    listingLoc.commune,
  );
  const nextDistrict = firstNonEmpty(
    property.district,
    property.quartier,
    property.quarter,
    property.neighborhood,
    loc.district,
    loc.quartier,
    loc.quarter,
    linked.district,
    listingLoc.district,
  );
  const nextLandmark = firstNonEmpty(
    property.landmark,
    property.repere,
    property.landmarkLabel,
    loc.landmark,
    loc.repere,
  );
  const nextAdmin = firstNonEmpty(
    property.adminAddress,
    property.administrativeAddress,
    property.adresseAdministrative,
    property.address,
  );
  const nextLabel = firstNonEmpty(
    property.locationLabel,
    property.mapLabel,
    property.libelleCarte,
  );
  const nextArea =
    property.area ||
    Number(property.surface) ||
    Number(property.surfaceArea) ||
    0;
  const nextDescription = firstNonEmpty(
    property.description,
    property.propertyDescription,
  );

  if (!property.city && nextCity) {
    property.city = nextCity;
    fields.push("city");
  }
  if (!property.commune && nextCommune) {
    property.commune = nextCommune;
    fields.push("commune");
  }
  if (!property.district && nextDistrict) {
    property.district = nextDistrict;
    fields.push("district");
  }
  if (!property.landmark && nextLandmark) {
    property.landmark = nextLandmark;
    fields.push("landmark");
  }
  if (!property.adminAddress && nextAdmin) {
    property.adminAddress = nextAdmin;
    fields.push("adminAddress");
  }
  if (!property.locationLabel && nextLabel) {
    property.locationLabel = nextLabel;
    fields.push("locationLabel");
  }
  if ((!property.area || property.area === 0) && nextArea) {
    property.area = nextArea;
    fields.push("area");
  }
  if (!String(property.description || "").trim() && nextDescription) {
    property.description = nextDescription;
    fields.push("description");
  }

  if (!property.adminAddress) {
    const derived = [property.district, property.commune, property.city]
      .filter(Boolean)
      .join(", ");
    if (derived) {
      property.adminAddress = derived;
      fields.push("adminAddress:derived");
    }
  }
  if (!property.locationLabel) {
    const derived = [property.district, property.commune, property.city]
      .filter(Boolean)
      .join(", ");
    if (derived) {
      property.locationLabel = derived;
      fields.push("locationLabel:derived");
    }
  }

  if (
    !property.coordinates &&
    (property.latitude != null || loc.lat != null) &&
    (property.longitude != null || loc.lng != null || loc.lon != null)
  ) {
    const lat = Number(property.latitude ?? loc.lat);
    const lng = Number(property.longitude ?? loc.lng ?? loc.lon);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      property.coordinates = { lat, lng };
      fields.push("coordinates");
    }
  }

  const images = Array.isArray(property.images) ? property.images : [];
  const photos = Array.isArray(property.photos) ? property.photos : [];
  if (images.length === 0 && photos.length > 0) {
    property.images = photos.filter((u) => typeof u === "string" && u.trim());
    fields.push("images:fromPhotos");
  }

  return { changed: fields.length > 0, fields };
}

function main() {
  const raw = fs.readFileSync(DB_PATH, "utf8");
  fs.writeFileSync(BACKUP_PATH, raw, "utf8");
  const db = JSON.parse(raw);
  const listings = db.listings || [];
  let migrated = 0;
  const report = [];
  for (const property of db.properties || []) {
    const result = migrateProperty(property, listings);
    if (result.changed) {
      migrated += 1;
      report.push({ id: property.id, fields: result.fields });
    }
  }
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
  console.log(
    JSON.stringify(
      {
        backup: BACKUP_PATH,
        total: (db.properties || []).length,
        migrated,
        report,
      },
      null,
      2,
    ),
  );
}

main();
