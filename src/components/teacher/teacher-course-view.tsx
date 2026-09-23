"use client";

import React from "react";
import { ArrowLeft, Users, Mail, Phone, Calendar } from "lucide-react";
import type { CourseItem } from "@/data/courses";
import type { EnrollmentRecord } from "@/hooks/use-student-enrollments";

interface TeacherCourseViewProps {
  course: CourseItem;
  enrollments: EnrollmentRecord[];
  onBack: () => void;
}

export function TeacherCourseView({ course, enrollments, onBack }: TeacherCourseViewProps) {
  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 rounded-xl border border-neutral-200 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white leading-tight">
            {course.title}
          </h2>
          <div className="flex items-center gap-2 mt-1 text-sm text-neutral-500">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400">
              {course.categoryLabel}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {enrollments.length} {enrollments.length === 1 ? 'Student' : 'Students'} Enrolled
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 dark:bg-black/20 border-b border-neutral-200 dark:border-white/10">
              <tr>
                <th className="px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">Student Email</th>
                <th className="px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">Enrollment Date</th>
                <th className="px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-white/5">
              {enrollments.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-neutral-500">
                    No students enrolled yet.
                  </td>
                </tr>
              ) : (
                enrollments.map((enrollment) => (
                  <tr key={enrollment.id} className="hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-neutral-900 dark:text-neutral-100 font-medium">
                      {enrollment.studentEmail}
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {new Date(enrollment.timestamp).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                        {enrollment.action}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
