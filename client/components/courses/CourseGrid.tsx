import React from "react";
import Link from "next/link";
import { Course } from "@/lib/queries/courses";
import CourseCard from "./CourseCard";

function SkeletonCard() {
  return (
    <div className="border border-hairline rounded-lg bg-canvas overflow-hidden animate-pulse">
      <div className="w-full aspect-video bg-surface-soft" />
      <div className="p-6">
        <div className="h-5 bg-surface-soft rounded-full w-3/4 mb-3" />
        <div className="h-4 bg-surface-soft rounded-full w-1/2" />
      </div>
    </div>
  );
}

export default function CourseGrid({
  courses,
  isLoading,
  isError,
  emptyTitle,
  emptyDescription,
}: {
  courses: Course[] | undefined;
  isLoading: boolean;
  isError: boolean;
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (isLoading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="border border-hairline rounded-lg p-8 text-center bg-canvas">
        <p className="body-md text-body">
          We couldn&apos;t load courses right now. Please try again shortly.
        </p>
      </div>
    );
  }

  if (!courses || courses.length === 0) {
    return (
      <div className="border border-hairline rounded-lg p-12 text-center bg-canvas flex flex-col items-center gap-4">
        <h3 className="heading-sm text-ink">{emptyTitle}</h3>
        <p className="body-sm text-body max-w-sm">{emptyDescription}</p>
        <Link
          href="/dashboard/courses/new"
          className="h-9 px-5 rounded-full bg-ink text-white hover:bg-ink-deep button-md flex items-center justify-center transition-colors"
        >
          Create a course
        </Link>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}
