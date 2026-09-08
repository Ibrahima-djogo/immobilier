/**
 * Tests 7C-2 — création de commandes matériaux.
 * Prérequis : API démarrée (DEMO_API_URL, défaut http://localhost:4000)
 */
const fs = require("fs");
const path = require("path");

const BASE = process.env.DEMO_API_URL || "http://localhost:4000";
const DB_PATH = path.join(__dirname, "..", "data", "db.json");
const STAMP = Date.now().toString(36);

const customer = {
  name: "Mamadou Diallo",
  phone: "+224 620 00 00 00",
  email: "mamadou.diallo@example.com",
  city: "Conakry",
  district: "Kipé",
  address: "Cité Minière, villa 12",
  comment: "Test étape 7C-2",
};

function stockSnapshot(db) {
  const ids = [
    "mp-ciment-42-5",
    "mp-fer-a-beton-12-mm",
    "mp-tuyau-pvc-100-mm",
    "mp-carreau-60-60-cm",
  ];
  return Object.fromEntries(
    ids.map((productId) => {
      const stock = (db.materialStocks || []).find((item) => item.productId === productId);
      return [
        productId,
        {
          quantity: stock ? stock.quantity : null,
        },
      ];
    }),
  );
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
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { status: response.status, json };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const results = [];
  const createdIds = [];

  const health = await api("GET", "/health");
  assert(health.status === 200, `GET /health → ${health.status}`);
  results.push("GET /health OK");

  const catalog = await api("GET", "/materials/catalog");
  assert(catalog.status === 200, `GET /materials/catalog → ${catalog.status}`);
  assert(Array.isArray(catalog.json.materials), "catalogue materials manquant");
  results.push("GET /materials/catalog OK");

  const beforeDb = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
  const beforeStock = stockSnapshot(beforeDb);
  const collections = [
    "materialCategories",
    "materialUnits",
    "materialProducts",
    "materialSuppliers",
    "materialStocks",
  ].map((key) => [key, (beforeDb[key] || []).length]);
  const reservationsBefore = (beforeDb.materialStockReservations || []).length;
  const movementsBefore = (beforeDb.materialStockMovements || []).length;

  const one = await api(
    "POST",
    "/materials/orders",
    {
      customer,
      deliveryMode: "RETRAIT_DEPOT",
      items: [{ productId: "mp-ciment-42-5", quantity: 5 }],
    },
    { "X-Idempotency-Key": `test-7c2-ciment-5-${STAMP}` },
  );
  assert(one.status === 201 || one.status === 200, `commande ciment → ${one.status} ${JSON.stringify(one.json)}`);
  assert(one.json.reference && one.json.reference.startsWith("DG-MAT-"), "référence manquante");
  assert(one.json.status === "EN_ATTENTE", `statut ${one.json.status}`);
  assert(one.json.items[0].unitPrice === 100000, `prix ${one.json.items[0].unitPrice}`);
  assert(one.json.items[0].subtotal === 500000, `sous-total ${one.json.items[0].subtotal}`);
  assert(one.json.totalAmount === 500000, `total ${one.json.totalAmount}`);
  createdIds.push(one.json.id);
  results.push("1 produit + calculs + statut + référence OK");

  const multi = await api("POST", "/materials/orders", {
    customer,
    deliveryMode: "LIVRAISON",
    items: [
      { productId: "mp-ciment-42-5", quantity: 2 },
      { productId: "mp-fer-a-beton-12-mm", quantity: 1 },
    ],
  });
  assert(multi.status === 201, `multi → ${multi.status}`);
  assert(multi.json.items.length === 2, "2 lignes attendues");
  assert(multi.json.items[0].subtotal === 200000, `ciment 2 × 100000 = ${multi.json.items[0].subtotal}`);
  assert(multi.json.items[1].subtotal === 45000, `fer 1 × 45000 = ${multi.json.items[1].subtotal}`);
  assert(multi.json.totalAmount === 245000, `total multi ${multi.json.totalAmount}`);
  assert(multi.json.subtotal === 245000, `subtotal multi ${multi.json.subtotal}`);
  assert(multi.json.deliveryFee == null, `livraison fee ${multi.json.deliveryFee}`);
  assert(multi.json.deliveryMode === "LIVRAISON", "mode livraison");
  assert(multi.json.reference !== one.json.reference, "références non uniques");
  createdIds.push(multi.json.id);
  results.push("plusieurs produits + références uniques OK");

  const replay = await api(
    "POST",
    "/materials/orders",
    {
      customer,
      items: [{ productId: "mp-ciment-42-5", quantity: 5 }],
    },
    { "X-Idempotency-Key": `test-7c2-ciment-5-${STAMP}` },
  );
  assert(replay.status === 200, `idempotence → ${replay.status}`);
  assert(replay.json.id === one.json.id, "double envoi a créé une 2e commande");
  results.push("idempotence (même clé) OK");

  const unknown = await api("POST", "/materials/orders", {
    customer,
    items: [{ productId: "mp-inconnu", quantity: 1 }],
  });
  assert(unknown.status === 400 && unknown.json.code === "UNKNOWN_PRODUCT", `inconnu → ${JSON.stringify(unknown.json)}`);

  const inactive = await api("POST", "/materials/orders", {
    customer,
    items: [{ productId: "mp-carreau-60-60-cm", quantity: 1 }],
  });
  assert(inactive.status === 400 && inactive.json.code === "INACTIVE_PRODUCT", `inactif → ${JSON.stringify(inactive.json)}`);

  const zero = await api("POST", "/materials/orders", {
    customer,
    items: [{ productId: "mp-ciment-42-5", quantity: 0 }],
  });
  assert(zero.status === 400 && zero.json.code === "INVALID_QUANTITY", `qté 0 → ${JSON.stringify(zero.json)}`);

  const negative = await api("POST", "/materials/orders", {
    customer,
    items: [{ productId: "mp-ciment-42-5", quantity: -3 }],
  });
  assert(negative.status === 400 && negative.json.code === "INVALID_QUANTITY", `qté négative → ${JSON.stringify(negative.json)}`);

  const over = await api("POST", "/materials/orders", {
    customer,
    items: [{ productId: "mp-tuyau-pvc-100-mm", quantity: 1 }],
  });
  assert(
    over.status === 409 && over.json.code === "INSUFFICIENT_STOCK",
    `stock → ${JSON.stringify(over.json)}`,
  );
  results.push("refus inconnu / inactif / qté / disponibilité OK");

  const afterDb = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
  const afterStock = stockSnapshot(afterDb);
  assert(JSON.stringify(beforeStock) === JSON.stringify(afterStock), "stock modifié");
  assert(
    createdIds.every((id) => (afterDb.materialOrders || []).some((order) => order.id === id)),
    "commandes absentes de db.json",
  );
  for (const [key, count] of collections) {
    assert((afterDb[key] || []).length === count, `collection ${key} altérée`);
  }
  assert(
    (afterDb.materialStockReservations || []).length > reservationsBefore,
    "réservations non créées",
  );
  assert(
    (afterDb.materialStockMovements || []).length > movementsBefore,
    "mouvements de réservation non journalisés",
  );
  results.push("stock physique inchangé + persistance + catalogue intact OK");

  const down = await fetch("http://127.0.0.1:9/materials/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customer, items: [{ productId: "mp-ciment-42-5", quantity: 1 }] }),
  }).then(
    () => "reachable",
    () => "unavailable",
  );
  assert(down === "unavailable", "port fermé inattendu");
  results.push("API indisponible détectable côté client OK");

  console.log(results.map((line) => `OK  ${line}`).join("\n"));
  console.log(`Créées : ${createdIds.join(", ")}`);
}

main().then(() => process.exit(0)).catch((error) => {
  console.error("FAIL", error.message);
  process.exit(1);
});
