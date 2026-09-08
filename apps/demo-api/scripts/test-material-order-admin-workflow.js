/**
 * Tests étape 3 — workflow admin sans vérification + livraison / retrait.
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

function customer(name, phone = "+224 620 11 22 33") {
  return {
    name,
    phone,
    email: `wf-${STAMP}@example.com`,
    city: "Conakry",
    district: "Hamdallaye",
    address: "Cité test workflow",
    comment: "Indication portail bleu",
  };
}

async function createOrder(deliveryMode, extra = {}) {
  return api("POST", "/materials/orders", {
    customer: customer(`Client ${deliveryMode}`),
    deliveryMode,
    items: [{ productId: "mp-ciment-42-5", quantity: 2 }],
    ...extra,
  });
}

async function patchStatus(id, status) {
  return api("PATCH", `/materials/orders/${id}/status`, { status, changedBy: "admin" });
}

async function advanceToReady(order) {
  const id = order.id;
  assert((await patchStatus(id, "PAIEMENT_EN_ATTENTE")).status === 200, "paiement");
  const paid = await api("POST", `/materials/orders/${id}/payments`, {
    channel: "AGENT_WHATSAPP",
    accessToken: order.accessToken,
  });
  assert(paid.status === 200, `paiement agent ${paid.status}`);
  assert(
    (await api("POST", `/materials/orders/${id}/payments/confirm-agent`, {
      changedBy: "admin",
    })).status === 200,
    "payée",
  );
  assert((await patchStatus(id, "EN_PREPARATION")).status === 200, "préparation");
  const ready = await patchStatus(id, "PRETE");
  assert(ready.status === 200 && ready.json.status === "PRETE", "prête");
  return ready.json;
}

async function main() {
  const results = [];
  assert((await api("GET", "/health")).status === 200, "API indisponible");

  const pickup = await createOrder("RETRAIT_DEPOT");
  assert(pickup.status === 201, "retrait créé");
  assert(pickup.json.status === "EN_ATTENTE", "retrait EN_ATTENTE");
  assert(!(pickup.json.statusHistory || []).some((item) => item.status === "EN_VERIFICATION"), "retrait sans EN_VERIFICATION");
  assert((await patchStatus(pickup.json.id, "EN_VERIFICATION")).status === 400, "retrait refuse EN_VERIFICATION");
  results.push("TEST 1 — retrait sans checklist / sans EN_VERIFICATION");

  const delivery = await createOrder("LIVRAISON");
  assert(delivery.status === 201, "livraison créée");
  assert(delivery.json.deliveryMode === "LIVRAISON", "mode livraison");
  assert(delivery.json.deliveryFee == null, "frais à confirmer");
  assert(!(delivery.json.statusHistory || []).some((item) => item.status === "EN_VERIFICATION"), "livraison sans EN_VERIFICATION");
  results.push("TEST 2 — livraison sans checklist");

  const fee = await api("PATCH", `/materials/orders/${delivery.json.id}/delivery-fee`, {
    deliveryFee: 50000,
    changedBy: "admin",
  });
  assert(fee.status === 200 && fee.json.deliveryFee === 50000, "frais");
  assert(fee.json.totalAmount === fee.json.subtotal + 50000, "total = subtotal + fee");
  results.push("TEST 6/7 — frais et total inchangés");

  const persisted = await api("GET", `/materials/orders/${delivery.json.id}`);
  assert(persisted.json.deliveryFee === 50000, "frais persistés");
  assert(persisted.json.totalAmount === persisted.json.subtotal + 50000, "total persisté");
  results.push("TEST 8 — relecture admin persistante");

  const guest = await createOrder("LIVRAISON", {
    customer: customer("Invité workflow", "+224 620 99 88 77"),
  });
  assert(!guest.json.userId, "invité");
  const guestFee = await api("PATCH", `/materials/orders/${guest.json.id}/delivery-fee`, {
    deliveryFee: 25000,
    changedBy: "admin",
  });
  assert(guestFee.status === 200, "frais invité");
  const guestReady = await advanceToReady(guest.json);
  assert(guestReady.deliveryMode === "LIVRAISON", "invité reste livraison");
  const ship = await patchStatus(guest.json.id, "EN_LIVRAISON");
  assert(ship.status === 200, "invité en livraison");
  const delivered = await patchStatus(guest.json.id, "LIVREE");
  assert(delivered.status === 200 && delivered.json.status === "LIVREE", "invité livré");
  results.push("TEST 9 — commande invitée administrable");

  const pickupReady = await advanceToReady(pickup.json);
  assert((await patchStatus(pickup.json.id, "EN_LIVRAISON")).status === 400, "retrait refuse EN_LIVRAISON");
  const retired = await patchStatus(pickup.json.id, "RETIRE_DEPOT");
  assert(retired.status === 200 && retired.json.status === "RETIRE_DEPOT", "retrait confirmé");
  assert(retired.json.deliveryFee === 0, "retrait fee 0");
  results.push("TEST 4 — retrait sans action livraison");

  const deliveryReady = await advanceToReady(delivery.json);
  assert((await patchStatus(delivery.json.id, "RETIRE_DEPOT")).status === 400, "livraison refuse RETIRE_DEPOT");
  assert((await patchStatus(delivery.json.id, "EN_LIVRAISON")).status === 200, "livraison EN_LIVRAISON");
  assert((await patchStatus(delivery.json.id, "LIVREE")).status === 200, "livraison LIVREE");
  results.push("TEST 3 — parcours livraison");

  results.push("TEST 10 — aucune nouvelle commande n’entre en EN_VERIFICATION");
  console.log(results.map((line) => `OK  ${line}`).join("\n"));
}

main().then(() => process.exit(0)).catch((error) => {
  console.error("FAIL", error.message);
  process.exit(1);
});
