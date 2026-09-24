"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { StudentRecord } from "@/data/students";

/**
 * Hook to subscribe to the authenticated user's real-time student record from Firestore.
 *
 * Adheres strictly to Firebase quota and security rules:
 * - Listens to a single document (`users/{uid}`) where the user is authorized (`isSelf(uid)`).
 * - Updates in real time whenever profile fields, Super10 flag, or course assignments change.
 */
export function useStudentProfile(uid?: string | null): {
  profile: StudentRecord | null;
  loading: boolean;
} {
  const [profile, setProfile] = useState<StudentRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid || !db) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const docRef = doc(db, "users", uid);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setProfile({
            id: snapshot.id,
            ...(snapshot.data() as Omit<StudentRecord, "id">),
          });
        } else {
          setProfile(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error("[useStudentProfile] Error reading student profile:", error);
        setProfile(null);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [uid]);

  return { profile, loading };
}
