/**
 * Tests étape 2 — frais de livraison admin.
 * Prérequis : API démarrée (DEMO_API_URL, défaut http://localhost:4000)
 */
const BASE = process.env.DEMO_API_URL || "http://localhost:4000";
const STAMP = Date.now();

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

function customer(name) {
  return {
    name,
    phone: "+224 620 44 33 22",
    email: `fee-${STAMP}@example.com`,
    city: "Conakry",
    district: "Hamdallaye",
    address: "Cité test livraison",
    comment: "Test frais",
  };
}

async function createOrder(deliveryMode) {
  return api("POST", "/materials/orders", {
    customer: customer(`Client ${deliveryMode}`),
    deliveryMode,
    items: [{ productId: "mp-ciment-42-5", quantity: 5 }],
  });
}

async function setFee(id, deliveryFee, extra = {}) {
  return api("PATCH", `/materials/orders/${id}/delivery-fee`, {
    deliveryFee,
    changedBy: "admin",
    ...extra,
  });
}

async function main() {
  const results = [];
  assert((await api("GET", "/health")).status === 200, "API indisponible");

  const pickup = await createOrder("RETRAIT_DEPOT");
  assert(pickup.status === 201, `retrait → ${pickup.status}`);
  assert(pickup.json.deliveryFee === 0, "retrait fee");
  assert(pickup.json.subtotal === 500000, "retrait subtotal");
  assert(pickup.json.totalAmount === 500000, "retrait total");
  const pickupFee = await setFee(pickup.json.id, 50000);
  assert(pickupFee.status === 400, `retrait refuse fee → ${pickupFee.status}`);
  const pickupRead = await api("GET", `/materials/orders/${pickup.json.id}`);
  assert(pickupRead.json.deliveryFee === 0, "retrait fee persisté");
  assert(pickupRead.json.totalAmount === 500000, "retrait total persisté");
  results.push("TEST 1 — RETRAIT_DEPOT : fee 0, total = subtotal, modification refusée");

  const delivery = await createOrder("LIVRAISON");
  assert(delivery.status === 201, `livraison → ${delivery.status}`);
  assert(delivery.json.deliveryFee == null, "livraison fee ouverte");
  assert(delivery.json.totalAmount === 500000, "livraison total initial");
  results.push("TEST 2 — LIVRAISON : À confirmer");

  const first = await setFee(delivery.json.id, 50000);
  assert(first.status === 200, `set 50000 → ${first.status} ${JSON.stringify(first.json)}`);
  assert(first.json.deliveryFee === 50000, "fee 50000");
  assert(first.json.subtotal === 500000, "subtotal inchangé");
  assert(first.json.totalAmount === 550000, "total 550000");
  assert(first.json.status === "EN_ATTENTE", `statut devenu ${first.json.status}`);
  results.push("TEST 3 — 50 000 GNF, total recalculé, statut inchangé");

  const second = await setFee(delivery.json.id, "75 000");
  assert(second.status === 200, `set 75000 → ${second.status}`);
  assert(second.json.deliveryFee === 75000, "fee 75000");
  assert(second.json.totalAmount === 575000, "total 575000");
  const history = second.json.verificationHistory || [];
  const feeEvents = history.filter((item) => item.action === "FRAIS_LIVRAISON_MODIFIES");
  assert(feeEvents.length === 2, `historique ${feeEvents.length}`);
  assert(feeEvents[0].toAmount === 50000, "historique 1");
  assert(feeEvents[1].fromAmount === 50000 && feeEvents[1].toAmount === 75000, "historique 2");
  results.push("TEST 4/5 — 75 000 GNF + historique conservé");

  const spoof = await setFee(delivery.json.id, 10000, { totalAmount: 1 });
  assert(spoof.status === 200, "spoof total");
  assert(spoof.json.totalAmount === 510000, `total imposé ${spoof.json.totalAmount}`);
  results.push("TEST 12 — total envoyé par le client ignoré");

  const persisted = await api("GET", `/materials/orders/${delivery.json.id}`);
  assert(persisted.json.deliveryFee === 10000, "persist fee");
  assert(persisted.json.totalAmount === 510000, "persist total");
  results.push("TEST 6 — relecture API persistée");

  const negative = await setFee(delivery.json.id, -12);
  assert(negative.status === 400 && negative.json.code === "INVALID_DELIVERY_FEE", "négatif");
  const text = await setFee(delivery.json.id, "abc");
  assert(text.status === 400 && text.json.code === "INVALID_DELIVERY_FEE", "texte");
  const afterReject = await api("GET", `/materials/orders/${delivery.json.id}`);
  assert(afterReject.json.deliveryFee === 10000, "montant conservé après refus");
  results.push("TEST 10/11 — négatif et texte refusés");

  const signup = await api("POST", "/auth/register", {
    firstName: "Fee",
    lastName: "User",
    email: `fee-user-${STAMP}@demeureguinee.test`,
    phone: "+224 620 10 20 30",
    password: "Demo1234!",
  });
  const token = signup.json.token || signup.json.user.id;
  const connected = await api(
    "POST",
    "/materials/orders",
    {
      customer: customer("Compte frais"),
      deliveryMode: "LIVRAISON",
      items: [{ productId: "mp-ciment-42-5", quantity: 1 }],
    },
    { Authorization: `Bearer ${token}` },
  );
  assert(connected.status === 201, "commande connectée");
  await setFee(connected.json.id, 40000);
  const mine = await api(
    "GET",
    `/materials/orders/my/${connected.json.id}`,
    null,
    { Authorization: `Bearer ${token}` },
  );
  assert(mine.json.deliveryFee === 40000, "mes commandes fee");
  assert(mine.json.totalAmount === 140000, "mes commandes total");
  results.push("TEST 7/8 — compte connecté voit le montant API");

  const guest = await api("POST", "/materials/orders", {
    customer: {
      ...customer("Invité frais"),
      phone: "+224 620 88 77 66",
    },
    deliveryMode: "LIVRAISON",
    items: [{ productId: "mp-ciment-42-5", quantity: 1 }],
  });
  await setFee(guest.json.id, 25000);
  const lookup = await api("POST", "/materials/orders/lookup", {
    reference: guest.json.reference,
    phone: "+224620887766",
  });
  assert(lookup.json.deliveryFee === 25000, "suivi invité fee");
  assert(lookup.json.totalAmount === 125000, "suivi invité total");
  results.push("TEST 9 — suivi invité actualisé");

  await api("POST", `/materials/orders/${pickup.json.id}/cancel`);
  await api("POST", `/materials/orders/${delivery.json.id}/cancel`);
  await api("POST", `/materials/orders/${connected.json.id}/cancel`);
  await api("POST", `/materials/orders/${guest.json.id}/cancel`);

  console.log(results.map((line) => `OK  ${line}`).join("\n"));
}

main().then(() => process.exit(0)).catch((error) => {
  console.error("FAIL", error.message);
  process.exit(1);
});
