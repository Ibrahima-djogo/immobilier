/**
 * Test E2E des dossiers de vérification DEMO (DEMO ONLY).
 * Prérequis : API démarrée (DEMO_API_URL, défaut http://localhost:4000)
 * Usage : node scripts/test-demo-scenarios.js
 *
 * Le scénario « propriétaire EN_ATTENTE » est réellement approuvé pendant le
 * test, puis les scénarios sont réarmés (`npm run demo:scenarios:reset`).
 */
const { execFileSync } = require("child_process");
const path = require("path");

const BASE = process.env.DEMO_API_URL || "http://localhost:4000";
const ADMIN_EMAIL = process.env.DEMO_ADMIN_EMAIL || "admin@demeureguinee.com";

let failures = 0;

function check(label, condition, detail) {
  if (condition) {
    console.log(`  OK   ${label}`);
  } else {
    failures += 1;
    console.log(
      `  FAIL ${label}${detail !== undefined ? ` → ${JSON.stringify(detail)}` : ""}`,
    );
  }
}

async function api(pathname, options = {}) {
  const res = await fetch(`${BASE}${pathname}`, {
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

async function head(pathname) {
  const res = await fetch(`${BASE}${pathname}`);
  return {
    status: res.status,
    contentType: res.headers.get("content-type"),
    length: Number(res.headers.get("content-length") || 0),
  };
}

function adminHeaders() {
  return { "X-Admin-Email": ADMIN_EMAIL };
}

function findByReference(list, reference) {
  return list.find((item) => item.reference === reference) || null;
}

function docByType(documents, documentType) {
  return documents.find((d) => d.documentType === documentType) || null;
}

async function main() {
  console.log(`Demo API: ${BASE}`);
  const health = await api("/health");
  if (health.status !== 200) {
    console.log("API injoignable — démarrez `npm start` dans immo-demo-api.");
    process.exit(1);
  }

  /* --- 1. Comptes Demo vierges --- */
  console.log("\n1. Comptes volontairement vierges");
  const allRequests = await api("/admin/role-requests", {
    headers: adminHeaders(),
  });
  check("liste admin accessible", allRequests.status === 200, allRequests.status);
  const requests = Array.isArray(allRequests.body) ? allRequests.body : [];
  for (const userId of ["user-demo-1", "user-demo-2"]) {
    check(
      `${userId} sans demande de rôle`,
      requests.every((r) => r.userId !== userId),
    );
    const login = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email:
          userId === "user-demo-1"
            ? "user1@demo.demeureguinee.com"
            : "user2@demo.demeureguinee.com",
        password: "Demo1234!",
      }),
    });
    const user = login.body?.user || login.body;
    check(`${userId} connectable et USER`, user?.role === "USER", {
      status: login.status,
      role: user?.role,
    });
  }

  /* --- 2. Présence des dossiers Demo --- */
  console.log("\n2. Dossiers Demo attendus");
  const expected = {
    owner: "ROLE-DEMO-OWNER-001",
    correction: "ROLE-DEMO-OWNER-CORRECTION-001",
    agency: "ROLE-DEMO-AGENCY-001",
    promoter: "ROLE-DEMO-PROMOTEUR-001",
    ownerApproved: "ROLE-DEMO-OWNER-APPROVED-001",
    agencyApproved: "ROLE-DEMO-AGENCY-APPROVED-001",
  };
  const summaries = {};
  for (const [key, reference] of Object.entries(expected)) {
    const found = findByReference(requests, reference);
    summaries[key] = found;
    check(`${reference} présent`, Boolean(found));
    if (found) check(`${reference} marqué DEMO`, found.demo === true, found.demo);
  }
  if (!summaries.owner) {
    console.log("\nDossiers Demo manquants — arrêt.");
    process.exit(1);
  }

  /* --- 3. Dossier propriétaire EN_ATTENTE : contenu complet --- */
  console.log("\n3. Dossier propriétaire EN_ATTENTE");
  const ownerRes = await api(`/admin/role-requests/${summaries.owner.id}`, {
    headers: adminHeaders(),
  });
  const owner = ownerRes.body;
  check("statut EN_ATTENTE", owner.status === "EN_ATTENTE", owner.status);
  check("userId = user-demo-pending", owner.userId === "user-demo-pending", owner.userId);
  check(
    "identité déclarée complète",
    owner.personalInformation?.lastName === "Diallo" &&
      owner.personalInformation?.birthDate === "1990-04-12" &&
      owner.personalInformation?.idNumber === "DEMO-CNI-OWNER-001",
    owner.personalInformation,
  );
  check(
    "adresse déclarée",
    owner.personalInformation?.commune === "Ratoma" &&
      Boolean(owner.personalInformation?.district),
    owner.personalInformation?.address,
  );
  check(
    "declaredPropertyIntents relationnel",
    JSON.stringify(owner.declaredPropertyIntents) ===
      JSON.stringify([
        { propertyType: "TERRAIN", operations: ["VENTE"], quantityRange: "ONE" },
      ]),
    owner.declaredPropertyIntents,
  );
  check(
    "listes plates dérivées",
    JSON.stringify(owner.declaredPropertyTypes) === JSON.stringify(["TERRAIN"]) &&
      JSON.stringify(owner.declaredOperations) === JSON.stringify(["VENTE"]) &&
      owner.declaredPortfolioSize === "ONE",
    {
      types: owner.declaredPropertyTypes,
      ops: owner.declaredOperations,
      size: owner.declaredPortfolioSize,
    },
  );
  check(
    "déclarations acceptées",
    owner.declarations?.accuracy === true &&
      owner.declarations?.authorization === true &&
      owner.declarations?.processing === true &&
      owner.declarations?.privacy === true,
    owner.declarations,
  );
  check("4 pièces jointes", (owner.documents || []).length === 4, (owner.documents || []).length);
  check(
    "sections non pré-vérifiées",
    owner.sectionReviews?.identity?.status === "EN_ATTENTE" &&
      owner.sectionReviews?.documents?.status === "EN_ATTENTE",
    owner.sectionReviews,
  );
  check(
    "configuration proposée depuis les intents",
    owner.proposedConfiguration?.allowedPropertyTypes?.join() === "TERRAIN" &&
      owner.proposedConfiguration?.allowedOperations?.join() === "VENTE",
    owner.proposedConfiguration,
  );
  check(
    "approbation bloquée au départ",
    owner.canFinalize?.ok === false,
    owner.canFinalize,
  );

  /* --- 4. Fichiers Demo réellement servis --- */
  console.log("\n4. Fichiers Demo (aucun 404)");
  const allDossiers = [];
  for (const summary of Object.values(summaries)) {
    if (!summary) continue;
    const detail = await api(`/admin/role-requests/${summary.id}`, {
      headers: adminHeaders(),
    });
    allDossiers.push(detail.body);
  }
  let filesChecked = 0;
  for (const dossier of allDossiers) {
    for (const doc of dossier.documents || []) {
      check(
        `relation ${doc.id} → dossier`,
        doc.roleRequestId === dossier.id && doc.ownerId === dossier.userId,
        { roleRequestId: doc.roleRequestId, ownerId: doc.ownerId },
      );
      const file = await head(doc.fileUrl);
      filesChecked += 1;
      check(
        `fichier ${doc.fileName} servi (${file.status})`,
        file.status === 200 && file.length > 0,
        file,
      );
      const expectedType = doc.fileName.endsWith(".pdf")
        ? "application/pdf"
        : "image/png";
      check(
        `type MIME ${doc.fileName}`,
        (file.contentType || "").includes(expectedType),
        file.contentType,
      );
    }
  }
  check("fichiers vérifiés > 25", filesChecked > 25, filesChecked);

  /* --- 5. Dossier A_CORRIGER --- */
  console.log("\n5. Dossier A_CORRIGER");
  const correction = allDossiers.find(
    (d) => d.reference === expected.correction,
  );
  check("statut A_CORRIGER", correction.status === "A_CORRIGER", correction.status);
  check(
    "message admin global",
    correction.correctionMessage ===
      "Veuillez remplacer uniquement le recto de votre pièce d’identité.",
    correction.correctionMessage,
  );
  const corrRecto = docByType(correction.documents, "CNI_RECTO");
  const corrVerso = docByType(correction.documents, "CNI_VERSO");
  const corrSelfie = docByType(correction.documents, "SELFIE_VERIFICATION");
  check("recto A_CORRIGER", corrRecto?.verificationStatus === "A_CORRIGER", corrRecto?.verificationStatus);
  check(
    "motif du recto",
    (corrRecto?.rejectionReason || "").includes("trop flou"),
    corrRecto?.rejectionReason,
  );
  check("verso VALIDE", corrVerso?.verificationStatus === "VALIDE", corrVerso?.verificationStatus);
  check("photo VALIDE", corrSelfie?.verificationStatus === "VALIDE", corrSelfie?.verificationStatus);
  check(
    "identité VERIFIE",
    correction.sectionReviews?.identity?.status === "VERIFIE",
    correction.sectionReviews?.identity,
  );

  /* --- 6. Dossier agence --- */
  console.log("\n6. Dossier agence EN_ATTENTE");
  const agency = allDossiers.find((d) => d.reference === expected.agency);
  check("rôle AGENCE", agency.requestedRole === "AGENCE", agency.requestedRole);
  check(
    "activité AGENCE_IMMOBILIERE",
    agency.activityType === "AGENCE_IMMOBILIERE",
    agency.activityType,
  );
  check(
    "entreprise complète",
    agency.companyInformation?.rccm === "DEMO-RCCM-GN-001" &&
      agency.companyInformation?.nif === "DEMO-NIF-001" &&
      agency.companyInformation?.legalForm === "SARL",
    agency.companyInformation,
  );
  check(
    "représentant légal",
    agency.representative?.lastName === "Camara" &&
      agency.representative?.function === "Gérante" &&
      agency.representative?.idNumber === "DEMO-CNI-REP-001",
    agency.representative,
  );
  check(
    "expérience déclarée",
    agency.companyInformation?.experienceYears === "5" &&
      agency.companyInformation?.experienceStartYear === "2021",
    agency.companyInformation?.experienceSummary,
  );
  check(
    "4 intents par type/opération",
    (agency.declaredPropertyIntents || []).length === 4 &&
      agency.declaredPropertyIntents.find((i) => i.propertyType === "APPARTEMENT")
        ?.operations.join() === "LOCATION",
    agency.declaredPropertyIntents,
  );
  check(
    "RCCM et statuts obligatoires",
    docByType(agency.documents, "RCCM")?.requirementLevel === "OBLIGATOIRE" &&
      docByType(agency.documents, "STATUTS_SOCIETE")?.requirementLevel ===
        "OBLIGATOIRE",
  );
  check(
    "justificatifs siège/expérience facultatifs",
    docByType(agency.documents, "JUSTIFICATIF_SIEGE")?.requirementLevel ===
      "FACULTATIF" &&
      docByType(agency.documents, "EXPERIENCE_PROOF")?.requirementLevel ===
        "FACULTATIF",
  );
  check(
    "agrément promoteur non applicable ici",
    !docByType(agency.documents, "AGREMENT_PROMOTEUR"),
  );

  /* --- 7. Dossier promoteur : documents conditionnels --- */
  console.log("\n7. Dossier promoteur (conditionnels)");
  const promoter = allDossiers.find((d) => d.reference === expected.promoter);
  check(
    "activité PROMOTEUR_IMMOBILIER",
    promoter.activityType === "PROMOTEUR_IMMOBILIER",
    promoter.activityType,
  );
  const agrement = docByType(promoter.documents, "AGREMENT_PROMOTEUR");
  check(
    "agrément CONDITIONNEL",
    agrement?.requirementLevel === "CONDITIONNEL",
    agrement?.requirementLevel,
  );
  check(
    "agrément exigé (mandatory)",
    agrement?.requirementMandatory === true,
    agrement?.requirementMandatory,
  );
  check(
    "explication du déclencheur",
    (agrement?.requirementReason || "").includes("PROMOTEUR_IMMOBILIER"),
    agrement?.requirementReason,
  );
  const garantie = docByType(promoter.documents, "GARANTIE_FINANCIERE");
  check(
    "garantie financière conditionnelle non bloquante",
    garantie?.requirementLevel === "CONDITIONNEL" &&
      garantie?.requirementMandatory === false,
    {
      level: garantie?.requirementLevel,
      mandatory: garantie?.requirementMandatory,
    },
  );

  /* --- 8. Comptes approuvés : historique + scopes --- */
  console.log("\n8. Comptes approuvés (historique + configuration)");
  const ownerApproved = allDossiers.find(
    (d) => d.reference === expected.ownerApproved,
  );
  check("statut APPROUVEE", ownerApproved.status === "APPROUVEE", ownerApproved.status);
  check(
    "scopes appliqués TERRAIN vente+location",
    JSON.stringify(ownerApproved.appliedConfiguration?.allowedPropertyScopes) ===
      JSON.stringify([
        { propertyType: "TERRAIN", operations: ["VENTE", "LOCATION"] },
      ]),
    ownerApproved.appliedConfiguration?.allowedPropertyScopes,
  );
  const ownerScope = await api("/users/user-demo-owner/account-scope");
  check(
    "OwnerProfile configuré",
    ownerScope.body?.ownerProfile?.profileType === "PARTICULIER" &&
      ownerScope.body?.ownerProfile?.verificationStatus === "VERIFIE" &&
      JSON.stringify(ownerScope.body?.ownerProfile?.allowedPropertyScopes) ===
        JSON.stringify([
          { propertyType: "TERRAIN", operations: ["VENTE", "LOCATION"] },
        ]),
    ownerScope.body?.ownerProfile,
  );
  const ownerDenied = await api("/properties", {
    method: "POST",
    body: JSON.stringify({
      ownerId: "user-demo-owner",
      title: "Test scope maison",
      type: "MAISON",
      operation: "VENTE",
      city: "Conakry",
      price: 100000,
    }),
  });
  check(
    "MAISON refusée pour owner@demo (403)",
    ownerDenied.status === 403 &&
      ownerDenied.body?.code === "PROPERTY_TYPE_NOT_ALLOWED",
    { status: ownerDenied.status, body: ownerDenied.body },
  );

  const agencyApproved = allDossiers.find(
    (d) => d.reference === expected.agencyApproved,
  );
  check("agence APPROUVEE", agencyApproved.status === "APPROUVEE", agencyApproved.status);
  const agencyScope = await api("/users/user-demo-agence/account-scope");
  check(
    "Agency vérifiée et scopée",
    agencyScope.body?.agency?.verificationStatus === "VERIFIE" &&
      (agencyScope.body?.agency?.allowedPropertyScopes || []).length === 4,
    agencyScope.body?.agency,
  );
  const agencyDenied = await api("/properties", {
    method: "POST",
    body: JSON.stringify({
      agencyId: "ag-demo-1",
      title: "Test scope bureau",
      type: "BUREAU",
      operation: "VENTE",
      city: "Conakry",
      price: 100000,
    }),
  });
  check(
    "BUREAU refusé pour agence@demo (403)",
    agencyDenied.status === 403 &&
      agencyDenied.body?.code === "PROPERTY_TYPE_NOT_ALLOWED",
    { status: agencyDenied.status, body: agencyDenied.body },
  );

  /* --- 8b. Configuration du compte : enregistrement explicite --- */
  console.log("\n8b. Configuration du compte (enregistrement explicite)");
  const configUrl = `/admin/role-requests/${summaries.agency.id}/account-configuration`;
  const noScopes = await api(configUrl, {
    method: "PATCH",
    headers: adminHeaders(),
    body: JSON.stringify({
      preset: "AGENCE_IMMOBILIERE",
      activityType: "AGENCE_IMMOBILIERE",
      allowedPropertyScopes: [],
    }),
  });
  check("aucun type autorisé → 400", noScopes.status === 400, noScopes.body);
  const noOps = await api(configUrl, {
    method: "PATCH",
    headers: adminHeaders(),
    body: JSON.stringify({
      preset: "AGENCE_IMMOBILIERE",
      activityType: "AGENCE_IMMOBILIERE",
      allowedPropertyScopes: [{ propertyType: "TERRAIN", operations: [] }],
    }),
  });
  check("type sans opération → 400", noOps.status === 400, noOps.body);
  const badPreset = await api(configUrl, {
    method: "PATCH",
    headers: adminHeaders(),
    body: JSON.stringify({
      preset: "PRESET_INEXISTANT",
      allowedPropertyScopes: [
        { propertyType: "TERRAIN", operations: ["VENTE"] },
      ],
    }),
  });
  check("preset inconnu → 400", badPreset.status === 400, badPreset.body);
  const anonymous = await api(configUrl, {
    method: "PATCH",
    body: JSON.stringify({
      preset: "AGENCE_IMMOBILIERE",
      allowedPropertyScopes: [
        { propertyType: "TERRAIN", operations: ["VENTE"] },
      ],
    }),
  });
  check("sans admin → 401", anonymous.status === 401, anonymous.status);

  // Scénario du brief : l'admin retire APPARTEMENT et garde ses propres choix.
  const adminScopes = [
    { propertyType: "TERRAIN", operations: ["VENTE", "LOCATION"] },
    { propertyType: "MAISON", operations: ["VENTE"] },
  ];
  const saved = await api(configUrl, {
    method: "PATCH",
    headers: adminHeaders(),
    body: JSON.stringify({
      preset: "AGENCE_IMMOBILIERE",
      activityType: "AGENCE_IMMOBILIERE",
      allowedPropertyScopes: adminScopes,
    }),
  });
  check("configuration enregistrée", saved.status === 200, saved.body?.error);
  check(
    "scopes conservés tels quels",
    JSON.stringify(saved.body?.savedConfiguration?.allowedPropertyScopes) ===
      JSON.stringify(adminScopes),
    saved.body?.savedConfiguration?.allowedPropertyScopes,
  );
  check(
    "listes plates dérivées",
    saved.body?.savedConfiguration?.allowedPropertyTypes?.join() ===
      "TERRAIN,MAISON" &&
      saved.body?.savedConfiguration?.allowedOperations?.join() ===
        "VENTE,LOCATION",
    saved.body?.savedConfiguration,
  );
  check(
    "traçabilité (date + admin)",
    Boolean(saved.body?.savedConfiguration?.configuredAt) &&
      Boolean(saved.body?.savedConfiguration?.configuredByAdminName),
    saved.body?.savedConfiguration,
  );
  check(
    "statut du dossier inchangé",
    saved.body?.status === "EN_ATTENTE",
    saved.body?.status,
  );
  const agencyUserAfterSave = await api("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: "pending.agency@demo.demeureguinee.com",
      password: "Demo1234!",
    }),
  });
  check(
    "enregistrer n’approuve pas (rôle toujours USER)",
    (agencyUserAfterSave.body?.user || agencyUserAfterSave.body)?.role ===
      "USER",
    (agencyUserAfterSave.body?.user || agencyUserAfterSave.body)?.role,
  );
  const agencyScopeAfterSave = await api(
    "/users/user-demo-agency-pending/account-scope",
  );
  check(
    "aucun profil activé par l’enregistrement",
    !agencyScopeAfterSave.body?.agency &&
      !agencyScopeAfterSave.body?.ownerProfile,
    agencyScopeAfterSave.body,
  );
  const reread = await api(`/admin/role-requests/${summaries.agency.id}`, {
    headers: adminHeaders(),
  });
  check(
    "persistance après rechargement (F5)",
    JSON.stringify(reread.body?.savedConfiguration?.allowedPropertyScopes) ===
      JSON.stringify(adminScopes),
    reread.body?.savedConfiguration?.allowedPropertyScopes,
  );
  check(
    "aperçu d’accès basé sur la configuration enregistrée",
    (reread.body?.accessPreview?.allowed || []).some((line) =>
      line.includes("Maison"),
    ) &&
      (reread.body?.accessPreview?.denied || []).some((line) =>
        line.includes("Appartement"),
      ),
    reread.body?.accessPreview,
  );
  const audit = await api("/admin/audit?limit=20", {
    headers: adminHeaders(),
  });
  const auditEntry = (Array.isArray(audit.body) ? audit.body : []).find(
    (log) => log.action === "ACCOUNT_CONFIGURATION_UPDATED",
  );
  check(
    "audit ACCOUNT_CONFIGURATION_UPDATED",
    Boolean(auditEntry),
    audit.status,
  );
  check(
    "audit contient before/after + admin + date",
    Boolean(auditEntry?.meta) &&
      "before" in (auditEntry?.meta || {}) &&
      Boolean(auditEntry?.meta?.after?.allowedPropertyScopes) &&
      Boolean(auditEntry?.adminId) &&
      Boolean(auditEntry?.timestamp),
    auditEntry,
  );

  /* --- 9. Vérification réelle du dossier propriétaire --- */
  console.log("\n9. Vérification pièce par pièce puis approbation");
  const ownerDocs = owner.documents || [];
  for (const type of ["CNI_RECTO", "CNI_VERSO", "SELFIE_VERIFICATION"]) {
    const doc = docByType(ownerDocs, type);
    const res = await api(
      `/admin/role-requests/${owner.id}/documents/${doc.id}`,
      {
        method: "PATCH",
        headers: adminHeaders(),
        body: JSON.stringify({ verificationStatus: "VALIDE" }),
      },
    );
    check(`${type} validé`, res.status === 200 && res.body?.verificationStatus === "VALIDE", res.body);
  }
  const identity = await api(
    `/admin/role-requests/${owner.id}/sections/identity`,
    {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({
        status: "VERIFIE",
        message: "Identité conforme (test automatisé).",
      }),
    },
  );
  check("identité marquée VERIFIE", identity.status === 200, identity.body);

  const beforeDecision = await api(`/admin/role-requests/${owner.id}`, {
    headers: adminHeaders(),
  });
  const optional = docByType(beforeDecision.body.documents, "JUSTIFICATIF_DOMICILE");
  check(
    "justificatif facultatif resté EN_ATTENTE",
    optional?.verificationStatus === "EN_ATTENTE",
    optional?.verificationStatus,
  );
  check(
    "facultatif ne bloque pas l’approbation",
    beforeDecision.body.canFinalize?.ok === true,
    beforeDecision.body.canFinalize,
  );

  // Sans configuration enregistrée, l’activation doit être refusée.
  const tooEarly = await api(`/admin/role-requests/${owner.id}/decision`, {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({
      decision: "APPROUVER",
      reason: "Tentative sans configuration",
    }),
  });
  check(
    "activation refusée sans configuration enregistrée",
    tooEarly.status === 400 &&
      tooEarly.body?.code === "ACCOUNT_CONFIGURATION_REQUIRED",
    tooEarly.body,
  );

  const ownerConfig = await api(
    `/admin/role-requests/${owner.id}/account-configuration`,
    {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({
        profileType: "PARTICULIER",
        preset: "PROPRIETAIRE_PARTICULIER",
        allowedPropertyScopes: [
          { propertyType: "TERRAIN", operations: ["VENTE"] },
        ],
      }),
    },
  );
  check(
    "configuration propriétaire enregistrée",
    ownerConfig.status === 200,
    ownerConfig.body?.error,
  );

  // Décision sans payload : la configuration enregistrée est appliquée telle quelle.
  const decision = await api(`/admin/role-requests/${owner.id}/decision`, {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({
      decision: "APPROUVER",
      reason: "Dossier Demo conforme (test automatisé)",
    }),
  });
  check("décision acceptée", decision.status === 200, decision.body);
  check(
    "configuration appliquée = configuration enregistrée",
    JSON.stringify(
      decision.body?.appliedConfiguration?.allowedPropertyScopes,
    ) === JSON.stringify([{ propertyType: "TERRAIN", operations: ["VENTE"] }]),
    decision.body?.appliedConfiguration?.allowedPropertyScopes,
  );
  check(
    "traçabilité configuré/approuvé",
    Boolean(decision.body?.appliedConfiguration?.configuredAt) &&
      Boolean(decision.body?.appliedConfiguration?.approvedAt) &&
      Boolean(decision.body?.appliedConfiguration?.approvedByAdminName),
    decision.body?.appliedConfiguration,
  );
  check("dossier APPROUVEE", decision.body?.status === "APPROUVEE", decision.body?.status);

  const pendingUser = await api("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: "pending.owner@demo.demeureguinee.com",
      password: "Demo1234!",
    }),
  });
  check(
    "compte devenu PROPRIETAIRE",
    (pendingUser.body?.user || pendingUser.body)?.role === "PROPRIETAIRE",
    (pendingUser.body?.user || pendingUser.body)?.role,
  );
  const pendingScope = await api("/users/user-demo-pending/account-scope");
  check(
    "scope TERRAIN / VENTE appliqué",
    JSON.stringify(pendingScope.body?.ownerProfile?.allowedPropertyScopes) ===
      JSON.stringify([{ propertyType: "TERRAIN", operations: ["VENTE"] }]),
    pendingScope.body?.ownerProfile?.allowedPropertyScopes,
  );
  const locationDenied = await api("/properties", {
    method: "POST",
    body: JSON.stringify({
      ownerId: "user-demo-pending",
      title: "Terrain en location",
      type: "TERRAIN",
      operation: "LOCATION",
      city: "Conakry",
      price: 5000,
    }),
  });
  check(
    "LOCATION sur TERRAIN refusée (403)",
    locationDenied.status === 403,
    { status: locationDenied.status, body: locationDenied.body },
  );

  /* --- 10. Réarmement des scénarios --- */
  console.log("\n10. Réarmement des scénarios Demo");
  execFileSync(
    process.execPath,
    [path.join(__dirname, "reset-demo-scenarios.js"), "--reset"],
    { stdio: "inherit" },
  );
  const rearmed = await api(`/admin/role-requests/${owner.id}`, {
    headers: adminHeaders(),
  });
  check("dossier revenu EN_ATTENTE", rearmed.body?.status === "EN_ATTENTE", rearmed.body?.status);
  check(
    "pièces revenues EN_ATTENTE",
    (rearmed.body?.documents || []).every(
      (d) => d.verificationStatus === "EN_ATTENTE",
    ),
    (rearmed.body?.documents || []).map((d) => d.verificationStatus),
  );
  const rearmedLogin = await api("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: "pending.owner@demo.demeureguinee.com",
      password: "Demo1234!",
    }),
  });
  check(
    "compte redevenu USER",
    (rearmedLogin.body?.user || rearmedLogin.body)?.role === "USER",
    (rearmedLogin.body?.user || rearmedLogin.body)?.role,
  );
  const rearmedScope = await api("/users/user-demo-pending/account-scope");
  check(
    "OwnerProfile de test supprimé",
    !rearmedScope.body?.ownerProfile,
    rearmedScope.body?.ownerProfile,
  );

  /* --- 11. Idempotence --- */
  console.log("\n11. Idempotence du seed");
  const first = await api(`/admin/role-requests/${summaries.agency.id}`, {
    headers: adminHeaders(),
  });
  const second = await api(`/admin/role-requests/${summaries.agency.id}`, {
    headers: adminHeaders(),
  });
  check(
    "dossier agence stable entre deux lectures",
    JSON.stringify(first.body.documents.map((d) => d.id)) ===
      JSON.stringify(second.body.documents.map((d) => d.id)),
  );

  console.log(
    `\n${failures === 0 ? "TOUS LES TESTS PASSENT" : `${failures} test(s) en échec`}`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
