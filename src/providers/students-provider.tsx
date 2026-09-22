"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { StudentRecord } from "@/data/students";
import {
  subscribeStudentsFromFirestore,
  getStudentsFromFirestore,
} from "@/services/students-service";
import { useAuth } from "@/providers/auth-provider";

interface StudentsContextType {
  students: StudentRecord[];
  loading: boolean;
  error: string | null;
  refreshStudents: () => Promise<void>;
}

const StudentsContext = createContext<StudentsContextType | undefined>(undefined);

export function StudentsProvider({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      setStudents([]);
      setLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const unsubscribe = subscribeStudentsFromFirestore(
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

    if (!unsubscribe) {
      setLoading(false);
    }

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [isAdmin]);

  const refreshStudents = async () => {
    setLoading(true);
    try {
      const data = await getStudentsFromFirestore();
      setStudents(data ?? []);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to refresh students";
      setError(msg);
    } finally {
      setLoading(false);
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
