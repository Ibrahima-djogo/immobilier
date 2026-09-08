/**
 * Tests — demande de paiement + choix client (retrait / magasin).
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

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

function customer(name, phone) {
  return {
    name,
    phone,
    email: `${name.toLowerCase().replace(/\s+/g, ".")}-${STAMP}@demeureguinee.test`,
    city: "Conakry",
    district: "Kipé",
    address: "Cité Minière, villa paiement demandé",
  };
}

async function registerUser(label) {
  const signup = await api("POST", "/auth/register", {
    firstName: label,
    lastName: "Paiement",
    email: `payreq-${label.toLowerCase()}-${STAMP}@demeureguinee.test`,
    phone: "+224 620 10 20 30",
    password: "Demo1234!",
  });
  assert(
    signup.status === 201,
    `register ${label} → ${signup.status} ${JSON.stringify(signup.json)}`,
  );
  return signup.json;
}

async function createOrder(deliveryMode, extra = {}, headers = {}) {
  return api(
    "POST",
    "/materials/orders",
    {
      customer: extra.customer || customer(`Client ${deliveryMode}`, "+224 620 11 22 33"),
      deliveryMode,
      items: [{ productId: "mp-ciment-42-5", quantity: 1 }],
      ...extra,
    },
    headers,
  );
}

async function requestPayment(id) {
  const waiting = await api("PATCH", `/materials/orders/${id}/status`, {
    status: "PAIEMENT_EN_ATTENTE",
    changedBy: "admin",
  });
  assert(
    waiting.status === 200 && waiting.json.status === "PAIEMENT_EN_ATTENTE",
    `demande paiement ${waiting.status} ${JSON.stringify(waiting.json)}`,
  );
  return waiting.json;
}

function historyActions(order) {
  return (order.verificationHistory || []).map((entry) => entry.action);
}

async function main() {
  const results = [];
  assert((await api("GET", "/health")).status === 200, "API indisponible");

  const accountA = await registerUser("Alpha");
  const accountB = await registerUser("Beta");
  const userA = accountA.user;
  const userB = accountB.user;
  const tokenA = accountA.token || userA.id;
  const tokenB = accountB.token || userB.id;

  const createdA = await createOrder(
    "RETRAIT_DEPOT",
    { customer: customer("Client Alpha", "+224 620 11 22 33") },
    auth(tokenA),
  );
  assert(createdA.status === 201, `commande A ${createdA.status}`);
  assert(createdA.json.userId === userA.id, "commande A liée au compte");
  assert(createdA.json.deliveryMode === "RETRAIT_DEPOT", "retrait A");

  const pendingA = await requestPayment(createdA.json.id);
  assert(pendingA.paymentRequested === true, "TEST 1 paymentRequested");
  assert(pendingA.status === "PAIEMENT_EN_ATTENTE", "TEST 1 statut conservé");
  assert(pendingA.paymentIntent == null, "TEST 1 aucun choix encore");
  assert(historyActions(pendingA).includes("PAIEMENT_DEMANDE"), "TEST 1 historique");

  const inboxA = await api("GET", "/notifications/my", null, auth(tokenA));
  assert(inboxA.status === 200, "inbox A");
  const requestNotif = (inboxA.json || []).find(
    (item) =>
      item.type === "MATERIAL_PAYMENT_REQUESTED" && item.orderId === pendingA.id,
  );
  assert(requestNotif, "TEST 1 notification client absente");
  assert(requestNotif.title.includes("Paiement demandé"), "TEST 1 titre");
  assert(requestNotif.orderReference === pendingA.reference, "TEST 1 référence");
  assert(
    requestNotif.href === `/mes-commandes/${pendingA.id}`,
    `TEST 2 href ${requestNotif.href}`,
  );
  results.push("TEST 1 / 2 — demande de paiement + lien commande");

  const online = await api(
    "POST",
    `/materials/orders/${pendingA.id}/payment-intent`,
    { intent: "PAY_ONLINE" },
    auth(tokenA),
  );
  assert(online.status === 200, `PAY_ONLINE ${online.status}`);
  assert(online.json.paymentIntent === "PAY_ONLINE", "choix en ligne");
  assert(online.json.status === "PAIEMENT_EN_ATTENTE", "TEST 3 statut inchangé");
  assert(online.json.payment?.status !== "PAID", "TEST 3 pas PAYEE");
  results.push("TEST 3 — Payer maintenant n’est pas un paiement");

  const store = await api(
    "POST",
    `/materials/orders/${pendingA.id}/payment-intent`,
    { intent: "PAY_AT_STORE" },
    auth(tokenB),
  );
  assert(store.status === 403, "TEST 9 B ne choisit pas pour A");

  const storeA = await api(
    "POST",
    `/materials/orders/${pendingA.id}/payment-intent`,
    { intent: "PAY_AT_STORE" },
    auth(tokenA),
  );
  assert(storeA.status === 200, `PAY_AT_STORE ${storeA.status}`);
  assert(storeA.json.paymentIntent === "PAY_AT_STORE", "choix magasin");
  assert(storeA.json.status === "PAIEMENT_EN_ATTENTE", "TEST 4 / 8 statut");
  assert(storeA.json.payment?.status !== "PAID", "TEST 8 pas PAYEE");
  assert(historyActions(storeA.json).includes("PAIEMENT_MODE_CHOISI"), "historique choix");
  results.push("TEST 4 / 8 — Payer au magasin ≠ PAYEE");

  const adminInbox = await api("GET", "/admin/notifications");
  assert(adminInbox.status === 200, "inbox admin");
  const adminNotif = (adminInbox.json || []).find(
    (item) =>
      item.type === "MATERIAL_PAYMENT_INTENT_CHOSEN" &&
      item.orderId === pendingA.id &&
      item.paymentIntent === "PAY_AT_STORE",
  );
  assert(adminNotif, "TEST 5 notification admin absente");
  assert(adminNotif.title.includes(pendingA.reference), "TEST 5 référence dans le titre");
  assert(adminNotif.title.toLowerCase().includes("magasin"), "TEST 5 magasin");
  assert(
    adminNotif.href === `/materiaux/commandes/${pendingA.id}`,
    `TEST 6 href ${adminNotif.href}`,
  );
  results.push("TEST 5 / 6 — notification admin liée à la commande");

  const selfConfirm = await api(
    "POST",
    `/materials/orders/${pendingA.id}/payments/confirm-store`,
    { changedBy: "client" },
    auth(tokenA),
  );
  assert(selfConfirm.status === 403, "client ne confirme pas le magasin");

  const confirmed = await api(
    "POST",
    `/materials/orders/${pendingA.id}/payments/confirm-store`,
    { changedBy: "admin" },
  );
  assert(confirmed.status === 200, `confirm-store ${confirmed.status}`);
  assert(confirmed.json.status === "PAYEE", "TEST 7 PAYEE");
  assert(confirmed.json.payment?.status === "PAID", "TEST 7 paiement PAID");
  assert(confirmed.json.payment?.channel === "STORE", "TEST 7 canal magasin");
  assert(historyActions(confirmed.json).includes("PAIEMENT_CONFIRME"), "TEST 7 historique");
  results.push("TEST 7 — confirmation admin → PAYEE");

  const inboxB = await api("GET", "/notifications/my", null, auth(tokenB));
  assert(inboxB.status === 200, "inbox B");
  const leak = (inboxB.json || []).some((item) => item.orderId === pendingA.id);
  assert(!leak, "TEST 9 B voit la commande de A");
  const steal = await api(
    "PATCH",
    `/notifications/${requestNotif.id}/read`,
    null,
    auth(tokenB),
  );
  assert(steal.status === 404, "TEST 9 B ne lit pas la notif de A");
  const anonInbox = await api("GET", "/notifications/my");
  assert(anonInbox.status === 401, "inbox sans session");
  results.push("TEST 9 — isolation A / B");

  const guestCreated = await createOrder("RETRAIT_DEPOT", {
    customer: customer("Invité Magasin", "+224 620 44 55 66"),
    userId: userA.id,
  });
  assert(guestCreated.status === 201, "commande invitée");
  assert(!guestCreated.json.userId, "invité sans compte");
  const guestPending = await requestPayment(guestCreated.json.id);
  assert(guestPending.paymentRequested === true, "invité paymentRequested");
  const guestInbox = await api("GET", "/notifications/my", null, auth(tokenA));
  const guestLeak = (guestInbox.json || []).some(
    (item) => item.orderId === guestPending.id,
  );
  assert(!guestLeak, "pas de notif compte pour un invité");
  const guestNoToken = await api(
    "POST",
    `/materials/orders/${guestPending.id}/payment-intent`,
    { intent: "PAY_AT_STORE" },
  );
  assert(guestNoToken.status === 403, "invité sans jeton refusé");
  const guestChoice = await api(
    "POST",
    `/materials/orders/${guestPending.id}/payment-intent`,
    { intent: "PAY_AT_STORE", accessToken: guestCreated.json.accessToken },
  );
  assert(guestChoice.status === 200, "invité choisit magasin");
  assert(guestChoice.json.status === "PAIEMENT_EN_ATTENTE", "invité reste en attente");
  const guestConfirmSelf = await api(
    "POST",
    `/materials/orders/${guestPending.id}/payments/confirm-store`,
    { accessToken: guestCreated.json.accessToken },
  );
  assert(guestConfirmSelf.status === 403, "invité ne confirme pas");
  const lookup = await api("POST", "/materials/orders/lookup", {
    reference: guestPending.reference,
    phone: "+224 620 44 55 66",
  });
  assert(lookup.status === 200, "suivi invité");
  assert(lookup.json.paymentRequested === true, "suivi : paiement demandé");
  assert(lookup.json.paymentIntent === "PAY_AT_STORE", "suivi : choix magasin");
  assert(lookup.json.status === "PAIEMENT_EN_ATTENTE", "suivi : pas PAYEE");
  results.push("TEST 10 — commande invitée + suivi");

  const delivery = await createOrder(
    "LIVRAISON",
    { customer: customer("Client Livraison", "+224 620 77 88 99") },
    auth(tokenA),
  );
  assert(delivery.status === 201, "commande livraison");
  const deliveryPending = await requestPayment(delivery.json.id);
  const deliveryStore = await api(
    "POST",
    `/materials/orders/${deliveryPending.id}/payment-intent`,
    { intent: "PAY_AT_STORE" },
    auth(tokenA),
  );
  assert(
    deliveryStore.status === 400 && deliveryStore.json.code === "INVALID_PAYMENT_INTENT",
    "TEST 11 paiement magasin refusé en livraison",
  );
  assert(deliveryPending.status === "PAIEMENT_EN_ATTENTE", "livraison toujours en attente");
  results.push("TEST 11 — LIVRAISON sans payer au magasin");

  const catalog = await api("GET", "/materials/catalog");
  const properties = await api("GET", "/properties");
  assert(catalog.status === 200 && properties.status === 200, "non-régression");

  console.log(results.map((line) => `OK  ${line}`).join("\n"));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("FAIL", error.message);
    process.exit(1);
  });
