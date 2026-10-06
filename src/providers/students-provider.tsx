"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { StudentRecord } from "@/data/students";
import {
  subscribeStudentsFromFirestore,
  getStudentsFromFirestore,
} from "@/services/students-service";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/providers/auth-provider";

interface StudentsContextType {
  students: StudentRecord[];
  loading: boolean;
  error: string | null;
  refreshStudents: () => Promise<void>;
}

const StudentsContext = createContext<StudentsContextType | undefined>(undefined);

export function StudentsProvider({ children }: { children: ReactNode }) {
  const { isAdmin, user, sessionReady } = useAuth();
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionReady || !isAdmin || !user?.id) {
      setStudents([]);
      setLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;
    let unsubscribe: (() => void) | null = null;
    setLoading(true);

    const initSubscription = async () => {
      try {
        if (auth && typeof auth.authStateReady === "function") {
          await auth.authStateReady();
        }
      } catch (err) {
        console.warn("[StudentsProvider] authStateReady error:", err);
      }

      if (!isMounted || !auth?.currentUser || auth.currentUser.uid !== user.id) {
        if (isMounted) {
          setLoading(false);
          setError(
            "Sign in with your admin Google account to load the roster. Cached session alone cannot access Firestore."
          );
        }
        return;
      }

      if (!isMounted) return;

      unsubscribe = subscribeStudentsFromFirestore(
        (records) => {
          if (!isMounted) return;
          setStudents(records ?? []);
          setLoading(false);
          setError(null);
        },
        (err) => {
          if (!isMounted) return;
          console.warn("[StudentsProvider] Roster subscription error:", err);
          setError(err.message);
          setLoading(false);
        }
      );

      if (!unsubscribe && isMounted) {
        setLoading(false);
      }
    };

    void initSubscription();

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [isAdmin, sessionReady, user?.id]);

  const refreshStudents = async () => {
    try {
      if (auth && typeof auth.authStateReady === "function") {
        await auth.authStateReady();
      }
      const data = await getStudentsFromFirestore();
      setStudents(data ?? []);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to refresh students";
      setError(msg);
      throw err;
    }
  };

  return (
    <StudentsContext.Provider value={{ students, loading, error, refreshStudents }}>
      {children}
    </StudentsContext.Provider>
  );
}

export function useStudents(): StudentsContextType {
  const context = useContext(StudentsContext);
  if (!context) {
    return {
      students: [],
      loading: false,
      error: null,
      refreshStudents: async () => {},
    };
  }
  return context;
}
