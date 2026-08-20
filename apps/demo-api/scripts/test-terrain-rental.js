/**
 * Test E2E « Terrain à louer / à vendre » (DEMO ONLY).
 * Prérequis : API démarrée sur http://localhost:4000
 * Usage : node scripts/test-terrain-rental.js
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

function adminHeaders() {
  return { "X-Admin-Email": ADMIN_EMAIL };
}

async function createUser(tag, stamp) {
  const signup = await api("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      firstName: "Terrain",
      lastName: tag,
      email: `terrain-${tag}-${stamp}@demo.gn`.toLowerCase(),
      password: "Demo1234!",
      phone: "+224620000009",
    }),
  });
  return signup.body?.user || signup.body;
}

async function configureScope(userId, operations) {
  return api(`/admin/users/${userId}/account-scope`, {
    method: "PATCH",
    headers: adminHeaders(),
    body: JSON.stringify({
      profileType: "PARTICULIER",
      preset: "PROPRIETAIRE_PARTICULIER",
      allowedPropertyTypes: ["TERRAIN"],
      allowedOperations: operations,
      allowedPropertyScopes: [{ propertyType: "TERRAIN", operations }],
      reason: "Test E2E terrain",
    }),
  });
}

async function main() {
  console.log(`Demo API: ${BASE}`);
  const health = await api("/health");
  if (health.status !== 200) {
    console.log("API injoignable — démarrez `npm start` dans immo-demo-api.");
    process.exit(1);
  }
  const stamp = Date.now();

  /* --- 1. Compte scope TERRAIN → LOCATION uniquement --- */
  console.log("\n1. Compte TERRAIN / LOCATION");
  const renter = await createUser("rent", stamp);
  check("utilisateur créé", Boolean(renter?.id), renter);
  if (!renter?.id) return;

  const rentScope = await configureScope(renter.id, ["LOCATION"]);
  check("scope configuré", rentScope.status === 200, rentScope);

  const scopeRead = await api(`/users/${renter.id}/account-scope`);
  check(
    "allowedPropertyScopes = TERRAIN → LOCATION",
    JSON.stringify(scopeRead.body?.ownerProfile?.allowedPropertyScopes) ===
      JSON.stringify([{ propertyType: "TERRAIN", operations: ["LOCATION"] }]),
    scopeRead.body?.ownerProfile?.allowedPropertyScopes,
  );

  /* --- 2. Property TERRAIN (caractéristiques permanentes) --- */
  console.log("\n2. Création du terrain");
  const terrain = await api("/properties", {
    method: "POST",
    body: JSON.stringify({
      title: "Terrain clôturé à Kagbelen",
      type: "TERRAIN",
      operation: "LOCATION",
      ownerId: renter.id,
      area: 1200,
      city: "Conakry",
      commune: "Ratoma",
      district: "Kagbelen",
      description: "Terrain plat, accès routier direct.",
    }),
  });
  check("terrain créé", terrain.status === 201, terrain);
  const terrainId = terrain.body?.id;
  check(
    "aucun champ locatif dans le Property",
    terrain.body?.rentalTerms === undefined,
    Object.keys(terrain.body || {}),
  );

  /* --- 3. Scope : VENTE refusée pour ce type --- */
  console.log("\n3. Enforcement du scope");
  const saleDenied = await api("/listings", {
    method: "POST",
    body: JSON.stringify({
      title: "Terrain à vendre (interdit)",
      propertyId: terrainId,
      ownerId: renter.id,
      type: "TERRAIN",
      operation: "VENTE",
      price: 400000000,
    }),
  });
  check(
    "TERRAIN + VENTE → 403",
    saleDenied.status === 403 &&
      String(saleDenied.body?.code || "").startsWith("OPERATION_NOT_ALLOWED"),
    saleDenied,
  );

  /* --- 4. Validation conditionnelle des conditions de location --- */
  console.log("\n4. Validation TERRAIN + LOCATION");
  const missingTerms = await api("/listings", {
    method: "POST",
    body: JSON.stringify({
      title: "Terrain à louer",
      propertyId: terrainId,
      ownerId: renter.id,
      type: "TERRAIN",
      operation: "LOCATION",
      price: 8000000,
    }),
  });
  check(
    "sans rentalTerms → 422 RENTAL_TERMS_REQUIRED",
    missingTerms.status === 422 &&
      missingTerms.body?.code === "RENTAL_TERMS_REQUIRED",
    missingTerms,
  );

  const incompleteTerms = await api("/listings", {
    method: "POST",
    body: JSON.stringify({
      title: "Terrain à louer",
      propertyId: terrainId,
      ownerId: renter.id,
      type: "TERRAIN",
      operation: "LOCATION",
      rentalTerms: { rentAmount: 8000000, period: "YEARLY", allowedUses: [] },
    }),
  });
  check(
    "sans usage autorisé → 422 RENTAL_TERMS_INVALID",
    incompleteTerms.status === 422 &&
      incompleteTerms.body?.code === "RENTAL_TERMS_INVALID" &&
      Boolean(incompleteTerms.body?.fields?.allowedUses),
    incompleteTerms,
  );

  const otherUseUnspecified = await api("/listings", {
    method: "POST",
    body: JSON.stringify({
      title: "Terrain à louer",
      propertyId: terrainId,
      ownerId: renter.id,
      type: "TERRAIN",
      operation: "LOCATION",
      rentalTerms: {
        rentAmount: 8000000,
        period: "YEARLY",
        allowedUses: ["OTHER"],
      },
    }),
  });
  check(
    "usage OTHER sans précision → 422",
    otherUseUnspecified.status === 422 &&
      Boolean(otherUseUnspecified.body?.fields?.allowedUsesOther),
    otherUseUnspecified,
  );

  /* --- 5. Annonce complète --- */
  console.log("\n5. Annonce Terrain / Location complète");
  const rentListing = await api("/listings", {
    method: "POST",
    body: JSON.stringify({
      title: "Terrain clôturé à louer à Kagbelen",
      description: "Idéal stockage ou activité commerciale.",
      propertyId: terrainId,
      ownerId: renter.id,
      type: "TERRAIN",
      operation: "LOCATION",
      rentalTerms: {
        rentAmount: 8000000,
        period: "YEARLY",
        depositRequired: true,
        depositAmount: 2000000,
        minimumDurationMonths: 12,
        availableFrom: "2026-10-01",
        allowedUses: ["STORAGE", "COMMERCE"],
        negotiable: true,
        specialConditions: "Pas de construction en dur.",
      },
    }),
  });
  check("annonce créée", rentListing.status === 201, rentListing);
  const rentAd = rentListing.body || {};
  check("statut EN_ATTENTE", rentAd.status === "EN_ATTENTE", rentAd.status);
  check(
    "price aligné sur rentAmount",
    rentAd.price === 8000000,
    { price: rentAd.price },
  );
  check(
    "rentalTerms persistées",
    rentAd.rentalTerms?.period === "YEARLY" &&
      rentAd.rentalTerms?.minimumDurationMonths === 12 &&
      JSON.stringify(rentAd.rentalTerms?.allowedUses) ===
        JSON.stringify(["STORAGE", "COMMERCE"]),
    rentAd.rentalTerms,
  );
  check("saleTerms vides en location", rentAd.saleTerms === null, rentAd.saleTerms);

  const bundle = await api(`/listings/${rentAd.id}/bundle`);
  check(
    "bundle exposé à l’admin avec conditions",
    bundle.body?.listing?.rentalTerms?.rentAmount === 8000000,
    bundle.body?.listing?.rentalTerms,
  );

  /* --- 6. Compte scope TERRAIN → VENTE --- */
  console.log("\n6. Compte TERRAIN / VENTE");
  const seller = await createUser("sale", stamp);
  if (!seller?.id) return;
  const saleScope = await configureScope(seller.id, ["VENTE"]);
  check("scope configuré", saleScope.status === 200, saleScope);

  const saleProperty = await api("/properties", {
    method: "POST",
    body: JSON.stringify({
      title: "Terrain à vendre à Coyah",
      type: "TERRAIN",
      operation: "VENTE",
      ownerId: seller.id,
      area: 800,
      city: "Coyah",
    }),
  });
  check("terrain créé", saleProperty.status === 201, saleProperty.status);

  const noPrice = await api("/listings", {
    method: "POST",
    body: JSON.stringify({
      title: "Terrain à vendre",
      propertyId: saleProperty.body?.id,
      ownerId: seller.id,
      type: "TERRAIN",
      operation: "VENTE",
      price: 0,
    }),
  });
  check(
    "vente sans prix → 422 SALE_PRICE_REQUIRED",
    noPrice.status === 422 && noPrice.body?.code === "SALE_PRICE_REQUIRED",
    noPrice,
  );

  const saleListing = await api("/listings", {
    method: "POST",
    body: JSON.stringify({
      title: "Terrain viabilisé à vendre à Coyah",
      description: "Titre foncier disponible.",
      propertyId: saleProperty.body?.id,
      ownerId: seller.id,
      type: "TERRAIN",
      operation: "VENTE",
      price: 450000000,
      saleTerms: { negotiable: false, availableFrom: "2026-09-15" },
    }),
  });
  check("annonce vente créée", saleListing.status === 201, saleListing);
  check(
    "aucune condition de location sur une vente",
    saleListing.body?.rentalTerms === null,
    saleListing.body?.rentalTerms,
  );
  check(
    "saleTerms persistées",
    saleListing.body?.saleTerms?.negotiable === false &&
      saleListing.body?.saleTerms?.availableFrom === "2026-09-15",
    saleListing.body?.saleTerms,
  );
  check(
    "prix de vente conservé sur listing.price",
    saleListing.body?.price === 450000000,
    saleListing.body?.price,
  );

  /* --- 7. Compatibilité ascendante --- */
  console.log("\n7. Annonces existantes");
  const legacy = await api("/listings/ad1");
  check(
    "annonce historique lisible (rentalTerms null)",
    legacy.status === 200 && legacy.body?.rentalTerms === null,
    { status: legacy.status, rentalTerms: legacy.body?.rentalTerms },
  );

  console.log(
    failures === 0
      ? "\nTous les tests Terrain location/vente passent."
      : `\n${failures} test(s) en échec.`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
