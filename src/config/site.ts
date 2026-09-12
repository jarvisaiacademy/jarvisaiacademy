export const siteConfig = {
  name: "Jarvis AI Academy",
  shortName: "Jarvis AI",
  tagline: "For the no-code generation.",
  description: "Jarvis AI Academy — For the no-code generation.",
  url: "https://jarvisaiacademy.netlify.app",
  contact: {
    email: "admissions@jarvisaiacademy.com",
    financeEmail: "finance@jarvisaiacademy.com",
    phone: "+91 91729 11988",
  },
} as const;

export type SiteConfig = typeof siteConfig;
