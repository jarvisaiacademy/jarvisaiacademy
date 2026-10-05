import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { ChatPageView } from "@/components/chat/chat-page-view";

export const metadata: Metadata = {
  title: `Connect with Admissions | ${siteConfig.name}`,
  description: `Book a 1-on-1 counseling session, get syllabus advice, and reserve batch seating at ${siteConfig.name}.`,
  alternates: { canonical: "/enquiry" },
};

export default function EnquiryPage() {
  return <ChatPageView initialTopic="enquiry" />;
}
