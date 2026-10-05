import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { ChatPageView } from "@/components/chat/chat-page-view";

export const metadata: Metadata = {
  title: `Verify Credentials & Certificate | ${siteConfig.name}`,
  description: `View tamper-proof cryptographic certificates, verify graduate credentials, and share on LinkedIn with ${siteConfig.name}.`,
  alternates: { canonical: "/certificate" },
};

export default function CertificatePage() {
  return <ChatPageView initialTopic="certificate" />;
}
