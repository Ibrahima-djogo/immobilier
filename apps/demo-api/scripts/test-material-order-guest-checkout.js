/**
 * Tests étape 1 — commandes invitée / connectée + mode de réception.
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

function customer(name, email, phone = "+224 620 55 44 33") {
  return {
    name,
    phone,
    email,
    city: "Conakry",
    district: "Kaloum",
    address: "Quartier Almamya, villa test",
    comment: "Test guest checkout",
  };
}

async function main() {
  const results = [];
  assert((await api("GET", "/health")).status === 200, "API indisponible");

  const guestPickup = await api("POST", "/materials/orders", {
    customer: customer("Invité Retrait", `guest-pickup-${STAMP}@example.com`),
    deliveryMode: "RETRAIT_DEPOT",
    items: [{ productId: "mp-ciment-42-5", quantity: 1 }],
    userId: "user-demo-1",
  });
  assert(guestPickup.status === 201, `invité retrait → ${guestPickup.status}`);
  assert(!guestPickup.json.userId, "userId du body accepté pour un invité");
  assert(guestPickup.json.deliveryMode === "RETRAIT_DEPOT", "mode retrait");
  assert(guestPickup.json.deliveryFee === 0, "frais retrait");
  assert(guestPickup.json.subtotal === 100000, "sous-total retrait");
  assert(guestPickup.json.totalAmount === 100000, "total retrait");
  assert(guestPickup.json.accessToken, "jeton invité manquant");
  results.push("Invité + retrait : userId ignoré, frais 0, jeton renvoyé");

  const guestDelivery = await api("POST", "/materials/orders", {
    customer: customer("Invité Livraison", `guest-liv-${STAMP}@example.com`),
    deliveryMode: "LIVRAISON",
    items: [{ productId: "mp-ciment-42-5", quantity: 1 }],
  });
  assert(guestDelivery.status === 201, `invité livraison → ${guestDelivery.status}`);
  assert(guestDelivery.json.deliveryMode === "LIVRAISON", "mode livraison");
  assert(guestDelivery.json.deliveryFee == null, "frais livraison encore ouverts");
  assert(guestDelivery.json.totalAmount === guestDelivery.json.subtotal, "total = sous-total");
  results.push("Invité + livraison : frais à confirmer");

  const badMode = await api("POST", "/materials/orders", {
    customer: customer("Mode invalide", `bad-mode-${STAMP}@example.com`),
    deliveryMode: "EXPRESS",
    items: [{ productId: "mp-ciment-42-5", quantity: 1 }],
  });
  assert(badMode.status === 400 && badMode.json.code === "INVALID_DELIVERY_MODE", "mode invalide");

  const lookup = await api("POST", "/materials/orders/lookup", {
    reference: guestPickup.json.reference,
    phone: "+224620554433",
  });
  assert(lookup.status === 200, `lookup → ${lookup.status}`);
  assert(lookup.json.id === guestPickup.json.id, "lookup mauvaise commande");
  assert(lookup.json.accessToken, "lookup sans jeton");

  const lookupWrong = await api("POST", "/materials/orders/lookup", {
    reference: guestPickup.json.reference,
    phone: "+224 620 00 00 00",
  });
  assert(lookupWrong.status === 404, "lookup téléphone étranger");

  const list = await api("GET", "/materials/orders");
  const listed = list.json.find((item) => item.id === guestPickup.json.id);
  assert(listed && !listed.accessToken, "jeton exposé dans la liste admin");
  assert(!listed.userId, "invité absent de la liste admin");
  results.push("Lookup référence + téléphone ; jeton absent de la liste");

  const signup = await api("POST", "/auth/register", {
    firstName: "Compte",
    lastName: "Checkout",
    email: `connected-${STAMP}@demeureguinee.test`,
    phone: "+224 620 10 20 30",
    password: "Demo1234!",
  });
  assert(signup.status === 201, `register → ${signup.status}`);
  const token = signup.json.token || signup.json.user.id;
  const connected = await api(
    "POST",
    "/materials/orders",
    {
      customer: customer("Compte Checkout", signup.json.user.email, "+224 620 10 20 30"),
      deliveryMode: "RETRAIT_DEPOT",
      items: [{ productId: "mp-ciment-42-5", quantity: 1 }],
      userId: "user-demo-1",
    },
    { Authorization: `Bearer ${token}` },
  );
  assert(connected.status === 201, `connecté → ${connected.status}`);
  assert(connected.json.userId === signup.json.user.id, "userId Bearer perdu");
  results.push("Connecté : userId = Bearer, body.userId ignoré");

  await api("POST", `/materials/orders/${guestPickup.json.id}/cancel`);
  await api("POST", `/materials/orders/${guestDelivery.json.id}/cancel`);
  await api("POST", `/materials/orders/${connected.json.id}/cancel`);

  console.log(results.map((line) => `OK  ${line}`).join("\n"));
}

main().catch((error) => {
  console.error("FAIL", error.message);
  process.exit(1);
});
