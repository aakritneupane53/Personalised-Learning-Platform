import React from "react";
import Link from "next/link";
import { Course } from "@/lib/queries/courses";

export default function CourseCard({ course }: { course: Course }) {
  return (
    <Link
      href={`/dashboard/courses/${course.id}`}
      className="flex flex-col gap-3 border border-hairline rounded-lg p-6 bg-canvas hover:border-hairline-strong transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="heading-sm text-ink line-clamp-2">{course.title}</h3>
        <span className="flex-shrink-0 text-xs font-medium uppercase tracking-wide px-2.5 py-1 rounded-full border border-hairline-strong text-charcoal">
          {course.skillLevel}
        </span>
      </div>
      <p className="body-sm text-body line-clamp-2">{course.topic}</p>
    </Link>
  );
}
