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
  if (!db) return COURSES_DATA;

  try {
    const snap = await getDocs(collection(db, "courses"));
    if (snap.empty) return COURSES_DATA;
    // The doc id is authoritative: routing and /courses/<slug> key off it, and a course
    // created through the dashboard stores it in the body only incidentally.
    return snap.docs.map((doc) => ({ ...(doc.data() as CourseItem), id: doc.id }));
  } catch (err) {
    // Falling back silently would make a broken read look like a working one.
    console.warn("[courses] Firestore read failed, serving COURSES_DATA:", err);
    return COURSES_DATA;
  }
});
