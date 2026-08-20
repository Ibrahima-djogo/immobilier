(async () => {
  const base = "http://localhost:4000";
  const j = async (url, opts) => {
    const r = await fetch(url, opts);
    const b = await r.json();
    return { status: r.status, body: b };
  };

  const list = await j(base + "/properties");
  const check =
    list.body.find((p) => p.id === "prop-1786464658795") || list.body[0];
  console.log("CHECK_OWNER", {
    id: check.id,
    city: check.city,
    commune: check.commune,
    district: check.district,
    landmark: check.landmark,
    adminAddress: check.adminAddress,
    locationLabel: check.locationLabel,
    coordinates: check.coordinates,
    area: check.area,
    desc: (check.description || "").slice(0, 50),
  });

  const created = await j(base + "/properties", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Villa E2E Localisation Complete",
      type: "Villa",
      operation: "VENTE",
      price: 250000000,
      area: 220,
      bedrooms: 4,
      bathrooms: 3,
      city: "Conakry",
      commune: "Ratoma",
      district: "Nongo",
      landmark: "Pres du marche de Nongo",
      description: "Villa de test E2E avec localisation complete.",
      locationLabel: "Nongo, Ratoma, Conakry",
      adminAddress: "Nongo, Ratoma, Conakry",
      latitude: 9.62,
      longitude: -13.61,
      locationConfirmed: true,
      ownerId: "u1",
      agencyId: null,
      images: [
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80",
      ],
      status: "ACTIF",
    }),
  });
  console.log("CREATE", created.status, {
    city: created.body.city,
    commune: created.body.commune,
    district: created.body.district,
    landmark: created.body.landmark,
    coordinates: created.body.coordinates,
  });

  const adminCreated = await j(base + "/admin/properties", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Email": "admin@demeureguinee.com",
    },
    body: JSON.stringify({
      title: "Terrain Admin Complet",
      type: "Terrain",
      operation: "VENTE",
      price: 90000000,
      area: 400,
      city: "Conakry",
      commune: "Ratoma",
      district: "Lambanyi",
      landmark: "Pres du Lycee Francais",
      description: "Terrain cree par admin avec localisation.",
      latitude: 9.64,
      longitude: -13.57,
      locationConfirmed: true,
      agencyId: "ag1",
      ownerId: null,
      images: [
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=86",
      ],
    }),
  });
  console.log("ADMIN_CREATE", adminCreated.status, {
    city: adminCreated.body.city,
    district: adminCreated.body.district,
    landmark: adminCreated.body.landmark,
    coords: adminCreated.body.coordinates,
    createdBy: adminCreated.body.createdByAdminId,
    agencyId: adminCreated.body.agencyId,
  });

  const incomplete = list.body.filter(
    (p) => !p.city || !p.commune || !p.district || !p.coordinates,
  ).length;
  console.log("INCOMPLETE_AFTER_MIGRATE", incomplete);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
