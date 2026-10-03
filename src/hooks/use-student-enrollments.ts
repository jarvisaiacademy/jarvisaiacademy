"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/providers/auth-provider";

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

/**
 * All enrolment records in the system (for admin views).
 * Attaches a real-time listener on the 'enrollments' collection.
 */
export function useAllEnrollments(): { enrollments: EnrollmentRecord[]; loading: boolean } {
  const { isAdmin, sessionReady, user } = useAuth();
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !sessionReady || !isAdmin || !user?.id) {
      setEnrollments([]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    let unsubscribe: (() => void) | null = null;

    const setup = async () => {
      if (auth && typeof auth.authStateReady === "function") {
        await auth.authStateReady();
      }
      if (!isMounted || !db || !auth?.currentUser || auth.currentUser.uid !== user.id) {
        if (isMounted) {
          setEnrollments([]);
          setLoading(false);
        }
        return;
      }

      const q = query(collection(db, ENROLLMENTS_COLLECTION));
      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!isMounted) return;
          const fetched = snapshot.docs.map(
            (doc) =>
              ({
                id: doc.id,
                ...doc.data(),
              } as EnrollmentRecord)
          );

          fetched.sort((a, b) => {
            const tA = new Date(a.timestamp).getTime() || 0;
            const tB = new Date(b.timestamp).getTime() || 0;
            return tB - tA;
          });

          setEnrollments(fetched);
          setLoading(false);
        },
        (error) => {
          if (!isMounted) return;
          console.warn("[useAllEnrollments] Error fetching all enrollments:", error);
          setEnrollments([]);
          setLoading(false);
        }
      );
    };

    void setup();

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [isAdmin, sessionReady, user?.id]);

  return { enrollments, loading };
}

