const fs = require("fs");

(async () => {
  const r = await fetch("http://localhost:4000/properties", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Test Image Sanitize",
      type: "Terrain",
      operation: "VENTE",
      price: 1,
      area: 10,
      agencyId: "ag1",
      status: "ACTIF",
      city: "Conakry",
      images: ["https://example.com/a.jpg", "https://evil.cdn/hack.png"],
    }),
  });
  const p = await r.json();
  console.log("created_images", p.images);

  const list = await (
    await fetch("http://localhost:4000/properties?agencyId=ag1")
  ).json();
  const bad = list
    .flatMap((x) => x.images || [])
    .filter((i) => String(i).includes("example.com"));
  console.log("remaining_example_in_agency_props", bad.length);

  const a = fs.existsSync(
    "C:/Users/Ibrahima Djogo/Desktop/immobilier/public/images/properties/property-placeholder.jpg",
  );
  const b = fs.existsSync(
    "C:/Users/Ibrahima Djogo/Desktop/immo/public/images/properties/property-placeholder.jpg",
  );
  console.log("placeholders", { immobilier: a, immo: b });

  const db = fs.readFileSync(
    "C:/Users/Ibrahima Djogo/Desktop/immo-demo-api/data/db.json",
    "utf8",
  );
  console.log(
    "db_example_jpg",
    (db.match(/https:\/\/example\.com\/a\.jpg/g) || []).length,
  );
  console.log(
    "db_placeholder_count",
    (db.match(/\/images\/properties\/property-placeholder\.jpg/g) || [])
      .length,
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
