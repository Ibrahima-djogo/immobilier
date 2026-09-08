/**
 * Tests 8A — compte utilisateur standard + liaison commandes matériaux.
 * Prérequis : API démarrée (DEMO_API_URL, défaut http://localhost:4000)
 */
const fs = require("fs");
const path = require("path");
const { confirmAgentPaid } = require("./material-order-helpers");

const BASE = process.env.DEMO_API_URL || "http://localhost:4000";
const DB_PATH = path.join(__dirname, "..", "data", "db.json");
const STAMP = Date.now();

const PROFESSIONAL_ROLES = new Set([
  "PROPRIETAIRE",
  "AGENCE",
  "AGENT_IMMOBILIER",
  "ADMIN",
  "SUPER_ADMIN",
]);

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

function isStandardUser(user) {
  return (
    user &&
    user.id &&
    user.name &&
    user.email &&
    !PROFESSIONAL_ROLES.has(user.role) &&
    user.roleVerified !== true
  );
}

function customerFor(name, email) {
  return {
    name,
    phone: "+224 620 88 77 66",
    email,
    city: "Conakry",
    district: "Kipé",
    address: "Cité Minière, villa 8A",
    comment: "Test 8A",
  };
}

async function registerUser(label) {
  const signup = await api("POST", "/auth/register", {
    firstName: label,
    lastName: "Standard",
    email: `8a-${label.toLowerCase()}-${STAMP}@demeureguinee.test`,
    phone: "+224 620 10 20 30",
    password: "Demo1234!",
  });
  assert(signup.status === 201, `register ${label} → ${signup.status} ${JSON.stringify(signup.json)}`);
  return signup.json;
}

async function postOrder(customer, headers = {}, extraBody = {}) {
  return api(
    "POST",
    "/materials/orders",
    {
      customer,
      items: [{ productId: "mp-ciment-42-5", quantity: 1 }],
      ...extraBody,
    },
    headers,
  );
}

async function patchStatus(id, status) {
  return api("PATCH", `/materials/orders/${id}/status`, { status, changedBy: "admin" });
}

async function patchMode(id, deliveryMode) {
  return api("PATCH", `/materials/orders/${id}/delivery-mode`, { deliveryMode });
}

async function main() {
  const results = [];
  assert((await api("GET", "/health")).status === 200, "API indisponible");

  const catalogBefore = await api("GET", "/materials/catalog");
  assert(catalogBefore.status === 200, "catalogue");
  assert(Array.isArray(catalogBefore.json.materials), "materials manquant");
  const catalogCount = catalogBefore.json.materials.length;

  const accountA = await registerUser("Alpha");
  const accountB = await registerUser("Beta");
  const userA = accountA.user;
  const userB = accountB.user;
  const tokenA = accountA.token || userA.id;
  const tokenB = accountB.token || userB.id;

  assert(isStandardUser(userA), `A n'est pas un compte standard: ${JSON.stringify(userA)}`);
  assert(isStandardUser(userB), `B n'est pas un compte standard: ${JSON.stringify(userB)}`);
  assert(userA.id !== userB.id, "A et B partagent le même id");
  const dbAfterSignup = readDb();
  const roleRequests = (dbAfterSignup.roleRequests || []).filter(
    (item) => item.userId === userA.id || item.userId === userB.id,
  );
  assert(roleRequests.length === 0, "roleRequest créée à l'inscription");
  results.push("1. Compte standard créé sans rôle professionnel");

  const customerA = customerFor("Alpha Commande", userA.email);
  const createdA = await postOrder(customerA, {
    ...authHeaders(tokenA),
    "X-Idempotency-Key": `8a-a-${STAMP}`,
  });
  assert(createdA.status === 201, `commande A → ${createdA.status} ${JSON.stringify(createdA.json)}`);
  assert(createdA.json.userId === userA.id, `userId A manquant: ${createdA.json.userId}`);
  assert(createdA.json.customer.name === customerA.name, "snapshot name");
  assert(
    createdA.json.customerSnapshot && createdA.json.customerSnapshot.name === customerA.name,
    "customerSnapshot",
  );
  results.push("2. Commande connectée conserve userId");

  const spoof = await postOrder(
    customerFor("Spoof", "spoof@example.com"),
    authHeaders(tokenA),
    { userId: userB.id },
  );
  assert(spoof.status === 201, `spoof → ${spoof.status}`);
  assert(spoof.json.userId === userA.id, `body.userId accepté: ${spoof.json.userId}`);
  results.push("POST ignore userId du corps");

  const guest = await postOrder(customerFor("Invité 8A", "invite-8a@example.com"));
  assert(guest.status === 201, `guest → ${guest.status}`);
  assert(!guest.json.userId, `invité a un userId: ${guest.json.userId}`);
  results.push("Invité : commande sans userId");

  const invalid = await postOrder(customerA, authHeaders("token-invalide-8a"));
  assert(invalid.status === 401, `token invalide → ${invalid.status}`);

  const snapshotBefore = {
    name: createdA.json.customer.name,
    phone: createdA.json.customer.phone,
    email: createdA.json.customer.email,
    city: createdA.json.customer.city,
    district: createdA.json.customer.district,
    address: createdA.json.customer.address,
  };
  const profile = await api(
    "PATCH",
    "/auth/me",
    {
      name: "Alpha Profil Modifié",
      firstName: "Alpha",
      lastName: "Modifié",
      email: `8a-alpha-updated-${STAMP}@demeureguinee.test`,
      phone: "+224 620 99 00 11",
    },
    authHeaders(tokenA),
  );
  assert(profile.status === 200, `profil → ${profile.status} ${JSON.stringify(profile.json)}`);
  assert(profile.json.user.name === "Alpha Profil Modifié", "profil name");
  assert(profile.json.user.email.includes("updated"), "profil email");

  const afterProfile = await api("GET", `/materials/orders/${createdA.json.id}`);
  assert(afterProfile.status === 200, "relecture commande");
  assert(afterProfile.json.userId === userA.id, "userId conservé après profil");
  assert(afterProfile.json.customer.name === snapshotBefore.name, "snapshot name modifié");
  assert(afterProfile.json.customer.email === snapshotBefore.email, "snapshot email modifié");
  assert(afterProfile.json.customer.phone === snapshotBefore.phone, "snapshot phone modifié");
  assert(afterProfile.json.customer.city === snapshotBefore.city, "snapshot ville");
  results.push("3. Snapshot client inchangé après modification du profil");

  const createdB = await postOrder(customerFor("Beta Commande", userB.email), authHeaders(tokenB));
  assert(createdB.status === 201 && createdB.json.userId === userB.id, "commande B");

  const mineA = await api("GET", "/materials/orders/my", null, authHeaders(tokenA));
  assert(mineA.status === 200 && Array.isArray(mineA.json), `my A → ${mineA.status}`);
  const idsA = mineA.json.map((item) => item.id);
  assert(idsA.includes(createdA.json.id), "A ne voit pas sa 1re commande");
  assert(idsA.includes(spoof.json.id), "A ne voit pas la commande spoof");
  assert(!idsA.includes(createdB.json.id), "A voit une commande de B");
  assert(!idsA.includes(guest.json.id), "A voit une commande invitée");
  assert(
    mineA.json.every((item) => item.userId === userA.id),
    "liste A contient un autre userId",
  );
  results.push("4. GET /materials/orders/my = uniquement les commandes de A");

  const mineB = await api("GET", "/materials/orders/my", null, authHeaders(tokenB));
  assert(mineB.status === 200, "my B");
  const idsB = mineB.json.map((item) => item.id);
  assert(idsB.includes(createdB.json.id), "B ne voit pas sa commande");
  assert(!idsB.includes(createdA.json.id), "B voit une commande de A");
  assert(mineB.json.every((item) => item.userId === userB.id), "liste B contaminée");
  results.push("5. Utilisateur A ne voit pas les commandes de B");

  const mineOne = await api(
    "GET",
    `/materials/orders/my/${createdA.json.id}`,
    null,
    authHeaders(tokenA),
  );
  assert(mineOne.status === 200 && mineOne.json.id === createdA.json.id, "my/:id A");
  assert(mineOne.json.userId === userA.id, "my/:id userId");
  const mineForeign = await api(
    "GET",
    `/materials/orders/my/${createdA.json.id}`,
    null,
    authHeaders(tokenB),
  );
  assert(mineForeign.status === 404, `B lit commande A → ${mineForeign.status}`);
  const mineGuest = await api(
    "GET",
    `/materials/orders/my/${guest.json.id}`,
    null,
    authHeaders(tokenA),
  );
  assert(mineGuest.status === 404, "commande invitée via /my/:id");
  const mineAnon = await api("GET", `/materials/orders/my/${createdA.json.id}`);
  assert(mineAnon.status === 401, "my/:id sans auth");

  const unauth = await api("GET", "/materials/orders/my");
  assert(unauth.status === 401, `my sans auth → ${unauth.status}`);
  const otherToken = await api("GET", "/materials/orders/my", null, authHeaders(tokenB));
  assert(
    !otherToken.json.some((item) => item.userId === userA.id),
    "B a reçu des commandes de A",
  );

  const adminList = await api("GET", "/materials/orders");
  assert(adminList.status === 200 && Array.isArray(adminList.json), "liste admin");
  const withoutUserId = adminList.json.filter((item) => !item.userId);
  assert(withoutUserId.length > 0, "admin ne voit plus les commandes sans userId");
  assert(
    adminList.json.some((item) => item.id === createdA.json.id && item.userId === userA.id),
    "admin ne voit pas la commande liée",
  );
  assert(
    adminList.json.some((item) => item.id === guest.json.id && !item.userId),
    "commande invitée absente admin",
  );
  results.push("6. Anciennes commandes sans userId visibles côté admin");

  const catalogAfter = await api("GET", "/materials/catalog");
  assert(catalogAfter.status === 200, "catalogue après");
  assert(catalogAfter.json.materials.length === catalogCount, "catalogue modifié");
  results.push("7. Catalogue matériaux intact");

  const flowId = createdA.json.id;
  assert((await patchStatus(flowId, "PAIEMENT_EN_ATTENTE")).status === 200, "PAIEMENT_EN_ATTENTE");
  assert(
    (await confirmAgentPaid(api, createdA.json, authHeaders(tokenA))).status === 200,
    "PAYEE",
  );
  assert((await patchStatus(flowId, "EN_PREPARATION")).status === 200, "EN_PREPARATION");
  assert((await patchStatus(flowId, "PRETE")).status === 200, "PRETE");
  assert((await patchMode(flowId, "RETRAIT_DEPOT")).status === 200, "mode remise");
  const handed = await patchStatus(flowId, "RETIRE_DEPOT");
  assert(handed.status === 200 && handed.json.status === "RETIRE_DEPOT", `remise → ${handed.status}`);
  assert(handed.json.userId === userA.id, "userId perdu pendant le workflow");
  const flowRead = await api("GET", `/materials/orders/${flowId}`);
  assert(flowRead.json.customer.name === snapshotBefore.name, "snapshot perdu pendant le workflow");
  results.push("8. Workflow commande intact jusqu’à la remise");

  await api("POST", `/materials/orders/${spoof.json.id}/cancel`);
  await api("POST", `/materials/orders/${guest.json.id}/cancel`);
  await api("POST", `/materials/orders/${createdB.json.id}/cancel`);

  console.log(results.map((line) => `OK  ${line}`).join("\n"));
}

main().catch((error) => {
  console.error("FAIL", error.message);
  process.exit(1);
});
