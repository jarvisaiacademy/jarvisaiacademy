"use client";

import React from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";

/**
 * One crumb of the trail. The last crumb is the page you are on, so it carries no
 * `onSelect` and renders as plain text; every crumb before it is a step back up.
 */
export interface Crumb {
  label: string;
  onSelect?: () => void;
}

interface PageHeaderProps {
  /** Root first, this page last. */
  crumbs: Crumb[];
  /** Leaves the dashboard — the same door the sidebar's "Return to Chat" opens. */
  onBack: () => void;
  /**
   * The page's primary action, on the right. Omitted on a page where nothing can be
   * created, rather than filled with a disabled button that explains itself.
   */
  action?: React.ReactNode;
}

/**
 * The header every dashboard page opens with: where you are, the way out, and the one
 * thing the page is for.
 *
 * Shared rather than repeated per page so the three positions cannot drift — a page that
 * put its create button on the left, or its breadcrumb below the fold, would be a page
 * users have to re-learn. Keep the anatomy here and pass content.
 *
 * Three columns, so the trail sits centred in the space between the arrow and the action
 * whatever either of those happens to be.
 *
 * The arrow and the crumbs are both buttons, not links: the dashboard swaps panels in
 * place and keeps its tab in session storage, so there is no URL to point a link at.
 */
export function PageHeader({ crumbs, onBack, action }: PageHeaderProps) {
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
      {/* Icon only, so the accessible name has to come from `aria-label`. */}
      <button
        type="button"
        onClick={onBack}
        aria-label="Back to chat"
        title="Back to chat"
        className="w-8 h-8 inline-flex items-center justify-center rounded-full border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 shadow-xs transition-colors cursor-pointer shrink-0"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      {/* The trail ends on the page you are on, which is the page's name — so the last crumb
          is read as the title and there is nothing else to put up here. */}
      <nav aria-label="Breadcrumb" className="min-w-0 flex justify-center">
        <ol className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 min-w-0">
          {crumbs.map((crumb, index) => {
            const isCurrent = index === crumbs.length - 1;

            return (
              <li key={crumb.label} className="flex items-center gap-1.5 min-w-0">
                {index > 0 && (
                  <ChevronRight
                    aria-hidden="true"
                    className="w-3 h-3 text-neutral-300 dark:text-neutral-600 shrink-0"
                  />
                )}
                {crumb.onSelect && !isCurrent ? (
                  <button
                    type="button"
                    onClick={crumb.onSelect}
                    className="hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer truncate"
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span
                    aria-current={isCurrent ? "page" : undefined}
                    className={`truncate ${
                      isCurrent
                        ? "text-sm font-bold text-neutral-900 dark:text-white"
                        : ""
                    }`}
                  >
                    {crumb.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {action ? (
        <div className="flex items-center gap-2 min-w-0 justify-self-end">{action}</div>
      ) : (
        // Holds the third column so the trail stays centred on a page with no action.
        <span aria-hidden="true" />
      )}
    </div>
  );
}

export default PageHeader;
