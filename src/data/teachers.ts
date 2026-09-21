export type TeacherStatus = "active" | "inactive";

// Lives here rather than in the service so `courses-service` can reach it without
// importing the service that imports `courses-service`.
export const TEACHERS_COLLECTION = "teachers";

/**
 * A teacher is a **signed-in user an admin has designated as faculty**, so `id` is
 * that user's uid and `teachers/{uid}` is the document. Keying by uid rather than a
 * generated id is what makes "this person is already a teacher" answerable, and what
 * stops the same account being added twice under two names.
 *
 * Being a teacher grants nothing on its own. `users/{uid}.role` is left alone: it is
 * recomputed from the admin allowlist on every sign-in, and no rule or guard reads a
 * teacher role, so writing one would only create a field that reverts.
 *
 * `name` is the user's name as it stood when the admin added them. The dashboard prefers
 * the live value off `users` and falls back to this, which keeps the roster renderable
 * even if a user document goes missing.
 *
 * `courseIds` mirrors `CourseItem.teacherIds` and the two are written in one batch
 * (`src/services/teachers-service.ts`); neither side is ever edited alone.
 */
export interface TeacherRecord {
  id: string;
  name: string;
  mobile: string;
  courseIds: string[];
  status: TeacherStatus;
  createdAt: string;
  updatedAt: string;
}
