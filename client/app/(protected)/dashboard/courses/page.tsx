"use client";

import React from "react";
import { useCoursesQuery } from "@/lib/queries/courses";
import CourseGrid from "@/components/courses/CourseGrid";

export default function BrowseCoursesPage() {
  const { data: courses, isLoading, isError } = useCoursesQuery();

  return (
    <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12 flex flex-col gap-8 text-left">
      <div>
        <h1 className="display-lg text-ink font-medium mb-2">Browse courses</h1>
        <p className="body-md text-body">All courses available on the platform.</p>
      </div>

      <CourseGrid
        courses={courses}
        isLoading={isLoading}
        isError={isError}
        emptyTitle="No courses yet"
        emptyDescription="Be the first to create a course for the catalog."
      />
    </main>
  );
}
