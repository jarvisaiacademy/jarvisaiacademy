import { cache } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CourseItem, COURSES_DATA } from "@/data/courses";

/**
 * The catalogue as the public pages should render it.
 *
 * Deliberately not `courses-service.ts`: that file imports `checkIsAdmin` from
 * `auth-provider.tsx`, which is a Client Component, so pulling it in here would drag
 * the browser auth graph into the server render.
 *
 * `cache()` dedupes the read across `generateStaticParams`, `generateMetadata` and the
 * page body within a single render pass. It is per-request, so it cannot go stale.
 */
export const getPublicCourses = cache(async (): Promise<CourseItem[]> => {
  // The fallback is filtered too. Without it, retiring a course in the seed file would hold
  // until Firestore had a bad minute and then quietly put the course back on the site.
  const fallback = COURSES_DATA.filter(isPublic);

  if (!db) return fallback;

  try {
    const snap = await getDocs(collection(db, "courses"));
    if (snap.empty) return fallback;
    // The doc id is authoritative: routing and /courses/<slug> key off it, and a course
    // created through the dashboard stores it in the body only incidentally.
    return snap.docs
      .map((doc) => ({ ...(doc.data() as CourseItem), id: doc.id }))
      .filter(isPublic);
  } catch (err) {
    // Falling back silently would make a broken read look like a working one.
    console.warn("[courses] Firestore read failed, serving COURSES_DATA:", err);
    return fallback;
  }
});

/**
 * An admin retires a course by setting `status: "inactive"` — nothing is deleted, because
 * the slug is in the sitemap and `assignments` reference it.
 *
 * The filter belongs here and nowhere else. `/courses`, `/courses/<slug>`,
 * `src/app/sitemap.ts` and `/llms.txt` all read through `getPublicCourses`, so a retired
 * course leaves the catalogue, the sitemap and the AI summary together.
 *
 * Absent means active: the seeded catalogue predates the field and must not vanish.
 */
export function isPublic(course: CourseItem): boolean {
  return (course.status ?? "active") !== "inactive";
}
