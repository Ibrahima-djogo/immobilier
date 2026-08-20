const fs = require("fs");
const path = require("path");

const PLACEHOLDER = "/images/properties/property-placeholder.jpg";
const dbPath = path.join(__dirname, "..", "data", "db.json");

const raw = fs.readFileSync(dbPath, "utf8");
const beforeCount = (raw.match(/https:\/\/example\.com\/a\.jpg/g) || []).length;
console.log("before_count", beforeCount);

const db = JSON.parse(raw);

function fixImages(arr) {
  if (!Array.isArray(arr)) return { arr, n: 0 };
  let n = 0;
  const next = arr.map((v) => {
    if (
      typeof v === "string" &&
      /https?:\/\/(www\.)?example\.com\//i.test(v) &&
      !v.includes("@")
    ) {
      n += 1;
      return PLACEHOLDER;
    }
    return v;
  });
  return { arr: next, n };
}

let replaced = 0;
for (const prop of db.properties || []) {
  const r = fixImages(prop.images);
  prop.images = r.arr;
  replaced += r.n;
}
for (const listing of db.listings || []) {
  const r = fixImages(listing.images);
  listing.images = r.arr;
  replaced += r.n;
}

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf8");
const after = fs.readFileSync(dbPath, "utf8");
const afterCount = (after.match(/https:\/\/example\.com\/a\.jpg/g) || []).length;
console.log("replaced", replaced);
console.log("after_count", afterCount);

const hosts = new Map();
function note(url) {
  if (typeof url !== "string" || !url) return;
  if (url.includes("@")) return;
  if (url.startsWith("data:image")) {
    hosts.set("data:image", (hosts.get("data:image") || 0) + 1);
    return;
  }
  if (url.startsWith("/")) {
    hosts.set("local", (hosts.get("local") || 0) + 1);
    return;
  }
  try {
    const h = new URL(url).hostname;
    hosts.set(h, (hosts.get(h) || 0) + 1);
  } catch {
    hosts.set("invalid", (hosts.get("invalid") || 0) + 1);
  }
}
for (const p of db.properties || []) (p.images || []).forEach(note);
for (const l of db.listings || []) (l.images || []).forEach(note);
for (const a of db.agencies || []) {
  note(a.logo);
  note(a.image);
  (a.images || []).forEach(note);
}
console.log("hosts", Object.fromEntries(hosts));
