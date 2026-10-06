"use client";

import React, { useMemo, useState } from "react";
import { Search, Info, ArrowLeft, ChevronRight, RotateCcw } from "lucide-react";
import { academyKnowledge } from "@/data/academy-knowledge";
import { MarkdownRenderer } from "@/components/chat/markdown-renderer";
import { useToast } from "@/components/ui/toast";

interface AdminKnowledgeProps {
  /** Back up the trail to the dashboard's root, which is where the header's arrow goes. */
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
export function AdminKnowledge({ onHome }: AdminKnowledgeProps) {
  const { showToast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Keys only. Reading `.text` here would call the `testimonials` getter, which draws a
  // fresh sample of people on every read.
  const topics = useMemo(() => Object.keys(academyKnowledge), []);

  const [selected, setSelected] = useState(topics[0]);
  const [query, setQuery] = useState("");

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      setQuery("");
      await new Promise((resolve) => setTimeout(resolve, 400));
      showToast("Answer Book refreshed", "success");
    } catch {
      showToast("Failed to refresh Answer Book", "error");
    } finally {
      setIsRefreshing(false);
    }
  };

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


  return (
    <div className="flex flex-col gap-4">
      {/* Breadcrumb at the top left side outside the card */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">
        <button
          type="button"
          onClick={onHome}
          className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
        >
          Home
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
        <span className="font-semibold text-neutral-900 dark:text-white">
          Answer Book
        </span>
      </nav>

      {/* Big Answer Book Card */}
      <div className="rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs overflow-hidden flex flex-col">
        {/* Inside Card Header Bar */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-white/10">
          <div className="relative flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 min-h-[38px]">
            {/* Back button inside the card */}
            <div className="flex items-center z-10">
              <button
                type="button"
                onClick={onHome}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 border border-neutral-200 dark:border-white/10 transition-colors cursor-pointer"
                title="Back to Home"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            </div>

            {/* In the Center: Answer Book Heading with Refresh icon at its side */}
            <div className="w-full sm:w-auto sm:absolute sm:inset-0 flex items-center justify-center gap-2 pointer-events-none order-first sm:order-none">
              <div className="flex items-center justify-center gap-2 pointer-events-auto">
                <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
                  Answer Book
                </h2>
                <button
                  type="button"
                  disabled={isRefreshing}
                  onClick={handleRefresh}
                  className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
                  title="Refresh Answer Book"
                >
                  <RotateCcw
                    className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                </button>
              </div>
            </div>

            {/* Right: Total replies count badge */}
            <div className="flex items-center z-10 ml-auto sm:ml-0">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-white/10">
                {topics.length} entries
              </span>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 sm:p-5 flex flex-col gap-4">
          <div className="flex items-start gap-2 p-3 rounded-xl bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10">
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
            <div className="flex flex-col gap-2 rounded-2xl bg-neutral-50/50 dark:bg-[#151515] border border-neutral-200 dark:border-white/10 shadow-2xs overflow-hidden">
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
            <div className="rounded-2xl bg-neutral-50/50 dark:bg-[#151515] border border-neutral-200 dark:border-white/10 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-neutral-200 dark:border-white/10 flex flex-col gap-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-white/10 text-[11px] font-semibold text-neutral-700 dark:text-neutral-200">
                    {selected}
                  </code>
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
      </div>
    </div>
  );
}
