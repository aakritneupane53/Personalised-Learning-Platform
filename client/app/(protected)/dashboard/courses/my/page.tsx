"use client";

import React from "react";
import { useMyCoursesQuery } from "@/lib/queries/courses";
import CourseGrid from "@/components/courses/CourseGrid";

export default function MyCoursesPage() {
  const { data: courses, isLoading, isError } = useMyCoursesQuery();

  return (
    <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12 flex flex-col gap-8 text-left">
      <div>
        <h1 className="display-lg text-ink font-medium mb-2">My courses</h1>
        <p className="body-md text-body">Courses you&apos;ve created.</p>
      </div>

      <CourseGrid
        courses={courses}
        isLoading={isLoading}
        isError={isError}
        emptyTitle="You haven't created a course yet"
        emptyDescription="Create your first course and we'll generate a module roadmap for it."
      />
    </main>
  );
}
