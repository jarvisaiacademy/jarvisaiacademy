"use client";

import { useEffect, useState } from "react";

/** One entry in the localStorage ledger written by the chat enrolment card. */
export interface EnrollmentRecord {
  action: "initiated" | "paid" | "not_paid";
  courseId: string;
  courseName: string;
  amount: number;
  transactionId: string;
  studentName: string;
  studentEmail: string;
  timestamp: string;
  messageId?: string;
}

const TRACKER_KEY = "jarvis_enrollment_tracker";

/**
 * The signed-in student's own enrolment records, newest first.
 *
 * Read in an effect rather than during render: the sidebar is server-rendered and
 * localStorage does not exist there. Records carry an email, not a uid — the tracker
 * is written before Firebase is consulted — so that is what we match on.
 */
export function useStudentEnrollments(email?: string | null): EnrollmentRecord[] {
  const [records, setRecords] = useState<EnrollmentRecord[]>([]);

  useEffect(() => {
    if (!email) {
      setRecords([]);
      return;
    }
    try {
      const parsed = JSON.parse(localStorage.getItem(TRACKER_KEY) || "[]");
      const mine = Array.isArray(parsed)
        ? parsed.filter(
            (r: EnrollmentRecord) =>
              r?.studentEmail?.toLowerCase() === email.toLowerCase()
          )
        : [];
      setRecords(mine);
    } catch {
      setRecords([]);
    }
  }, [email]);

  return records;
}
