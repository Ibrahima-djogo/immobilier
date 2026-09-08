/**
 * Tests d’intégration — matériaux dans le compte standard existant.
 * Prérequis : API + site web (DEMO_WEB_URL, défaut http://localhost:3000)
 */
const BASE = process.env.DEMO_API_URL || "http://localhost:4000";
const WEB = process.env.DEMO_WEB_URL || "http://localhost:3000";

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
  return { status: response.status, json: await response.json().catch(() => null) };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const results = [];

  const health = await api("GET", "/health");
  assert(health.status === 200, "API down");

  const loginA = await api("POST", "/auth/login", {
    identifier: "user1@demo.demeureguinee.com",
    password: "Demo1234!",
  });
  assert(loginA.status === 200 && loginA.json.user.id === "user-demo-1", "login A");
  assert(loginA.json.user.role === "USER", `rôle A ${loginA.json.user.role}`);
  const tokenA = loginA.json.token;
  results.push("1. Connexion compte standard existant");

  const listings = await api("GET", "/listings");
  assert(listings.status === 200, "listings");
  results.push("2. Annonces immobilières accessibles");

  const catalog = await api("GET", "/materials/catalog");
  assert(catalog.status === 200 && catalog.json.materials.length > 0, "catalogue");
  const ciment = catalog.json.materials.find((item) => item.id === "mp-ciment-42-5");
  assert(ciment, "ciment absent");
  const stock = ciment.stock || ciment;
  const expectedAvailable = Math.max(
    0,
    Number(stock.quantity || 0) - Number(stock.reservedQuantity || 0),
  );
  assert(
    Number(stock.availableQuantity) === expectedAvailable,
    `disponibilité ${stock.availableQuantity} ≠ ${expectedAvailable}`,
  );
  results.push("3. Catalogue matériaux");

  const created = await api(
    "POST",
    "/materials/orders",
    {
      customer: {
        name: "Awa Diallo",
        phone: "+224 620 11 11 11",
        email: "user1@demo.demeureguinee.com",
        city: "Conakry",
        district: "Kaloum",
        address: "Compte standard, villa test",
      },
      items: [{ productId: "mp-ciment-42-5", quantity: 1 }],
    },
    { Authorization: `Bearer ${tokenA}` },
  );
  assert(created.status === 201 || created.status === 200, `commande ${created.status}`);
  assert(created.json.userId === "user-demo-1", "userId manquant");
  assert(created.json.status === "EN_ATTENTE", `statut ${created.json.status}`);
  results.push("5. Commande liée au compte standard");

  const mine = await api("GET", "/materials/orders/my", null, {
    Authorization: `Bearer ${tokenA}`,
  });
  assert(mine.status === 200 && mine.json.some((item) => item.id === created.json.id), "my");
  const mineOne = await api("GET", `/materials/orders/my/${created.json.id}`, null, {
    Authorization: `Bearer ${tokenA}`,
  });
  assert(mineOne.status === 200 && mineOne.json.status === created.json.status, "statut API");
  results.push("6-8. Commande visible, statut API, persistance");

  const loginB = await api("POST", "/auth/login", {
    identifier: "user2@demo.demeureguinee.com",
    password: "Demo1234!",
  });
  const asB = await api("GET", `/materials/orders/my/${created.json.id}`, null, {
    Authorization: `Bearer ${loginB.json.token}`,
  });
  assert(asB.status === 404, `B voit A → ${asB.status}`);
  const anon = await api("GET", "/materials/orders/my");
  assert(anon.status === 401, "déconnexion");
  results.push("9-10. Isolation A/B et session requise");

  const pages = await Promise.all(
    ["/", "/annonces", "/annonces?categorie=terrain", "/materiaux", "/mes-commandes", "/favoris"].map(
      async (path) => {
        const response = await fetch(`${WEB}${path}`);
        return [path, response.status];
      },
    ),
  );
  for (const [path, status] of pages) {
    assert(status === 200, `${path} → ${status}`);
  }
  results.push("11-16. Pages immobilières, terrains, favoris, matériaux, compte");

  console.log(results.map((line) => `OK  ${line}`).join("\n"));
  console.log(`Commande ${created.json.reference} statut=${created.json.status}`);
}

main().then(() => process.exit(0)).catch((error) => {
  console.error("FAIL", error.message);
  process.exit(1);
});
