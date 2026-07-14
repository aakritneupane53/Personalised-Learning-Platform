"use client";

import React, { use } from "react";
import Link from "next/link";
import axios from "axios";
import { ArrowLeft } from "lucide-react";
import { useCourseQuery, useModulesQuery } from "@/lib/queries/courses";
import ModuleRow from "@/components/courses/ModuleRow";
import { getCategoryMeta } from "@/lib/categories";

export default function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);

  const { data: course, isLoading, isError, error } = useCourseQuery(courseId);
  const { data: modules, isLoading: isModulesLoading } = useModulesQuery(courseId);

  const notFound = axios.isAxiosError(error) && error.response?.status === 404;

  if (isError) {
    return (
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-12 flex flex-col items-center text-center gap-4">
        <h1 className="heading-lg text-ink">
          {notFound ? "Course not found" : "Something went wrong"}
        </h1>
        <p className="body-md text-body max-w-sm">
          {notFound
            ? "This course doesn't exist or may have been removed."
            : "We couldn't load this course right now. Please try again shortly."}
        </p>
        <Link
          href="/dashboard/courses"
          className="h-9 px-5 rounded-full bg-ink text-white hover:bg-ink-deep button-md flex items-center gap-2 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to courses
        </Link>
      </main>
    );
  }

  if (isLoading || !course) {
    return (
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-12 flex flex-col gap-8 animate-pulse">
        <div className="h-8 bg-surface-soft rounded-full w-2/3" />
        <div className="h-4 bg-surface-soft rounded-full w-1/2" />
        <div className="h-40 bg-surface-soft rounded-lg w-full" />
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-12 flex flex-col gap-8 text-left">
      <Link
        href="/dashboard/courses"
        className="body-sm text-body hover:text-ink transition-colors flex items-center gap-1.5 w-fit"
      >
        <ArrowLeft size={14} />
        Back to courses
      </Link>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-medium uppercase tracking-wide px-2.5 py-1 rounded-full border border-hairline-strong text-charcoal inline-block">
            {course.skillLevel}
          </span>
          <span className="text-xs font-medium uppercase tracking-wide px-2.5 py-1 rounded-full border border-hairline-strong text-charcoal inline-block">
            {getCategoryMeta(course.category).label}
          </span>
        </div>
        <h1 className="display-lg text-ink font-medium mb-2">{course.title}</h1>
        <p className="body-md text-body">{course.topic}</p>
      </div>

      <div>
        <h2 className="heading-md text-ink mb-4">Modules</h2>

        {isModulesLoading && (
          <div className="flex flex-col gap-3 animate-pulse">
            <div className="h-14 bg-surface-soft rounded-md w-full" />
            <div className="h-14 bg-surface-soft rounded-md w-full" />
            <div className="h-14 bg-surface-soft rounded-md w-full" />
          </div>
        )}

        {!isModulesLoading && (!modules || modules.length === 0) && (
          <p className="body-sm text-body">This course doesn&apos;t have any modules yet.</p>
        )}

        {!isModulesLoading && modules && modules.length > 0 && (
          <div className="border border-hairline rounded-lg px-4 bg-canvas">
            {modules.map((module, index) => (
              <ModuleRow key={module.id} courseId={courseId} module={module} index={index} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
