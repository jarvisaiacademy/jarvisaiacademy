export const siteConfig = {
  name: "Jarvis AI Academy",
  shortName: "Jarvis AI",
  tagline: "For the vibe code generation.",
  description: "Jarvis AI Academy — For the vibe code generation.",
  url: "https://jarvisaiacademy.com",
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
