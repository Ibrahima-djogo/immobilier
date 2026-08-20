import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const appDir = path.join(root, "src", "app");
const sourceDir = path.join(root, "src");

const ignoredHrefPrefixes = [
  "http://",
  "https://",
  "mailto:",
  "tel:",
  "#",
  "javascript:",
];

const mojibakeTokens = ["Ã", "Â", "â€™", "â€œ", "â€", "ðŸ"];

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function routeFromPage(pageFile) {
  const relative = path.relative(appDir, path.dirname(pageFile));
  const segments = relative
    .split(path.sep)
    .filter(Boolean)
    .filter((segment) => !(segment.startsWith("(") && segment.endsWith(")")));

  if (!segments.length) return "/";

  return `/${segments.join("/")}`;
}

function routePattern(route) {
  const pattern = route
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\\\[\.\.\.[^\]]+\\\]/g, ".+")
    .replace(/\\\[\[\.\.\.[^\]]+\\\]\\\]/g, ".*")
    .replace(/\\\[[^\]]+\\\]/g, "[^/]+");

  return new RegExp(`^${pattern}/?$`);
}

const files = walk(sourceDir);
const pageFiles = files.filter((file) => file.endsWith(`${path.sep}page.tsx`));
const routes = pageFiles.map(routeFromPage);
const routePatterns = routes.map((route) => ({
  route,
  pattern: routePattern(route),
}));

const issues = [];
const warnings = [];

for (const file of files.filter((value) => /\.(tsx?|jsx?|mjs|css)$/.test(value))) {
  const content = fs.readFileSync(file, "utf8");
  const relative = path.relative(root, file);

  for (const token of mojibakeTokens) {
    if (content.includes(token)) {
      issues.push(`${relative}: encodage suspect détecté (${token})`);
      break;
    }
  }

  const cssImports = [...content.matchAll(/from\s+["'](.+?\.module\.css)["']/g)];
  for (const match of cssImports) {
    const cssPath = path.resolve(path.dirname(file), match[1]);
    if (!fs.existsSync(cssPath)) {
      issues.push(`${relative}: CSS Module introuvable -> ${match[1]}`);
    }
  }

  const hrefs = [...content.matchAll(/href\s*=\s*["']([^"']+)["']/g)]
    .map((match) => match[1])
    .filter((href) => !ignoredHrefPrefixes.some((prefix) => href.startsWith(prefix)))
    .filter((href) => href.startsWith("/"));

  for (const href of hrefs) {
    const pathname = href.split("?")[0].split("#")[0];
    const exists = routePatterns.some(({ pattern }) => pattern.test(pathname));

    if (!exists) {
      warnings.push(`${relative}: lien local sans route détectée -> ${href}`);
    }
  }

  const routeArrayEntries = [
    ...content.matchAll(/\[\s*["'](\/[^"']*)["']\s*,\s*["'][^"']+["']\s*\]/g),
  ].map((match) => match[1]);

  const duplicateEntries = routeArrayEntries.filter(
    (entry, index, values) => values.indexOf(entry) !== index,
  );

  for (const duplicate of new Set(duplicateEntries)) {
    issues.push(`${relative}: route dupliquée dans un tableau -> ${duplicate}`);
  }
}

console.log("\nDEMEURE GUINEE — AUDIT FRONT-END\n");
console.log(`Pages détectées : ${routes.length}`);
console.log(`Fichiers analysés : ${files.length}`);

if (warnings.length) {
  console.log("\nAVERTISSEMENTS :");
  warnings.forEach((warning) => console.log(`- ${warning}`));
}

if (issues.length) {
  console.error("\nERREURS À CORRIGER :");
  issues.forEach((issue) => console.error(`- ${issue}`));
  process.exitCode = 1;
} else {
  console.log("\n[OK] Aucun doublon de route, CSS manquant ou encodage suspect détecté.");
}

console.log("\nRoutes principales :");
routes.sort().forEach((route) => console.log(`- ${route}`));
