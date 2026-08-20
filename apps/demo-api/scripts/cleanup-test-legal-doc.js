/**
 * Retire un justificatif juridique inséré manuellement pendant un test
 * et remet le bien dans son état précédent.
 *
 * Usage : node scripts/cleanup-test-legal-doc.js <docId>
 */
const fs = require("node:fs");
const path = require("node:path");

const docId = process.argv[2];
if (!docId) {
  console.error("Usage: node scripts/cleanup-test-legal-doc.js <docId>");
  process.exit(1);
}

const dbPath = path.join(__dirname, "..", "data", "db.json");
const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));

const doc = (db.verificationDocuments || []).find((d) => d.id === docId);
if (!doc) {
  console.log(`Document ${docId} introuvable — rien à faire.`);
  process.exit(0);
}

db.verificationDocuments = db.verificationDocuments.filter(
  (d) => d.id !== docId,
);

const property = (db.properties || []).find((p) => p.id === doc.propertyId);
if (property) {
  property.legalDocumentIds = (property.legalDocumentIds || []).filter(
    (id) => id !== docId,
  );
  const remaining = (db.verificationDocuments || []).filter(
    (d) => d.propertyId === property.id,
  );
  if (remaining.length === 0) {
    property.legalVerificationStatus = "NON_SOUMIS";
  }
  console.log(
    `Bien ${property.id} → ${property.legalVerificationStatus} (${property.legalDocumentIds.length} document(s))`,
  );
}

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log(`Document ${docId} supprimé.`);
