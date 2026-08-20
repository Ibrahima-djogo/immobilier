/**
 * EXEMPLE NON ACTIF.
 *
 * Renommez ce fichier en middleware.ts uniquement après intégration
 * de l’authentification Spring Boot et après définition des cookies
 * sécurisés HTTP-only.
 *
 * Le front-end ne doit jamais considérer un rôle stocké côté navigateur
 * comme une preuve suffisante. Le backend reste la source de vérité.
 */

import { NextResponse, type NextRequest } from "next/server";

const protectedPrefixes = [
  "/tableau-de-bord",
  "/profil",
  "/securite",
  "/favoris",
  "/notifications",
  "/demandes-contact",
  "/demande-role",
  "/proprietaire",
  "/agence",
  "/administration",
];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const protectedRoute = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (!protectedRoute) return NextResponse.next();

  const sessionMarker = request.cookies.get("dg_session")?.value;

  if (!sessionMarker) {
    const loginUrl = new URL("/connexion", request.url);
    loginUrl.searchParams.set("retour", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/tableau-de-bord/:path*",
    "/profil/:path*",
    "/securite/:path*",
    "/favoris/:path*",
    "/notifications/:path*",
    "/demandes-contact/:path*",
    "/demande-role/:path*",
    "/proprietaire/:path*",
    "/agence/:path*",
    "/administration/:path*",
  ],
};
