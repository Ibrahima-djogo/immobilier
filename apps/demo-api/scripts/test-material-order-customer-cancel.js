/**
 * Tests — annulation client + commandes liées multi-fournisseurs.
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
    address: "Cité Minière, villa annulation",
  };
}

async function registerUser(label) {
  const signup = await api("POST", "/auth/register", {
    firstName: label,
    lastName: "Annulation",
    email: `cancel-${label.toLowerCase()}-${STAMP}@demeureguinee.test`,
    phone: "+224 620 10 20 30",
    password: "Demo1234!",
  });
  assert(signup.status === 201, `register ${label} → ${signup.status}`);
  return signup.json;
}

async function main() {
  const results = [];
  assert((await api("GET", "/health")).status === 200, "API indisponible");

  const accountA = await registerUser("Alpha");
  const accountB = await registerUser("Beta");
  const userA = accountA.user;
  const tokenA = accountA.token || userA.id;
  const tokenB = accountB.token || accountB.user.id;

  const checkout = await api(
    "POST",
    "/materials/orders/checkout",
    {
      customer: customer("Panier Multi", "+224 620 11 22 33"),
      deliveryMode: "RETRAIT_DEPOT",
      items: [
        { productId: "mp-ciment-42-5", quantity: 1 },
        { productId: "mp-peinture-interieure-20-l", quantity: 1 },
      ],
    },
    auth(tokenA),
  );
  assert(checkout.status === 201, `checkout ${checkout.status}`);
  assert((checkout.json.orders || []).length === 2, "deux commandes");
  const first = checkout.json.orders[0];
  const second = checkout.json.orders[1];
  const detail = await api(
    "GET",
    `/materials/orders/my/${first.id}`,
    null,
    auth(tokenA),
  );
  assert(detail.status === 200, "détail A");
  assert((detail.json.relatedOrders || []).length === 1, "commande liée");
  assert(detail.json.relatedOrders[0].id === second.id, "id lié");
  assert(detail.json.relatedOrders[0].supplierName, "fournisseur lié");
  assert(detail.json.relatedOrders[0].status, "statut lié");
  assert(
    typeof detail.json.relatedOrders[0].totalAmount === "number",
    "montant lié",
  );
  assert(!detail.json.relatedOrders[0].accessToken, "jeton lié masqué au compte");
  results.push("multi-fournisseurs : relatedOrders visibles");

  const steal = await api(
    "POST",
    `/materials/orders/${first.id}/customer-cancel`,
    {},
    auth(tokenB),
  );
  assert(steal.status === 403, "B n’annule pas A");
  const anon = await api("POST", `/materials/orders/${first.id}/customer-cancel`);
  assert(anon.status === 403, "annulation anonyme refusée");

  const cancelled = await api(
    "POST",
    `/materials/orders/${first.id}/customer-cancel`,
    {},
    auth(tokenA),
  );
  assert(cancelled.status === 200, `cancel A ${cancelled.status}`);
  assert(cancelled.json.status === "ANNULEE", "statut ANNULEE");
  assert(
    (cancelled.json.statusHistory || []).some((item) => item.status === "ANNULEE"),
    "historique statut",
  );
  assert(
    (cancelled.json.verificationHistory || []).some(
      (item) => item.action === "ANNULATION_CLIENT",
    ),
    "événement ANNULATION_CLIENT",
  );
  const adminInbox = await api("GET", "/admin/notifications");
  assert(
    (adminInbox.json || []).some(
      (item) =>
        item.type === "MATERIAL_ORDER_CANCELLED" && item.orderId === first.id,
    ),
    "notification admin",
  );
  const sibling = await api(
    "GET",
    `/materials/orders/my/${second.id}`,
    null,
    auth(tokenA),
  );
  assert(sibling.json.status !== "ANNULEE", "commande liée non annulée");
  results.push("annulation connectée + isolation + notif admin");

  const pending = await api(
    "POST",
    "/materials/orders",
    {
      customer: customer("Paiement Attente", "+224 620 33 44 55"),
      deliveryMode: "RETRAIT_DEPOT",
      items: [{ productId: "mp-ciment-42-5", quantity: 1 }],
    },
    auth(tokenA),
  );
  assert(pending.status === 201, "commande paiement");
  const waiting = await api("PATCH", `/materials/orders/${pending.json.id}/status`, {
    status: "PAIEMENT_EN_ATTENTE",
    changedBy: "admin",
  });
  assert(waiting.status === 200, "paiement demandé");
  const cancelWaiting = await api(
    "POST",
    `/materials/orders/${pending.json.id}/customer-cancel`,
    {},
    auth(tokenA),
  );
  assert(cancelWaiting.json.status === "ANNULEE", "annulation PAIEMENT_EN_ATTENTE");
  results.push("annulation PAIEMENT_EN_ATTENTE");

  const guest = await api("POST", "/materials/orders", {
    customer: customer("Invité Annule", "+224 620 66 77 88"),
    deliveryMode: "RETRAIT_DEPOT",
    items: [{ productId: "mp-ciment-42-5", quantity: 1 }],
  });
  assert(guest.status === 201 && guest.json.accessToken, "invité créé");
  const guestNoToken = await api(
    "POST",
    `/materials/orders/${guest.json.id}/customer-cancel`,
  );
  assert(guestNoToken.status === 403, "invité sans jeton");
  const guestOther = await api(
    "POST",
    `/materials/orders/${guest.json.id}/customer-cancel`,
    {},
    auth(tokenA),
  );
  assert(guestOther.status === 403, "compte A n’annule pas l’invité");
  const guestOk = await api("POST", `/materials/orders/${guest.json.id}/customer-cancel`, {
    accessToken: guest.json.accessToken,
  });
  assert(guestOk.status === 200 && guestOk.json.status === "ANNULEE", "invité annule");
  results.push("annulation invitée sécurisée");

  const paidSource = await api(
    "POST",
    "/materials/orders",
    {
      customer: customer("Déjà payée", "+224 620 99 00 11"),
      deliveryMode: "RETRAIT_DEPOT",
      items: [{ productId: "mp-ciment-42-5", quantity: 1 }],
    },
    auth(tokenA),
  );
  await api("PATCH", `/materials/orders/${paidSource.json.id}/status`, {
    status: "PAIEMENT_EN_ATTENTE",
    changedBy: "admin",
  });
  const agent = await api(
    "POST",
    `/materials/orders/${paidSource.json.id}/payments`,
    { channel: "AGENT_WHATSAPP" },
    auth(tokenA),
  );
  assert(agent.status === 200, "agent initié");
  const paid = await api("POST", `/materials/orders/${paidSource.json.id}/payments/confirm-agent`, {
    changedBy: "admin",
  });
  assert(paid.json.status === "PAYEE", "PAYEE");
  const cancelPaid = await api(
    "POST",
    `/materials/orders/${paidSource.json.id}/customer-cancel`,
    {},
    auth(tokenA),
  );
  assert(cancelPaid.status === 400, "PAYEE non annulable");
  const prep = await api("PATCH", `/materials/orders/${paidSource.json.id}/status`, {
    status: "EN_PREPARATION",
    changedBy: "admin",
  });
  assert(prep.status === 200, "préparation");
  const cancelPrep = await api(
    "POST",
    `/materials/orders/${paidSource.json.id}/customer-cancel`,
    {},
    auth(tokenA),
  );
  assert(cancelPrep.status === 400, "EN_PREPARATION non annulable");
  results.push("annulation interdite après PAYEE / préparation");

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
