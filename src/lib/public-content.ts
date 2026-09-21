import type { CourseItem } from "@/data/courses";
import type { AppSettings } from "@/data/app-settings";

export interface PublicContent {
  courses: CourseItem[];
  settings: AppSettings;
}

let pending: Promise<PublicContent> | null = null;

/**
 * The cached public payload — the catalogue and the academy settings in one request.
 *
 * Both providers ask for this on the same tick and the answer is the same for both, so the
 * promise is remembered for the life of the page rather than the request being made twice.
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
