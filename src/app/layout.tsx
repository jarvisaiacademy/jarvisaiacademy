import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { ThemeProvider } from "@/providers/theme-provider";
import { LanguageProvider } from "@/providers/language-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { CoursesProvider } from "@/providers/courses-provider";
import { StudentsProvider } from "@/providers/students-provider";
import { AssignmentsProvider } from "@/providers/assignments-provider";
import { ShortcutGuide } from "@/components/ui/shortcut-guide";

import { siteConfig } from "@/config/site";
import { structuredData } from "@/config/seo";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export const metadata: Metadata = {
  // Needed for the relative canonical below, and as a guard for any future
  // relative URL field.
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  alternates: { canonical: "/" },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
  // Absolute URLs on purpose. The app-directory opengraph-image/twitter-image
  // file conventions ignore metadataBase and emit the dev origin
  // (http://localhost:3000) in the built HTML, which breaks every share preview.
  openGraph: {
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    images: [
      {
        url: `${siteConfig.url}/og-image.png`,
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} — ${siteConfig.tagline}`,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    images: [`${siteConfig.url}/og-image.png`],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${geistMono.variable} dark h-full antialiased font-sans`}
    >
      <head>
        {/* Anti-flash auth script executed before initial paint. The theme class is
            next-themes' own pre-paint script, injected by ThemeProvider. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var user = localStorage.getItem('jarvis_auth_user');
                  if (user && user !== 'null') {
                    document.documentElement.classList.add('is-auth');
                  } else {
                    document.documentElement.classList.remove('is-auth');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="h-full bg-background text-foreground antialiased overflow-hidden selection:bg-[#9d5932] selection:text-white font-sans transition-colors duration-150">
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <CoursesProvider>
                <StudentsProvider>
                  <AssignmentsProvider>
                    {children}
                    {/* Renders nothing until opened, so it adds no markup to the HTML. */}
                    <ShortcutGuide />
                  </AssignmentsProvider>
                </StudentsProvider>
              </CoursesProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

