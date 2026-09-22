"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Select } from "@/components/ui/select";
import { PAGE_SIZES, type PageSize } from "@/services/pagination";

interface TablePaginationProps {
  /** Zero-based. */
  page: number;
  pageSize: PageSize;
  /** Rows in the whole filtered set, not rows on screen. Drives the page count. */
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: PageSize) => void;
  /** Plural noun for one row — "accounts", "courses", "records". */
  noun: string;
}

/**
 * The footer under a list table: what slice of the set is on screen, how big a slice to take
 * next, and the two controls that move between slices.
 *
 * It owns no data. Page and page size come from whoever holds the query, so the ledger — which
 * slices an array it already has — and the tables — which ask Firestore for a page — share one
 * footer rather than one each.
 */
export function TablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  noun,
}: TablePaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const first = page * pageSize + 1;
  const last = Math.min((page + 1) * pageSize, total);

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap px-4 sm:px-6 py-3 border-t border-neutral-200 dark:border-white/10">
      {/* The range, not just the total: on page 2 of 3 the number of rows in the set is not the
          number an admin is looking at, and the old count-only label read as if it were. */}
      <span className="text-[11px] text-neutral-400">
        {total === 0 ? `No ${noun}` : `${first}–${last} of ${total} ${noun}`}
      </span>

      <div className="flex items-center gap-2 flex-wrap">
        <Select
          label="Rows per page"
          value={String(pageSize)}
          onValueChange={(next) => onPageSizeChange(Number(next) as PageSize)}
          options={PAGE_SIZES.map((size) => ({ value: String(size), label: `${size} rows` }))}
          className="py-1.5 px-3 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs"
        />

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0}
            aria-label="Previous page"
            className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-[11px] text-neutral-500 tabular-nums px-1">
            Page {page + 1} of {pageCount}
          </span>

          {/* Next is disabled on the last page rather than hidden, so the control does not move
              under the pointer as the set grows and shrinks. */}
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page + 1 >= pageCount}
            aria-label="Next page"
            className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
