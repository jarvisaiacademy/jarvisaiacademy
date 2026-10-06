"use client";

import { useEffect, useState, useCallback } from "react";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatDate } from "@/lib/date-format";

export type ReferralCandidateStatus =
  | "Enquiry"
  | "Admission Completed"
  | "Course Ongoing"
  | "Course Completed";

export interface ReferredCandidate {
  id: string;
  name: string;
  course: string;
  date: string;
  status: ReferralCandidateStatus;
}

export const ALL_REFERRAL_STATUSES: ReferralCandidateStatus[] = [
  "Enquiry",
  "Admission Completed",
  "Course Ongoing",
  "Course Completed",
];

export const STATUS_CONFIG: Record<
  ReferralCandidateStatus,
  {
    step: number;
    badgeClass: string;
    dotClass: string;
    description: string;
  }
> = {
  "Enquiry": {
    step: 1,
    badgeClass:
      "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/40 ring-amber-500/20",
    dotClass: "bg-amber-500",
    description: "Initial lead / enquiry",
  },
  "Admission Completed": {
    step: 2,
    badgeClass:
      "bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/40 ring-blue-500/20",
    dotClass: "bg-blue-500",
    description: "Admitted & tuition confirmed",
  },
  "Course Ongoing": {
    step: 3,
    badgeClass:
      "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-500/40 ring-indigo-500/20",
    dotClass: "bg-indigo-500",
    description: "Active coursework in progress",
  },
  "Course Completed": {
    step: 4,
    badgeClass:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40 ring-emerald-500/20",
    dotClass: "bg-emerald-500",
    description: "Graduated & reward unlocked",
  },
};

const DEFAULT_CANDIDATES: ReferredCandidate[] = [];

export function normalizeStatus(raw?: string): ReferralCandidateStatus {
  if (!raw) return "Enquiry";
  if (raw === "Enquery" || raw.toLowerCase().includes("enquir")) return "Enquiry";
  if (raw.toLowerCase().includes("admission")) return "Admission Completed";
  if (raw.toLowerCase().includes("ongoing")) return "Course Ongoing";
  if (raw.toLowerCase().includes("completed")) return "Course Completed";
  return "Enquiry";
}

function getInitialCandidates(storageKey: string): ReferredCandidate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
          .filter((item) => !["ref-1", "ref-2", "ref-3", "ref-4"].includes(item.id))
          .map((item) => ({
            ...item,
            status: normalizeStatus(item.status),
          }));
      }
    }
  } catch {
    // ignore parse error
  }
  return [];
}

export function useStudentReferrals(userId?: string | null, referralCode?: string | null) {
  const storageKey = userId ? `jarvis_referrals_${userId}` : "jarvis_referrals_guest";

  const [candidates, setCandidates] = useState<ReferredCandidate[]>(() =>
    getInitialCandidates(storageKey)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db || !userId) return;
    let isCancelled = false;

    const fetchLiveReferrals = async () => {
      try {
        if (!db) return;
        const usersRef = collection(db, "users");
        const docMap = new Map<string, Record<string, unknown>>();

        // Query by referrer UID
        try {
          const snapUid = await getDocs(query(usersRef, where("referredBy", "==", userId)));
          snapUid.forEach((d) => docMap.set(d.id, d.data() as Record<string, unknown>));
        } catch {
          // ignore
        }

        // Query by referral code if provided
        if (referralCode) {
          try {
            const snapCode = await getDocs(query(usersRef, where("referredByCode", "==", referralCode)));
            snapCode.forEach((d) => docMap.set(d.id, d.data() as Record<string, unknown>));
          } catch {
            // ignore
          }
        }

        if (isCancelled) return;

        const liveList: ReferredCandidate[] = [];
        docMap.forEach((data, id) => {
          liveList.push({
            id,
            name: (data.name as string) || ((data.email as string)?.split("@")[0]) || "Referred Student",
            course: (data.enrolledCourseTitle as string) || (data.course as string) || "Full Stack AI Engineering",
            date: formatDate((data.referredAt as string) || (data.createdAt as string) || Date.now()),
            status: normalizeStatus(data.referralStatus as string),
          });
        });

        setCandidates(liveList);
        if (typeof window !== "undefined") {
          localStorage.setItem(storageKey, JSON.stringify(liveList));
        }
      } catch (err) {
        console.warn("[useStudentReferrals] Live Firestore query failed:", err);
        if (!isCancelled) {
          setError("Unable to sync live Firestore referrals. Using local records.");
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchLiveReferrals();

    return () => {
      isCancelled = true;
    };
  }, [userId, referralCode, storageKey]);

  // Update candidate status dynamically
  const updateCandidateStatus = useCallback(
    async (candidateId: string, nextStatus: ReferralCandidateStatus) => {
      setCandidates((prev) => {
        const updated = prev.map((cand) =>
          cand.id === candidateId ? { ...cand, status: nextStatus } : cand
        );
        if (typeof window !== "undefined") {
          localStorage.setItem(storageKey, JSON.stringify(updated));
        }
        return updated;
      });

      // Try updating in Firestore if available
      if (db) {
        try {
          const candDocRef = doc(db, "users", candidateId);
          await updateDoc(candDocRef, { referralStatus: nextStatus });
        } catch {
          // best-effort Firestore sync
        }
      }
    },
    [storageKey]
  );

  return {
    candidates,
    loading,
    error,
    updateCandidateStatus,
  };
}
