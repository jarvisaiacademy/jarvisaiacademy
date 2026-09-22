import { ShieldCheck, Briefcase, GraduationCap } from "lucide-react";
import type { AccountRole } from "@/data/students";

/**
 * The three roles a person can hold on this site, and how each one's badge reads.
 *
 * One table, because the roster tables and a single account's page all draw the same chip, and a
 * person who reads "Teacher" on one surface must not read something else on another.
 *
 * Sky rather than amber for Teacher: amber already means Super10 on the same row, and one row
 * must not carry two amber chips.
 */
export const ROLE_BADGE = {
  admin: {
    label: "Admin",
    icon: ShieldCheck,
    badge:
      "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30",
  },
  teacher: {
    label: "Teacher",
    icon: Briefcase,
    badge:
      "bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-500/30",
  },
  student: {
    label: "Student",
    icon: GraduationCap,
    badge:
      "bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-white/10",
  },
} as const;

/** The chip for an account's role — or for a role already worked out, e.g. a roster page. */
export function RoleBadge({ role }: { role: AccountRole }) {
  const { label, icon: Icon, badge } = ROLE_BADGE[role];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${badge}`}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

export default RoleBadge;
