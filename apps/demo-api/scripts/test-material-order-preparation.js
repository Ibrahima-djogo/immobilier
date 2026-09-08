/**
 * Tests 7G — préparation interne après paiement.
 * Prérequis : API démarrée (DEMO_API_URL, défaut http://localhost:4000)
 */
const fs = require("fs");
const path = require("path");
const { confirmAgentPaid } = require("./material-order-helpers");

const BASE = process.env.DEMO_API_URL || "http://localhost:4000";
const DB_PATH = path.join(__dirname, "..", "data", "db.json");

const customer = {
  name: "Test Préparation",
  phone: "+224 620 33 22 11",
  city: "Conakry",
  district: "Kipé",
  address: "Dépôt test, villa 12",
};

function readDb() {
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
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

async function reachPaid() {
  const created = await postOrder();
  assert(created.status === 201, `create ${created.status}`);
  assert((await patchStatus(created.json.id, "PAIEMENT_EN_ATTENTE")).status === 200, "paiement");
  const paid = await confirmAgentPaid(api, created.json);
  assert(paid.status === 200 && paid.json.status === "PAYEE", "payée");
  return paid.json;
}

async function main() {
  assert((await api("GET", "/health")).status === 200, "health");
  assert((await api("GET", "/materials")).status === 200, "warmup");

  const happy = await reachPaid();
  const stock0 = stockOf(readDb(), "mp-ciment-42-5");
  const res0 = reservationsSnapshot(readDb(), happy.id);
  assert(res0.length === 1 && res0[0].status === "ACTIVE", "résa ACTIVE");

  const preparing = await patchStatus(happy.id, "EN_PREPARATION");
  assert(
    preparing.status === 200 && preparing.json.status === "EN_PREPARATION",
    `préparation ${preparing.status}`,
  );
  assert(
    (preparing.json.statusHistory || []).some((item) => item.status === "EN_PREPARATION"),
    "historique EN_PREPARATION",
  );
  const afterPrep = readDb();
  assert(stockOf(afterPrep, "mp-ciment-42-5").quantity === stock0.quantity, "qty préparation");
  assert(
    stockOf(afterPrep, "mp-ciment-42-5").reservedQuantity === stock0.reservedQuantity,
    "reserved préparation",
  );
  assert(
    JSON.stringify(reservationsSnapshot(afterPrep, happy.id)) === JSON.stringify(res0),
    "résa préparation",
  );

  const ready = await patchStatus(happy.id, "PRETE");
  assert(ready.status === 200 && ready.json.status === "PRETE", `prête ${ready.status}`);
  assert(
    (ready.json.statusHistory || []).some((item) => item.status === "PRETE"),
    "historique PRETE",
  );
  const afterReady = readDb();
  assert(stockOf(afterReady, "mp-ciment-42-5").quantity === stock0.quantity, "qty PRETE");
  assert(
    stockOf(afterReady, "mp-ciment-42-5").reservedQuantity === stock0.reservedQuantity,
    "reserved PRETE",
  );
  assert(
    JSON.stringify(reservationsSnapshot(afterReady, happy.id)) === JSON.stringify(res0),
    "résa PRETE",
  );
  const persisted = await api("GET", `/materials/orders/${happy.id}`);
  assert(persisted.json.status === "PRETE", "persistance GET");
  const fromDisk = (readDb().materialOrders || []).find((item) => item.id === happy.id);
  assert(fromDisk && fromDisk.status === "PRETE", "persistance db.json");

  const paidSkip = await reachPaid();
  const skip = await patchStatus(paidSkip.id, "PRETE");
  assert(skip.status === 400, `PAYEE→PRETE ${skip.status}`);
  assert((await api("GET", `/materials/orders/${paidSkip.id}`)).json.status === "PAYEE", "PAYEE altérée");

  const created = await postOrder();
  const waiting = await patchStatus(created.json.id, "PAIEMENT_EN_ATTENTE");
  assert((await patchStatus(waiting.json.id, "EN_PREPARATION")).status === 400, "PAIEMENT→EN_PREPARATION");

  const cancelled = await postOrder();
  assert((await api("POST", `/materials/orders/${cancelled.json.id}/cancel`)).status === 200, "cancel");
  assert((await patchStatus(cancelled.json.id, "EN_PREPARATION")).status === 400, "ANNULEE→EN_PREPARATION");

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

  console.log("OK  PAYEE → EN_PREPARATION → PRETE");
  console.log("OK  transitions interdites refusées");
  console.log("OK  stock + réservations inchangés");
  console.log("OK  historique + persistance");
  console.log("OK  catalogue / immobilier / stock / réservations");
}

main().then(() => process.exit(0)).catch((error) => {
  console.error("FAIL", error.message);
  process.exit(1);
});
