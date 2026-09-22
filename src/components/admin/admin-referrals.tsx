"use client";

import React from "react";
import { Gift, IndianRupee, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { useStudents } from "@/providers/students-provider";
import { referredUsers, type StudentRecord } from "@/data/students";
import { APP_SETTINGS } from "@/data/app-settings";

/**
 * Who brought whom in.
 *
 * Reads the roster the provider already holds in full rather than querying: `referredBy` lives on
 * the `users` row, so a claim is one field on a document that is already subscribed to — a second
 * query would be a second thing to keep in step, for data that is already here.
 *
 * The reward is not paid from here. This tab is the record the payout is checked against, which is
 * why it shows the code that was used and not only the two names.
 */
interface AdminReferralsProps {
  onHome: () => void;
}

function formatWhen(iso: string): string {
  const when = new Date(iso);
  if (Number.isNaN(when.getTime())) return "—";
  return when.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AdminReferrals({ onHome }: AdminReferralsProps) {
  const { students, loading } = useStudents();
  const events = referredUsers(students);

  // Resolved from the roster rather than stored on the claim, so a renamed account shows its
  // current name. A referrer whose own row is gone leaves the uid, which is still an answer.
  const byId = new Map<string, StudentRecord>(students.map((student) => [student.id, student]));

  const sorted = [...events].sort((a, b) => (b.referredAt ?? "").localeCompare(a.referredAt ?? ""));
  const exposure = events.length * APP_SETTINGS.referralReward;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader crumbs={[{ label: "Home", onSelect: onHome }, { label: "Referrals" }]} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              Referrals Recorded
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-bold text-neutral-900 dark:text-white">
            {events.length}
          </span>
          <span className="text-[11px] text-neutral-500">
            Learners who signed up with someone&apos;s code
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              Reward Exposure
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-bold text-neutral-900 dark:text-white">
            ₹{exposure.toLocaleString("en-IN")}
          </span>
          <span className="text-[11px] text-neutral-500">
            ₹{APP_SETTINGS.referralReward.toLocaleString("en-IN")} each. Paid by hand, not from here.
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              Codes To Share
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Gift className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-bold text-neutral-900 dark:text-white">
            {students.length}
          </span>
          <span className="text-[11px] text-neutral-500">
            Every account has one, derived from its id
          </span>
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-neutral-200 dark:border-white/10">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
            Referral Ledger
          </h3>
          <p className="text-[11px] text-neutral-500 mt-1">
            Who came in on whose code, newest first.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-50 dark:bg-white/5 text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-white/10 font-medium">
                <th className="py-3 px-4 sm:px-6">New Learner</th>
                <th className="py-3 px-4 sm:px-6">Code Used</th>
                <th className="py-3 px-4 sm:px-6">Referred By</th>
                <th className="py-3 px-4 sm:px-6">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-white/5">
              {sorted.length > 0 ? (
                sorted.map((learner) => {
                  const referrer = learner.referredBy ? byId.get(learner.referredBy) : undefined;
                  return (
                    <tr
                      key={learner.id}
                      className="hover:bg-neutral-50/80 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex flex-col">
                          <span className="font-semibold text-neutral-900 dark:text-white">
                            {learner.name}
                          </span>
                          <span className="text-[11px] text-neutral-500">{learner.email}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 font-mono text-[11px] text-neutral-600 dark:text-neutral-400">
                        {learner.referredByCode ?? "—"}
                      </td>

                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex flex-col">
                          <span className="font-medium text-neutral-800 dark:text-neutral-200">
                            {referrer?.name ?? "Account no longer on the roster"}
                          </span>
                          {referrer?.email && (
                            <span className="text-[11px] text-neutral-500">{referrer.email}</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-neutral-500 text-[11px]">
                        {learner.referredAt ? formatWhen(learner.referredAt) : "—"}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-neutral-400">
                    {loading
                      ? "Loading the roster…"
                      : "No referrals yet. A code is captured when a new learner signs up with one."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminReferrals;
