import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { ChatPageView } from "@/components/chat/chat-page-view";

export const metadata: Metadata = {
  title: `Student Success & Reviews | ${siteConfig.name}`,
  description: `Read verified student reviews, explore portfolio projects, and view compensation packages of our alumni at ${siteConfig.name}.`,
  alternates: { canonical: "/testimonials" },
};

export default function TestimonialsPage() {
  return <ChatPageView initialTopic="testimonials" />;
}
