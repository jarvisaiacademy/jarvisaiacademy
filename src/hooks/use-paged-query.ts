"use client";

import { useEffect, useRef, useState } from "react";
import { onSnapshot, type Query, type QueryDocumentSnapshot } from "firebase/firestore";
import { DEFAULT_PAGE_SIZE, type PageSize } from "@/services/pagination";

export interface PagedQuery<T> {
  rows: T[];
  /** How many rows the current filter matches in total, not how many are on screen. */
  total: number;
  loading: boolean;
  error: string | null;
  page: number;
  pageSize: PageSize;
  setPage: (page: number) => void;
  setPageSize: (size: PageSize) => void;
}

interface PagedQueryOptions<T> {
  /** False while this table's tab is closed: nothing subscribed, no rows held. */
  enabled: boolean;
  /**
   * Identifies the current filter set. Everything `buildQuery` and `count` read has to be
   * folded into this string: both are called through refs and are deliberately not effect
   * dependencies, so a filter that changed without changing this key would leave the previous
   * page's rows on screen.
   */
  filterKey: string;
  buildQuery: (
    page: number,
    size: PageSize,
    cursor: QueryDocumentSnapshot | null
  ) => Query<T> | null;
  count: () => Promise<number>;
}

/**
 * One page of a Firestore collection, live.
 *
 * `limit` and `onSnapshot` are not in tension: the listener is attached to the *constrained*
 * query, so a write that lands on the page you are looking at still appears without a reload,
 * and a write that lands elsewhere costs nothing.
 *
 * Pages are addressed by cursor rather than by offset — the modular SDK has no `offset` — so
 * each page's start cursor is remembered as that page loads. That makes page one the only page
 * reachable without having loaded the one before it, which is exactly what the footer's
 * previous/next navigation does.
 */
export function usePagedQuery<T extends { id: string }>({
  enabled,
  filterKey,
  buildQuery,
  count,
}: PagedQueryOptions<T>): PagedQuery<T> {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<PageSize>(DEFAULT_PAGE_SIZE);
  const [cursors, setCursors] = useState<(QueryDocumentSnapshot | null)[]>([null]);
  const [rows, setRows] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New filters, or a new page size, mean every remembered cursor points into a page that no
  // longer exists. Adjusted during render rather than in an effect, so the table is never
  // painted for a frame showing rows the new filter excludes.
  const [applied, setApplied] = useState({ key: filterKey, size: DEFAULT_PAGE_SIZE });
  if (applied.key !== filterKey || applied.size !== pageSize) {
    setApplied({ key: filterKey, size: pageSize });
    setPage(0);
    setCursors([null]);
  }

  // A live deletion can leave the current page past the end of the set. Only knowable once the
  // count has answered, so this waits for a non-zero total rather than guessing at one.
  if (total > 0) {
    const lastPage = Math.max(0, Math.ceil(total / pageSize) - 1);
    if (page > lastPage) {
      setPage(lastPage);
      setCursors((prev) => prev.slice(0, lastPage + 1));
    }
  }

  // Held in refs so the subscription keys on the values that change the answer rather than on
  // the identity of two closures that are rebuilt on every render. Declared before the effect
  // that reads them, so the sync always runs first.
  const buildRef = useRef(buildQuery);
  const countRef = useRef(count);
  const cursorsRef = useRef(cursors);
  useEffect(() => {
    buildRef.current = buildQuery;
    countRef.current = count;
    cursorsRef.current = cursors;
  });

  useEffect(() => {
    // A closed tab is not cleared but ignored: the derived values at the bottom read as empty
    // while `enabled` is false, which saves a state write and lets a reopened tab paint its
    // previous page instead of flashing a spinner.
    if (!enabled) return;

    const cursor = cursorsRef.current[page] ?? null;
    // Only reachable by loading the page before this one, which is what recorded the cursor.
    if (page > 0 && !cursor) return;

    const built = buildRef.current(page, pageSize, cursor);
    if (!built) {
      setRows([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    let live = true;
    setLoading(true);

    const unsubscribe = onSnapshot(
      built,
      (snapshot) => {
        if (!live) return;

        const last = snapshot.docs[snapshot.docs.length - 1] ?? null;
        setCursors((prev) => {
          if (prev[page + 1] === last) return prev;
          // Anything deeper is now unreachable — a cursor is only valid for the rows it was
          // captured from, so a page that changed invalidates every page after it.
          const next = prev.slice(0, page + 1);
          next[page + 1] = last;
          return next;
        });

        // The document id last: a record that happens to store an `id` field of its own must not
        // shadow the one every caller keys rows by.
        setRows(snapshot.docs.map((snap) => ({ ...snap.data(), id: snap.id }) as T));
        setLoading(false);
        setError(null);
      },
      (err) => {
        if (!live) return;
        // A missing composite index arrives here as a failed listener whose message carries the
        // URL that creates it. `scripts/check-queries.mjs` names the same index without a browser.
        console.warn("[usePagedQuery] Page subscription error:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    countRef
      .current()
      .then((value) => {
        if (live) setTotal(value);
      })
      .catch(() => {
        if (live) setTotal(0);
      });

    return () => {
      live = false;
      unsubscribe();
    };
  }, [enabled, page, pageSize, filterKey]);

  return {
    rows: enabled ? rows : [],
    total: enabled ? total : 0,
    loading: enabled && loading,
    error: enabled ? error : null,
    page,
    pageSize,
    setPage,
    setPageSize,
  };
}
