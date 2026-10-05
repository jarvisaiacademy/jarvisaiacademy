import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { getPublicCourses } from "@/lib/courses-server";
import { ChatPageView } from "@/components/chat/chat-page-view";

export const revalidate = 300;

export async function generateStaticParams() {
  const courses = await getPublicCourses();
  return courses.map((course) => ({ slug: course.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const courses = await getPublicCourses();
  const course = courses.find((c) => c.id === slug);
  const title = course ? `${course.title} | ${siteConfig.name}` : `Course | ${siteConfig.name}`;
  const description = course?.description || `Explore course curriculum and roadmap at ${siteConfig.name}.`;

  return {
    title,
    description,
    alternates: { canonical: `/cource/${slug}` },
  };
}

export default async function CourceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ChatPageView initialTopic={slug} />;
}
