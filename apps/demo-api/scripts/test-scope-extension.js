/**
 * Test E2E « Demande d'extension de scope » (DEMO ONLY).
 * Prérequis : API démarrée (DEMO_API_URL, défaut http://localhost:4000)
 * Usage : node scripts/test-scope-extension.js
 */
const BASE = process.env.DEMO_API_URL || "http://localhost:4000";
const ADMIN_EMAIL = process.env.DEMO_ADMIN_EMAIL || "admin@demeureguinee.com";

let failures = 0;

function check(label, condition, detail) {
  if (condition) {
    console.log(`  OK   ${label}`);
  } else {
    failures += 1;
    console.log(
      `  FAIL ${label}${detail ? ` → ${JSON.stringify(detail)}` : ""}`,
    );
  }
}

async function api(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers || {}),
    },
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, body };
}

const adminHeaders = () => ({ "X-Admin-Email": ADMIN_EMAIL });

function scopeKey(scopes) {
  return (scopes || [])
    .map((s) => `${s.propertyType}:${[...s.operations].sort().join("+")}`)
    .sort()
    .join("|");
}

async function readScopes(userId) {
  const res = await api(`/users/${userId}/account-scope`);
  const profile = res.body?.ownerProfile || res.body?.agency || null;
  return profile?.allowedPropertyScopes || [];
}

async function createOwner(stamp) {
  const signup = await api("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      firstName: "Scope",
      lastName: "Extension",
      email: `scope-ext-${stamp}@demo.gn`,
      password: "Demo1234!",
      phone: "+224620000021",
    }),
  });
  const user = signup.body?.user || signup.body;
  await api(`/admin/users/${user.id}/account-scope`, {
    method: "PATCH",
    headers: adminHeaders(),
    body: JSON.stringify({
      profileType: "PARTICULIER",
      preset: "PROPRIETAIRE_PARTICULIER",
      allowedPropertyTypes: ["TERRAIN"],
      allowedOperations: ["VENTE"],
      allowedPropertyScopes: [{ propertyType: "TERRAIN", operations: ["VENTE"] }],
      reason: "Test E2E extension de scope",
    }),
  });
  return user;
}

async function main() {
  console.log(`\nDemande d'extension de scope — ${BASE}\n`);
  const stamp = Date.now();
  const owner = await createOwner(stamp);

  console.log("1. Configuration de départ");
  const initial = await readScopes(owner.id);
  check(
    "TERRAIN → VENTE uniquement",
    scopeKey(initial) === "TERRAIN:VENTE",
    initial,
  );

  console.log("\n2. Refus serveur — demandes invalides");
  const empty = await api("/account-scope-requests", {
    method: "POST",
    body: JSON.stringify({ userId: owner.id, requestedScopes: [] }),
  });
  check(
    "extension vide → 400 SCOPE_REQUEST_EMPTY",
    empty.status === 400 && empty.body?.code === "SCOPE_REQUEST_EMPTY",
    empty,
  );

  const noOp = await api("/account-scope-requests", {
    method: "POST",
    body: JSON.stringify({
      userId: owner.id,
      requestedScopes: [{ propertyType: "MAISON", operations: [] }],
    }),
  });
  check(
    "type sans opération → 400 SCOPE_REQUEST_TYPE_WITHOUT_OPERATION",
    noOp.status === 400 &&
      noOp.body?.code === "SCOPE_REQUEST_TYPE_WITHOUT_OPERATION",
    noOp,
  );

  const granted = await api("/account-scope-requests", {
    method: "POST",
    body: JSON.stringify({
      userId: owner.id,
      requestedScopes: [{ propertyType: "TERRAIN", operations: ["VENTE"] }],
    }),
  });
  check(
    "scope déjà accordé → 409 SCOPE_ALREADY_GRANTED",
    granted.status === 409 && granted.body?.code === "SCOPE_ALREADY_GRANTED",
    granted,
  );

  console.log("\n3. Extension d'opération sur un type existant");
  const addRent = await api("/account-scope-requests", {
    method: "POST",
    body: JSON.stringify({
      userId: owner.id,
      // Le client demande VENTE + LOCATION : seule LOCATION est un vrai delta.
      requestedScopes: [
        { propertyType: "TERRAIN", operations: ["VENTE", "LOCATION"] },
      ],
      reason: "",
    }),
  });
  check(
    "TERRAIN + LOCATION accepté (motif vide) → 201 EN_ATTENTE",
    addRent.status === 201 && addRent.body?.status === "EN_ATTENTE",
    addRent,
  );
  check(
    "delta réduit à TERRAIN:LOCATION",
    scopeKey(addRent.body?.requestedScopes) === "TERRAIN:LOCATION",
    addRent.body?.requestedScopes,
  );

  const duplicate = await api("/account-scope-requests", {
    method: "POST",
    body: JSON.stringify({
      userId: owner.id,
      requestedScopes: [{ propertyType: "TERRAIN", operations: ["LOCATION"] }],
    }),
  });
  check(
    "doublon exact → 409 SCOPE_REQUEST_DUPLICATE",
    duplicate.status === 409 &&
      duplicate.body?.code === "SCOPE_REQUEST_DUPLICATE",
    duplicate,
  );

  console.log("\n4. Nouveau type avec une seule opération");
  const addFlat = await api("/account-scope-requests", {
    method: "POST",
    body: JSON.stringify({
      userId: owner.id,
      requestedScopes: [{ propertyType: "APPARTEMENT", operations: ["VENTE"] }],
    }),
  });
  check(
    "APPARTEMENT + VENTE → 201",
    addFlat.status === 201,
    addFlat,
  );

  console.log("\n5. Approbation admin — application au compte");
  await api(`/admin/account-scope-requests/${addFlat.body.id}/decision`, {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({ decision: "APPROUVER" }),
  });
  const afterFlat = await readScopes(owner.id);
  check(
    "APPARTEMENT ajouté en VENTE seule (pas de produit croisé)",
    scopeKey(afterFlat) === "APPARTEMENT:VENTE|TERRAIN:VENTE",
    afterFlat,
  );

  await api(`/admin/account-scope-requests/${addRent.body.id}/decision`, {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({ decision: "APPROUVER" }),
  });
  const afterRent = await readScopes(owner.id);
  check(
    "TERRAIN passe à VENTE+LOCATION, APPARTEMENT reste en VENTE",
    scopeKey(afterRent) === "APPARTEMENT:VENTE|TERRAIN:LOCATION+VENTE",
    afterRent,
  );

  console.log("\n6. Création directe d'un type déjà autorisé");
  const created = await api("/properties", {
    method: "POST",
    body: JSON.stringify({
      title: `Terrain scope ${stamp}`,
      type: "Terrain",
      operation: "VENTE",
      price: 150000000,
      area: 500,
      city: "Conakry",
      location: "Kipé, Ratoma, Conakry",
      description: "Terrain de test extension de scope.",
      ownerId: owner.id,
      status: "ACTIF",
    }),
  });
  check(
    "TERRAIN + VENTE créé sans extension → 201",
    created.status === 201,
    { status: created.status, error: created.body?.error },
  );

  console.log("\n7. Comptes démo existants");
  const u1 = await readScopes("u1");
  check(
    "u1 (propriétaire démo) a bien une configuration active",
    u1.length > 0 && u1.some((s) => s.propertyType === "TERRAIN"),
    u1,
  );
  const agency = await readScopes("u-ag1");
  check(
    "u-ag1 (agence démo) a bien une configuration active",
    agency.length > 0,
    agency,
  );

  console.log(
    `\n${failures === 0 ? "TOUS LES TESTS PASSENT" : `${failures} ÉCHEC(S)`}\n`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("Erreur test:", err);
  process.exit(1);
});
