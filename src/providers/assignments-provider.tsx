"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { AssignmentRecord, StudentRecord } from "@/data/assignments";
import { CourseItem } from "@/data/courses";
import {
  subscribeAssignmentsFromFirestore,
  getAssignmentsFromFirestore,
  createAssignmentInFirestore,
  revokeAssignmentInFirestore,
  restoreAssignmentInFirestore,
} from "@/services/assignments-service";
import { useAuth } from "@/providers/auth-provider";

interface AssignmentsContextType {
  assignments: AssignmentRecord[];
  myAssignments: AssignmentRecord[];
  loading: boolean;
  error: string | null;
  assignCourse: (
    student: Pick<StudentRecord, "id" | "name" | "email">,
    course: Pick<CourseItem, "id" | "title">
  ) => Promise<void>;
  revokeAssignment: (id: string) => Promise<void>;
  restoreAssignment: (id: string) => Promise<void>;
  refreshAssignments: () => Promise<void>;
}

const AssignmentsContext = createContext<AssignmentsContextType | undefined>(undefined);

export function AssignmentsProvider({ children }: { children: ReactNode }) {
  const { user, isAdmin } = useAuth();
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = user?.id;

  useEffect(() => {
    if (!userId) {
      setAssignments([]);
      setLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const unsubscribe = subscribeAssignmentsFromFirestore(
      (records) => {
        if (!isMounted) return;
        setAssignments(records ?? []);
        setLoading(false);
        setError(null);
      },
      isAdmin ? undefined : { studentId: userId },
      (err) => {
        if (!isMounted) return;
        console.warn("[AssignmentsProvider] Subscription error:", err);
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
  }, [userId, isAdmin]);

  const assignCourse = async (
    student: Pick<StudentRecord, "id" | "name" | "email">,
    course: Pick<CourseItem, "id" | "title">
  ) => {
    if (!user?.isAdmin) {
      throw new Error("Unauthorized: Only verified admins can assign courses.");
    }
    const record = await createAssignmentInFirestore(
      { student, courseId: course.id, courseTitle: course.title },
      user.email
    );

    // Optimistic local insert (also covers Firestore-offline)
    setAssignments((prev) => {
      const others = prev.filter((a) => a.id !== record.id);
      return [record, ...others].sort((a, b) =>
        (b.assignedAt || "").localeCompare(a.assignedAt || "")
      );
    });
  };

  const revokeAssignment = async (id: string) => {
    if (!user?.isAdmin) {
      throw new Error("Unauthorized: Only verified admins can revoke assignments.");
    }
    await revokeAssignmentInFirestore(id, user.email);
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: "revoked", revokedAt: new Date().toISOString() } : a
      )
    );
  };

  const restoreAssignment = async (id: string) => {
    if (!user?.isAdmin) {
      throw new Error("Unauthorized: Only verified admins can restore assignments.");
    }
    await restoreAssignmentInFirestore(id, user.email);
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, status: "active" as const, revokedAt: undefined, revokedByEmail: undefined }
          : a
      )
    );
  };

  const refreshAssignments = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await getAssignmentsFromFirestore(isAdmin ? undefined : userId);
      setAssignments(data ?? []);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to refresh assignments";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const myAssignments = userId
    ? assignments.filter((a) => a.studentId === userId && a.status === "active")
    : [];

  return (
    <AssignmentsContext.Provider
      value={{
        assignments,
        myAssignments,
        loading,
        error,
        assignCourse,
        revokeAssignment,
        restoreAssignment,
        refreshAssignments,
      }}
    >
      {children}
    </AssignmentsContext.Provider>
  );
}

export function useAssignments(): AssignmentsContextType {
  const context = useContext(AssignmentsContext);
  if (!context) {
    return {
      assignments: [],
      myAssignments: [],
      loading: false,
      error: null,
      assignCourse: async () => {
        throw new Error("useAssignments must be used within an AssignmentsProvider");
      },
      revokeAssignment: async () => {
        throw new Error("useAssignments must be used within an AssignmentsProvider");
      },
      restoreAssignment: async () => {
        throw new Error("useAssignments must be used within an AssignmentsProvider");
      },
      refreshAssignments: async () => {},
    };
  }
  return context;
}
