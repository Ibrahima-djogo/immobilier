/**
 * Réarme les dossiers de vérification DEMO (statuts, revues, pièces jointes).
 * Additif : aucune autre collection de db.json n’est touchée.
 *
 *   npm run demo:scenarios         → crée / répare ce qui manque
 *   npm run demo:scenarios:reset   → remet les scénarios dans leur état initial
 */

const fs = require("fs");
const path = require("path");

const {
  ensureDemoVerificationScenarios,
  buildScenarios,
} = require("../demo-verification-scenarios");

const DB_PATH = path.join(__dirname, "..", "data", "db.json");
const reset = process.argv.includes("--reset");

const db = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
const before = {
  users: (db.users || []).length,
  properties: (db.properties || []).length,
  listings: (db.listings || []).length,
  roleRequests: (db.roleRequests || []).length,
  documents: (db.verificationDocuments || []).length,
};

const changed = ensureDemoVerificationScenarios(db, { reset });
fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

const after = {
  users: (db.users || []).length,
  properties: (db.properties || []).length,
  listings: (db.listings || []).length,
  roleRequests: (db.roleRequests || []).length,
  documents: (db.verificationDocuments || []).length,
};

console.log(reset ? "Scénarios Demo réarmés." : "Scénarios Demo vérifiés.");
console.log("Modifications appliquées :", changed);
console.log("Avant :", before);
console.log("Après :", after);
for (const scenario of buildScenarios()) {
  const request = db.roleRequests.find((r) => r.id === scenario.request.id);
  console.log(
    ` - ${scenario.key.padEnd(17)} ${request?.reference || "?"} → ${request?.status || "?"} (${(request?.documentIds || []).length} pièces)`,
  );
}
