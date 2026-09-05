import type { MetadataRoute } from "next";

const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/login", "/register"],
      // dashboard/portal require auth and have nothing worth indexing; the
      // per-company routes are wildcarded since /{slug}/login and
      // /{slug}/portal exist for every tenant and aren't meant for search
      disallow: ["/dashboard", "/onboarding", "/*/login", "/*/portal", "/*/change-password"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
