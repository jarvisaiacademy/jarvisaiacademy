export type TeacherStatus = "active" | "inactive";

// Lives here rather than in the service so `courses-service` can reach it without
// importing the service that imports `courses-service`.
export const TEACHERS_COLLECTION = "teachers";

/**
 * A teacher is a record an admin maintains by hand — **not** a login. There is no
 * auth account, no email and no role, so nothing here can authorize anything.
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
