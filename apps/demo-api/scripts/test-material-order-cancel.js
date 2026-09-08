/**
 * Tests 7D-2 — annulation de commande et libération des réservations.
 * Prérequis : API démarrée (DEMO_API_URL, défaut http://localhost:4000)
 */
const fs = require("fs");
const path = require("path");

const BASE = process.env.DEMO_API_URL || "http://localhost:4000";
const DB_PATH = path.join(__dirname, "..", "data", "db.json");

const customer = {
  name: "Test Annulation",
  phone: "+224 620 44 55 66",
  city: "Conakry",
  district: "Kipé",
  address: "Dépôt test, villa 8",
};

function readDb() {
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function activeReserved(db, productId) {
  return (db.materialStockReservations || [])
    .filter((item) => item.productId === productId && item.status === "ACTIVE")
    .reduce((sum, item) => sum + Number(item.quantity || 0), 0);
}

function stockOf(db, productId) {
  const stock = (db.materialStocks || []).find((item) => item.productId === productId);
  if (!stock) return null;
  const reservedQuantity = Number(stock.reservedQuantity || 0);
  return {
    quantity: stock.quantity,
    reservedQuantity,
    available: Math.max(0, Number(stock.quantity) - reservedQuantity),
    activeReserved: activeReserved(db, productId),
  };
}

function reservationsForOrder(db, orderId) {
  return (db.materialStockReservations || []).filter((item) => item.orderId === orderId);
}

function assertInvariants(stock, label) {
  assert(stock.reservedQuantity >= 0, `${label} reserved < 0`);
  assert(stock.reservedQuantity <= stock.quantity, `${label} reserved > quantity`);
  assert(stock.available >= 0, `${label} available < 0`);
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
  let json = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }
  return { status: response.status, json };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function postOrder(items, headers = {}) {
  const response = await fetch(`${BASE}/materials/orders`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({ customer, items }),
  });
  return { status: response.status, json: await response.json() };
}

async function main() {
  const health = await api("GET", "/health");
  assert(health.status === 200, `health ${health.status}`);
  assert((await api("GET", "/materials")).status === 200, "warmup materials");

  const before = readDb();
  const movementsBefore = (before.materialStockMovements || []).length;
  const ciment0 = stockOf(before, "mp-ciment-42-5");
  const fer0 = stockOf(before, "mp-fer-a-beton-12-mm");
  assert(ciment0 && ciment0.available >= 10, "ciment insuffisant pour le test");
  assert(fer0 && fer0.available >= 1, "fer insuffisant pour le test multi");

  const simple = await postOrder([{ productId: "mp-ciment-42-5", quantity: 10 }]);
  assert(simple.status === 201, `create 10 → ${simple.status}`);
  const afterCreate = readDb();
  const simpleReservations = reservationsForOrder(afterCreate, simple.json.id);
  assert(simpleReservations.length === 1 && simpleReservations[0].status === "ACTIVE", "réservation ACTIVE");
  assert(simpleReservations[0].quantity === 10, "qté réservée 10");
  const ciment1 = stockOf(afterCreate, "mp-ciment-42-5");
  assert(ciment1.quantity === ciment0.quantity, "quantity après création");
  assert(ciment1.activeReserved === ciment0.activeReserved + 10, "reserved +10");
  assert(ciment1.reservedQuantity === ciment1.activeReserved, "reserved désynchronisé après création");

  const cancelled = await api("POST", `/materials/orders/${simple.json.id}/cancel`);
  assert(cancelled.status === 200, `cancel → ${cancelled.status} ${JSON.stringify(cancelled.json)}`);
  assert(cancelled.json.status === "ANNULEE", `statut ${cancelled.json.status}`);
  const afterCancel = readDb();
  const released = reservationsForOrder(afterCancel, simple.json.id);
  assert(released.length === 1 && released[0].status === "RELEASED", `libération ${released[0] && released[0].status}`);
  const ciment2 = stockOf(afterCancel, "mp-ciment-42-5");
  assert(ciment2.quantity === ciment0.quantity, "quantity physique changée (test 1)");
  assert(ciment2.activeReserved === ciment0.activeReserved, "reserved pas revenu à l’état initial");
  assert(ciment2.reservedQuantity === ciment2.activeReserved, "reserved désynchronisé après cancel");
  assertInvariants(ciment2, "ciment après cancel");

  const again = await api("POST", `/materials/orders/${simple.json.id}/cancel`);
  assert(again.status === 409 && again.json.code === "ALREADY_CANCELLED", `double cancel ${again.status}`);
  const afterAgain = readDb();
  assert(reservationsForOrder(afterAgain, simple.json.id)[0].status === "RELEASED", "double libération");
  assert(
    stockOf(afterAgain, "mp-ciment-42-5").reservedQuantity === ciment2.reservedQuantity,
    "stock modifié au 2e cancel",
  );

  const missing = await api("POST", "/materials/orders/mo-inexistant/cancel");
  assert(missing.status === 404, `404 → ${missing.status}`);

  const secondProduct = { productId: "mp-fer-a-beton-12-mm", quantity: 1 };
  const secondId = secondProduct.productId;
  const secondBefore = stockOf(afterAgain, secondId);
  const multi = await postOrder([
    { productId: "mp-ciment-42-5", quantity: 4 },
    secondProduct,
  ]);
  assert(multi.status === 201, `multi → ${multi.status} ${JSON.stringify(multi.json)}`);
  const afterMulti = readDb();
  assert(reservationsForOrder(afterMulti, multi.json.id).every((item) => item.status === "ACTIVE"), "multi ACTIVE");
  const multiCancel = await api("POST", `/materials/orders/${multi.json.reference}/cancel`);
  assert(multiCancel.status === 200 && multiCancel.json.status === "ANNULEE", "multi cancel");
  const afterMultiCancel = readDb();
  const multiReleased = reservationsForOrder(afterMultiCancel, multi.json.id);
  assert(multiReleased.length === 2, `multi réservations ${multiReleased.length}`);
  assert(multiReleased.every((item) => item.status === "RELEASED"), "multi pas toutes RELEASED");
  assert(stockOf(afterMultiCancel, "mp-ciment-42-5").quantity === ciment0.quantity, "qty ciment multi");
  assert(stockOf(afterMultiCancel, secondId).quantity === secondBefore.quantity, "qty second produit");
  assert(
    stockOf(afterMultiCancel, "mp-ciment-42-5").reservedQuantity ===
      stockOf(afterAgain, "mp-ciment-42-5").reservedQuantity,
    "ciment reserved multi",
  );
  assert(
    stockOf(afterMultiCancel, secondId).reservedQuantity === secondBefore.reservedQuantity,
    "second reserved multi",
  );

  const expireCase = await postOrder([{ productId: "mp-ciment-42-5", quantity: 1 }]);
  assert(expireCase.status === 201, "expire create");
  const dbExpire = readDb();
  dbExpire.materialStockReservations = (dbExpire.materialStockReservations || []).map((item) =>
    item.orderId === expireCase.json.id ? { ...item, status: "EXPIRED" } : item,
  );
  writeDb(dbExpire);
  const expireCancel = await api("POST", `/materials/orders/${expireCase.json.id}/cancel`);
  assert(
    expireCancel.status === 400 && expireCancel.json.code === "INVALID_ORDER_STATUS",
    `expire cancel ${expireCancel.status} ${JSON.stringify(expireCancel.json)}`,
  );
  const afterExpire = readDb();
  const expiredRes = reservationsForOrder(afterExpire, expireCase.json.id);
  assert(expiredRes.length === 1 && expiredRes[0].status === "EXPIRED", `expired devenu ${expiredRes[0] && expiredRes[0].status}`);
  const expiredOrder = (afterExpire.materialOrders || []).find((item) => item.id === expireCase.json.id);
  assert(expiredOrder && expiredOrder.status === "RESERVATION_EXPIREE", `commande expired ${expiredOrder && expiredOrder.status}`);
  assert(stockOf(afterExpire, "mp-ciment-42-5").quantity === ciment0.quantity, "qty après expire");

  const afterAll = readDb();
  const addedMovements = (afterAll.materialStockMovements || []).slice(
    0,
    Math.max(0, (afterAll.materialStockMovements || []).length - movementsBefore),
  );
  assert(addedMovements.length > 0, "journal réservation/libération manquant");
  assert(
    addedMovements.every((item) => item.type === "RESERVATION" || item.type === "LIBERATION"),
    "mouvement physique inattendu à l’annulation",
  );
  assert(
    addedMovements.some((item) => item.type === "LIBERATION"),
    "libération non journalisée",
  );
  assertInvariants(stockOf(afterAll, "mp-ciment-42-5"), "ciment final");
  if (fer0) assertInvariants(stockOf(afterAll, "mp-fer-a-beton-12-mm"), "fer final");

  const persisted = await api("GET", `/materials/orders/${simple.json.id}`);
  assert(persisted.status === 200 && persisted.json.status === "ANNULEE", "persistance GET");
  const catalog = await api("GET", "/materials/catalog");
  const properties = await api("GET", "/properties");
  assert(catalog.status === 200 && properties.status === 200, "non-régression");

  console.log("OK  cancel 10 ciment → RELEASED, reserved -10, quantity inchangée");
  console.log("OK  multi-produits libérés");
  console.log("OK  double annulation refusée");
  console.log("OK  404 commande inexistante");
  console.log("OK  EXPIRED → RESERVATION_EXPIREE, annulation refusée");
  console.log("OK  journal RESERVATION/LIBERATION + invariants");
}

main().catch((error) => {
  console.error("FAIL", error.message);
  process.exit(1);
});
