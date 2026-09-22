"use client";

import React, { useState } from "react";
import { Info, Loader2, RotateCcw, Save } from "lucide-react";
import { AppSettings, DEFAULT_APP_SETTINGS } from "@/data/app-settings";
import { useSettings } from "@/providers/settings-provider";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/ui/page-header";

const inputClass =
  "w-full py-2 px-3 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500";
const labelClass = "text-[11px] font-semibold text-neutral-600 dark:text-neutral-400";

/**
 * The fields, described rather than hand-written.
 *
 * Adding one is three lines — the interface, the default in `app-settings.ts`, and an entry
 * here — with nothing to touch in the render below. That is the point of this table: the
 * config is meant to grow as more figures move out of the code.
 *
 * `usedBy` is not decoration. It is the answer to "if I change this, what moves?", and it is
 * how an admin can tell a field that takes effect from one that only looks like it does.
 */
interface FieldSpec {
  key: keyof AppSettings;
  label: string;
  hint: string;
  usedBy: string;
  group: string;
  /** Rendered as a number input with these bounds, or as free text. */
  number?: { min: number; max: number };
  prefix?: string;
  suffix?: string;
}

const FIELDS: FieldSpec[] = [
  {
    key: "referralReward",
    label: "Referral reward",
    hint: "Paid once the referred candidate completes the course.",
    usedBy: "Dashboard projection · enrol card banner · catalogue reply",
    group: "Referrals & Super10",
    number: { min: 0, max: 1000000 },
    prefix: "₹",
  },
  {
    key: "super10Seats",
    label: "Super10 seats",
    hint: "The cap the Super10 track is advertised at.",
    usedBy: "Dashboard seats-left · enrol card · catalogue reply",
    group: "Referrals & Super10",
    number: { min: 1, max: 1000 },
  },
  {
    key: "moneyBackDays",
    label: "Money-back window",
    hint: "Printed on the tax receipt.",
    usedBy: "Receipt only",
    group: "Billing",
    number: { min: 0, max: 365 },
    suffix: "days",
  },
  {
    key: "gstRatePercent",
    label: "GST rate",
    hint: "A percentage, not a fraction. 18, never 0.18.",
    usedBy: "Analytics tax breakdown · receipt label",
    group: "Billing",
    number: { min: 0, max: 100 },
    suffix: "%",
  },
  {
    key: "gstin",
    label: "GSTIN",
    hint: "15 characters, printed on the tax receipt.",
    usedBy: "Receipt only",
    group: "Billing",
  },
];

/** A GSTIN is 15 characters: 2 state digits, 5 letters, 4 digits, then a check pattern. */
const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/;

interface AdminSettingsProps {
  /** Back up the trail to the dashboard's root, which is where the header's arrow goes. */
  onHome: () => void;
}

/**
 * Academy Settings — the figures that are a decision rather than content.
 *
 * Read from `settings/app` and written back with a merge, so a partial save cannot blank a
 * field it did not mention. The values are quoted on public pages, so the read is open and
 * only the write is admin-only.
 *
 * What it does not reach: the chat's answers in `src/data/academy-knowledge.ts` state several
 * of these figures as prose. They are static on purpose — the bot must answer with Firestore
 * unreachable — so they do not follow a change made here, and the notice below says so.
 */
export function AdminSettings({ onHome }: AdminSettingsProps) {
  const { settings, loading, saveSettings } = useSettings();
  const { showToast } = useToast();

  // Only the fields touched since the last save. Anything untouched reads straight off the
  // snapshot, so a value changed elsewhere lands in the form without an effect to sync it,
  // and text being typed is never clobbered by a snapshot arriving mid-edit.
  const [edits, setEdits] = useState<Partial<AppSettings>>({});
  const [isSaving, setIsSaving] = useState(false);

  const valueOf = <K extends keyof AppSettings>(key: K): AppSettings[K] =>
    (key in edits ? edits[key] : settings[key]) as AppSettings[K];

  const dirty = Object.keys(edits).length > 0;

  const setField = (key: keyof AppSettings, value: string | number) => {
    setEdits((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    // Coerce before writing: the inputs hand back strings, and a settings document holding
    // "18" where the app reads a number is a bug that only shows up in arithmetic.
    const next: Partial<AppSettings> = {};
    const writable = next as Record<string, unknown>;

    for (const spec of FIELDS) {
      if (!(spec.key in edits)) continue;
      const raw = edits[spec.key];

      if (spec.number) {
        const parsed = typeof raw === "number" ? raw : Number(String(raw).trim());
        if (!Number.isFinite(parsed) || parsed < spec.number.min || parsed > spec.number.max) {
          showToast(
            `${spec.label} must be between ${spec.number.min} and ${spec.number.max}`,
            "error"
          );
          return;
        }
        // Whole numbers only: "10.5 seats" is not a thing anyone meant to type.
        writable[spec.key] = Math.round(parsed);
      } else {
        const text = String(raw ?? "").trim().toUpperCase();
        if (spec.key === "gstin" && !GSTIN_PATTERN.test(text)) {
          showToast("That is not a 15-character GSTIN", "error");
          return;
        }
        writable[spec.key] = text;
      }
    }

    setIsSaving(true);
    try {
      await saveSettings(next);
      setEdits({});
      showToast("Academy settings saved", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not save the settings", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setEdits({ ...DEFAULT_APP_SETTINGS });
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader crumbs={[{ label: "Home", onSelect: onHome }, { label: "Settings" }]} />

      <div className="flex items-start gap-2 p-3 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10">
        <Info className="w-3.5 h-3.5 text-neutral-500 mt-0.5 shrink-0" />
        <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
          These reach the dashboard, the enrolment card and the receipt. Three files quote the
          same numbers as <em>prose</em> and do not follow a change here, because the answers
          must keep working when Firestore does not:{" "}
          <code className="px-1 py-0.5 rounded bg-neutral-200/70 dark:bg-white/10 text-[10px]">
            src/data/academy-knowledge.ts
          </code>
          ,{" "}
          <code className="px-1 py-0.5 rounded bg-neutral-200/70 dark:bg-white/10 text-[10px]">
            src/components/layout/sidebar-nav.tsx
          </code>{" "}
          and{" "}
          <code className="px-1 py-0.5 rounded bg-neutral-200/70 dark:bg-white/10 text-[10px]">
            src/app/llms.txt/route.ts
          </code>
          . Course fees and durations are <strong>not</strong> here either — the Courses tab
          owns those, per course.
        </p>
      </div>

      <div className="rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-white/10">
          <span className="text-xs font-bold text-neutral-900 dark:text-white">
            {FIELDS.length} values
          </span>
          {loading ? (
            <span className="flex items-center gap-1.5 text-[11px] text-neutral-500">
              <Loader2 className="w-3 h-3 animate-spin" /> Reading Firestore
            </span>
          ) : (
            <span className="text-[11px] text-neutral-500">
              {dirty ? "Unsaved changes" : "In step with Firestore"}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4 p-4">
          {FIELDS.map((spec, index) => {
            // Derived from the previous entry rather than carried in a variable that the map
            // writes to: mutating across render iterations is what the compiler refuses.
            const heading = spec.group !== FIELDS[index - 1]?.group ? spec.group : null;
            const value = valueOf(spec.key);

            return (
              <React.Fragment key={spec.key}>
                {heading ? (
                  <div className="md:col-span-2 -mb-1 pt-1">
                    <span className="text-[10px] font-bold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase">
                      {heading}
                    </span>
                  </div>
                ) : null}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor={`setting-${spec.key}`} className={labelClass}>
                    {spec.label}
                  </label>
                  <div className="relative">
                    {spec.prefix ? (
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500">
                        {spec.prefix}
                      </span>
                    ) : null}
                    <input
                      id={`setting-${spec.key}`}
                      type={spec.number ? "number" : "text"}
                      inputMode={spec.number ? "numeric" : undefined}
                      min={spec.number?.min}
                      max={spec.number?.max}
                      value={value ?? ""}
                      onChange={(e) => setField(spec.key, e.target.value)}
                      className={`${inputClass} ${spec.prefix ? "pl-7" : ""} ${
                        spec.suffix ? "pr-14" : ""
                      }`}
                    />
                    {spec.suffix ? (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-neutral-500">
                        {spec.suffix}
                      </span>
                    ) : null}
                  </div>
                  <span className="text-[10px] text-neutral-500">{spec.hint}</span>
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                    Used by: {spec.usedBy}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-neutral-200 dark:border-white/10">
          <button
            type="button"
            onClick={handleReset}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Fill with defaults
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !dirty}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
