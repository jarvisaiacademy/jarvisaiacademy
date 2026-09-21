"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { TeacherRecord, TeacherStatus } from "@/data/teachers";
import {
  TeacherInput,
  subscribeTeachersFromFirestore,
  createTeacherInFirestore,
  updateTeacherInFirestore,
  deleteTeacherInFirestore,
  setTeacherStatusInFirestore,
} from "@/services/teachers-service";
import { useAuth } from "@/providers/auth-provider";

interface TeachersContextType {
  teachers: TeacherRecord[];
  loading: boolean;
  error: string | null;
  addTeacher: (input: TeacherInput) => Promise<TeacherRecord>;
  editTeacher: (id: string, updates: Partial<TeacherInput>) => Promise<void>;
  removeTeacher: (id: string) => Promise<void>;
  setTeacherStatus: (id: string, status: TeacherStatus) => Promise<void>;
}

const TeachersContext = createContext<TeachersContextType | undefined>(undefined);

/**
 * No optimistic state here, unlike `courses-provider`. `teachers` is admin-only to read, so
 * the only client subscribed to it is the dashboard that just made the write, and the
 * listener delivers the committed document. Mirroring the write locally would only be a
 * second copy to keep in step.
 */
export function TeachersProvider({ children }: { children: ReactNode }) {
  const { user, isAdmin } = useAuth();
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      setTeachers([]);
      setLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const unsubscribe = subscribeTeachersFromFirestore(
      (records) => {
        if (!isMounted) return;
        setTeachers(records ?? []);
        setLoading(false);
        setError(null);
      },
      (err) => {
        if (!isMounted) return;
        console.warn("[TeachersProvider] Teacher subscription error:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    if (!unsubscribe) setLoading(false);

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [isAdmin]);

  const addTeacher = (input: TeacherInput) =>
    createTeacherInFirestore(input, user?.email);

  const editTeacher = (id: string, updates: Partial<TeacherInput>) =>
    updateTeacherInFirestore(id, updates, user?.email);

  const removeTeacher = (id: string) => deleteTeacherInFirestore(id, user?.email);

  const setTeacherStatus = (id: string, status: TeacherStatus) =>
    setTeacherStatusInFirestore(id, status, user?.email);

  return (
    <TeachersContext.Provider
      value={{ teachers, loading, error, addTeacher, editTeacher, removeTeacher, setTeacherStatus }}
    >
      {children}
    </TeachersContext.Provider>
  );
}

export function useTeachers(): TeachersContextType {
  const context = useContext(TeachersContext);
  if (!context) {
    return {
      teachers: [],
      loading: false,
      error: null,
      addTeacher: async () => {
        throw new Error("useTeachers must be used within a TeachersProvider");
      },
      editTeacher: async () => {
        throw new Error("useTeachers must be used within a TeachersProvider");
      },
      removeTeacher: async () => {
        throw new Error("useTeachers must be used within a TeachersProvider");
      },
      setTeacherStatus: async () => {
        throw new Error("useTeachers must be used within a TeachersProvider");
      },
    };
  }
  return context;
}
