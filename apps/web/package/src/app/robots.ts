import type { MetadataRoute } from "next";

import { env } from "@/lib/config/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/administration",
          "/tableau-de-bord",
          "/proprietaire",
          "/agence/tableau-de-bord",
          "/profil",
          "/securite",
          "/favoris",
          "/notifications",
          "/demandes-contact",
          "/demande-role",
        ],
      },
    ],
    sitemap: `${env.siteUrl}/sitemap.xml`,
  };
}
