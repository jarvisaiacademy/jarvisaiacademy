import {
  collection,
  getCountFromServer,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  type Query,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CourseItem } from "@/data/courses";
import { CandidateStatus, StudentRecord, type AccountRole } from "@/data/students";

export const PAGE_SIZES = [10, 25, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZES)[number];
export const DEFAULT_PAGE_SIZE: PageSize = 10;

/**
 * A field/value equality pair.
 *
 * Equality only, deliberately. Firestore can combine an equality filter with the `orderBy`
 * these pages need, but every distinct combination wants its own composite index — so the
 * shape of a filter is also the shape of the index list in `firestore.indexes.json`. Anything
 * a range or a substring would need is done on the loaded page instead.
 */
export type EqualityFilter = readonly [field: string, value: string | boolean];

/**
 * The equality filters one roster page implies.
 *
 * Pure and exported so the rule can be read without a database. `is_teacher` is a flag on the
 * user document rather than a collection of its own, and `accountRoleOf` gives an account the
 * strongest role it holds — so a teacher is specifically a non-admin carrying the flag, and
 * the `role` clause is what stops the two admins who are also faculty appearing under Teachers
 * as well as under Admins.
 */
export function rosterFilters(
  role: AccountRole,
  status: "all" | CandidateStatus
): EqualityFilter[] {
  const filters: EqualityFilter[] =
    role === "admin"
      ? [["role", "admin"]]
      : role === "teacher"
        ? [
            ["is_teacher", true],
            ["role", "student"],
          ]
        : [
            ["role", "student"],
            ["is_teacher", false],
          ];

  // A status filter is an equality filter like any other, which is why `pnpm db backfill users`
  // writes `active` onto the documents that never had one: everywhere else in the dashboard an
  // absent status reads as active, and a query cannot express "absent or active".
  if (status !== "all") filters.push(["status", status]);

  return filters;
}

/** The catalogue's one server-side filter. The search box narrows the loaded page instead. */
export function courseFilters(category: string): EqualityFilter[] {
  return category === "all" ? [] : [["category", category]];
}

function buildQuery<T>(
  collectionName: string,
  filters: EqualityFilter[],
  orderByField: string,
  size: number,
  cursor: QueryDocumentSnapshot | null
): Query<T> | null {
  if (!db) return null;

  const constraints: QueryConstraint[] = [
    ...filters.map(([field, value]) => where(field, "==", value)),
    orderBy(orderByField),
  ];
  // The cursor is the last document of the previous page. Page one has none, which is what
  // makes it the only page that can be reached without having loaded the one before it.
  if (cursor) constraints.push(startAfter(cursor));
  constraints.push(limit(size));

  return query(collection(db, collectionName), ...constraints) as unknown as Query<T>;
}

/** Up to `size` roster rows for one page, in the same name order the roster used to sort to. */
export function buildRosterQuery(
  role: AccountRole,
  status: "all" | CandidateStatus,
  size: number,
  cursor: QueryDocumentSnapshot | null
): Query<StudentRecord> | null {
  return buildQuery<StudentRecord>("users", rosterFilters(role, status), "name", size, cursor);
}

/** Up to `size` catalogue rows for one page, ordered by the course number the table shows. */
export function buildCoursesQuery(
  category: string,
  size: number,
  cursor: QueryDocumentSnapshot | null
): Query<CourseItem> | null {
  return buildQuery<CourseItem>("courses", courseFilters(category), "number", size, cursor);
}

/**
 * How many rows the current filter set matches, so the footer can name the last page.
 *
 * `getCountFromServer` bills a fraction of a document read per row rather than one read per
 * row, and it is the only way to know the size of a set the client deliberately does not hold.
 *
 * ponytail: the count is a snapshot, taken when the page subscribes, not a live figure. A row
 * inserted while an admin sits on the table does not move "of N" until they page or filter
 * again. Upgrade path is a periodic re-count, which is only worth it if the count is ever
 * shown somewhere an admin would act on without navigating first.
 */
async function countMatching(collectionName: string, filters: EqualityFilter[]): Promise<number> {
  if (!db) return 0;

  const constraints = filters.map(([field, value]) => where(field, "==", value));
  const snapshot = await getCountFromServer(query(collection(db, collectionName), ...constraints));
  return snapshot.data().count;
}

export function countRoster(role: AccountRole, status: "all" | CandidateStatus): Promise<number> {
  return countMatching("users", rosterFilters(role, status));
}

export function countCourses(category: string): Promise<number> {
  return countMatching("courses", courseFilters(category));
}
