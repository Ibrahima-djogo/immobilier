/**
 * Tests 7H — remise commande (retrait dépôt / livraison interne).
 * Prérequis : API démarrée (DEMO_API_URL, défaut http://localhost:4000)
 */
const fs = require("fs");
const path = require("path");
const { confirmAgentPaid } = require("./material-order-helpers");

const BASE = process.env.DEMO_API_URL || "http://localhost:4000";
const DB_PATH = path.join(__dirname, "..", "data", "db.json");

const customer = {
  name: "Test Remise",
  phone: "+224 620 22 11 00",
  city: "Conakry",
  district: "Kipé",
  address: "Dépôt test, villa 14",
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

async function patchMode(id, deliveryMode) {
  return api("PATCH", `/materials/orders/${id}/delivery-mode`, { deliveryMode });
}

async function reachReady() {
  const created = await postOrder();
  assert(created.status === 201, `create ${created.status}`);
  assert((await patchStatus(created.json.id, "PAIEMENT_EN_ATTENTE")).status === 200, "paiement");
  assert((await confirmAgentPaid(api, created.json)).status === 200, "payée");
  assert((await patchStatus(created.json.id, "EN_PREPARATION")).status === 200, "préparation");
  const ready = await patchStatus(created.json.id, "PRETE");
  assert(ready.status === 200 && ready.json.status === "PRETE", "prête");
  return ready.json;
}

async function main() {
  assert((await api("GET", "/health")).status === 200, "health");
  assert((await api("GET", "/materials")).status === 200, "warmup");

  const delivery = await reachReady();
  const stock0 = stockOf(readDb(), "mp-ciment-42-5");
  const res0 = reservationsSnapshot(readDb(), delivery.id);
  assert(res0.length === 1 && res0[0].status === "ACTIVE", "résa ACTIVE");

  const mode = await patchMode(delivery.id, "LIVRAISON");
  assert(mode.status === 200 && mode.json.deliveryMode === "LIVRAISON", "mode livraison");

  const shipping = await patchStatus(delivery.id, "EN_LIVRAISON");
  assert(shipping.status === 200 && shipping.json.status === "EN_LIVRAISON", "EN_LIVRAISON");
  assert(shipping.json.deliveryMode === "LIVRAISON", "mode conservé");
  assert(
    (shipping.json.statusHistory || []).some((item) => item.status === "EN_LIVRAISON"),
    "historique EN_LIVRAISON",
  );
  const afterShip = readDb();
  assert(stockOf(afterShip, "mp-ciment-42-5").quantity === stock0.quantity, "qty livraison");
  assert(
    stockOf(afterShip, "mp-ciment-42-5").reservedQuantity === stock0.reservedQuantity,
    "reserved livraison",
  );
  assert(
    JSON.stringify(reservationsSnapshot(afterShip, delivery.id)) === JSON.stringify(res0),
    "résa livraison",
  );

  const delivered = await patchStatus(delivery.id, "LIVREE");
  assert(delivered.status === 200 && delivered.json.status === "LIVREE", "LIVREE");
  const persisted = await api("GET", `/materials/orders/${delivery.id}`);
  assert(persisted.json.status === "LIVREE", "persistance GET");
  const fromDisk = (readDb().materialOrders || []).find((item) => item.id === delivery.id);
  assert(fromDisk && fromDisk.status === "LIVREE" && fromDisk.deliveryMode === "LIVRAISON", "db.json");
  const afterDelivered = stockOf(readDb(), "mp-ciment-42-5");
  assert(afterDelivered.quantity === stock0.quantity - 1, "qty vendue livraison");
  assert(afterDelivered.reservedQuantity === stock0.reservedQuantity - 1, "réservé consommé livraison");
  assert(
    reservationsSnapshot(readDb(), delivery.id).some((item) => item.status === "CONSUMED"),
    "résa CONSUMED livraison",
  );

  const pickup = await reachReady();
  const beforePickup = stockOf(readDb(), "mp-ciment-42-5");
  const pickupMode = await patchMode(pickup.id, "RETRAIT_DEPOT");
  assert(pickupMode.status === 200 && pickupMode.json.deliveryMode === "RETRAIT_DEPOT", "mode retrait");
  const retired = await patchStatus(pickup.id, "RETIRE_DEPOT");
  assert(retired.status === 200 && retired.json.status === "RETIRE_DEPOT", "RETIRE_DEPOT");
  const afterPickup = readDb();
  assert(stockOf(afterPickup, "mp-ciment-42-5").quantity === beforePickup.quantity - 1, "qty retrait vendue");
  assert(
    JSON.stringify(reservationsSnapshot(afterPickup, pickup.id)).includes('"CONSUMED"'),
    "résa retrait consommée",
  );

  const paid = await postOrder();
  assert((await patchStatus(paid.json.id, "PAIEMENT_EN_ATTENTE")).status === 200, "wait paid");
  const paidOnly = await confirmAgentPaid(api, paid.json);
  assert((await patchStatus(paidOnly.json.id, "EN_LIVRAISON")).status === 400, "PAYEE→EN_LIVRAISON");

  const readySkip = await reachReady();
  assert((await patchStatus(readySkip.id, "LIVREE")).status === 400, "PRETE→LIVREE");

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

  console.log("OK  PRETE → EN_LIVRAISON → LIVREE");
  console.log("OK  PRETE → RETIRE_DEPOT");
  console.log("OK  transitions interdites refusées");
  console.log("OK  stock consommé à LIVREE / RETIRE_DEPOT");
  console.log("OK  historique + persistance");
  console.log("OK  catalogue / immobilier / stock / réservations");
}

main().catch((error) => {
  console.error("FAIL", error.message);
  process.exit(1);
});
