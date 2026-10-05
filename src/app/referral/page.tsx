import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { ChatPageView } from "@/components/chat/chat-page-view";

export const metadata: Metadata = {
  title: `Refer & Earn ₹3,000 | ${siteConfig.name}`,
  description: `Refer a peer to any 60-day program and receive a ₹3,000 cash reward upon their course completion at ${siteConfig.name}.`,
  alternates: { canonical: "/referral" },
};

export default function ReferralPage() {
  return <ChatPageView initialTopic="referral" />;
}
