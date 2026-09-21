import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicCourses } from "@/lib/courses-server";
import { COURSE_KB_KEY, academyKnowledge } from "@/data/academy-knowledge";
import { courseStructuredData } from "@/config/seo";
import { siteConfig } from "@/config/site";
import { MarkdownRenderer } from "@/components/chat/markdown-renderer";

/**
 * One page per catalogue entry, rendered from the same strings the chat replies
 * with. The point is that a crawler — which cannot click a sidebar row — reads the
 * answer, and a visitor landing here can carry the conversation on into the chat.
 */
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
  if (!course) return {};

  const url = `${siteConfig.url}/courses/${course.id}`;

  return {
    // The root layout's template appends "| Jarvis AI Academy", and its canonical
    // of "/" would otherwise be inherited by every one of these pages.
    title: course.title,
    description: course.description,
    alternates: { canonical: `/courses/${course.id}` },
    openGraph: {
      title: `${course.title} | ${siteConfig.name}`,
      description: course.description,
      url,
      siteName: siteConfig.name,
      images: [
        {
          url: `${siteConfig.url}/og-image.png`,
          width: 1200,
          height: 630,
          alt: course.title,
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${course.title} | ${siteConfig.name}`,
      description: course.description,
      images: [`${siteConfig.url}/og-image.png`],
    },
  };
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const courses = await getPublicCourses();
  const course = courses.find((c) => c.id === slug);
  if (!course) notFound();

  const kbKey = COURSE_KB_KEY[course.id];
  const answer = kbKey ? academyKnowledge[kbKey] : undefined;

  // The referral entry is a reward scheme, not a course — describing it as one in
  // structured data would be a claim the page does not make anywhere else.
  const structuredData =
    course.id === "referral" ? null : courseStructuredData(course);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 pt-8">
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}

      <Link
        href="/courses"
        className="text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:underline"
      >
        ← All courses
      </Link>

      <section
        className={`mt-4 bg-gradient-to-br ${course.gradient} rounded-3xl px-5 sm:px-7 py-7 flex flex-col gap-2`}
      >
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/85 text-xs font-extrabold text-neutral-900">
            {course.number}
          </span>
          {course.badge && (
            <span className="rounded-full border border-white/30 bg-white/25 px-2.5 py-0.5 text-[11px] font-bold text-white">
              {course.badge}
            </span>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
          {course.title}
        </h1>
        <p className="text-sm text-white/85">{course.bannerSubtitle}</p>
        <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-sm text-white">
          <span>
            <span className="text-white/70">Duration: </span>
            {course.duration}
          </span>
          <span>
            <span className="text-white/70">Level: </span>
            {course.level}
          </span>
          <span className="font-semibold">Tuition: {course.fee}</span>
        </div>
      </section>

      <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-2.5">
        <Link
          href="/?topic=enroll"
          className="inline-flex items-center justify-center rounded-full bg-neutral-900 dark:bg-white px-5 py-2.5 text-sm font-semibold text-white dark:text-neutral-900 transition-colors hover:opacity-90"
        >
          Reserve my seat
        </Link>
        <Link
          href={`/?topic=${course.id}`}
          className="inline-flex items-center justify-center rounded-full border border-neutral-300 dark:border-white/15 px-5 py-2.5 text-sm font-semibold text-neutral-800 dark:text-neutral-100 transition-colors hover:bg-neutral-100 dark:hover:bg-white/5"
        >
          Continue in chat
        </Link>
        <a
          href={`tel:${siteConfig.contact.phone}`}
          className="inline-flex items-center justify-center px-2 py-2.5 text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:underline"
        >
          Talk to admissions
        </a>
      </div>

      {/* The bot's own answer, rendered from the knowledge base, so the page cannot
          drift from what the chat says. MarkdownRenderer is a client component, but
          it renders on the server too — the text is in the HTML a crawler reads. */}
      {answer && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            What this programme is
          </h2>
          <div className="mt-3">
            <MarkdownRenderer content={answer.text} />
          </div>
          {answer.showCourseCatalog && (
            <Link
              href="/courses"
              className="mt-3 inline-block text-sm font-medium text-[#9d5932] dark:text-[#ea580c] hover:underline"
            >
              See all {courses.length} programmes →
            </Link>
          )}
        </section>
      )}

      {course.topics.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            What&apos;s covered
          </h2>
          <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {course.topics.map((topic) => (
              <li
                key={topic}
                className="rounded-2xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/[0.03] px-3.5 py-2.5 text-[13px] text-neutral-700 dark:text-neutral-300"
              >
                {topic}
              </li>
            ))}
          </ul>
        </section>
      )}

      {course.techStack.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            Tech stack
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {course.techStack.map((tech) => (
              <span
                key={tech}
                className="rounded-full border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#191919] px-3 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-300"
              >
                {tech}
              </span>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
