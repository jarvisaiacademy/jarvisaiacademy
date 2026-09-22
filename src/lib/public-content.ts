import type { CourseItem } from "@/data/courses";

export interface PublicContent {
  courses: CourseItem[];
}

let pending: Promise<PublicContent> | null = null;

/**
 * The cached public payload — the catalogue, in one request.
 *
 * Every provider that needs it asks on the same tick and the answer is the same for all of
 * them, so the promise is remembered for the life of the page rather than the request being
 * made twice.
 *
 * The academy's own figures are not in here: they are hard-coded in `src/data/app-settings.ts`
 * and never leave the browser's bundle, so there is nothing to fetch for them.
 *
 * A failure is deliberately not remembered: the next caller gets a fresh attempt instead of
 * the cached rejection.
 */
export function fetchPublicContent(): Promise<PublicContent> {
  pending ??= fetch("/api/public-content")
    .then((res) => {
      if (!res.ok) throw new Error(`/api/public-content responded ${res.status}`);
      return res.json() as Promise<PublicContent>;
    })
    .catch((err: unknown) => {
      pending = null;
      throw err;
    });

  return pending;
}
