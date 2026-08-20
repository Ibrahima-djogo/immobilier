/**
 * Tests RBAC Demo API — permissions admin immobilières.
 * Usage: node scripts/test-admin-rbac.js
 */
const BASE = process.env.DEMO_API_URL || "http://localhost:4000";

async function req(method, path, { email, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(email ? { "X-Admin-Email": email } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty */
  }
  return { status: res.status, data };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  const results = [];
  function log(name, ok, detail) {
    results.push({ name, ok, detail });
    console.log(`${ok ? "OK" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  }

  const health = await req("GET", "/health");
  assert(health.status === 200, "Demo API inaccessible");

  const SUPER = "admin@demeureguinee.com";
  const MOD = "moderateur@demeureguinee.com";
  const SUPPORT = "support@demeureguinee.com";
  const IMMO = "immobilier@demeureguinee.com";

  // --- SUPER_ADMIN : créer bien ---
  {
    const r = await req("POST", "/admin/properties", {
      email: SUPER,
      body: {
        title: `Bien test SUPER ${Date.now()}`,
        type: "Villa",
        operation: "VENTE",
        price: 1000000,
        city: "Conakry",
        ownerId: "u1",
        agencyId: null,
      },
    });
    log(
      "SUPER_ADMIN créer bien",
      r.status === 201 && r.data?.ownerId === "u1" && !r.data?.ownerId?.includes("admin"),
      `HTTP ${r.status}`,
    );
    var superPropId = r.data?.id;
  }

  // --- MODERATEUR : créer bien → 403 ---
  {
    const r = await req("POST", "/admin/properties", {
      email: MOD,
      body: {
        title: "Doit échouer",
        ownerId: "u1",
      },
    });
    log("MODERATEUR créer bien", r.status === 403, `HTTP ${r.status}`);
  }

  // --- SUPPORT : publication directe → 403 ---
  {
    const r = await req("POST", "/listings/fake/publish", {
      email: SUPPORT,
    });
    log(
      "SUPPORT publish (auth)",
      r.status === 403 || r.status === 404,
      `HTTP ${r.status} (403 attendu si route atteinte)`,
    );
    // Sans permission → 403 avant 404
    const r2 = await req("POST", "/admin/listings", {
      email: SUPPORT,
      body: { propertyId: superPropId, title: "x" },
    });
    log("SUPPORT créer annonce admin", r2.status === 403, `HTTP ${r2.status}`);
  }

  // --- ADMIN immobilier : créer annonce + publier ---
  let listingId;
  {
    const created = await req("POST", "/admin/listings", {
      email: IMMO,
      body: {
        propertyId: superPropId,
        title: `Annonce admin ${Date.now()}`,
        operation: "VENTE",
        price: 2000000,
        description: "Créée par admin immobilier",
        status: "BROUILLON",
      },
    });
    log(
      "ADMIN immobilier créer annonce",
      created.status === 201 && created.data?.status === "BROUILLON",
      `HTTP ${created.status} status=${created.data?.status}`,
    );
    listingId = created.data?.id;

    const pub = await req("POST", `/listings/${listingId}/publish`, {
      email: IMMO,
    });
    log(
      "ADMIN immobilier publication directe",
      pub.status === 200 && pub.data?.status === "PUBLIEE" && pub.data?.publishedByAdminId,
      `HTTP ${pub.status} publishedBy=${pub.data?.publishedByAdminId}`,
    );
  }

  // --- MODERATEUR : publication directe → 403 ---
  {
    const draft = await req("POST", "/admin/listings", {
      email: SUPER,
      body: {
        propertyId: superPropId,
        title: `Draft pour mod ${Date.now()}`,
        status: "BROUILLON",
      },
    });
    const r = await req("POST", `/listings/${draft.data.id}/publish`, {
      email: MOD,
    });
    log("MODERATEUR publication directe", r.status === 403, `HTTP ${r.status}`);
  }

  // --- MODERATEUR : approuver EN_ATTENTE → OUI ---
  {
    // Soumission annonceur
    const submitted = await req("POST", "/listings", {
      body: {
        propertyId: superPropId,
        title: `Soumission ${Date.now()}`,
        ownerId: "u1",
        advertiserType: "PROPRIETAIRE",
        status: "EN_ATTENTE",
      },
    });
    const approve = await req("POST", `/listings/${submitted.data.id}/approve`, {
      email: MOD,
    });
    log(
      "MODERATEUR approuver EN_ATTENTE",
      approve.status === 200 &&
        approve.data?.status === "PUBLIEE" &&
        approve.data?.approvedByAdminId,
      `HTTP ${approve.status}`,
    );

    const submitted2 = await req("POST", "/listings", {
      body: {
        propertyId: superPropId,
        title: `Correction ${Date.now()}`,
        ownerId: "u1",
        status: "EN_ATTENTE",
      },
    });
    const corr = await req(
      "POST",
      `/listings/${submitted2.data.id}/request-correction`,
      { email: MOD, body: { note: "Photos manquantes" } },
    );
    log(
      "MODERATEUR demander correction",
      corr.status === 200 && corr.data?.status === "A_CORRIGER",
      `HTTP ${corr.status}`,
    );

    const submitted3 = await req("POST", "/listings", {
      body: {
        propertyId: superPropId,
        title: `Refus ${Date.now()}`,
        ownerId: "u1",
        status: "EN_ATTENTE",
      },
    });
    const rej = await req("POST", `/listings/${submitted3.data.id}/reject`, {
      email: MOD,
      body: { note: "Contenu non conforme", canResubmit: true },
    });
    log(
      "MODERATEUR refuser",
      rej.status === 200 && rej.data?.status === "REFUSEE",
      `HTTP ${rej.status}`,
    );
  }

  // --- ADMIN immobilier sans ADMINISTRATEURS : pas de bypass TOUTES ---
  {
    const admins = await req("GET", "/admin/admins");
    const immo = (admins.data || []).find((a) => a.email === IMMO);
    log(
      "ADMIN immobilier sans TOUTES/ADMINISTRATEURS",
      immo &&
        !immo.permissions.includes("TOUTES") &&
        !immo.permissions.includes("ADMINISTRATEURS"),
      `perms=${(immo?.permissions || []).join(",")}`,
    );
  }

  // --- Appel sans header → 401 ---
  {
    const r = await req("POST", "/admin/properties", {
      body: { title: "x", ownerId: "u1" },
    });
    log("Sans X-Admin-Email", r.status === 401, `HTTP ${r.status}`);
  }

  // Admin never owner
  {
    const r = await req("POST", "/admin/properties", {
      email: SUPER,
      body: {
        title: "Check owner",
        ownerId: "u1",
      },
    });
    log(
      "Admin n’est jamais propriétaire",
      r.data?.ownerId === "u1" &&
        r.data?.createdByAdminId &&
        r.data?.ownerId !== r.data?.createdByAdminId,
      `owner=${r.data?.ownerId} createdBy=${r.data?.createdByAdminId}`,
    );
  }

  const failed = results.filter((r) => !r.ok);
  console.log("\n---");
  console.log(`${results.length - failed.length}/${results.length} passed`);
  if (failed.length) {
    console.error("Failed:", failed.map((f) => f.name).join(", "));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
