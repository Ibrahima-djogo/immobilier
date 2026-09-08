/**
 * Tests 7D-1 — commande → réservation de stock.
 * Prérequis : API démarrée (DEMO_API_URL, défaut http://localhost:4000)
 */
const fs = require("fs");
const path = require("path");

const BASE = process.env.DEMO_API_URL || "http://localhost:4000";
const DB_PATH = path.join(__dirname, "..", "data", "db.json");

const STAMP = Date.now().toString(36);

const customer = {
  name: "Test Réservation",
  phone: "+224 620 11 22 33",
  city: "Conakry",
  district: "Kipé",
  address: "Dépôt test, villa 3",
};

function readDb() {
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

function stockOf(db, productId) {
  const stock = (db.materialStocks || []).find((item) => item.productId === productId);
  if (!stock) return null;
  const available = Math.max(0, Number(stock.quantity) - Number(stock.reservedQuantity));
  return {
    id: stock.id,
    quantity: stock.quantity,
    reservedQuantity: stock.reservedQuantity,
    available,
  };
}

function reservationsForOrder(db, orderId) {
  return (db.materialStockReservations || []).filter((item) => item.orderId === orderId);
}

async function api(method, pathname, body, headers = {}) {
  const response = await fetch(`${BASE}${pathname}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...headers,
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

async function main() {
  const health = await api("GET", "/health");
  assert(health.status === 200, `health ${health.status}`);

  const before = readDb();
  const cimentBefore = stockOf(before, "mp-ciment-42-5");
  const ferBefore = stockOf(before, "mp-fer-a-beton-12-mm");
  const reservationCountBefore = (before.materialStockReservations || []).length;
  const orderCountBefore = (before.materialOrders || []).length;
  assert(cimentBefore, "stock ciment manquant");

  const one = await api(
    "POST",
    "/materials/orders",
    {
      customer,
      items: [{ productId: "mp-ciment-42-5", quantity: 50 }],
    },
    { "X-Idempotency-Key": `test-7d1-ciment-50-${STAMP}` },
  );
  assert(one.status === 201 || one.status === 200, `ciment 50 → ${one.status} ${JSON.stringify(one.json)}`);
  assert(one.json.status === "EN_ATTENTE", `statut ${one.json.status}`);

  const afterOne = readDb();
  const cimentAfter = stockOf(afterOne, "mp-ciment-42-5");
  const oneReservations = reservationsForOrder(afterOne, one.json.id);
  assert(cimentAfter.quantity === cimentBefore.quantity, "quantity physique ciment changée");
  assert(
    cimentAfter.reservedQuantity === cimentBefore.reservedQuantity + 50,
    `réservé ciment ${cimentAfter.reservedQuantity} ≠ ${cimentBefore.reservedQuantity + 50}`,
  );
  assert(cimentAfter.available === cimentBefore.available - 50, `dispo ciment ${cimentAfter.available}`);
  assert(cimentAfter.reservedQuantity <= cimentAfter.quantity, "reserved > quantity");
  assert(cimentAfter.available >= 0, "available négatif");
  assert(oneReservations.length === 1, `réservations commande 1 : ${oneReservations.length}`);
  assert(oneReservations[0].status === "ACTIVE", "réservation inactive");
  assert(oneReservations[0].orderReference === one.json.reference, "référence absente");
  assert(oneReservations[0].expiresAt, "expiresAt manquant");

  const replay = await api(
    "POST",
    "/materials/orders",
    {
      customer,
      items: [{ productId: "mp-ciment-42-5", quantity: 50 }],
    },
    { "X-Idempotency-Key": `test-7d1-ciment-50-${STAMP}` },
  );
  assert(replay.status === 200 && replay.json.id === one.json.id, "idempotence commande");
  const afterReplay = readDb();
  assert(
    reservationsForOrder(afterReplay, one.json.id).length === 1,
    "double réservation",
  );
  assert(
    stockOf(afterReplay, "mp-ciment-42-5").reservedQuantity === cimentAfter.reservedQuantity,
    "réservé augmenté au replay",
  );

  const multi = await api("POST", "/materials/orders", {
    customer,
    items: [
      { productId: "mp-ciment-42-5", quantity: 2 },
      { productId: "mp-fer-a-beton-12-mm", quantity: 1 },
    ],
  });
  assert(multi.status === 201, `multi → ${multi.status}`);
  const afterMulti = readDb();
  const multiReservations = reservationsForOrder(afterMulti, multi.json.id);
  assert(multiReservations.length === 2, `réservations multi ${multiReservations.length}`);
  assert(stockOf(afterMulti, "mp-ciment-42-5").quantity === cimentBefore.quantity, "qty ciment multi");
  assert(stockOf(afterMulti, "mp-fer-a-beton-12-mm").quantity === ferBefore.quantity, "qty fer multi");
  assert(
    stockOf(afterMulti, "mp-fer-a-beton-12-mm").reservedQuantity === ferBefore.reservedQuantity + 1,
    "réservé fer",
  );

  const fail = await api("POST", "/materials/orders", {
    customer,
    items: [
      { productId: "mp-ciment-42-5", quantity: 1 },
      { productId: "mp-fer-a-beton-12-mm", quantity: 9999 },
    ],
  });
  assert(fail.status === 409, `échec partiel → ${fail.status}`);
  assert(
    fail.json.error ===
      "Certains matériaux ne sont plus disponibles dans les quantités demandées.",
    `message ${fail.json.error}`,
  );
  const afterFail = readDb();
  assert((afterFail.materialOrders || []).length === (afterMulti.materialOrders || []).length, "commande partielle créée");
  assert(
    (afterFail.materialStockReservations || []).length ===
      (afterMulti.materialStockReservations || []).length,
    "réservation partielle créée",
  );
  assert(
    stockOf(afterFail, "mp-ciment-42-5").reservedQuantity ===
      stockOf(afterMulti, "mp-ciment-42-5").reservedQuantity,
    "ciment réservé malgré échec",
  );

  const catalog = await api("GET", "/materials/catalog");
  const properties = await api("GET", "/properties");
  const reservations = await api("GET", "/materials");
  assert(catalog.status === 200, "catalogue");
  assert(properties.status === 200, "immobilier");
  assert(reservations.status === 200, "snapshot");
  const linked = (reservations.json.reservations || []).filter(
    (item) => item.orderId === one.json.id,
  );
  assert(linked.length === 1, "snapshot admin sans réservation commande");

  console.log("OK  stock 50 → reserved +50, quantity inchangée");
  console.log("OK  multi-produits + 2 réservations");
  console.log("OK  échec partiel sans écriture");
  console.log("OK  pas de double réservation");
  console.log("OK  EN_ATTENTE + expiration 5C + catalogue/immo");
  console.log(
    `Avant ciment ${cimentBefore.quantity}/${cimentBefore.reservedQuantity}/${cimentBefore.available} → après +50 : ${stockOf(afterFail, "mp-ciment-42-5").quantity}/${stockOf(afterFail, "mp-ciment-42-5").reservedQuantity}/${stockOf(afterFail, "mp-ciment-42-5").available}`,
  );
  console.log(`Réservations ${reservationCountBefore} → ${(afterFail.materialStockReservations || []).length}`);
  console.log(`Commandes ${orderCountBefore} → ${(afterFail.materialOrders || []).length}`);
}

main().catch((error) => {
  console.error("FAIL", error.message);
  process.exit(1);
});
