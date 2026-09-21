"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  Clock,
  Globe,
  Mail,
  Phone,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { useTeachers } from "@/providers/teachers-provider";
import { useCourses } from "@/providers/courses-provider";
import { useStudents } from "@/providers/students-provider";
import { UserAvatar } from "@/components/ui/user-avatar";

function formatWhen(iso?: string): string {
  if (!iso) return "—";
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

function Field({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 text-neutral-400 shrink-0">{icon}</span>
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
          {label}
        </span>
        <span className="text-xs text-neutral-900 dark:text-white break-words">{value}</span>
      </div>
    </div>
  );
}

interface TeacherProfileProps {
  teacherId: string;
  onBack: () => void;
}

/**
 * One teacher, in full.
 *
 * Everything here is already stored: the faculty record (`teachers/{uid}`) and the account
 * (`users/{uid}`). Google's basic profile — name, email, photo and whether the address is
 * verified — is the whole of what the app asks for at sign-in, so "more from Google" means
 * asking for narrower scopes and a consent screen, not reading a field that is already there.
 * The page says so rather than pretending a richer profile exists.
 */
export function TeacherProfile({ teacherId, onBack }: TeacherProfileProps) {
  const { teachers, loading } = useTeachers();
  const { students } = useStudents();
  const { firestoreCourses: courses } = useCourses();

  const teacher = teachers.find((t) => t.id === teacherId);
  const user = students.find((s) => s.id === teacherId);

  if (loading && !teacher) {
    return (
      <div className="flex-1 flex items-center justify-center text-neutral-400 text-xs">
        Loading teacher...
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
        <ShieldAlert className="w-6 h-6 text-neutral-400" />
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          No teacher on the roster has the id <code className="font-mono">{teacherId}</code>.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-white/15 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
        >
          Back to the dashboard
        </button>
      </div>
    );
  }

  const name = user?.name || teacher.name;
  const isActive = teacher.status !== "inactive";
  const assigned = teacher.courseIds ?? [];

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
      <div className="flex flex-col gap-6 max-w-4xl">
        <button
          type="button"
          onClick={onBack}
          className="self-start flex items-center gap-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to the dashboard
        </button>

        {/* Identity */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-amber-600/10 via-orange-600/10 to-amber-600/10 border border-amber-500/20 shadow-xs">
          <UserAvatar user={{ name, email: user?.email, picture: user?.picture }} size="lg" />

          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
                {name}
              </h1>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                  isActive
                    ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30"
                    : "bg-neutral-200 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 border-neutral-300 dark:border-white/10"
                }`}
              >
                <ShieldCheck className="w-3 h-3" />
                {isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <span className="text-xs text-neutral-600 dark:text-neutral-400 truncate">
              {user?.email || "No account email on record"}
            </span>
            <span className="text-[11px] text-neutral-500 font-mono">
              teachers/{teacher.id}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Faculty record */}
          <section className="p-5 rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
              Faculty record
            </h2>
            <Field
              icon={<Phone className="w-3.5 h-3.5" />}
              label="Mobile"
              value={teacher.mobile}
            />
            <Field
              icon={<CalendarDays className="w-3.5 h-3.5" />}
              label="Added to the faculty"
              value={formatWhen(teacher.createdAt)}
            />
            <Field
              icon={<Clock className="w-3.5 h-3.5" />}
              label="Last edited"
              value={formatWhen(teacher.updatedAt)}
            />
            <Field
              icon={<BookOpen className="w-3.5 h-3.5" />}
              label="Courses assigned"
              value={assigned.length === 0 ? "None yet" : `${assigned.length}`}
            />
            {assigned.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {assigned.map((id) => (
                  <Link
                    key={id}
                    href={`/courses/${id}`}
                    className="px-2 py-1 rounded-lg text-[10px] font-medium bg-neutral-100 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-white/10 hover:bg-neutral-200/70 dark:hover:bg-white/15 transition-colors"
                  >
                    {courses.find((c) => c.id === id)?.title ?? id}
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* What the Google account gave us */}
          <section className="p-5 rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
              From the Google account
            </h2>

            {user ? (
              <>
                <Field
                  icon={<Mail className="w-3.5 h-3.5" />}
                  label="Email"
                  value={user.email || "—"}
                />
                <Field
                  icon={<BadgeCheck className="w-3.5 h-3.5" />}
                  label="Email verified"
                  value={user.emailVerified ? "Yes, by Google" : "Not verified"}
                />
                <Field
                  icon={<Globe className="w-3.5 h-3.5" />}
                  label="Sign-in provider"
                  value={user.signInProvider || "—"}
                />
                <Field
                  icon={<CalendarDays className="w-3.5 h-3.5" />}
                  label="Google account created"
                  value={formatWhen(user.createdAt)}
                />
                <Field
                  icon={<Clock className="w-3.5 h-3.5" />}
                  label="Last signed in"
                  value={formatWhen(user.lastLoginAt)}
                />
                <Field
                  icon={<ShieldCheck className="w-3.5 h-3.5" />}
                  label="Role and plan"
                  value={`${user.role}${user.plan ? ` · ${user.plan}` : ""}`}
                />
              </>
            ) : (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                This teacher has no account document, so there is nothing to show. The roster
                keeps its own copy of the name.
              </p>
            )}

            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 border-t border-neutral-200 dark:border-white/10 pt-3">
              Name, photo, email and the verified flag are the whole of what Google hands over
              at sign-in, and all of it is stored. Anything else — phone number, locale,
              birthday — would need the account to approve extra permissions, so it is not
              collected.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
