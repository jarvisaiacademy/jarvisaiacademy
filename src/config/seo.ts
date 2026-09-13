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
