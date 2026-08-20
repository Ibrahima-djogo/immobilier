/**
 * Test E2E des scopes de compte (DEMO ONLY).
 * Prérequis : API démarrée sur http://localhost:4000
 * Usage : node scripts/test-account-scopes.js
 */
const BASE = process.env.DEMO_API_URL || "http://localhost:4000";
const ADMIN_EMAIL =
  process.env.DEMO_ADMIN_EMAIL || "admin@demeureguinee.com";

let failures = 0;

function check(label, condition, detail) {
  if (condition) {
    console.log(`  OK   ${label}`);
  } else {
    failures += 1;
    console.log(`  FAIL ${label}${detail ? ` → ${JSON.stringify(detail)}` : ""}`);
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

function adminHeaders() {
  return { "X-Admin-Email": ADMIN_EMAIL };
}

async function main() {
  console.log(`Demo API: ${BASE}`);

  const health = await api("/health");
  if (health.status !== 200) {
    console.log("API injoignable — démarrez `npm start` dans immo-demo-api.");
    process.exit(1);
  }

  const stamp = Date.now();

  /* --- 1. Utilisateur neuf --- */
  console.log("\n1. Création utilisateur de test");
  const signup = await api("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      firstName: "Scope",
      lastName: "Terrain",
      email: `scope-terrain-${stamp}@demo.gn`,
      password: "Demo1234!",
      phone: "+224620000001",
    }),
  });
  const user = signup.body?.user || signup.body;
  check("utilisateur créé", Boolean(user?.id), signup);
  if (!user?.id) return;
  check("rôle initial USER", user.role === "USER", user.role);

  /* --- 2. Demande PROPRIETAIRE : TERRAIN / VENTE / 1 bien --- */
  console.log("\n2. Demande de rôle avec projet déclaré");
  const created = await api("/role-requests", {
    method: "POST",
    body: JSON.stringify({
      userId: user.id,
      requestedRole: "PROPRIETAIRE",
      personalInformation: {
        firstName: "Scope",
        lastName: "Terrain",
        email: user.email,
        phone: "+224620000001",
        idType: "CNI",
        idNumber: "CNI-SCOPE-1",
        address: "Quartier test",
        city: "Conakry",
        commune: "Ratoma",
      },
      declaredPropertyTypes: ["TERRAIN"],
      declaredOperations: ["VENTE"],
      declaredPortfolioSize: "ONE",
    }),
  });
  const request = created.body;
  check("demande créée", Boolean(request?.id), created);
  if (!request?.id) return;
  check(
    "declaredPropertyTypes persistés",
    JSON.stringify(request.declaredPropertyTypes) === JSON.stringify(["TERRAIN"]),
    request.declaredPropertyTypes,
  );
  check(
    "declaredOperations persistés",
    JSON.stringify(request.declaredOperations) === JSON.stringify(["VENTE"]),
    request.declaredOperations,
  );
  check(
    "configuration proposée = déclaration",
    request.proposedConfiguration?.allowedPropertyTypes?.[0] === "TERRAIN" &&
      request.proposedConfiguration?.allowedOperations?.[0] === "VENTE",
    request.proposedConfiguration,
  );
  check(
    "sectionReviews initialisées",
    request.sectionReviews?.identity?.status === "EN_ATTENTE",
    request.sectionReviews,
  );

  /* --- 3. Documents obligatoires --- */
  console.log("\n3. Documents + soumission");
  for (const doc of [
    { documentType: "CNI_RECTO", label: "CNI recto", side: "RECTO" },
    { documentType: "CNI_VERSO", label: "CNI verso", side: "VERSO" },
    { documentType: "SELFIE_VERIFICATION", label: "Photo de vérification" },
  ]) {
    await api(`/role-requests/${request.id}/documents`, {
      method: "POST",
      body: JSON.stringify({
        ...doc,
        fileName: `${doc.documentType}.jpg`,
        fileUrl: `/uploads/demo/${doc.documentType}.jpg`,
      }),
    });
  }
  await api(`/role-requests/${request.id}`, {
    method: "PATCH",
    body: JSON.stringify({
      declarations: {
        accuracy: true,
        authorization: true,
        processing: true,
        privacy: true,
      },
    }),
  });
  const submitted = await api(`/role-requests/${request.id}/submit`, {
    method: "POST",
    body: "{}",
  });
  check(
    "demande soumise",
    ["EN_ATTENTE", "EN_VERIFICATION"].includes(submitted.body?.status),
    submitted.body?.status || submitted,
  );

  /* --- 4. Refus d'approbation sans vérification --- */
  console.log("\n4. Garde-fous d’approbation");
  const tooEarly = await api(`/admin/role-requests/${request.id}/decision`, {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({ decision: "APPROUVER" }),
  });
  check(
    "approbation refusée sans identité vérifiée",
    tooEarly.status === 400,
    tooEarly,
  );

  /* --- 5. Vérification identité + documents --- */
  const detail = await api(`/admin/role-requests/${request.id}`, {
    headers: adminHeaders(),
  });
  check("détail admin accessible", detail.status === 200, detail.status);
  check(
    "canFinalize faux avant revue",
    detail.body?.canFinalize?.ok === false,
    detail.body?.canFinalize,
  );

  await api(`/admin/role-requests/${request.id}/sections/identity`, {
    method: "PATCH",
    headers: adminHeaders(),
    body: JSON.stringify({ status: "VERIFIE" }),
  });
  for (const doc of detail.body?.documents || []) {
    await api(`/admin/role-requests/${request.id}/documents/${doc.id}`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({ verificationStatus: "VALIDE" }),
    });
  }

  const missingScope = await api(
    `/admin/role-requests/${request.id}/decision`,
    {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({
        decision: "APPROUVER",
        configuration: {
          profileType: "PARTICULIER",
          preset: "PROPRIETAIRE_PARTICULIER",
          allowedPropertyTypes: [],
          allowedOperations: ["VENTE"],
        },
      }),
    },
  );
  check(
    "approbation refusée sans type autorisé",
    missingScope.status === 400,
    missingScope,
  );

  /* --- 6. Validation + configuration --- */
  console.log("\n5. Valider et configurer le compte");
  const approved = await api(`/admin/role-requests/${request.id}/decision`, {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({
      decision: "APPROUVER",
      configuration: {
        profileType: "PARTICULIER",
        preset: "PROPRIETAIRE_PARTICULIER",
        allowedPropertyTypes: ["TERRAIN"],
        allowedOperations: ["VENTE"],
      },
    }),
  });
  check("demande APPROUVEE", approved.body?.status === "APPROUVEE", approved.body?.status);
  check(
    "aperçu d’accès renvoyé",
    Array.isArray(approved.body?.accessPreview?.allowed),
    approved.body?.accessPreview,
  );

  const scope = await api(`/users/${user.id}/account-scope`);
  check("rôle devenu PROPRIETAIRE", scope.body?.role === "PROPRIETAIRE", scope.body?.role);
  check(
    "OwnerProfile créé avec TERRAIN",
    JSON.stringify(scope.body?.ownerProfile?.allowedPropertyTypes) ===
      JSON.stringify(["TERRAIN"]),
    scope.body?.ownerProfile,
  );
  check(
    "OwnerProfile VENTE uniquement",
    JSON.stringify(scope.body?.ownerProfile?.allowedOperations) ===
      JSON.stringify(["VENTE"]),
    scope.body?.ownerProfile?.allowedOperations,
  );
  check(
    "profileType PARTICULIER",
    scope.body?.ownerProfile?.profileType === "PARTICULIER",
    scope.body?.ownerProfile?.profileType,
  );
  check(
    "publication directe interdite",
    scope.body?.ownerProfile?.capabilities?.directPublish === false,
    scope.body?.ownerProfile?.capabilities,
  );

  /* --- 7. Enforcement --- */
  console.log("\n6. Enforcement API");
  const okTerrain = await api("/properties", {
    method: "POST",
    body: JSON.stringify({
      title: "Terrain autorisé",
      type: "TERRAIN",
      operation: "VENTE",
      ownerId: user.id,
      price: 100000000,
      area: 500,
    }),
  });
  check("création TERRAIN acceptée", okTerrain.status === 201, okTerrain.status);

  const villaRefused = await api("/properties", {
    method: "POST",
    body: JSON.stringify({
      title: "Villa interdite",
      type: "VILLA",
      operation: "VENTE",
      ownerId: user.id,
      price: 900000000,
      area: 300,
    }),
  });
  check(
    "création VILLA → 403 PROPERTY_TYPE_NOT_ALLOWED",
    villaRefused.status === 403 &&
      villaRefused.body?.error === "PROPERTY_TYPE_NOT_ALLOWED",
    villaRefused,
  );

  const rentRefused = await api("/properties", {
    method: "POST",
    body: JSON.stringify({
      title: "Terrain en location",
      type: "TERRAIN",
      operation: "LOCATION",
      ownerId: user.id,
      price: 500000,
      area: 500,
    }),
  });
  check(
    "opération LOCATION → 403 OPERATION_NOT_ALLOWED",
    rentRefused.status === 403 &&
      rentRefused.body?.error === "OPERATION_NOT_ALLOWED",
    rentRefused,
  );

  const listingRefused = await api("/listings", {
    method: "POST",
    body: JSON.stringify({
      title: "Annonce location interdite",
      propertyId: okTerrain.body?.id,
      ownerId: user.id,
      type: "TERRAIN",
      operation: "LOCATION",
      price: 400000,
    }),
  });
  check(
    "annonce LOCATION → 403 OPERATION_NOT_ALLOWED",
    listingRefused.status === 403 &&
      listingRefused.body?.error === "OPERATION_NOT_ALLOWED",
    listingRefused,
  );

  const listingOk = await api("/listings", {
    method: "POST",
    body: JSON.stringify({
      title: "Annonce vente terrain",
      propertyId: okTerrain.body?.id,
      ownerId: user.id,
      type: "TERRAIN",
      operation: "VENTE",
      price: 100000000,
    }),
  });
  check("annonce VENTE acceptée", listingOk.status === 201, listingOk.status);
  check(
    "annonce en attente de modération",
    listingOk.body?.status === "EN_ATTENTE",
    listingOk.body?.status,
  );

  /* --- 8. Extension MAISON --- */
  console.log("\n7. Demande d’extension");
  const extension = await api("/account-scope-requests", {
    method: "POST",
    body: JSON.stringify({
      userId: user.id,
      requestedPropertyTypes: ["MAISON"],
      reason: "Je possède désormais une maison à vendre.",
    }),
  });
  check("extension créée", extension.status === 201, extension);

  const extApproved = await api(
    `/admin/account-scope-requests/${extension.body?.id}/decision`,
    {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({
        decision: "APPROUVER",
        adminMessage: "Extension approuvée.",
      }),
    },
  );
  check(
    "extension approuvée",
    extApproved.body?.status === "APPROUVEE",
    extApproved.body,
  );

  const scope2 = await api(`/users/${user.id}/account-scope`);
  check(
    "scope étendu à TERRAIN + MAISON",
    (scope2.body?.ownerProfile?.allowedPropertyTypes || []).includes("MAISON") &&
      (scope2.body?.ownerProfile?.allowedPropertyTypes || []).includes("TERRAIN"),
    scope2.body?.ownerProfile?.allowedPropertyTypes,
  );

  const maisonOk = await api("/properties", {
    method: "POST",
    body: JSON.stringify({
      title: "Maison autorisée après extension",
      type: "MAISON",
      operation: "VENTE",
      ownerId: user.id,
      price: 750000000,
      area: 200,
      bedrooms: 4,
    }),
  });
  check("création MAISON acceptée", maisonOk.status === 201, maisonOk.status);
  check(
    "historique de configuration enregistré",
    (scope2.body?.history || []).length >= 2,
    (scope2.body?.history || []).length,
  );

  /* --- 9. Scénario AGENCE --- */
  console.log("\n8. Scénario AGENCE");
  const agencySignup = await api("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      firstName: "Scope",
      lastName: "Agence",
      email: `scope-agence-${stamp}@demo.gn`,
      password: "Demo1234!",
      phone: "+224620000002",
    }),
  });
  const agencyUser = agencySignup.body?.user || agencySignup.body;
  check("utilisateur agence créé", Boolean(agencyUser?.id), agencySignup);
  if (!agencyUser?.id) return;

  const agencyRequest = await api("/role-requests", {
    method: "POST",
    body: JSON.stringify({
      userId: agencyUser.id,
      requestedRole: "AGENCE",
      activityType: "AGENCE_IMMOBILIERE",
      personalInformation: {
        firstName: "Scope",
        lastName: "Agence",
        email: agencyUser.email,
        phone: "+224620000002",
        idType: "CNI",
        idNumber: "CNI-SCOPE-AG",
        city: "Conakry",
        commune: "Kaloum",
      },
      companyInformation: {
        legalName: "Agence Scope SARL",
        tradeName: "Agence Scope",
        rccm: "GN-CKY-2026-B-0001",
        city: "Conakry",
        professionalEmail: agencyUser.email,
      },
      declaredPropertyTypes: ["TERRAIN", "MAISON", "APPARTEMENT"],
      declaredOperations: ["VENTE", "LOCATION"],
    }),
  });
  check("demande agence créée", Boolean(agencyRequest.body?.id), agencyRequest);
  if (!agencyRequest.body?.id) return;
  check(
    "preset proposé AGENCE_IMMOBILIERE",
    agencyRequest.body?.proposedConfiguration?.preset === "AGENCE_IMMOBILIERE",
    agencyRequest.body?.proposedConfiguration?.preset,
  );

  for (const doc of [
    { documentType: "CNI_RECTO", label: "CNI recto", side: "RECTO" },
    { documentType: "CNI_VERSO", label: "CNI verso", side: "VERSO" },
    { documentType: "SELFIE_VERIFICATION", label: "Photo de vérification" },
    { documentType: "RCCM", label: "RCCM" },
    { documentType: "STATUTS_SOCIETE", label: "Statuts de la société" },
  ]) {
    await api(`/role-requests/${agencyRequest.body.id}/documents`, {
      method: "POST",
      body: JSON.stringify({
        ...doc,
        fileName: `${doc.documentType}.pdf`,
        fileUrl: `/uploads/demo/${doc.documentType}.pdf`,
      }),
    });
  }
  await api(`/role-requests/${agencyRequest.body.id}`, {
    method: "PATCH",
    body: JSON.stringify({
      declarations: {
        accuracy: true,
        authorization: true,
        processing: true,
        privacy: true,
      },
    }),
  });
  const agencySubmitted = await api(
    `/role-requests/${agencyRequest.body.id}/submit`,
    { method: "POST", body: "{}" },
  );
  check(
    "demande agence soumise",
    ["EN_ATTENTE", "EN_VERIFICATION"].includes(agencySubmitted.body?.status),
    agencySubmitted.body?.status || agencySubmitted,
  );

  await api(
    `/admin/role-requests/${agencyRequest.body.id}/sections/identity`,
    {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({ status: "VERIFIE" }),
    },
  );
  const agencyDetail = await api(
    `/admin/role-requests/${agencyRequest.body.id}`,
    { headers: adminHeaders() },
  );
  for (const doc of agencyDetail.body?.documents || []) {
    await api(
      `/admin/role-requests/${agencyRequest.body.id}/documents/${doc.id}`,
      {
        method: "PATCH",
        headers: adminHeaders(),
        body: JSON.stringify({ verificationStatus: "VALIDE" }),
      },
    );
  }

  const agencyApproved = await api(
    `/admin/role-requests/${agencyRequest.body.id}/decision`,
    {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({
        decision: "APPROUVER",
        configuration: {
          preset: "AGENCE_IMMOBILIERE",
          activityType: "AGENCE_IMMOBILIERE",
          allowedPropertyTypes: ["TERRAIN", "MAISON", "APPARTEMENT"],
          allowedOperations: ["VENTE", "LOCATION"],
        },
      }),
    },
  );
  check(
    "demande agence APPROUVEE",
    agencyApproved.body?.status === "APPROUVEE",
    agencyApproved.body?.status || agencyApproved,
  );

  const agencyScope = await api(`/users/${agencyUser.id}/account-scope`);
  const agencyId = agencyScope.body?.agency?.id;
  check("rôle devenu AGENCE", agencyScope.body?.role === "AGENCE", agencyScope.body?.role);
  check(
    "agence configurée sur 3 types",
    (agencyScope.body?.agency?.allowedPropertyTypes || []).length === 3,
    agencyScope.body?.agency?.allowedPropertyTypes,
  );
  check(
    "agence autorisée VENTE + LOCATION",
    (agencyScope.body?.agency?.allowedOperations || []).length === 2,
    agencyScope.body?.agency?.allowedOperations,
  );

  const agencyBureau = await api("/properties", {
    method: "POST",
    body: JSON.stringify({
      title: "Bureau hors périmètre agence",
      type: "BUREAU",
      operation: "VENTE",
      agencyId,
      price: 500000000,
      area: 120,
    }),
  });
  check(
    "agence : BUREAU → 403 PROPERTY_TYPE_NOT_ALLOWED",
    agencyBureau.status === 403 &&
      agencyBureau.body?.error === "PROPERTY_TYPE_NOT_ALLOWED",
    agencyBureau,
  );

  const agencyRent = await api("/properties", {
    method: "POST",
    body: JSON.stringify({
      title: "Appartement en location",
      type: "APPARTEMENT",
      operation: "LOCATION",
      agencyId,
      price: 4000000,
      area: 90,
      bedrooms: 3,
    }),
  });
  check(
    "agence : APPARTEMENT / LOCATION accepté",
    agencyRent.status === 201,
    agencyRent.status,
  );

  /* --- 10. Comptes démo préservés --- */
  console.log("\n9. Comptes démo existants");
  const ownerDemo = await api("/users/user-demo-owner/account-scope");
  check(
    "owner démo migré avec ses types réels",
    (ownerDemo.body?.ownerProfile?.allowedPropertyTypes || []).length > 0,
    ownerDemo.body?.ownerProfile?.allowedPropertyTypes,
  );
  const agencyDemo = await api("/users/user-demo-agence/account-scope");
  check(
    "agence démo migrée",
    (agencyDemo.body?.agency?.allowedPropertyTypes || []).length > 0,
    agencyDemo.body?.agency?.allowedPropertyTypes,
  );

  console.log(
    `\n${failures === 0 ? "TOUS LES TESTS PASSENT" : `${failures} test(s) en échec`}`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("Erreur de test:", err);
  process.exit(1);
});
