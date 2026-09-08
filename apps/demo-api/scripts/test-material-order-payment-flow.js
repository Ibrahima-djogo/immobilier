/**
 * Tests étape 4 — paiement commandes matériaux (sans identifiants Moneroo).
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

function customer(name, phone) {
  return {
    name,
    phone,
    email: `pay-${STAMP}@example.com`,
    city: "Conakry",
    district: "Kipé",
    address: "Cité paiement test, villa 4",
  };
}

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

async function createOrder(deliveryMode, extra = {}, headers = {}) {
  return api(
    "POST",
    "/materials/orders",
    {
      customer: extra.customer || customer(`Client ${deliveryMode}`, "+224 620 11 22 33"),
      deliveryMode,
      items: [{ productId: "mp-ciment-42-5", quantity: 2 }],
      ...extra,
    },
    headers,
  );
}

async function patchStatus(id, status) {
  return api("PATCH", `/materials/orders/${id}/status`, {
    status,
    changedBy: "admin",
  });
}

async function requestPay(order, headers = {}) {
  const waiting = await patchStatus(order.id, "PAIEMENT_EN_ATTENTE");
  assert(waiting.status === 200, `paiement attente ${waiting.status}`);
  return waiting.json;
}

async function main() {
  const results = [];
  assert((await api("GET", "/health")).status === 200, "API indisponible");

  const methods = await api("GET", "/materials/payments/methods");
  assert(methods.status === 200, "methods");
  assert(Array.isArray(methods.json.onlineMethods), "onlineMethods");
  if (!methods.json.onlineConfigured) {
    assert(
      methods.json.onlineMethods.length === 0,
      "aucun moyen en ligne inventé sans configuration",
    );
  }
  results.push("méthodes = configuration réelle");

  const pickup = await createOrder("RETRAIT_DEPOT");
  assert(pickup.status === 201, "create retrait");
  assert(pickup.json.deliveryFee === 0, "retrait fee 0");
  const tooSoon = await api("POST", `/materials/orders/${pickup.json.id}/payments`, {
    channel: "AGENT_WHATSAPP",
    accessToken: pickup.json.accessToken,
  });
  assert(tooSoon.status === 400 && tooSoon.json.code === "INVALID_ORDER_STATUS", "EN_ATTENTE non payable");
  const pickupPending = await requestPay(pickup.json);
  const pickupPay = await api("POST", `/materials/orders/${pickup.json.id}/payments`, {
    channel: "AGENT_WHATSAPP",
    accessToken: pickup.json.accessToken,
  });
  assert(pickupPay.status === 200, "TEST 1 retrait payable");
  assert(pickupPay.json.payment.amount === pickupPending.totalAmount, "montant serveur retrait");
  assert(pickupPay.json.status === "PAIEMENT_EN_ATTENTE", "agent ≠ PAYEE");
  assert(pickupPay.json.payment.status === "PENDING_AGENT", "TEST 11 agent en attente");
  results.push("TEST 1 / 11 — retrait payable + agent en attente");

  const delivery = await createOrder("LIVRAISON", {
    customer: customer("Livraison sans frais", "+224 620 22 33 44"),
  });
  assert(delivery.status === 201 && delivery.json.deliveryFee == null, "livraison fee null");
  await requestPay(delivery.json);
  const blocked = await api("POST", `/materials/orders/${delivery.json.id}/payments`, {
    channel: "AGENT_WHATSAPP",
    accessToken: delivery.json.accessToken,
    amount: 1,
    totalAmount: 1,
  });
  assert(blocked.status === 400 && blocked.json.code === "DELIVERY_FEE_PENDING", "TEST 2 bloqué");
  results.push("TEST 2 — livraison sans frais bloquée");

  const fee = await api("PATCH", `/materials/orders/${delivery.json.id}/delivery-fee`, {
    deliveryFee: 50000,
    changedBy: "admin",
  });
  assert(fee.status === 200, "frais définis");
  assert(fee.json.totalAmount === fee.json.subtotal + 50000, "total = subtotal + fee");
  const afterFee = await api("POST", `/materials/orders/${delivery.json.id}/payments`, {
    channel: "AGENT_WHATSAPP",
    accessToken: delivery.json.accessToken,
    totalAmount: 999999,
  });
  assert(afterFee.status === 200, "TEST 3 payable après frais");
  assert(afterFee.json.payment.amount === fee.json.totalAmount, "TEST 4 montant = total final");
  assert(afterFee.json.payment.amount !== 999999, "montant navigateur ignoré");
  results.push("TEST 3 / 4 — frais confirmés + montant serveur");

  const online = await api("POST", `/materials/orders/${delivery.json.id}/payments`, {
    channel: "ONLINE",
    accessToken: delivery.json.accessToken,
  });
  if (!methods.json.onlineConfigured) {
    assert(online.status === 503 && online.json.code === "PAYMENT_NOT_CONFIGURED", "online non configuré");
    assert(
      (await api("GET", `/materials/orders/${delivery.json.id}`)).json.status ===
        "PAIEMENT_EN_ATTENTE",
      "online 503 ne paye pas",
    );
    results.push("TEST 5 — paiement réel Moneroo impossible sans identifiants");
  } else {
    assert(online.status === 200 && online.json.checkoutUrl, "init Moneroo");
    results.push("TEST 5 — init Moneroo (confirmation réelle encore requise)");
  }

  const fakeWebhook = await api("POST", "/webhooks/moneroo", {
    event: "payment.success",
    data: { id: "pay_fake_success" },
  });
  assert(fakeWebhook.status === 403, "webhook non signé rejeté");
  assert(
    (await api("GET", `/materials/orders/${delivery.json.id}`)).json.status ===
      "PAIEMENT_EN_ATTENTE",
    "fake success ≠ PAYEE",
  );
  results.push("TEST 6 / 7 — échec/annulation : pas de PAYEE sans preuve");

  const confirmed = await api(
    "POST",
    `/materials/orders/${delivery.json.id}/payments/confirm-agent`,
    { changedBy: "admin" },
  );
  assert(confirmed.status === 200 && confirmed.json.status === "PAYEE", "TEST 12 admin confirme");
  assert(confirmed.json.payment.status === "PAID", "payment PAID");
  assert(
    (confirmed.json.verificationHistory || []).some((item) => item.action === "PAIEMENT_CONFIRME"),
    "historique PAIEMENT_CONFIRME",
  );
  const reload = await api("GET", `/materials/orders/${delivery.json.id}`);
  assert(reload.json.status === "PAYEE", "TEST 13 persistance");
  assert(reload.json.totalAmount === fee.json.totalAmount, "TEST 14 / 16 montant admin");
  assert(reload.json.payment.method === "AGENT_WHATSAPP", "TEST 16 méthode");
  assert(reload.json.payment.reference, "TEST 16 référence");
  results.push("TEST 12 / 13 / 14 / 16 — confirmation + persistance + admin");

  const twice = await api("POST", `/materials/orders/${delivery.json.id}/payments`, {
    channel: "AGENT_WHATSAPP",
    accessToken: delivery.json.accessToken,
  });
  assert(twice.status === 409 && twice.json.code === "ALREADY_PAID", "TEST 8 double paiement");
  assert((await patchStatus(delivery.json.id, "PAYEE")).status === 400, "PATCH PAYEE refusé");
  results.push("TEST 8 — double paiement refusé");

  const loginA = await api("POST", "/auth/login", {
    identifier: "user1@demo.demeureguinee.com",
    password: "Demo1234!",
  });
  const loginB = await api("POST", "/auth/login", {
    identifier: "user2@demo.demeureguinee.com",
    password: "Demo1234!",
  });
  assert(loginA.status === 200 && loginB.status === 200, "logins");
  const tokenA = loginA.json.token;
  const tokenB = loginB.json.token;
  const orderA = await createOrder(
    "RETRAIT_DEPOT",
    { customer: customer("Compte A", "+224 620 33 44 55") },
    auth(tokenA),
  );
  assert(orderA.status === 201 && orderA.json.userId === loginA.json.user.id, "commande A");
  await requestPay(orderA.json);
  const steal = await api(
    "POST",
    `/materials/orders/${orderA.json.id}/payments`,
    { channel: "AGENT_WHATSAPP", accessToken: orderA.json.accessToken },
    auth(tokenB),
  );
  assert(steal.status === 403, "TEST 9 A ne paie pas B");
  const own = await api(
    "POST",
    `/materials/orders/${orderA.json.id}/payments`,
    { channel: "AGENT_WHATSAPP" },
    auth(tokenA),
  );
  assert(own.status === 200, "compte A paie sa commande");
  results.push("TEST 9 — isolation comptes");

  const guest = await createOrder("RETRAIT_DEPOT", {
    customer: customer("Invité paiement", "+224 620 44 55 66"),
  });
  assert(!guest.json.userId, "invité");
  await requestPay(guest.json);
  const guestNoToken = await api("POST", `/materials/orders/${guest.json.id}/payments`, {
    channel: "AGENT_WHATSAPP",
  });
  assert(guestNoToken.status === 403, "invité sans jeton refusé");
  const guestPay = await api("POST", `/materials/orders/${guest.json.id}/payments`, {
    channel: "AGENT_WHATSAPP",
    accessToken: guest.json.accessToken,
  });
  assert(guestPay.status === 200, "TEST 10 invité peut payer");
  const lookup = await api("POST", "/materials/orders/lookup", {
    reference: guest.json.reference,
    phone: "+224 620 44 55 66",
  });
  assert(lookup.status === 200, "suivi invité");
  assert(lookup.json.totalAmount === guest.json.totalAmount, "TEST 15 montant invité");
  assert(lookup.json.status === "PAIEMENT_EN_ATTENTE", "TEST 15 statut invité");
  assert(lookup.json.payment.status === "PENDING_AGENT", "TEST 15 paiement invité");
  results.push("TEST 10 / 15 — invité + suivi");

  const catalog = await api("GET", "/materials/catalog");
  const properties = await api("GET", "/properties");
  assert(catalog.status === 200 && properties.status === 200, "non-régression");

  console.log(results.map((line) => `OK  ${line}`).join("\n"));
}

main().then(() => process.exit(0)).catch((error) => {
  console.error("FAIL", error.message);
  process.exit(1);
});
