/**
 * Filtrage destinataire — propriétaire / agence / admin.
 */

const BASE = process.env.DEMO_API_URL || "http://localhost:4000";

async function request(method, path, body) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(`${method} ${path} → ${response.status} ${text}`);
  }
  return data;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function belongsToOwner(item, ownerId) {
  return item.recipientType === "OWNER" && item.recipientId === ownerId;
}

function belongsToAgency(item, agencyId) {
  return item.recipientType === "AGENCY" && item.recipientId === agencyId;
}

async function main() {
  const demande1 = await request("POST", "/fonciere-verifications", {
    propertyId: "prop-1788260777403",
    propertyTitle: "terrain a louer",
    requestMode: "ORIENTATION_SERVICE",
    requesterId: "u-filter-owner",
    requesterName: "Client A",
    requester: {
      userId: "u-filter-owner",
      fullName: "Client A",
      phone: "+224 620 11 11 11",
      email: "client-a@example.com",
      city: "Conakry",
      message: "Demande 1 propriétaire A",
    },
  });

  const demande2 = await request("POST", "/fonciere-verifications", {
    propertyId: "prop-1786455906258",
    propertyTitle: "Terrain a vendre a Hamdallaye",
    requestMode: "ACCOMPAGNEMENT_DEMEURE",
    requesterId: "u-filter-habitat",
    requesterName: "Client Habitat",
    requester: {
      userId: "u-filter-habitat",
      fullName: "Client Habitat",
      phone: "+224 620 22 22 22",
      email: "client-habitat@example.com",
      city: "Conakry",
      message: "Demande 2 Habitat Conakry",
    },
  });

  const demande3 = await request("POST", "/fonciere-verifications", {
    propertyId: "prop-other-agency",
    propertyTitle: "Terrain autre agence",
    requestMode: "ORIENTATION_SERVICE",
    agencyId: "ag-demo-1",
    agencyName: "Demeure Demo Agence",
    advertiserType: "AGENCE",
    requesterId: "u-filter-other",
    requesterName: "Client Autre",
    requester: {
      userId: "u-filter-other",
      fullName: "Client Autre",
      phone: "+224 620 33 33 33",
      email: "client-autre@example.com",
      city: "Conakry",
      message: "Demande 3 autre agence",
    },
  });

  assert(demande1.recipientType === "OWNER" && demande1.recipientId === "u1", "Demande 1: destinataire u1");
  assert(demande2.recipientType === "AGENCY" && demande2.recipientId === "ag1", "Demande 2: destinataire ag1");
  assert(
    demande3.recipientType === "AGENCY" && demande3.recipientId === "ag-demo-1",
    "Demande 3: destinataire ag-demo-1",
  );

  const list = await request("GET", "/fonciere-verifications");
  const ownerA = list.filter((item) => belongsToOwner(item, "u1"));
  const habitat = list.filter((item) => belongsToAgency(item, "ag1"));
  const otherAgency = list.filter((item) => belongsToAgency(item, "ag-demo-1"));

  assert(ownerA.some((item) => item.id === demande1.id), "Propriétaire A doit voir demande 1");
  assert(!ownerA.some((item) => item.id === demande2.id), "Propriétaire A ne doit pas voir demande 2");
  assert(!ownerA.some((item) => item.id === demande3.id), "Propriétaire A ne doit pas voir demande 3");

  assert(habitat.some((item) => item.id === demande2.id), "Habitat Conakry doit voir demande 2");
  assert(!habitat.some((item) => item.id === demande1.id), "Habitat Conakry ne doit pas voir demande 1");
  assert(!habitat.some((item) => item.id === demande3.id), "Habitat Conakry ne doit pas voir demande 3");

  assert(otherAgency.some((item) => item.id === demande3.id), "Autre agence doit voir demande 3");
  assert(list.some((item) => item.id === demande1.id), "Admin doit voir demande 1");
  assert(list.some((item) => item.id === demande2.id), "Admin doit voir demande 2");
  assert(list.some((item) => item.id === demande3.id), "Admin doit voir demande 3");

  const adminDetail = await request("GET", `/fonciere-verifications/${demande2.id}`);
  assert(adminDetail.recipientType === "AGENCY", "Admin détail: type Agence");
  assert(adminDetail.recipientName === "Habitat Conakry", "Admin détail: nom Habitat Conakry");
  assert(adminDetail.recipientId === "ag1", "Admin détail: identifiant ag1");

  console.log("OK filtrage destinataire");
  console.log(`d1=${demande1.id} owner=${demande1.recipientId}`);
  console.log(`d2=${demande2.id} habitat=${demande2.recipientName}`);
  console.log(`d3=${demande3.id} other=${demande3.recipientId}`);
  console.log(`admin=${list.length} ownerA=${ownerA.length} habitat=${habitat.length}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
