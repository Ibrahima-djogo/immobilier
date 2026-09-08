/**
 * Tests 7F — workflow paiement interne (sans prestataire).
 * Prérequis : API démarrée (DEMO_API_URL, défaut http://localhost:4000)
 */
const fs = require("fs");
const path = require("path");
const { confirmAgentPaid } = require("./material-order-helpers");

const BASE = process.env.DEMO_API_URL || "http://localhost:4000";
const DB_PATH = path.join(__dirname, "..", "data", "db.json");

const customer = {
  name: "Test Paiement",
  phone: "+224 620 55 44 33",
  city: "Conakry",
  district: "Kipé",
  address: "Dépôt test, villa 11",
};

function readDb() {
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function stockOf(db, productId) {
  const stock = (db.materialStocks || []).find((item) => item.productId === productId);
  return {
    quantity: stock.quantity,
    reservedQuantity: stock.reservedQuantity,
  };
}

function reservationsSnapshot(db, orderId) {
  return (db.materialStockReservations || [])
    .filter((item) => item.orderId === orderId)
    .map((item) => ({
      id: item.id,
      status: item.status,
      quantity: item.quantity,
      updatedAt: item.updatedAt,
    }));
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

async function postOrder() {
  return api("POST", "/materials/orders", {
    customer,
    items: [{ productId: "mp-ciment-42-5", quantity: 1 }],
  });
}

async function patchStatus(id, status) {
  return api("PATCH", `/materials/orders/${id}/status`, { status, changedBy: "admin" });
}

async function reachPaymentPending() {
  const created = await postOrder();
  assert(created.status === 201, `create ${created.status}`);
  const waiting = await patchStatus(created.json.id, "PAIEMENT_EN_ATTENTE");
  assert(
    waiting.status === 200 && waiting.json.status === "PAIEMENT_EN_ATTENTE",
    `paiement attente ${waiting.status}`,
  );
  return waiting.json;
}

async function main() {
  assert((await api("GET", "/health")).status === 200, "health");
  assert((await api("GET", "/materials")).status === 200, "warmup");

  const createdHappy = await postOrder();
  assert(createdHappy.status === 201, `create ${createdHappy.status}`);
  const waiting = await patchStatus(createdHappy.json.id, "PAIEMENT_EN_ATTENTE");
  assert(waiting.status === 200, "paiement attente");
  const happy = waiting.json;
  const stock0 = stockOf(readDb(), "mp-ciment-42-5");
  const res0 = reservationsSnapshot(readDb(), happy.id);
  assert(res0.length === 1 && res0[0].status === "ACTIVE", "résa ACTIVE");
  assert(
    (happy.statusHistory || []).some((item) => item.status === "PAIEMENT_EN_ATTENTE"),
    "historique PAIEMENT_EN_ATTENTE",
  );
  const afterWait = readDb();
  assert(stockOf(afterWait, "mp-ciment-42-5").quantity === stock0.quantity, "qty après demande");
  assert(
    stockOf(afterWait, "mp-ciment-42-5").reservedQuantity === stock0.reservedQuantity,
    "reserved après demande",
  );
  assert(
    JSON.stringify(reservationsSnapshot(afterWait, happy.id)) === JSON.stringify(res0),
    "résa après demande",
  );

  const paid = await confirmAgentPaid(api, createdHappy.json);
  assert(paid.status === 200 && paid.json.status === "PAYEE", `payée ${paid.status}`);
  assert(
    (paid.json.statusHistory || []).some((item) => item.status === "PAYEE"),
    "historique PAYEE",
  );
  const afterPaid = readDb();
  assert(stockOf(afterPaid, "mp-ciment-42-5").quantity === stock0.quantity, "qty après PAYEE");
  assert(
    stockOf(afterPaid, "mp-ciment-42-5").reservedQuantity === stock0.reservedQuantity,
    "reserved après PAYEE",
  );
  assert(
    JSON.stringify(reservationsSnapshot(afterPaid, happy.id)) === JSON.stringify(res0),
    "résa après PAYEE",
  );
  const persisted = await api("GET", `/materials/orders/${happy.id}`);
  assert(persisted.json.status === "PAYEE", "persistance GET");
  const fromDisk = (readDb().materialOrders || []).find((item) => item.id === happy.id);
  assert(fromDisk && fromDisk.status === "PAYEE", "persistance db.json");

  const pending = await postOrder();
  const pendingToPaid = await patchStatus(pending.json.id, "PAYEE");
  assert(pendingToPaid.status === 400, `EN_ATTENTE→PAYEE ${pendingToPaid.status}`);

  const waitingOnly = await reachPaymentPending();
  const waitingToPrep = await patchStatus(waitingOnly.id, "EN_PREPARATION");
  assert(waitingToPrep.status === 400, `PAIEMENT→PREPARATION ${waitingToPrep.status}`);
  assert(
    (await api("GET", `/materials/orders/${waitingOnly.id}`)).json.status ===
      "PAIEMENT_EN_ATTENTE",
    "PAIEMENT_EN_ATTENTE altérée",
  );

  const cancelled = await postOrder();
  assert((await api("POST", `/materials/orders/${cancelled.json.id}/cancel`)).status === 200, "cancel");
  assert((await patchStatus(cancelled.json.id, "PAYEE")).status === 400, "ANNULEE→PAYEE");

  const expireCase = await postOrder();
  const dbExpire = readDb();
  const past = new Date(Date.now() - 60 * 1000).toISOString();
  dbExpire.materialStockReservations = (dbExpire.materialStockReservations || []).map((item) =>
    item.orderId === expireCase.json.id && item.status === "ACTIVE"
      ? { ...item, expiresAt: past }
      : item,
  );
  writeDb(dbExpire);
  const expiredRead = await api("GET", `/materials/orders/${expireCase.json.id}`);
  assert(expiredRead.json.status === "RESERVATION_EXPIREE", "expire");
  assert((await patchStatus(expireCase.json.id, "PAYEE")).status === 400, "EXPIREE→PAYEE");

  const catalog = await api("GET", "/materials/catalog");
  const properties = await api("GET", "/properties");
  const stocks = await api("GET", "/materials/stocks");
  const reservations = await api("GET", "/materials/reservations");
  assert(
    catalog.status === 200 &&
      properties.status === 200 &&
      stocks.status === 200 &&
      reservations.status === 200,
    "non-régression",
  );

  console.log("OK  EN_ATTENTE → PAIEMENT_EN_ATTENTE → PAYEE");
  console.log("OK  transitions interdites refusées");
  console.log("OK  stock + réservations inchangés");
  console.log("OK  historique + persistance");
  console.log("OK  catalogue / immobilier / stock / réservations");
}

main().catch((error) => {
  console.error("FAIL", error.message);
  process.exit(1);
});
