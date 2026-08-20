const fs = require("fs");
const path = require("path");

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (entry.name === "page.tsx") acc.push(full);
  }
  return acc;
}

function needsClient(code) {
  return (
    /use(State|Effect|Memo|Callback|Ref|Reducer)\s*\(/.test(code) ||
    /\bon[A-Z][a-zA-Z]+\s*=\s*\{/.test(code) ||
    /\b(usePathname|useRouter|useSearchParams|useParams)\s*\(/.test(code)
  );
}

const adminRoot = path.join("src", "app", "(admin)", "administration");
const staticAdmin = [];
for (const file of walk(adminRoot)) {
  const code = fs.readFileSync(file, "utf8");
  if (code.includes('"use client"') && !needsClient(code)) {
    staticAdmin.push(file);
  }
}
console.log("STATIC_ADMIN_COUNT", staticAdmin.length);
staticAdmin.forEach((f) => console.log(f));

function stripBeforeContent(cssPath) {
  const css = fs.readFileSync(cssPath, "utf8");
  const markers = ["\n.content {", "\n.content{"];
  let idx = -1;
  let marker = "";
  for (const m of markers) {
    const i = css.indexOf(m);
    if (i !== -1 && (idx === -1 || i < idx)) {
      idx = i;
      marker = m;
    }
  }
  if (idx === -1) {
    console.log("SKIP (no .content):", cssPath);
    return;
  }
  const before = css.slice(0, idx);
  const next = css.slice(idx + 1); // drop leading newline already in marker via slice(idx+1) -> starts with .content
  // Ensure .content keeps box-sizing tokens if stripped .page had them - most files redefine on .content
  fs.writeFileSync(cssPath, next);
  console.log(
    "STRIPPED",
    cssPath,
    Math.round(before.length / 1024) + "KB -> " + Math.round(next.length / 1024) + "KB",
  );
}

const userCss = [
  "src/app/(dashboard)/tableau-de-bord/page.module.css",
  "src/app/(dashboard)/favoris/page.module.css",
  "src/app/(dashboard)/profil/page.module.css",
  "src/app/(dashboard)/securite/page.module.css",
  "src/app/(dashboard)/notifications/page.module.css",
  "src/app/(dashboard)/demandes-contact/page.module.css",
];

console.log("CSS_STRIP");
for (const file of userCss) {
  if (fs.existsSync(file)) stripBeforeContent(file);
}

for (const file of staticAdmin) {
  let code = fs.readFileSync(file, "utf8");
  const next = code.replace(/^["']use client["'];\r?\n\r?\n?/, "");
  if (next !== code) {
    fs.writeFileSync(file, next);
    console.log("SERVERIZED", file);
  }
}
