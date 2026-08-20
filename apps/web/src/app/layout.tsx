import type { Metadata } from "next";
import type { ReactNode } from "react";
import { FavoritesProvider } from "@/context/FavoritesContext";

import "./globals.css";

export const metadata: Metadata = {
  title: "Demeure Guinée | Immobilier en Guinée",
  description:
    "Plateforme de recherche et de publication d’annonces immobilières fiables en Guinée.",
  icons: {
    icon: [{ url: "/icon", type: "image/png" }],
    shortcut: "/favicon.ico",
  },
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

/**
 * Polices via CSS (pas next/font/google) pour que le build
 * ne dépende pas du réseau Google Fonts.
 */
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,100..900&family=Manrope:wght@200..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <FavoritesProvider>{children}</FavoritesProvider>
      </body>
    </html>
  );
}
