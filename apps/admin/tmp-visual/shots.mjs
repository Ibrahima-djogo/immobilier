// Script jetable : captures d'écran des pages admin pour valider AdminPageHero.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.ADMIN_URL || "http://localhost:3001";
const OUT = "tmp-visual/out";
mkdirSync(OUT, { recursive: true });

const PAGES = [
  ["dashboard", "/"],
  ["annonces-liste", "/annonces"],
  ["annonce-detail", "/annonces/ad-1786728698766"],
  ["utilisateurs-liste", "/utilisateurs"],
  ["utilisateur-detail", "/utilisateurs/u1"],
  ["roles-liste", "/demandes-role"],
  ["role-detail", "/demandes-role/rr-demo-agency-pending"],
  ["agence-detail", "/agences/ag1"],
  ["biens-liste", "/biens"],
  ["bien-detail", "/biens/prop-1786728699150"],
  ["parametres", "/parametres"],
  ["referentiels-villes", "/referentiels/villes"],
  ["signalements-liste", "/signalements"],
  ["contacts-liste", "/contacts"],
];

const VIEWPORTS = [
  ["desktop", { width: 1440, height: 1000 }],
  ["tablette", { width: 900, height: 1000 }],
  ["mobile", { width: 390, height: 900 }],
];

const browser = await chromium.launch();

for (const [device, viewport] of VIEWPORTS) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();

  await page.goto(`${BASE}/connexion`, { waitUntil: "domcontentloaded" });
  await page.fill('input[type="email"]', "admin@demeureguinee.com");
  await page.fill('input[type="password"]', "DemoAdmin123");
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes("connexion"), {
    timeout: 20000,
  });

  const targets = device === "desktop" ? PAGES : PAGES.slice(0, 8);

  for (const [name, path] of targets) {
    await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);
    const h1 = await page.locator("h1").allTextContents();
    console.log(`${device} ${path} -> h1(${h1.length}): ${h1.join(" | ")}`);
    await page.screenshot({ path: `${OUT}/${device}-${name}.png` });
  }

  await context.close();
}

await browser.close();
console.log("done");
