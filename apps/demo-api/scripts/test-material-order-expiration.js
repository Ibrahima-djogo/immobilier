/**
 * Tests 7D-3 — expiration des réservations liées aux commandes.
 * Prérequis : API démarrée (DEMO_API_URL, défaut http://localhost:4000)
 */
const fs = require("fs");
const path = require("path");

const BASE = process.env.DEMO_API_URL || "http://localhost:4000";
const DB_PATH = path.join(__dirname, "..", "data", "db.json");

const customer = {
  name: "Test Expiration",
  phone: "+224 620 77 88 99",
  city: "Conakry",
  district: "Kipé",
  address: "Dépôt test, villa 4",
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
    available: Math.max(0, Number(stock.quantity) - Number(stock.reservedQuantity)),
  };
}

function reservationsForOrder(db, orderId) {
  return (db.materialStockReservations || []).filter((item) => item.orderId === orderId);
}

function expireReservations(orderId) {
  const db = readDb();
  const past = new Date(Date.now() - 60 * 1000).toISOString();
  db.materialStockReservations = (db.materialStockReservations || []).map((item) =>
    item.orderId === orderId && item.status === "ACTIVE"
      ? { ...item, expiresAt: past }
      : item,
  );
  writeDb(db);
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

async function postOrder(items) {
  return api("POST", "/materials/orders", { customer, items });
}

async function main() {
  assert((await api("GET", "/health")).status === 200, "health");
  assert((await api("GET", "/materials")).status === 200, "warmup materials");

  const before = readDb();
  const ciment0 = stockOf(before, "mp-ciment-42-5");
  const fer0 = stockOf(before, "mp-fer-a-beton-12-mm");
  assert(ciment0.available >= 3, "ciment insuffisant");
  assert(fer0.available >= 1, "fer insuffisant");

  const one = await postOrder([{ productId: "mp-ciment-42-5", quantity: 3 }]);
  assert(one.status === 201 && one.json.status === "EN_ATTENTE", `create ${one.status}`);
  const afterCreate = readDb();
  const ciment1 = stockOf(afterCreate, "mp-ciment-42-5");
  assert(ciment1.quantity === ciment0.quantity, "qty après création");
  assert(ciment1.reservedQuantity === ciment0.reservedQuantity + 3, "reserved +3");
  assert(reservationsForOrder(afterCreate, one.json.id)[0].status === "ACTIVE", "pas ACTIVE");

  expireReservations(one.json.id);
  const firstRead = await api("GET", `/materials/orders/${one.json.id}`);
  assert(firstRead.status === 200, "GET après expire");
  assert(firstRead.json.status === "RESERVATION_EXPIREE", `statut ${firstRead.json.status}`);
  const afterExpire = readDb();
  const expired = reservationsForOrder(afterExpire, one.json.id);
  assert(expired.length === 1 && expired[0].status === "EXPIRED", `résa ${expired[0] && expired[0].status}`);
  const ciment2 = stockOf(afterExpire, "mp-ciment-42-5");
  assert(ciment2.quantity === ciment0.quantity, "quantity physique changée");
  assert(ciment2.reservedQuantity === ciment0.reservedQuantity, `reserved ${ciment2.reservedQuantity}`);
  assert(ciment2.available === ciment0.available, `available ${ciment2.available}`);
  assert(ciment2.reservedQuantity <= ciment2.quantity, "reserved > quantity");
  assert(ciment2.available >= 0, "available < 0");
  const firstUpdatedAt = firstRead.json.updatedAt;

  const secondRead = await api("GET", `/materials/orders/${one.json.id}`);
  assert(secondRead.json.status === "RESERVATION_EXPIREE", "2e lecture statut");
  assert(secondRead.json.updatedAt === firstUpdatedAt, "2e lecture a re-écrit la commande");
  const afterSecond = readDb();
  assert(
    stockOf(afterSecond, "mp-ciment-42-5").reservedQuantity === ciment2.reservedQuantity,
    "2e lecture a modifié le stock",
  );
  assert(reservationsForOrder(afterSecond, one.json.id)[0].status === "EXPIRED", "2e lecture a relibéré");

  const multi = await postOrder([
    { productId: "mp-ciment-42-5", quantity: 2 },
    { productId: "mp-fer-a-beton-12-mm", quantity: 1 },
  ]);
  assert(multi.status === 201, `multi ${multi.status}`);
  const dbMulti = readDb();
  const past = new Date(Date.now() - 60 * 1000).toISOString();
  let expiredOne = false;
  dbMulti.materialStockReservations = (dbMulti.materialStockReservations || []).map((item) => {
    if (item.orderId !== multi.json.id || item.status !== "ACTIVE" || expiredOne) return item;
    expiredOne = true;
    return { ...item, expiresAt: past };
  });
  writeDb(dbMulti);
  const multiRead = await api("GET", `/materials/orders/${multi.json.id}`);
  assert(multiRead.json.status === "RESERVATION_EXPIREE", `multi statut ${multiRead.json.status}`);
  const afterMulti = readDb();
  const multiRes = reservationsForOrder(afterMulti, multi.json.id);
  assert(multiRes.some((item) => item.status === "EXPIRED"), "aucune EXPIRED multi");
  assert(multiRes.some((item) => item.status === "ACTIVE"), "l’autre résa doit rester ACTIVE");
  assert(stockOf(afterMulti, "mp-ciment-42-5").quantity === ciment0.quantity, "qty ciment multi");
  assert(stockOf(afterMulti, "mp-fer-a-beton-12-mm").quantity === fer0.quantity, "qty fer multi");
  const persistedOrder = afterExpire.materialOrders.find((item) => item.id === one.json.id);
  assert(persistedOrder && persistedOrder.status === "RESERVATION_EXPIREE", "persistance db.json");

  const cancelled = await postOrder([{ productId: "mp-ciment-42-5", quantity: 1 }]);
  assert(cancelled.status === 201, "cancel create");
  const cancelRes = await api("POST", `/materials/orders/${cancelled.json.id}/cancel`);
  assert(cancelRes.status === 200 && cancelRes.json.status === "ANNULEE", "cancel");
  expireReservations(cancelled.json.id);
  const cancelRead = await api("GET", `/materials/orders/${cancelled.json.id}`);
  assert(cancelRead.json.status === "ANNULEE", `ANNULEE devenu ${cancelRead.json.status}`);
  const afterCancel = readDb();
  assert(
    reservationsForOrder(afterCancel, cancelled.json.id).every((item) => item.status === "RELEASED"),
    "RELEASED devenue EXPIRED",
  );

  const persisted = await api("GET", `/materials/orders/${one.json.id}`);
  assert(persisted.json.status === "RESERVATION_EXPIREE", "persistance");
  const catalog = await api("GET", "/materials/catalog");
  const snapshot = await api("GET", "/materials");
  const properties = await api("GET", "/properties");
  assert(catalog.status === 200 && snapshot.status === 200 && properties.status === 200, "régression");

  console.log("OK  GET expire → EXPIRED + RESERVATION_EXPIREE");
  console.log("OK  quantity inchangée, reserved/available restaurés");
  console.log("OK  multi : une expiration suffit");
  console.log("OK  2e lecture idempotente");
  console.log("OK  ANNULEE / RELEASED intacts");
  console.log("OK  catalogue + immobilier");
}

main().then(() => process.exit(0)).catch((error) => {
  console.error("FAIL", error.message);
  process.exit(1);
});
