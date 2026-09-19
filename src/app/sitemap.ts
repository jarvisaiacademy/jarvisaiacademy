import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { getPublicCourses } from "@/lib/courses-server";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const courses = await getPublicCourses();

  // The chat, the course index, one page per catalogue entry, and the privacy policy
  // (which Google's consent screen requires to be reachable). /settings is account UI
  // and stays out.
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
    ...courses.map((course) => ({
      url: `${siteConfig.url}/courses/${course.id}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    {
      url: `${siteConfig.url}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
