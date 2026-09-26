"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Users,
  IndianRupee,
  GraduationCap,
  ArrowLeft,
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
  Award,
  Plus,
  Sparkles,
  BookOpen,
  Layers,
  AlertCircle,
  Star,
} from "lucide-react";
import { useCourses } from "@/providers/courses-provider";
import { useStudents } from "@/providers/students-provider";
import { useAuth } from "@/providers/auth-provider";
import { updateCandidateInFirestore } from "@/services/students-service";
import { accountRoleOf, CandidateStatus, StudentRecord, type AccountRole } from "@/data/students";
import { APP_SETTINGS } from "@/data/app-settings";
import { academyKnowledge } from "@/data/academy-knowledge";
import { isPublic } from "@/lib/courses-server";
import {
  CourseItem,
  COURSE_CATEGORIES,
  CourseCategoryId,
  CourseStatus,
  stackDisplay,
} from "@/data/courses";
import { DevIcon } from "@/components/ui/dev-icon";
import { StatusSwitch } from "@/components/ui/switch";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useToast } from "@/components/ui/toast";

import { DashboardTab } from "@/components/layout/dashboard-sidebar-nav";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminKnowledge } from "@/components/admin/admin-knowledge";
import { AdminReferrals } from "@/components/admin/admin-referrals";
import { AdminAdmins } from "@/components/admin/admin-admins";
import { AdminStudents } from "@/components/admin/admin-students";
import { AdminTeachers } from "@/components/admin/admin-teachers";
import { AdminCourses } from "@/components/admin/admin-courses";
import { AdminUsers } from "@/components/admin/admin-users";
import { ROLE_BADGE } from "@/components/admin/role-badge";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page-header";
import { TablePagination } from "@/components/ui/table-pagination";
import { usePagedQuery } from "@/hooks/use-paged-query";
import {
  buildCoursesQuery,
  buildRosterQuery,
  countCourses,
  countRoster,
  DEFAULT_PAGE_SIZE,
  type PageSize,
} from "@/services/pagination";
import { shortcutById } from "@/data/shortcuts";
import { isTypingTarget, matchesShortcut } from "@/lib/keyboard";

interface EnrollmentRecord {
  action: string;
  courseId: string;
  courseName: string;
  amount: number;
  transactionId: string;
  studentName: string;
  studentEmail: string;
  timestamp: string;
}

/** Roster rows carry the ISO string written at sign-in; show it like the ledger's dates. */
function formatSignIn(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * The framing around each role's roster table. The table is the same three times, so the
 * words that differ — the page title in the header, and what an empty page means — are
 * stated once here rather than inline three times.
 */
const ROLE_PAGE = {
  student: {
    title: "Students",
    empty: "No learner accounts yet — nobody has signed in with Google.",
  },
  admin: {
    title: "Admins",
    empty: "No admin accounts found.",
  },
  teacher: {
    title: "Teachers",
    empty: "No faculty yet — mark an account as Teacher from the Teacher column.",
  },
} as const satisfies Record<AccountRole, unknown>;

interface AdminDashboardProps {
  activeTab?: DashboardTab;
  onChangeTab?: (tab: DashboardTab) => void;
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export function AdminDashboard({
  activeTab: controlledTab,
  onChangeTab,
  sidebarOpen = true,
  onToggleSidebar,
}: AdminDashboardProps) {
  const { showToast } = useToast();
  const { user } = useAuth();
  const {
    students,
    loading: studentsLoading,
    error: studentsError,
  } = useStudents();
  // `firestoreCourses`, not `courses`: this tab lists what is in the database. With the
  // COURSES_DATA fallback in front of it the twelve built-in courses appeared here as if they
  // were stored, and saving one failed the write because no such document existed.
  const {
    firestoreCourses: courses,
    loading: coursesLoading,
    editCourse,
    removeCourse,
  } = useCourses();

  // Firestore has no joins, so the courses table assembles its own. A course's `teacherIds` are
  // user ids, and `studentsById` is where their names and pictures come from.
  const studentsById = useMemo(() => {
    const map = new Map(students.map((s) => [s.id, s] as const));
    return map;
  }, [students]);

  const [localTab, setLocalTab] = useState<DashboardTab>("courses");
  const activeTab: DashboardTab = controlledTab || localTab;
  const setActiveTab = (tab: DashboardTab) => {
    setLocalTab(tab);
    onChangeTab?.(tab);
  };

  // Admissions state
  const [records, setRecords] = useState<EnrollmentRecord[]>([]);


  // Candidate rows are edited on the spot — the two admin-owned fields are the whole
  // edit surface, so a modal would be a dialog around two controls.
  const [busyCandidateId, setBusyCandidateId] = useState<string | null>(null);

  // The roster's filters. One pair of them, shared by the three role pages — they filter the
  // same table — and cleared when the page changes, because a query typed while looking at
  // Students would otherwise keep hiding rows on Teachers with nothing on screen to say so.
  // Adjusted during render rather than in an effect, so the reset lands in the same commit as
  // the new tab and the next page never paints a filtered table for a frame.
  const [rosterQuery, setRosterQuery] = useState("");
  const [rosterStatus, setRosterStatus] = useState<"all" | CandidateStatus>("all");
  const [filtersTab, setFiltersTab] = useState(activeTab);

  if (filtersTab !== activeTab) {
    setFiltersTab(activeTab);
    setRosterQuery("");
    setRosterStatus("all");
  }

  // The roster is three pages that share one table, and exactly one of them is mounted at a
  // time, so there is one query rather than three. `null` while no role page is open: the hook
  // then holds nothing and subscribes to nothing.
  const rosterRole: AccountRole | null =
    activeTab === "students" ? "student"
    : activeTab === "admins" ? "admin"
    : null;

  const rosterPage = usePagedQuery<StudentRecord>({
    enabled: rosterRole !== null,
    // The search box is deliberately absent from this key: it narrows the page already loaded,
    // so folding it in would re-run the query on every keystroke for the same rows.
    filterKey: `${rosterRole}|${rosterStatus}`,
    buildQuery: (_page, size, cursor) =>
      rosterRole ? buildRosterQuery(rosterRole, rosterStatus, size, cursor) : null,
    count: () => (rosterRole ? countRoster(rosterRole, rosterStatus) : Promise.resolve(0)),
  });


  const handleCandidateStatus = async (uid: string, status: CandidateStatus) => {
    setBusyCandidateId(uid);
    try {
      await updateCandidateInFirestore(uid, { status }, user?.email);
      showToast(`Candidate marked ${status}`, "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to update candidate", "error");
    } finally {
      setBusyCandidateId(null);
    }
  };


  const handleToggleSuper10 = async (uid: string, current: boolean) => {
    const next = !current;
    setBusyCandidateId(uid);
    try {
      await updateCandidateInFirestore(uid, { is_super10: next }, user?.email);
      showToast(next ? "Super10 granted" : "Super10 removed", "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to update candidate", "error");
    } finally {
      setBusyCandidateId(null);
    }
  };

  const handleUpdateReferralCode = async (uid: string, current: string | undefined) => {
    const next = window.prompt("Enter a 4-letter VIP referral code (or leave blank to remove and use auto-generated):", current || "");
    if (next === null) return; // cancelled
    
    const cleaned = next.trim().toUpperCase().replace(/[^A-Z]/g, "");
    if (next.trim() !== "" && cleaned.length !== 4) {
      showToast("VIP Code must be exactly 4 letters.", "error");
      return;
    }

    setBusyCandidateId(uid);
    try {
      await updateCandidateInFirestore(uid, { referralCode: next.trim() === "" ? "" : cleaned }, user?.email);
      showToast(cleaned ? "VIP Code assigned" : "VIP Code removed", "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to update candidate", "error");
    } finally {
      setBusyCandidateId(null);
    }
  };

  // Fills the roster defaults onto rows that predate the sign-in writing them. Those rows are
  // invisible to the Students page, whose filter is `is_teacher == false` — a `==` never matches
  // an absent field, so the sidebar counts them and the table cannot list them.
  //
  // Only the fields that are missing, so a value an admin set deliberately is never overwritten:
  // a teacher keeps `true`, a banned candidate keeps `banned`. Once every row carries both, the
  // loop finds nothing to write and costs one pass over data already in memory.
  const healedRoster = useRef(false);
  useEffect(() => {
    if (healedRoster.current || students.length === 0) return;
    healedRoster.current = true;

    for (const candidate of students) {
      const patch: { is_teacher?: boolean; status?: CandidateStatus } = {};
      if (candidate.is_teacher === undefined) patch.is_teacher = false;
      if (candidate.status === undefined) patch.status = "active";
      if (Object.keys(patch).length === 0) continue;

      updateCandidateInFirestore(candidate.id, patch, user?.email).catch((err) => {
        console.warn("[AdminDashboard] Could not write roster defaults for", candidate.id, err);
      });
    }
  }, [students, user?.email]);

  // The ledger is the enrolments that actually happened, read back from the tracker
  // the chat writes. A hardcoded set of demo students used to be merged in here, which
  // showed fabricated registrations as though they were real ones.
  useEffect(() => {
    // Dynamic import to avoid SSR issues if this component gets SSR'd
    import("firebase/firestore").then(({ collection, onSnapshot, query }) => {
      import("@/lib/firebase").then(({ db }) => {
        if (!db) return;
        const q = query(collection(db, "enrollments"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const fetched = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          } as unknown as EnrollmentRecord));
          
          fetched.sort((a, b) => {
            const tA = new Date(a.timestamp).getTime() || 0;
            const tB = new Date(b.timestamp).getTime() || 0;
            return tB - tA;
          });
          
          setRecords(fetched);
        });
        
        // Cannot easily return unsubscribe from a dynamic import effect without more complex state
        // This is a minimal refactor.
      });
    });
  }, []);

  // Only live while the dashboard is mounted, so these never fight the shortcuts
  // on the chat view.
  const totalPaidRevenue = records
    .filter((r) => r.action === "paid")
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const totalPaidStudents = records.filter((r) => r.action === "paid").length;
  const super10Count = records.filter(
    (r) => r.courseId === "super10" && r.action === "paid"
  ).length;

  // The academy's business figures, hard-coded in `src/data/app-settings.ts`. Changing one is a
  // code change and a deploy, on purpose: the same numbers are printed on the receipt and the
  // enrolment card, and an editor that can disagree with the receipt is worse than no editor.
  const { referralReward, super10Seats } = APP_SETTINGS;
  // Pricing is quoted all-inclusive, so the tax breakdown divides tax back out rather than
  // adding it on. `gstRatePercent` is a percentage — 18, not 0.18 — so the fraction is derived
  // here, in the one place that needs it.
  const gstDivisor = 1 + APP_SETTINGS.gstRatePercent / 100;


  // A candidate's status cell. Three states in two controls, and only an admin can move them:
  // the `users` rule pins both fields to their stored values for a self-write, so a banned
  // candidate cannot clear their own ban.
  //
  // A ban is not the same thing as an inactivity, so it is not the same click. While banned the
  // switch is disabled and reads "Banned" — a block a stray flick could lift would be no block
  // at all — and Unban is the way back.
  const renderCandidateStatus = (student: StudentRecord) => {
    // Absent means active. The sign-in upsert deliberately never writes `status`, so treating a
    // missing one as anything but active would paint the whole roster red.
    const isActive = (student.status ?? "active") === "active";
    const busy = busyCandidateId === student.id;
    const who = student.name || student.email;

    return (
      <div className="flex items-center gap-3">
        <StatusSwitch
          checked={isActive}
          offLabel="Inactive"
          disabled={busy}
          onCheckedChange={(next) => handleCandidateStatus(student.id, next ? "active" : "inactive")}
          label={`Active status for ${who}`}
        />
      </div>
    );
  };

  // The roster split three ways, one page per role, so every account is listed under the role
  // it holds rather than all of them under a "Students" heading. Built from the same rule the
  // badge reads, so a page holds everybody whose badge names that role, and nobody twice.
  const rosterByRole: Record<AccountRole, StudentRecord[]> = {
    student: [],
    teacher: [],
    admin: [],
  };
  for (const student of students) rosterByRole[accountRoleOf(student)].push(student);

  // The table on its own. The page below supplies the framing around it, so the markup for a
  // row exists once for all three roles.
  const renderRosterTable = (role: AccountRole, empty: string) => {
    // The page the query returned, not the whole roster: the providers' full arrays are still
    // what the Home cards and the courses table's teacher names read.
    const rows = rosterPage.rows;

    // The status is a query constraint (`rosterFilters`), so it is already applied to `rows`.
    // Only the search narrows anything here, and only within the page — Firestore cannot match
    // a substring, so a search box that spans the roster is not something a real limit allows.
    const query = rosterQuery.trim().toLowerCase();
    const visible = query
      ? rows.filter((student) =>
          `${student.name ?? ""} ${student.email ?? ""}`.toLowerCase().includes(query)
        )
      : rows;

    return (
      <div className="rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs overflow-hidden flex flex-col">
        {/* The count reads left and the control sits right, the way every other toolbar on the
            dashboard is laid out. The count is the whole filtered set while the footer below
            says which slice of it is on screen. */}
        <div className="flex items-center justify-between gap-3 flex-wrap px-4 sm:px-6 py-3 border-b border-neutral-200 dark:border-white/10">
          <span className="text-[11px] text-neutral-400">
            {rosterPage.total} {rosterPage.total === 1 ? "account" : "accounts"}
          </span>

          <Select
            label="Filter accounts by status"
            value={rosterStatus}
            onValueChange={(next) => setRosterStatus(next as "all" | CandidateStatus)}
            options={[
              { value: "all", label: "All Statuses" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
            className="py-1.5 px-3 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-50 dark:bg-white/5 text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-white/10 font-medium">
                <th className="py-3 px-4 sm:px-6">Account</th>
                <th className="py-3 px-4 sm:px-6">Status</th>
                <th className="py-3 px-4 sm:px-6">Super10</th>
                <th className="py-3 px-4 sm:px-6">Referral Code</th>
                <th className="py-3 px-4 sm:px-6">Last Sign-in</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-white/5">
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-neutral-400">
                    {/* Four different facts, four sentences. A search that hid the page's rows
                        is not the same as a status nobody holds, and neither is the same as a
                        roster that is empty. */}
                    {query
                      ? "No accounts on this page match your search."
                      : rosterStatus !== "all"
                        ? "No accounts hold this status."
                        : empty}
                  </td>
                </tr>
              ) : (
                visible.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-neutral-50/80 dark:hover:bg-white/5 transition-colors"
                  >
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <UserAvatar user={student} />
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-neutral-900 dark:text-white truncate">
                            {student.name || "—"}
                          </span>
                          <span className="text-[11px] text-neutral-500 truncate">
                            {student.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 sm:px-6">{renderCandidateStatus(student)}</td>

                    <td className="py-3.5 px-4 sm:px-6">
                      <StatusSwitch
                        checked={student.is_super10 === true}
                        onCheckedChange={() =>
                          handleToggleSuper10(student.id, student.is_super10 === true)
                        }
                        disabled={busyCandidateId === student.id}
                        onLabel="Super10"
                        offLabel="Not Super10"
                        label={`Super10 status for ${student.name || student.email}`}
                      />
                    </td>

                    <td className="py-3.5 px-4 sm:px-6">
                      <button
                        type="button"
                        disabled={busyCandidateId === student.id}
                        onClick={() => handleUpdateReferralCode(student.id, student.referralCode)}
                        className="px-2 py-1 rounded-md text-[10px] font-semibold border transition-colors disabled:opacity-50 text-neutral-600 dark:text-neutral-300 bg-white dark:bg-white/5 border-neutral-200 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-white/10"
                      >
                        {student.referralCode ? student.referralCode : "Assign VIP"}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 sm:px-6 text-neutral-500 text-[11px]">
                      {formatSignIn(student.lastLoginAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          page={rosterPage.page}
          pageSize={rosterPage.pageSize}
          total={rosterPage.total}
          onPageChange={rosterPage.setPage}
          onPageSizeChange={rosterPage.setPageSize}
          noun="accounts"
        />
      </div>
    );
  };

  // One page per role. The roster loads once for the whole dashboard, so each page states the
  // wait and the failure for itself rather than the three of them sharing a single message.
  const renderRolePage = (role: AccountRole) => {
    const page = ROLE_PAGE[role];

    return (
      <div className="flex flex-col gap-4">
        {/* Search, not create: an account is created by signing in with Google and admin
            access is an email allowlist, so there is nothing this page could create. What an
            admin does here is find one, on a roster that is otherwise a long scroll. */}
        <PageHeader
          crumbs={[{ label: "Home", onSelect: () => setActiveTab("home") }, { label: page.title }]}
          action={
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={rosterQuery}
                onChange={(e) => setRosterQuery(e.target.value)}
                placeholder="Search accounts..."
                aria-label={`Search ${page.title.toLowerCase()}`}
                className="w-36 sm:w-52 pl-8 pr-3 py-1.5 text-xs rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>
          }
        />

        {rosterPage.error || studentsError ? (
          <div className="rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs p-8 text-center text-xs text-amber-600 dark:text-amber-400">
            {/* A rejected query is usually a composite index the project is missing, and
                Firestore's own message carries the URL that creates it, so it is worth more
                than a fixed sentence. */}
            {rosterPage.error
              ? "This page could not be queried — see the console for the index it needs."
              : "Could not load the roster right now."}
          </div>
        ) : studentsLoading || rosterPage.loading ? (
          <div className="rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs p-8 text-center text-xs text-neutral-400">
            Loading accounts...
          </div>
        ) : (
          renderRosterTable(role, page.empty)
        )}
      </div>
    );
  };

  // The overview. Every figure here is counted from what is stored — the roster and the
  // catalogue — rather than from the browser's own admissions ledger, so Home and the tab a
  // number belongs to can never disagree about it. The one exception is Super10, which is
  // counted from the roster but capped from Settings.
  const renderHome = () => {
    const super10Accounts = students.filter((s) => s.is_super10 === true).length;

    // One card per number, and one shape for all of them: what it counts, the figure, and a
    // line saying exactly what was counted, since "Courses: 12" and "Live Courses: 9" would
    // otherwise be two numbers nobody can reconcile.
    const cards = [
      {
        label: "Accounts",
        icon: Users,
        tint: "text-amber-500",
        value: students.length,
        hint: "every account that has signed in",
      },
      {
        label: "Admins",
        icon: ROLE_BADGE.admin.icon,
        tint: "text-indigo-500",
        value: rosterByRole.admin.length,
        hint: "can open this dashboard",
      },
      {
        label: "Teachers",
        icon: ROLE_BADGE.teacher.icon,
        tint: "text-sky-500",
        value: rosterByRole.teacher.length,
        hint: "marked as faculty",
      },
      {
        label: "Students",
        icon: ROLE_BADGE.student.icon,
        tint: "text-emerald-500",
        value: rosterByRole.student.length,
        hint: "signed in, no other role",
      },
      {
        label: "Super10",
        icon: Star,
        tint: "text-amber-500",
        value: super10Accounts,
        hint: `of the ${super10Seats} seats the academy caps`,
      },
      {
        label: "Courses",
        icon: BookOpen,
        tint: "text-blue-500",
        value: courses.length,
        hint: courses.length > 0 ? "in the stored catalogue" : "nothing stored yet",
      },
      {
        label: "Live Courses",
        icon: CheckCircle2,
        tint: "text-emerald-500",
        // The site's own predicate, not a re-derivation of it: absent status means published,
        // and a count that disagreed with `/courses` would be worse than no count.
        value: courses.filter(isPublic).length,
        hint: "published on the public site",
      },
      {
        label: "Answer Book",
        icon: Layers,
        tint: "text-indigo-500",
        value: Object.keys(academyKnowledge).length,
        hint: "entries the chat can answer from",
      },
    ];

    return (
      <div className="flex flex-col gap-4">
        {/* The root of the trail, so the crumb is this page and there is nothing to step up to. */}
        <PageHeader crumbs={[{ label: "Home" }]} />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map(({ label, icon: Icon, tint, value, hint }) => (
            <div
              key={label}
              className="p-4 rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs flex flex-col gap-2"
            >
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span>{label}</span>
                <Icon className={`w-4 h-4 ${tint}`} />
              </div>
              <div className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</div>
              <span className="text-[11px] text-neutral-400">{hint}</span>
            </div>
          ))}
        </div>

        {(studentsLoading || coursesLoading) && (
          <p className="text-[11px] text-neutral-400">Still loading the rest of the roster...</p>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-neutral-50 dark:bg-[#121212] text-neutral-900 dark:text-neutral-100 overflow-y-auto">
      {/* Top Header — shared with the course detail page, a route of its own that has no
          dashboard around it to draw the sidebar toggle. */}
      <AdminHeader sidebarOpen={sidebarOpen} onToggleSidebar={onToggleSidebar} />

      {/* Main Container */}
      <main className="flex-1 w-full mx-auto py-6 sm:py-8 px-3 sm:px-6 flex flex-col gap-6 sm:gap-8 max-w-none">
        {/* HOME: the counts */}
        {activeTab === "home" && renderHome()}

        {/* TAB 1: COURSE MANAGEMENT (CRUD) */}
        {activeTab === "courses" && (
          <AdminCourses onHome={() => setActiveTab("home")} />
        )}

        {/* TAB 2: USERS & ADMISSIONS */}
        {activeTab === "users" && (
          <AdminUsers
            records={records}
            onHome={() => setActiveTab("home")}
          />
        )}

        {/* ONE PAGE PER ROLE. The three together list every account exactly once, because
            `accountRoleOf` gives each account the strongest role it holds. */}
        {activeTab === "students" && (
          <AdminStudents onHome={() => setActiveTab("home")} />
        )}
        {activeTab === "admins" && (
          <AdminAdmins onHome={() => setActiveTab("home")} />
        )}
        {activeTab === "teachers" && (
          <AdminTeachers onHome={() => setActiveTab("home")} />
        )}

        {/* ANSWER BOOK — what the assistant replies with, read-only */}
        {activeTab === "knowledge" && (
          <AdminKnowledge onHome={() => setActiveTab("home")} />
        )}

        {/* REFERRALS — who came in on whose code, read-only */}
        {activeTab === "referrals" && (
          <AdminReferrals onHome={() => setActiveTab("home")} />
        )}

        {/* REVENUE & ANALYTICS */}
        {activeTab === "analytics" && (
          <div className="flex flex-col gap-4">
            <PageHeader
              crumbs={[
                { label: "Home", onSelect: () => setActiveTab("home") },
                { label: "Revenue & Analytics" },
              ]}
                />

            {/* 4 KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    Gross Admissions Revenue
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <IndianRupee className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-neutral-900 dark:text-white">
                    ₹{totalPaidRevenue.toLocaleString("en-IN")}
                  </span>
                  {/* No growth figure here. There is no prior period stored to compare
                      against, and the "+100%" that used to sit in this slot was typed into
                      the JSX — it read the same whether revenue rose or fell to zero. */}
                </div>
                <span className="text-[11px] text-neutral-500">
                  Incl. {APP_SETTINGS.gstRatePercent}% statutory GST
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    Confirmed Learners
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {totalPaidStudents}
                  </span>
                  <span className="text-xs text-neutral-500">Active enrollments</span>
                </div>
                <span className="text-[11px] text-neutral-500">Across Full-Stack &amp; Super10</span>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    Super10 Seats Filled
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Award className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {super10Count} / {super10Seats}
                  </span>
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    {Math.max(super10Seats - super10Count, 0)} seats left
                  </span>
                </div>
                <span className="text-[11px] text-neutral-500">Placement assurance track</span>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    Referral Payout Pool
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-neutral-900 dark:text-white">
                    ₹{(totalPaidStudents * referralReward).toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs text-purple-600 dark:text-purple-400">
                    ₹{referralReward / 1000}K / student
                  </span>
                </div>
                <span className="text-[11px] text-neutral-500">Upon 60-day completion</span>
              </div>
            </div>

            {/* Financial Breakdown Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs flex flex-col gap-3">
                <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
                  Statutory Tax Breakdown
                </h4>
                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-white/5">
                    <span className="text-neutral-500">Gross Invoiced:</span>
                    <span className="font-semibold">₹{totalPaidRevenue.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-white/5">
                    <span className="text-neutral-500">Net Academy Revenue (excl. GST):</span>
                    <span className="font-semibold">
                      ₹{Math.round(totalPaidRevenue / gstDivisor).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-neutral-500">
                      {APP_SETTINGS.gstRatePercent}% Statutory GST:
                    </span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      ₹{Math.round(totalPaidRevenue - totalPaidRevenue / gstDivisor).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs flex flex-col gap-3">
                <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
                  Program Metrics
                </h4>
                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-white/5">
                    <span className="text-neutral-500">Full-Stack AI Engineering Program:</span>
                    <span className="font-semibold">
                      {records.filter((r) => r.courseId === "fullstack" && r.action === "paid").length} Students
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-white/5">
                    <span className="text-neutral-500">Super10 Placement Assurance Batch:</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      {super10Count} of {super10Seats} seats
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-neutral-500">Avg Invoiced Ticket:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      ₹{totalPaidStudents > 0 ? Math.round(totalPaidRevenue / totalPaidStudents).toLocaleString("en-IN") : "0"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default AdminDashboard;
