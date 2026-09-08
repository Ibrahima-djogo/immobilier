/**
 * Tests étape 3 — workflow sans vérification + gestion livraison.
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
    address: "Cité test, villa 3",
    comment: "Appeler avant livraison",
  };
}

async function createOrder(deliveryMode, extra = {}, headers = {}) {
  return api(
    "POST",
    "/materials/orders",
    {
      customer: customer(`Client ${deliveryMode}`),
      deliveryMode,
      items: [{ productId: "mp-ciment-42-5", quantity: 2 }],
      ...extra,
    },
    headers,
  );
}

async function main() {
  const results = [];
  assert((await api("GET", "/health")).status === 200, "API indisponible");

  const pickup = await createOrder("RETRAIT_DEPOT");
  assert(pickup.status === 201, `retrait ${pickup.status}`);
  assert(pickup.json.status === "EN_ATTENTE", "retrait EN_ATTENTE");
  assert(pickup.json.deliveryFee === 0, "retrait fee");
  assert(pickup.json.totalAmount === pickup.json.subtotal, "retrait total");
  assert(
    !(pickup.json.statusHistory || []).some((item) => item.status === "EN_VERIFICATION"),
    "retrait historique EN_VERIFICATION",
  );
  assert(
    (await api("PATCH", `/materials/orders/${pickup.json.id}/status`, {
      status: "EN_VERIFICATION",
    })).status === 400,
    "retrait ne passe pas en EN_VERIFICATION",
  );
  results.push("TEST 1 — nouvelle commande retrait sans checklist");

  const delivery = await createOrder("LIVRAISON");
  assert(delivery.status === 201, `livraison ${delivery.status}`);
  assert(delivery.json.deliveryMode === "LIVRAISON", "mode livraison");
  assert(delivery.json.deliveryFee == null, "frais à confirmer");
  assert(
    !(delivery.json.statusHistory || []).some((item) => item.status === "EN_VERIFICATION"),
    "livraison historique EN_VERIFICATION",
  );
  assert(
    (await api("PATCH", `/materials/orders/${delivery.json.id}/status`, {
      status: "EN_VERIFICATION",
    })).status === 400,
    "livraison ne passe pas en EN_VERIFICATION",
  );
  results.push("TEST 2 / 10 — nouvelle commande livraison sans EN_VERIFICATION");

  const adminDelivery = await api("GET", `/materials/orders/${delivery.json.id}`);
  assert(adminDelivery.json.customer.city === "Conakry", "bloc livraison ville");
  assert(adminDelivery.json.customer.district === "Hamdallaye", "bloc livraison quartier");
  assert(adminDelivery.json.customer.phone, "bloc livraison téléphone");
  results.push("TEST 3 — commande livraison lisible admin");

  const adminPickup = await api("GET", `/materials/orders/${pickup.json.id}`);
  assert(adminPickup.json.deliveryMode === "RETRAIT_DEPOT", "retrait mode");
  assert(adminPickup.json.deliveryFee === 0, "retrait 0 GNF");
  assert(
    (await api("PATCH", `/materials/orders/${pickup.json.id}/status`, {
      status: "EN_LIVRAISON",
    })).status === 400,
    "retrait ne peut pas passer en livraison",
  );
  results.push("TEST 4 — retrait sans action livraison");

  const historical = await createOrder("LIVRAISON", {
    customer: customer("Ancien dossier", "+224 620 44 55 66"),
  });
  const note = await api("PATCH", `/materials/orders/${historical.json.id}/verification`, {
    notes: "Ancienne vérification conservée",
    changedBy: "admin",
  });
  assert(note.status === 200, "note historique");
  const historyRead = await api("GET", `/materials/orders/${historical.json.id}`);
  assert(
    (historyRead.json.verificationHistory || []).some((item) => item.action === "MAJ_CHECKLIST"),
    "verificationHistory lisible",
  );
  assert(historyRead.json.verification.notes === "Ancienne vérification conservée", "notes");
  results.push("TEST 5 — ancienne verificationHistory lisible");

  const fee = await api("PATCH", `/materials/orders/${delivery.json.id}/delivery-fee`, {
    deliveryFee: 50000,
    changedBy: "admin",
    totalAmount: 1,
  });
  assert(fee.status === 200, `frais ${fee.status}`);
  assert(fee.json.deliveryFee === 50000, "frais 50000");
  assert(fee.json.subtotal === 200000, "sous-total inchangé");
  assert(fee.json.totalAmount === 250000, "total = subtotal + fee");
  assert(fee.json.status === "EN_ATTENTE", "statut inchangé par les frais");
  results.push("TEST 6 / 7 — frais et total serveur inchangés");

  const persisted = await api("GET", `/materials/orders/${delivery.json.id}`);
  assert(persisted.json.deliveryFee === 50000, "frais persistés");
  assert(persisted.json.totalAmount === 250000, "total persisté");
  results.push("TEST 8 — rechargement admin persisté");

  const guest = await createOrder("LIVRAISON", {
    customer: customer("Invité workflow", "+224 620 77 88 99"),
  });
  assert(!guest.json.userId, "invité sans compte");
  const guestFee = await api("PATCH", `/materials/orders/${guest.json.id}/delivery-fee`, {
    deliveryFee: 25000,
    changedBy: "admin",
  });
  assert(guestFee.status === 200 && guestFee.json.totalAmount === 225000, "invité frais");
  const guestWait = await api("PATCH", `/materials/orders/${guest.json.id}/status`, {
    status: "PAIEMENT_EN_ATTENTE",
    changedBy: "admin",
  });
  assert(guestWait.status === 200, "invité administrable");
  const lookup = await api("POST", "/materials/orders/lookup", {
    reference: guest.json.reference,
    phone: "+224620778899",
  });
  assert(lookup.json.deliveryFee === 25000, "suivi invité");
  results.push("TEST 9 — commande invitée administrable");

  await api("POST", `/materials/orders/${pickup.json.id}/cancel`);
  await api("POST", `/materials/orders/${delivery.json.id}/cancel`);
  await api("POST", `/materials/orders/${historical.json.id}/cancel`);
  await api("POST", `/materials/orders/${guest.json.id}/cancel`);

  console.log(results.map((line) => `OK  ${line}`).join("\n"));
}

main().then(() => process.exit(0)).catch((error) => {
  console.error("FAIL", error.message);
  process.exit(1);
});
