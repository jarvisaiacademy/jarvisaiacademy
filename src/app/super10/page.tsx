import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { ChatPageView } from "@/components/chat/chat-page-view";

export const metadata: Metadata = {
  title: `Super10 Elite Program | ${siteConfig.name}`,
  description: `The selective 10-student program (60 Days / ₹0 — fully sponsored) with 100% placement assurance at ${siteConfig.name}.`,
  alternates: { canonical: "/super10" },
};

export default function Super10Page() {
  return <ChatPageView initialTopic="super10" />;
}
