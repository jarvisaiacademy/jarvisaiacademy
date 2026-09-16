import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { COURSES_DATA } from "@/data/courses";

export default function sitemap(): MetadataRoute.Sitemap {
  // The chat, the course index and one page per catalogue entry. /settings is
  // account UI and stays out.
  return [
    {
      url: siteConfig.url,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteConfig.url}/courses`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...COURSES_DATA.map((course) => ({
      url: `${siteConfig.url}/courses/${course.id}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
