import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Nothing is disallowed on purpose:
      // - /admin and /settings carry `noindex` from their segment layouts. A
      //   Disallow here would stop the crawl before those tags could be read.
      // - the admin dashboard's content is behind a client-side auth gate and is
      //   never in the HTML, so there is nothing for a crawler to index anyway.
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
