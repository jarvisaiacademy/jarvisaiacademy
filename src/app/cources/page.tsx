import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { ChatPageView } from "@/components/chat/chat-page-view";

export const metadata: Metadata = {
  title: `Courses | ${siteConfig.name}`,
  description: `Explore all intensive 60-day software engineering and AI programs at ${siteConfig.name}.`,
  alternates: { canonical: "/cources" },
};

export default function CourcesPage() {
  return <ChatPageView initialTopic="courses" />;
}
