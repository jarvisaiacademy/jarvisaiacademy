import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Jarvis AI Academy",
  description: "ChatGPT-inspired AI Chat Application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} dark h-full antialiased font-sans`}
    >
      <body className="h-full bg-black text-white antialiased overflow-hidden selection:bg-[#9d5932] selection:text-white font-sans">
        {children}
      </body>
    </html>
  );
}
