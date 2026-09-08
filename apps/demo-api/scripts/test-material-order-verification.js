/**
 * Tests étape 3 — la vérification n’est plus requise pour avancer.
 * Les données historiques restent lisibles.
 * Prérequis : API démarrée (DEMO_API_URL, défaut http://localhost:4000)
 */
const fs = require("fs");
const path = require("path");

const { completeVerification } = require("./material-order-helpers");

const BASE = process.env.DEMO_API_URL || "http://localhost:4000";
const DB_PATH = path.join(__dirname, "..", "data", "db.json");

const customer = {
  name: "Test Vérification",
  phone: "+224 620 33 22 11",
  city: "Conakry",
  district: "Kipé",
  address: "Dépôt test, villa 22",
};

function readDb() {
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

async function api(method, pathname, body) {
  const response = await fetch(`${BASE}${pathname}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: response.status, json: await response.json() };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function postOrder(deliveryMode = "RETRAIT_DEPOT") {
  return api("POST", "/materials/orders", {
    customer,
    deliveryMode,
    items: [{ productId: "mp-ciment-42-5", quantity: 1 }],
  });
}

async function patchStatus(id, status) {
  return api("PATCH", `/materials/orders/${id}/status`, { status, changedBy: "admin" });
}

async function main() {
  assert((await api("GET", "/health")).status === 200, "health");

  const created = await postOrder();
  assert(created.status === 201, "create");
  assert(created.json.status === "EN_ATTENTE", "nouvelle commande EN_ATTENTE");
  assert(created.json.verification, "objet verification conservé");
  assert(created.json.verification.status === "NON_VERIFIE", "verification non requise");
  assert(!(created.json.statusHistory || []).some((item) => item.status === "EN_VERIFICATION"), "historique EN_VERIFICATION");

  const review = await patchStatus(created.json.id, "EN_VERIFICATION");
  assert(review.status === 400, "EN_ATTENTE → EN_VERIFICATION refusé");

  const skipped = await patchStatus(created.json.id, "VALIDEE");
  assert(skipped.status === 400, "EN_ATTENTE → VALIDEE refusé");

  const waiting = await patchStatus(created.json.id, "PAIEMENT_EN_ATTENTE");
  assert(waiting.status === 200 && waiting.json.status === "PAIEMENT_EN_ATTENTE", "avance sans checklist");

  const notes = await completeVerification(api, created.json.id, "Note historique");
  assert(notes.status === 400, "checklist inactive après paiement");

  const historical = await postOrder("LIVRAISON");
  const historyNote = await completeVerification(api, historical.json.id, "Ancienne note");
  assert(historyNote.status === 200, "PATCH verification encore possible sur EN_ATTENTE");
  assert(
    (historyNote.json.verificationHistory || []).some((item) => item.action === "MAJ_CHECKLIST"),
    "verificationHistory lisible",
  );
  const persisted = await api("GET", `/materials/orders/${historical.json.id}`);
  assert(persisted.json.verification.notes === "Ancienne note", "notes historiques");
  assert(persisted.json.status === "EN_ATTENTE", "statut inchangé par la note");
  assert(!(persisted.json.statusHistory || []).some((item) => item.status === "EN_VERIFICATION"), "pas de EN_VERIFICATION");

  const db = readDb();
  const stored = (db.materialOrders || []).find((item) => item.id === historical.json.id);
  assert(stored && Array.isArray(stored.verificationHistory), "données historiques en base");

  console.log("OK  nouvelle commande sans EN_VERIFICATION");
  console.log("OK  checklist non requise pour avancer");
  console.log("OK  verificationHistory historique lisible");
}

main().catch((error) => {
  console.error("FAIL", error.message);
  process.exit(1);
});
