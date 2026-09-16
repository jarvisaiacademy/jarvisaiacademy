import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Nothing is disallowed on purpose:
      // - the admin dashboard has no route (it renders inside / behind auth), so
      //   there is no URL to exclude;
      // - /settings carries `noindex` from app/settings/layout.tsx. A Disallow
      //   here would stop the crawl before that tag could ever be read.
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
