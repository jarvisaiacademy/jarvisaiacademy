import type { CourseItem } from "@/data/courses";
import { siteConfig } from "./site";

// Site-wide JSON-LD. Derived from siteConfig so brand, contact and social data
// cannot drift from the copy and the sidebar. Rendered once, in app/layout.tsx.
export const structuredData = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: siteConfig.name,
  alternateName: siteConfig.shortName,
  url: siteConfig.url,
  logo: `${siteConfig.url}/logo.png`,
  description: siteConfig.description,
  email: siteConfig.contact.email,
  telephone: siteConfig.contact.phone,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Pune",
    addressRegion: "Maharashtra",
    addressCountry: "IN",
  },
  sameAs: [
    siteConfig.links.linkedin,
    siteConfig.links.instagram,
    siteConfig.links.youtube,
    siteConfig.links.twitter,
    siteConfig.links.facebook,
  ],
} as const;

/**
 * Per-programme JSON-LD for `/courses/<id>`.
 *
 * Every value is read from the catalogue or siteConfig, so the markup cannot claim
 * a price or a duration the page does not also show. Only the fields we actually
 * hold are emitted — no `hasCourseInstance` or `courseMode`, because nothing in
 * COURSES_DATA says how a batch is delivered or when it starts, and a guessed value
 * here would be a fact invented for a crawler.
 *
 * Callers must skip the referral entry: it is a reward scheme, not a course, and
 * typing it as one would describe it as something it is not.
 */
export function courseStructuredData(course: CourseItem) {
  const url = `${siteConfig.url}/courses/${course.id}`;

  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.description,
    url,
    provider: {
      "@type": "EducationalOrganization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    offers: {
      "@type": "Offer",
      category: course.amount === 0 ? "Free" : "Paid",
      price: String(course.amount),
      priceCurrency: "INR",
      url,
    },
  };
}
