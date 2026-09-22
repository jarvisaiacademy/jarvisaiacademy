"use client";

import React, { useMemo, useState } from "react";
import { Search, Info } from "lucide-react";
import { academyKnowledge, replyPages } from "@/data/academy-knowledge";
import { MarkdownRenderer } from "@/components/chat/markdown-renderer";
import { PageHeader } from "@/components/ui/page-header";

interface AdminKnowledgeProps {
  /** Leaves the dashboard for the chat, as the header's arrow does on every other page. */
  onBack: () => void;
  /** Back up the trail to the dashboard's root. */
  onHome: () => void;
}

/**
 * What the assistant answers with, read-only.
 *
 * The answers are not stored in Firestore and an edit here would not stick: they live in
 * `src/data/academy-knowledge.ts`, and `src/app/courses/<slug>` renders the same words
 * through `COURSE_KB_KEY`. This exists so an admin can see what the bot actually says
 * without having to ask it, and without the bot gaining a database dependency it would
 * have to be up for.
 */
export function AdminKnowledge({ onBack, onHome }: AdminKnowledgeProps) {
  // Keys only. Reading `.text` here would call the `testimonials` getter, which draws a
  // fresh sample of people on every read.
  const topics = useMemo(() => Object.keys(academyKnowledge), []);

  const [selected, setSelected] = useState(topics[0]);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return topics;
    return topics.filter((key) => {
      // Search the prose, not just the key — "refund" is in the text of a topic that is
      // not named for it.
      const entry = academyKnowledge[key];
      return (
        key.toLowerCase().includes(q) ||
        (entry?.text ?? "").toLowerCase().includes(q)
      );
    });
  }, [topics, query]);

  const entry = academyKnowledge[selected];

  // Which public page renders this topic, if any. Inverse of the map the course pages read.
  const pages = replyPages(selected);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        crumbs={[{ label: "Home", onSelect: onHome }, { label: "Answer Book" }]}
        onBack={onBack}
      />

      <div className="flex items-start gap-2 p-3 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10">
        <Info className="w-3.5 h-3.5 text-neutral-500 mt-0.5 shrink-0" />
        <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
          Read-only, on purpose. The wording lives in{" "}
          <code className="px-1 py-0.5 rounded bg-neutral-200/70 dark:bg-white/10 text-[10px]">
            src/data/academy-knowledge.ts
          </code>{" "}
          so the bot can answer instantly and keep working when Firestore is unreachable.
          Editing it is a code change, not a dashboard one. A program&apos;s answer is also
          rendered on its page, so the two always say the same thing.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 items-start">
        {/* Topic list */}
        <div className="flex flex-col gap-2 rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs overflow-hidden">
          <div className="p-3 border-b border-neutral-200 dark:border-white/10">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search replies..."
                className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="max-h-[420px] overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="p-3 text-[11px] text-neutral-500 text-center">
                No reply mentions that.
              </p>
            ) : (
              filtered.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelected(key)}
                  className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                    key === selected
                      ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                >
                  {key}
                </button>
              ))
            )}
          </div>
          <div className="px-3 py-2 border-t border-neutral-200 dark:border-white/10">
            <span className="text-[10px] text-neutral-500">
              {topics.length} replies · {filtered.length} shown
            </span>
          </div>
        </div>

        {/* Selected reply */}
        <div className="rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-neutral-200 dark:border-white/10 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <code className="px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-white/10 text-[11px] font-semibold text-neutral-700 dark:text-neutral-200">
                {selected}
              </code>
              {pages.map((page) => (
                <span
                  key={page}
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30"
                >
                  shown on {page}
                </span>
              ))}
            </div>
            {entry?.suggestions?.length ? (
              <span className="text-[11px] text-neutral-500">
                Follow-up chips: {entry.suggestions.join(" · ")}
              </span>
            ) : null}
          </div>

          <div className="p-4 sm:p-5 max-h-[520px] overflow-y-auto">
            {/* No `onPromptClick`: the `#ask:` links render, but this is a reference view,
                not a chat, so clicking one has nowhere to go. */}
            <MarkdownRenderer content={entry?.text ?? ""} />
          </div>
        </div>
      </div>
    </div>
  );
}
