/**
 * Tests étape 3 — transitions de statut sans vérification obligatoire.
 * Prérequis : API démarrée (DEMO_API_URL, défaut http://localhost:4000)
 */
const fs = require("fs");
const path = require("path");

const BASE = process.env.DEMO_API_URL || "http://localhost:4000";
const DB_PATH = path.join(__dirname, "..", "data", "db.json");

const customer = {
  name: "Test Statut",
  phone: "+224 620 88 77 66",
  city: "Conakry",
  district: "Kipé",
  address: "Dépôt test, villa 9",
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

function assertUnchanged(before, after, label) {
  assert(before.quantity === after.quantity, `${label} quantity changée`);
  assert(before.reservedQuantity === after.reservedQuantity, `${label} reserved changé`);
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

async function main() {
  assert((await api("GET", "/health")).status === 200, "health");
  assert((await api("GET", "/materials")).status === 200, "warmup");

  const happy = await postOrder();
  assert(happy.status === 201 && happy.json.status === "EN_ATTENTE", `create ${happy.status}`);
  const stock0 = stockOf(readDb(), "mp-ciment-42-5");
  const res0 = reservationsSnapshot(readDb(), happy.json.id);
  assert(res0.length === 1 && res0[0].status === "ACTIVE", "résa initiale");

  const review = await patchStatus(happy.json.id, "EN_VERIFICATION");
  assert(
    review.status === 400 && review.json.code === "INVALID_ORDER_STATUS",
    `review ${review.status}`,
  );

  const waiting = await patchStatus(happy.json.id, "PAIEMENT_EN_ATTENTE");
  assert(
    waiting.status === 200 && waiting.json.status === "PAIEMENT_EN_ATTENTE",
    `paiement ${waiting.status}`,
  );
  assert(
    (waiting.json.statusHistory || []).some((item) => item.status === "PAIEMENT_EN_ATTENTE"),
    "historique PAIEMENT_EN_ATTENTE",
  );
  const afterWait = readDb();
  assertUnchanged(stock0, stockOf(afterWait, "mp-ciment-42-5"), "après paiement");
  assert(
    JSON.stringify(reservationsSnapshot(afterWait, happy.json.id)) === JSON.stringify(res0),
    "résa changée après paiement",
  );

  const skip = await postOrder();
  const direct = await patchStatus(skip.json.id, "VALIDEE");
  assert(
    direct.status === 400 && direct.json.code === "INVALID_ORDER_STATUS",
    `skip ${direct.status} ${JSON.stringify(direct.json)}`,
  );
  assert((await api("GET", `/materials/orders/${skip.json.id}`)).json.status === "EN_ATTENTE", "skip a changé le statut");

  const cancelled = await postOrder();
  const cancelRes = await api("POST", `/materials/orders/${cancelled.json.id}/cancel`);
  assert(cancelRes.status === 200 && cancelRes.json.status === "ANNULEE", "cancel");
  const cancelToPaid = await patchStatus(cancelled.json.id, "PAYEE");
  assert(cancelToPaid.status === 400, `ANNULEE→PAYEE ${cancelToPaid.status}`);

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
  assert(expiredRead.json.status === "RESERVATION_EXPIREE", `expire ${expiredRead.json.status}`);
  const expireToPaid = await patchStatus(expireCase.json.id, "PAYEE");
  assert(expireToPaid.status === 400, `EXPIREE→PAYEE ${expireToPaid.status}`);

  const waitCancel = await postOrder();
  assert((await patchStatus(waitCancel.json.id, "PAIEMENT_EN_ATTENTE")).status === 200, "wait cancel setup");
  const cancelledWait = await api("POST", `/materials/orders/${waitCancel.json.id}/cancel`);
  assert(cancelledWait.status === 200 && cancelledWait.json.status === "ANNULEE", "cancel PAIEMENT_EN_ATTENTE");

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

  console.log("OK  EN_ATTENTE → EN_VERIFICATION refusé");
  console.log("OK  EN_ATTENTE → PAIEMENT_EN_ATTENTE");
  console.log("OK  EN_ATTENTE → VALIDEE refusé");
  console.log("OK  ANNULEE / RESERVATION_EXPIREE → PAYEE refusés");
  console.log("OK  stock et réservations inchangés");
  console.log("OK  persistance + annulation depuis PAIEMENT_EN_ATTENTE");
  console.log("OK  catalogue / immobilier / stock / réservations");
}

main().catch((error) => {
  console.error("FAIL", error.message);
  process.exit(1);
});
