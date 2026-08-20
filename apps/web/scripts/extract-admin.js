/**
 * Extraction script: immobilier → immobilier-admin
 * Run from immobilier root. Does NOT modify source admin files.
 */
const fs = require("fs");
const path = require("path");

const SRC = path.resolve(__dirname, "..");
const DEST = path.resolve(SRC, "..", "immobilier-admin");

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function copyFile(from, to) {
  ensureDir(path.dirname(to));
  fs.copyFileSync(from, to);
}

function copyDir(from, to) {
  if (!fs.existsSync(from)) return;
  ensureDir(to);
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const s = path.join(from, entry.name);
    const d = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else copyFile(s, d);
  }
}

function write(file, content) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, content, "utf8");
}

function rewriteAdminUrls(text) {
  return text
    .replaceAll("/administration/referentiels/", "/referentiels/")
    .replaceAll("/administration/demandes-role", "/demandes-role")
    .replaceAll("/administration/signalements", "/signalements")
    .replaceAll("/administration/administrateurs", "/administrateurs")
    .replaceAll("/administration/utilisateurs", "/utilisateurs")
    .replaceAll("/administration/annonces", "/annonces")
    .replaceAll("/administration/moderation", "/moderation")
    .replaceAll("/administration/statistiques", "/statistiques")
    .replaceAll("/administration/parametres", "/parametres")
    .replaceAll("/administration/contenus", "/contenus")
    .replaceAll("/administration/audit", "/audit")
    .replaceAll("/administration/referentiels", "/referentiels")
    .replaceAll('"/administration"', '"/"')
    .replaceAll("'/administration'", "'/'")
    .replaceAll("`/administration`", "`/`")
    .replaceAll('href="/administration"', 'href="/"')
    .replaceAll("href='/administration'", "href='/'");
}

function copyAndRewrite(from, to) {
  let text = fs.readFileSync(from, "utf8");
  text = rewriteAdminUrls(text);
  // routes helpers → new admin routes
  text = text
    .replaceAll("routes.adminUsers", "routes.users")
    .replaceAll("routes.adminUser(", "routes.user(")
    .replaceAll("routes.adminAds", "routes.ads")
    .replaceAll("routes.adminAd(", "routes.ad(")
    .replaceAll("routes.adminReports", "routes.reports")
    .replaceAll("routes.adminReport(", "routes.report(")
    .replaceAll("routes.adminRoleRequests", "routes.roleRequests")
    .replaceAll("routes.adminRoleRequest(", "routes.roleRequest(")
    .replaceAll("routes.adminAdmins", "routes.admins")
    .replaceAll("routes.admin", "routes.dashboard");
  write(to, text);
}

if (fs.existsSync(DEST)) {
  console.error("Destination already exists:", DEST);
  console.error("Delete it first or choose another path.");
  process.exit(1);
}

ensureDir(DEST);
console.log("Creating", DEST);

// ---- configs ----
write(
  path.join(DEST, "package.json"),
  JSON.stringify(
    {
      name: "immobilier-admin",
      version: "0.1.0",
      private: true,
      scripts: {
        dev: "next dev -p 3001",
        build: "next build",
        start: "next start -p 3001",
        lint: "eslint",
      },
      dependencies: {
        "lucide-react": "^1.28.0",
        next: "16.2.12",
        react: "19.2.4",
        "react-dom": "19.2.4",
      },
      devDependencies: {
        "@tailwindcss/postcss": "^4",
        "@types/node": "^20",
        "@types/react": "^19",
        "@types/react-dom": "^19",
        "babel-plugin-react-compiler": "1.0.0",
        eslint: "^9",
        "eslint-config-next": "16.2.12",
        tailwindcss: "^4",
        typescript: "^5",
      },
    },
    null,
    2,
  ) + "\n",
);

copyFile(path.join(SRC, "tsconfig.json"), path.join(DEST, "tsconfig.json"));
copyFile(
  path.join(SRC, "postcss.config.mjs"),
  path.join(DEST, "postcss.config.mjs"),
);
copyFile(
  path.join(SRC, "eslint.config.mjs"),
  path.join(DEST, "eslint.config.mjs"),
);
copyFile(
  path.join(SRC, "next-env.d.ts"),
  path.join(DEST, "next-env.d.ts"),
);

if (fs.existsSync(path.join(SRC, ".gitignore"))) {
  copyFile(path.join(SRC, ".gitignore"), path.join(DEST, ".gitignore"));
}

write(
  path.join(DEST, "next.config.ts"),
  `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
`,
);

write(
  path.join(DEST, ".env.example"),
  `NEXT_PUBLIC_APP_NAME="Demeure Guinée Administration"
NEXT_PUBLIC_API_URL="http://localhost:8080"
NEXT_PUBLIC_PUBLIC_SITE_URL="http://localhost:3000"
`,
);

write(
  path.join(DEST, ".env.local"),
  `NEXT_PUBLIC_APP_NAME="Demeure Guinée Administration"
NEXT_PUBLIC_API_URL="http://localhost:8080"
NEXT_PUBLIC_PUBLIC_SITE_URL="http://localhost:3000"
`,
);

write(
  path.join(DEST, "AGENTS.md"),
  `<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in \`node_modules/next/dist/docs/\` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
`,
);

write(
  path.join(DEST, "CLAUDE.md"),
  `@AGENTS.md
`,
);

// ---- globals ----
copyFile(
  path.join(SRC, "src", "app", "globals.css"),
  path.join(DEST, "src", "app", "globals.css"),
);

write(
  path.join(DEST, "src", "app", "layout.tsx"),
  `import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces, Manrope } from "next/font/google";

import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Demeure Guinée — Administration",
    template: "%s | Administration Demeure Guinée",
  },
  description: "Interface d’administration de Demeure Guinée.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="fr" className={\`\${fraunces.variable} \${manrope.variable}\`}>
      <body>{children}</body>
    </html>
  );
}
`,
);

write(
  path.join(DEST, "src", "app", "robots.ts"),
  `import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
`,
);

write(
  path.join(DEST, "src", "app", "not-found.tsx"),
  `import Link from "next/link";

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#f8f6f0",
      }}
    >
      <section
        style={{
          padding: 30,
          border: "1px solid #dce6df",
          borderRadius: 16,
          background: "#fff",
          textAlign: "center",
        }}
      >
        <h1 style={{ color: "#0f3527" }}>Ressource introuvable</h1>
        <p style={{ color: "#647169" }}>
          La ressource administrative demandée n’existe pas.
        </p>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            marginTop: 12,
            color: "#246448",
            fontWeight: 800,
            textDecoration: "none",
          }}
        >
          Retour au tableau de bord
        </Link>
      </section>
    </main>
  );
}
`,
);

// ---- copy admin pages: administration/* → app/* ----
const adminRoot = path.join(SRC, "src", "app", "(admin)", "administration");
function walkPages(dir, rel = "") {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const s = path.join(dir, entry.name);
    const r = path.join(rel, entry.name);
    if (entry.isDirectory()) {
      walkPages(s, r);
      continue;
    }
    // Map page.tsx at root of administration → app/page.tsx
    // Map utilisateurs/page.tsx → utilisateurs/page.tsx
    // Skip not-found (we have global), keep error/loading at root
    let destRel = r;
    if (rel === "" && entry.name === "page.tsx") {
      destRel = "page.tsx";
    } else if (rel === "" && entry.name === "page.module.css") {
      destRel = "page.module.css";
    } else if (rel === "" && entry.name === "not-found.tsx") {
      continue; // use global not-found
    } else if (rel === "" && (entry.name === "error.tsx" || entry.name === "loading.tsx")) {
      destRel = entry.name;
    }

    const dest = path.join(DEST, "src", "app", destRel);
    if (/\.(tsx|ts|css)$/.test(entry.name)) {
      copyAndRewrite(s, dest);
    } else {
      copyFile(s, dest);
    }
  }
}
walkPages(adminRoot);

// ---- components ----
copyDir(
  path.join(SRC, "src", "components", "administration"),
  path.join(DEST, "src", "components", "administration"),
);
copyDir(
  path.join(SRC, "src", "components", "charts"),
  path.join(DEST, "src", "components", "charts"),
);
copyDir(
  path.join(SRC, "src", "components", "dashboard"),
  path.join(DEST, "src", "components", "dashboard"),
);
copyDir(
  path.join(SRC, "src", "components", "ui"),
  path.join(DEST, "src", "components", "ui"),
);

// Rewrite AdminShell urls after copy
const adminShellPath = path.join(
  DEST,
  "src",
  "components",
  "administration",
  "AdminShell.tsx",
);
let adminShell = fs.readFileSync(adminShellPath, "utf8");
adminShell = rewriteAdminUrls(adminShell);

// Insert PUBLIC_SITE_URL helper and point logout + optional "voir le site"
adminShell = adminShell.replace(
  'import { useSidebarCollapsed } from "@/hooks/useSidebarCollapsed";',
  `import { useSidebarCollapsed } from "@/hooks/useSidebarCollapsed";

const PUBLIC_SITE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || "http://localhost:3000";`,
);

adminShell = adminShell.replace(
  `<Link href="/" className={styles.logout} title="Se déconnecter">
              <LogOut size={17} />
              <span className={styles.navText}>Se déconnecter</span>
            </Link>`,
  `<a
              href={PUBLIC_SITE_URL}
              className={styles.logout}
              title="Retour au site public"
            >
              <LogOut size={17} />
              <span className={styles.navText}>Se déconnecter</span>
            </a>`,
);

write(adminShellPath, adminShell);

// ---- hooks ----
copyFile(
  path.join(SRC, "src", "hooks", "useDebouncedValue.ts"),
  path.join(DEST, "src", "hooks", "useDebouncedValue.ts"),
);
copyFile(
  path.join(SRC, "src", "hooks", "useSidebarCollapsed.ts"),
  path.join(DEST, "src", "hooks", "useSidebarCollapsed.ts"),
);

// ---- lib ----
copyDir(
  path.join(SRC, "src", "lib", "administration"),
  path.join(DEST, "src", "lib", "administration"),
);
copyFile(
  path.join(SRC, "src", "lib", "demo-charts.ts"),
  path.join(DEST, "src", "lib", "demo-charts.ts"),
);

write(
  path.join(DEST, "src", "lib", "routes", "app-routes.ts"),
  `/** Helpers de navigation — frontend Administration Demeure Guinée */
export const routes = {
  dashboard: "/",
  users: "/utilisateurs",
  user: (id: string) => \`/utilisateurs/\${id}\`,
  admins: "/administrateurs",
  ads: "/annonces",
  ad: (id: string) => \`/annonces/\${id}\`,
  reports: "/signalements",
  report: (id: string) => \`/signalements/\${id}\`,
  roleRequests: "/demandes-role",
  roleRequest: (id: string) => \`/demandes-role/\${id}\`,
  moderation: "/moderation",
  contents: "/contenus",
  audit: "/audit",
  statistics: "/statistiques",
  settings: "/parametres",
  references: "/referentiels",
  referenceCities: "/referentiels/villes",
  referenceDistricts: "/referentiels/quartiers",
  referenceCategories: "/referentiels/categories",
  referenceAmenities: "/referentiels/equipements",
} as const;
`,
);

// Minimal public folder
ensureDir(path.join(DEST, "public"));
write(
  path.join(DEST, "public", ".gitkeep"),
  "",
);

// Copy favicon if any
for (const asset of ["favicon.ico", "next.svg", "vercel.svg", "file.svg", "globe.svg", "window.svg"]) {
  const p = path.join(SRC, "public", asset);
  if (fs.existsSync(p)) copyFile(p, path.join(DEST, "public", asset));
}

console.log("Extraction copy complete.");
console.log("Next: npm install && rewrite verification");
