/**
 * Phase 1 — fournisseurs, stock, multi-fournisseurs, devis B2B.
 * Prérequis : API démarrée (DEMO_API_URL, défaut http://localhost:4000)
 */
const fs = require("fs");
const path = require("path");
const { confirmAgentPaid } = require("./material-order-helpers");

const BASE = process.env.DEMO_API_URL || "http://localhost:4000";
const DB_PATH = path.join(__dirname, "..", "data", "db.json");
const STAMP = Date.now();

function readDb() {
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
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

function authHeaders(userId) {
  return { Authorization: `Bearer ${userId}` };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function stockOf(db, productId) {
  const stock = (db.materialStocks || []).find((item) => item.productId === productId);
  return {
    quantity: Number(stock.quantity || 0),
    reservedQuantity: Number(stock.reservedQuantity || 0),
    soldQuantity: Number(stock.soldQuantity || 0),
    availableQuantity: Math.max(
      0,
      Number(stock.quantity || 0) - Number(stock.reservedQuantity || 0),
    ),
    minimumQuantity: Number(stock.minimumQuantity || 0),
  };
}

function customer(name = "Phase 1") {
  return {
    name,
    phone: "+224 620 33 22 11",
    email: `phase1-${STAMP}@demeureguinee.test`,
    city: "Conakry",
    district: "Kipé",
    address: "Cité test, villa 9",
    comment: "Test Phase 1",
  };
}

async function restock(productId, quantity, reason = "Réapprovisionnement test Phase 1") {
  const result = await api("POST", "/materials/movements", {
    productId,
    type: "ENTREE",
    quantity,
    reason,
    createdBy: "phase1-test",
  });
  assert(result.status === 201, `restock ${productId} → ${result.status} ${JSON.stringify(result.json)}`);
  return result.json;
}

async function registerUser(label) {
  const signup = await api("POST", "/auth/register", {
    firstName: label,
    lastName: "Phase1",
    email: `p1-${label.toLowerCase()}-${STAMP}@demeureguinee.test`,
    phone: "+224 620 10 20 30",
    password: "Motdepasse1",
  });
  assert(signup.status === 201, `register ${label} → ${signup.status}`);
  return signup.json;
}

async function patchStatus(id, status) {
  return api("PATCH", `/materials/orders/${id}/status`, { status, changedBy: "admin" });
}

async function patchMode(id, deliveryMode) {
  return api("PATCH", `/materials/orders/${id}/delivery-mode`, { deliveryMode });
}

async function reachReady(items, extras = {}) {
  const created = await api("POST", "/materials/orders", {
    customer: customer("Remise Phase 1"),
    items,
    ...extras,
  });
  assert(created.status === 201, `create ${created.status} ${JSON.stringify(created.json)}`);
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

  const particulier = await api("POST", "/materials/suppliers", {
    type: "PARTICULIER",
    name: `Particulier Phase1 ${STAMP}`,
    phone: "+224 622 00 11 22",
    city: "Coyah",
    district: "Centre",
    address: "Quartier Centre",
  });
  assert(particulier.status === 201, "1. création particulier");
  assert(particulier.json.type === "PARTICULIER", "1. type particulier");
  assert(particulier.json.verificationStatus === "NON_VERIFIE", "1. non vérifié à la création");
  assert(particulier.json.district === "Centre", "1. quartier");

  const professionnel = await api("POST", "/materials/suppliers", {
    type: "PROFESSIONNEL",
    name: `Société Phase1 ${STAMP}`,
    phone: "+224 622 33 44 55",
    email: `soc-${STAMP}@example.com`,
    city: "Conakry",
    district: "Dixinn",
  });
  assert(professionnel.status === 201 && professionnel.json.type === "PROFESSIONNEL", "2. professionnel");

  const product = await api("POST", "/materials/products", {
    name: `Ciment test ${STAMP}`,
    categoryId: "mc-ciment-et-liants",
    unit: "SAC",
    supplierId: professionnel.json.id,
    price: 90000,
    status: "ACTIF",
  });
  assert(product.status === 201, `3. produit ${product.status} ${JSON.stringify(product.json)}`);
  assert(product.json.supplierId === professionnel.json.id, "3. association fournisseur → produit");

  const verify = await api("PATCH", `/materials/suppliers/${professionnel.json.id}`, {
    verificationStatus: "VERIFIE",
    changedBy: "admin",
  });
  assert(verify.status === 200 && verify.json.verificationStatus === "VERIFIE", "4. fournisseur vérifié");
  assert(
    (verify.json.history || []).some((item) => item.action === "VERIFICATION"),
    "4. historique vérification",
  );
  const catalog = await api("GET", "/materials/catalog");
  const catalogProduct = (catalog.json.materials || []).find((item) => item.id === product.json.id);
  assert(!catalogProduct || !catalogProduct.certified, "4. pas de produit certifié");
  assert(
    !JSON.stringify(catalogProduct || {}).includes("Produit certifié"),
    "4. libellé produit certifié absent",
  );

  const stocks = await api("GET", "/materials/stocks");
  const ciment = (stocks.json || []).find((item) => item.productId === "mp-ciment-42-5");
  assert(ciment, "5. stock ciment");
  assert(Number.isFinite(ciment.availableQuantity), "5. stock disponible");
  assert(Number.isFinite(ciment.reservedQuantity), "6. stock réservé");
  assert(Number.isFinite(ciment.soldQuantity), "7. stock vendu");
  assert(Number.isFinite(ciment.minimumQuantity), "8. stock minimum");

  const beforeOver = stockOf(readDb(), "mp-ciment-42-5");
  const over = await api("POST", "/materials/orders", {
    customer: customer("Stock overflow"),
    items: [{ productId: "mp-ciment-42-5", quantity: beforeOver.availableQuantity + 50 }],
  });
  assert(over.status === 409 && over.json.code === "INSUFFICIENT_STOCK", "9. commande au-delà du stock");
  assert(stockOf(readDb(), "mp-ciment-42-5").availableQuantity === beforeOver.availableQuantity, "9. stock inchangé");

  const reservedBefore = stockOf(readDb(), "mp-ciment-42-5");
  const reservedOrder = await api("POST", "/materials/orders", {
    customer: customer("Réservation"),
    items: [{ productId: "mp-ciment-42-5", quantity: 2 }],
  });
  assert(reservedOrder.status === 201, "10. commande créée");
  const reservedAfter = stockOf(readDb(), "mp-ciment-42-5");
  assert(reservedAfter.reservedQuantity === reservedBefore.reservedQuantity + 2, "10. stock réservé");
  assert(reservedAfter.availableQuantity === reservedBefore.availableQuantity - 2, "10. disponible diminué");
  assert(
    (readDb().materialStockMovements || []).some(
      (item) => item.orderId === reservedOrder.json.id && item.type === "RESERVATION",
    ),
    "12. mouvement réservation",
  );

  const cancelled = await api("POST", `/materials/orders/${reservedOrder.json.id}/cancel`);
  assert(cancelled.status === 200, "11. annulation");
  const released = stockOf(readDb(), "mp-ciment-42-5");
  assert(released.reservedQuantity === reservedBefore.reservedQuantity, "11. libération du stock");
  assert(
    (readDb().materialStockMovements || []).some(
      (item) => item.orderId === reservedOrder.json.id && item.type === "LIBERATION",
    ),
    "11. mouvement libération",
  );

  await restock("mp-ciment-42-5", 20);
  await restock("mp-fer-a-beton-12-mm", 20);
  await restock("mp-peinture-interieure-20-l", 20);

  const mono = await api("POST", "/materials/orders", {
    customer: customer("Mono"),
    items: [
      { productId: "mp-ciment-42-5", quantity: 1 },
      { productId: "mp-fer-a-beton-12-mm", quantity: 1 },
    ],
  });
  assert(mono.status === 201, "13. panier mono-fournisseur");
  assert(mono.json.supplierId === "ms-societe-materiaux-conakry", "13. fournisseur unique");
  assert((mono.json.items || []).every((item) => item.supplierId === mono.json.supplierId), "13. lignes");

  const mixed = await api("POST", "/materials/orders", {
    customer: customer("Mixte interdit"),
    items: [
      { productId: "mp-ciment-42-5", quantity: 1 },
      { productId: "mp-peinture-interieure-20-l", quantity: 1 },
    ],
  });
  assert(mixed.status === 400 && mixed.json.code === "MIXED_SUPPLIERS", "14. mixte refusé sur POST simple");

  const checkout = await api("POST", "/materials/orders/checkout", {
    customer: customer("Multi"),
    deliveryMode: "LIVRAISON",
    items: [
      { productId: "mp-ciment-42-5", quantity: 1 },
      { productId: "mp-peinture-interieure-20-l", quantity: 1 },
    ],
  });
  assert(checkout.status === 201, `14. checkout ${checkout.status}`);
  assert((checkout.json.orders || []).length === 2, "15. deux commandes fournisseur");
  const suppliers = new Set((checkout.json.orders || []).map((item) => item.supplierId));
  assert(suppliers.size === 2, "15. séparation fournisseurs");
  assert(
    (checkout.json.orders || []).every((item) => item.checkoutGroupId === checkout.json.checkoutGroupId),
    "15. groupe commun",
  );
  assert(
    (checkout.json.orders || []).every((item) => item.deliveryMode === "LIVRAISON"),
    "16. livraison multi-fournisseurs",
  );
  assert(
    (checkout.json.orders || []).every((item) => item.deliveryFee == null),
    "16. frais à confirmer séparément",
  );
  const tampered = await api("POST", "/materials/orders/checkout", {
    customer: customer("Montants"),
    items: [{ productId: "mp-ciment-42-5", quantity: 1 }],
    totalAmount: 1,
    itemsPriced: [{ productId: "mp-ciment-42-5", quantity: 1, unitPrice: 1, subtotal: 1 }],
  });
  assert(tampered.status === 201, "22. commande créée malgré totaux client");
  assert(tampered.json.orders[0].totalAmount !== 1, "22. montant serveur");
  assert(tampered.json.orders[0].items[0].unitPrice !== 1, "22. prix serveur");

  const pickupCheckout = await api("POST", "/materials/orders/checkout", {
    customer: customer("Retrait"),
    deliveryMode: "RETRAIT_DEPOT",
    items: [
      { productId: "mp-ciment-42-5", quantity: 1 },
      { productId: "mp-peinture-interieure-20-l", quantity: 1 },
    ],
  });
  assert(
    (pickupCheckout.json.orders || []).every(
      (item) => item.deliveryMode === "RETRAIT_DEPOT" && item.deliveryFee === 0,
    ),
    "17. retrait fournisseur",
  );

  const accountA = await registerUser("Alpha");
  const accountB = await registerUser("Beta");
  const quote = await api(
    "POST",
    "/materials/quotes",
    {
      customer: { name: "Alpha Pro", city: "Conakry", company: "BTP Alpha" },
      items: [
        { productId: "mp-ciment-42-5", quantity: 80 },
        { productId: "mp-fer-a-beton-12-mm", quantity: 40 },
      ],
      comment: "Chantier Dixinn",
      totalAmount: 12,
    },
    authHeaders(accountA.user.id),
  );
  assert(quote.status === 201, `18. devis ${quote.status} ${JSON.stringify(quote.json)}`);
  assert(quote.json.reference.startsWith("DG-DEV-"), "18. référence unique");
  assert(quote.json.status === "DEMANDE", "18. statut DEMANDE");
  assert(!("totalAmount" in quote.json) || quote.json.totalAmount == null, "18. pas de total client");

  const guestQuote = await api("POST", "/materials/quotes", {
    items: [{ productId: "mp-ciment-42-5", quantity: 10 }],
  });
  assert(guestQuote.status === 401, "18. devis invité refusé");

  await api("PATCH", `/materials/quotes/${quote.json.id}/status`, { status: "EN_ETUDE" });
  const firstProposal = await api("POST", `/materials/quotes/${quote.json.id}/proposals`, {
    supplierId: "ms-societe-materiaux-conakry",
    items: [
      { productId: "mp-ciment-42-5", quantity: 80, unitPrice: 95000 },
      { productId: "mp-fer-a-beton-12-mm", quantity: 40, unitPrice: 43000 },
    ],
    deliveryFee: 150000,
    delayDays: 5,
    conditions: "Paiement à la commande",
    validUntil: "2026-12-31",
    totalAmount: 1,
  });
  assert(firstProposal.status === 201, `19. proposition 1 ${firstProposal.status}`);
  const secondProposal = await api("POST", `/materials/quotes/${quote.json.id}/proposals`, {
    supplierId: "ms-depot-kipe",
    items: [{ productId: "mp-ciment-42-5", quantity: 80, unitPrice: 98000 }],
    deliveryFee: 0,
  });
  assert(secondProposal.status === 201, "19. proposition 2");
  assert((secondProposal.json.proposals || []).length === 2, "19. plusieurs propositions");
  const acceptedAmount = secondProposal.json.proposals.find(
    (item) => item.supplierId === "ms-societe-materiaux-conakry",
  );
  assert(acceptedAmount.totalAmount === 80 * 95000 + 40 * 43000 + 150000, "22. total proposition serveur");
  assert(acceptedAmount.totalAmount !== 1, "22. total client ignoré");

  const foreign = await api(
    "GET",
    `/materials/quotes/${quote.json.id}`,
    null,
    authHeaders(accountB.user.id),
  );
  assert(foreign.status === 404, "21. isolation devis");

  const accept = await api(
    "POST",
    `/materials/quotes/${quote.json.id}/proposals/${acceptedAmount.id}/accept`,
    {},
    authHeaders(accountA.user.id),
  );
  assert(accept.status === 200 && accept.json.status === "ACCEPTEE", "20. acceptation");
  assert(
    accept.json.proposals.some((item) => item.status === "REFUSEE"),
    "20. autres propositions refusées",
  );

  const otherQuote = await api(
    "POST",
    "/materials/quotes",
    {
      items: [{ productId: "mp-peinture-interieure-20-l", quantity: 6 }],
    },
    authHeaders(accountB.user.id),
  );
  await api("PATCH", `/materials/quotes/${otherQuote.json.id}/status`, { status: "EN_ETUDE" });
  const refuseProposal = await api("POST", `/materials/quotes/${otherQuote.json.id}/proposals`, {
    supplierId: "ms-depot-kipe",
    items: [{ productId: "mp-peinture-interieure-20-l", quantity: 6, unitPrice: 340000 }],
    deliveryFee: 0,
  });
  const refuseId = refuseProposal.json.proposals[0].id;
  const refused = await api(
    "POST",
    `/materials/quotes/${otherQuote.json.id}/proposals/${refuseId}/refuse`,
    {},
    authHeaders(accountB.user.id),
  );
  assert(refused.status === 200 && refused.json.status === "REFUSEE", "20. refus");

  const mineA = await api("GET", "/materials/quotes/my", null, authHeaders(accountA.user.id));
  const mineB = await api("GET", "/materials/quotes/my", null, authHeaders(accountB.user.id));
  assert(mineA.json.every((item) => item.userId === accountA.user.id), "21. isolation liste A");
  assert(mineB.json.every((item) => item.userId === accountB.user.id), "21. isolation liste B");

  const stockInject = await api("POST", "/materials/orders", {
    customer: customer("Stock client"),
    items: [{ productId: "mp-ciment-42-5", quantity: 1, availableQuantity: 99999 }],
  });
  assert(stockInject.status === 201, "23. commande ignoré stock client");
  const afterInject = stockOf(readDb(), "mp-ciment-42-5");
  assert(afterInject.availableQuantity < 99999, "23. stock serveur");

  const guest = await api("POST", "/materials/orders", {
    customer: customer("Invité"),
    items: [{ productId: "mp-ciment-42-5", quantity: 1 }],
    userId: accountA.user.id,
  });
  assert(guest.status === 201, "25. commande invitée");
  assert(!guest.json.userId, "25. userId client ignoré");
  assert(guest.json.accessToken, "25. jeton invité");
  assert((await patchStatus(guest.json.id, "PAIEMENT_EN_ATTENTE")).status === 200, "24. passage paiement");

  const pay = await api("POST", `/materials/orders/${guest.json.id}/payments`, {
    channel: "AGENT_WHATSAPP",
    accessToken: guest.json.accessToken,
    amount: 1,
  });
  assert(pay.status === 200, `24. paiement ${pay.status} ${JSON.stringify(pay.json)}`);
  assert(pay.json.payment.amount === guest.json.totalAmount, "24. montant paiement serveur");
  const confirmed = await api("POST", `/materials/orders/${guest.json.id}/payments/confirm-agent`, {
    changedBy: "admin",
  });
  assert(confirmed.status === 200 && confirmed.json.status === "PAYEE", "24. paiement confirmé");

  const soldBefore = stockOf(readDb(), "mp-ciment-42-5");
  const ready = await reachReady([{ productId: "mp-ciment-42-5", quantity: 1 }]);
  await patchMode(ready.id, "LIVRAISON");
  assert((await patchStatus(ready.id, "EN_LIVRAISON")).status === 200, "16. en livraison");
  assert(stockOf(readDb(), "mp-ciment-42-5").soldQuantity === soldBefore.soldQuantity, "7. pas encore vendu");
  const delivered = await patchStatus(ready.id, "LIVREE");
  assert(delivered.status === 200, "7. livrée");
  const soldAfter = stockOf(readDb(), "mp-ciment-42-5");
  assert(soldAfter.soldQuantity === soldBefore.soldQuantity + 1, "7. stock vendu");
  assert(soldAfter.quantity === soldBefore.quantity - 1, "7. physique diminué");
  assert(
    (readDb().materialStockMovements || []).some(
      (item) => item.orderId === ready.id && item.type === "VENTE",
    ),
    "12. mouvement vente",
  );

  const pickupReady = await reachReady([{ productId: "mp-ciment-42-5", quantity: 1 }]);
  await patchMode(pickupReady.id, "RETRAIT_DEPOT");
  const retired = await patchStatus(pickupReady.id, "RETIRE_DEPOT");
  assert(retired.status === 200, "17. retrait finalisé");
  assert(
    (readDb().materialStockReservations || []).some(
      (item) => item.orderId === pickupReady.id && item.status === "CONSUMED",
    ),
    "17. réservation consommée",
  );

  const alerts = await api("GET", "/materials/stock-alerts");
  assert(alerts.status === 200, "8. alertes");
  assert(
    (alerts.json || []).every((item) => Number(item.minimumQuantity) > 0),
    "8. alerte seulement si seuil",
  );

  const properties = await api("GET", "/properties");
  assert(properties.status === 200, "non-régression immobilier");

  console.log("OK  1-4   fournisseurs (particulier, professionnel, association, vérifié)");
  console.log("OK  5-8   stock disponible / réservé / vendu / minimum");
  console.log("OK  9-12  commande, réservation, libération, mouvements");
  console.log("OK  13-17 multi-fournisseurs + livraison / retrait");
  console.log("OK  18-20 devis + propositions + acceptation / refus");
  console.log("OK  21-23 isolation + montants/stock serveur");
  console.log("OK  24-25 non-régression paiement + commande invitée");
}

main().catch((error) => {
  console.error("FAIL", error.message);
  process.exit(1);
});
