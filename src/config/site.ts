export const siteConfig = {
  name: "Jarvis AI Academy",
  shortName: "Jarvis AI",
  tagline: "For the vibe code generation.",
  description:
    "60-day build-first AI & full-stack engineering program in Pune. 1-on-1 mentorship, real portfolio projects, and 100% placement assurance on the Super10 Elite batch.",
  url: "https://jarvisaiacademy.com",
  /** Square brand mark, transparent so it sits on both themes. */
  logo: "/logo-mark.png",
  contact: {
    email: "admissions@jarvisaiacademy.com",
    financeEmail: "finance@jarvisaiacademy.com",
    phone: "+91 91729 11988",
  },
  links: {
    facebook: "https://www.facebook.com/jarvisaiacademy/",
    instagram: "https://www.instagram.com/jarvisaiacademy/",
    youtube: "https://www.youtube.com/@JarvisAIAcademy",
    linkedin: "https://www.linkedin.com/company/jarvisaiacademy/",
    twitter: "https://x.com/jarvisaiacademy",
    github: "https://github.com/jarvisaiacademy",
  },
} as const;

export type SiteConfig = typeof siteConfig;
