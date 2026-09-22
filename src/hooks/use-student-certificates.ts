"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface CertificateRecord {
  id: string; // JAA-2026-XXXX
  courseId: string;
  courseName: string;
  studentName: string;
  studentEmail: string;
  issuedAt: string;
}

export const CERTIFICATES_COLLECTION = "certificates";

export function useStudentCertificates(email?: string | null): CertificateRecord[] {
  const [records, setRecords] = useState<CertificateRecord[]>([]);

  useEffect(() => {
    if (!email || !db) {
      setRecords([]);
      return;
    }

    const q = query(
      collection(db, CERTIFICATES_COLLECTION),
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
            } as CertificateRecord)
        );

        fetched.sort((a, b) => {
          const tA = new Date(a.issuedAt).getTime() || 0;
          const tB = new Date(b.issuedAt).getTime() || 0;
          return tB - tA;
        });

        setRecords(fetched);
      },
      (error) => {
        console.error("[useStudentCertificates] Error:", error);
        setRecords([]);
      }
    );

    return () => unsubscribe();
  }, [email]);

  return records;
}
