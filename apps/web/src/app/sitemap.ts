import type { MetadataRoute } from "next";

import { env } from "@/lib/config/env";
import { appRoutes } from "@/lib/routes/app-routes";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return appRoutes
    .filter((route) => route.indexable)
    .map((route) => ({
      url: `${env.siteUrl}${route.path === "/" ? "" : route.path}`,
      lastModified: now,
      changeFrequency:
        route.path === "/annonces" ? "daily" : "monthly",
      priority:
        route.path === "/" ? 1 : route.path === "/annonces" ? 0.9 : 0.6,
    }));
}
