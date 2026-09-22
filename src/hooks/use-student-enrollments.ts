"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface EnrollmentRecord {
  id?: string;
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

export const ENROLLMENTS_COLLECTION = "enrollments";

/**
 * The signed-in student's own enrolment records, newest first.
 *
 * Reads from the Firestore 'enrollments' collection matching on studentEmail.
 */
export function useStudentEnrollments(email?: string | null): EnrollmentRecord[] {
  const [records, setRecords] = useState<EnrollmentRecord[]>([]);

  useEffect(() => {
    if (!email || !db) {
      setRecords([]);
      return;
    }

    const q = query(
      collection(db, ENROLLMENTS_COLLECTION),
      where("studentEmail", "==", email)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as EnrollmentRecord)
        );

        // Sort descending by timestamp locally (since Firestore requires a composite index
        // if we orderBy("timestamp", "desc") alongside a where() clause).
        fetched.sort((a, b) => {
          // Fallback to 0 if parsing fails
          const tA = new Date(a.timestamp).getTime() || 0;
          const tB = new Date(b.timestamp).getTime() || 0;
          return tB - tA;
        });

        setRecords(fetched);
      },
      (error) => {
        console.error("[useStudentEnrollments] Error fetching enrollments:", error);
        setRecords([]);
      }
    );

    return () => unsubscribe();
  }, [email]);

  return records;
}
