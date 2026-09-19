import type { Metadata } from "next";
import Link from "next/link";
import { CourseItem } from "@/data/courses";
import { getPublicCourses } from "@/lib/courses-server";
import { siteConfig } from "@/config/site";

// The catalogue is admin-editable in Firestore, so this page revalidates instead of
// freezing at build. Read it through getPublicCourses() — never COURSES_DATA, which is
// only that helper's fallback.
export const revalidate = 300;

const COURSES_URL = `${siteConfig.url}/courses`;

// Derived from the catalogue rather than written into the copy, so a price change
// is one edit in Firestore. The referral entry is not a track with tuition, and
// `Set` keeps this honest if the paid tracks ever stop sharing one fee.
//
// A function, not module-scope constants: those evaluate once, and a static
// `metadata` object is frozen at build, so neither would follow a Firestore edit.
function summarise(courses: CourseItem[]) {
  return {
    paidFees: [
      ...new Set(courses.filter((c) => c.id !== "referral" && c.amount > 0).map((c) => c.fee)),
    ].join(" / "),
    sponsored: courses.find((c) => c.amount === 0),
    // Every entry except the referral reward scheme.
    trackCount: courses.filter((c) => c.id !== "referral").length,
    total: courses.length,
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const { paidFees, trackCount, total } = summarise(await getPublicCourses());
  return {
    title: "Courses",
    // Every number here comes from the catalogue, so a fee change cannot leave the
    // result snippet advertising the old one.
    description: `${trackCount} build-first programs at ${siteConfig.name}, Pune. Tuition ${paidFees} all-inclusive — fees, duration, curriculum and tech stack for every track.`,
    alternates: { canonical: "/courses" },
    openGraph: {
      title: `Courses | ${siteConfig.name}`,
      description: `${total} build-first programs — see fees, duration and curriculum for each.`,
      url: COURSES_URL,
      siteName: siteConfig.name,
      images: [
        {
          url: `${siteConfig.url}/og-image.png`,
          width: 1200,
          height: 630,
          alt: siteConfig.name,
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `Courses | ${siteConfig.name}`,
      description: `${total} build-first programs — see fees, duration and curriculum for each.`,
      images: [`${siteConfig.url}/og-image.png`],
    },
  };
}

function FactPill({ children, strong }: { children: React.ReactNode; strong?: boolean }) {
  return (
    <span
      className={`px-2 py-0.5 rounded-full border ${
        strong
          ? "border-neutral-300 dark:border-white/20 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold"
          : "border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/[0.03] text-neutral-600 dark:text-neutral-400"
      }`}
    >
      {children}
    </span>
  );
}

export default async function CoursesIndexPage() {
  const courses = await getPublicCourses();
  const { paidFees, sponsored } = summarise(courses);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 pt-10 sm:pt-14">
      <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight">
        Courses at {siteConfig.name}
      </h1>
      <p className="mt-3 max-w-2xl text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
        {siteConfig.description}
      </p>
      <p className="mt-3 max-w-2xl text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
        Tuition is {paidFees} all-inclusive on the paid tracks
        {sponsored && (
          <>
            , and the {sponsored.bannerTitle} is fully sponsored at {sponsored.fee}
          </>
        )}
        {"."}
      </p>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        Not sure which track fits?{" "}
        <Link href="/" className="font-medium text-[#9d5932] dark:text-[#ea580c] hover:underline">
          Ask the admissions assistant
        </Link>
        .
      </p>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((course) => (
          <Link
            key={course.id}
            href={`/courses/${course.id}`}
            className="group flex flex-col overflow-hidden rounded-3xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#191919] shadow-xs transition-colors hover:border-neutral-300 dark:hover:border-white/25"
          >
            <div
              className={`bg-gradient-to-br ${course.gradient} flex flex-col gap-1.5 px-4 py-5`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/85 text-[11px] font-extrabold text-neutral-900">
                  {course.number}
                </span>
                {course.badge && (
                  <span className="rounded-full border border-white/30 bg-white/25 px-2 py-0.5 text-[10px] font-bold text-white">
                    {course.badge}
                  </span>
                )}
              </div>
              <h2 className="text-base font-semibold leading-snug text-white">
                {course.bannerTitle}
              </h2>
              <p className="text-xs leading-snug text-white/85">{course.bannerSubtitle}</p>
            </div>

            <div className="flex flex-1 flex-col gap-3 p-4">
              <p className="text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                {course.description}
              </p>
              <div className="mt-auto flex flex-wrap gap-1.5 text-[11px]">
                <FactPill>{course.duration}</FactPill>
                <FactPill>{course.level}</FactPill>
                <FactPill strong>{course.fee}</FactPill>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
