import type { MetadataRoute } from "next";
import { SITE, absoluteUrl } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private, per-user or transactional screens have nothing worth indexing.
      disallow: ["/api/", "/dashboard", "/cart", "/checkout", "/profile", "/become-creator"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: SITE.url,
  };
}
