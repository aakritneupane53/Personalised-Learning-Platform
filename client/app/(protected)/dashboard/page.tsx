"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Compass, Plus } from "lucide-react";
import { useProfileQuery } from "@/lib/queries/auth";
import { useMyCoursesQuery } from "@/lib/queries/courses";
import CourseGrid from "@/components/courses/CourseGrid";
import ProgressOverview from "@/components/dashboard/ProgressOverview";

export default function DashboardPage() {
  const { data: profile } = useProfileQuery();
  const { data: myCourses, isLoading, isError } = useMyCoursesQuery();

  const recentCourses = myCourses?.slice(0, 3);

  return (
    <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 flex flex-col gap-12 text-left">
      <div>
        <p className="caption-sm text-mute uppercase tracking-widest mb-1.5">Study Space</p>
        <h1 className="display-lg text-ink font-medium">
          Welcome back{profile?.name ? `, ${profile.name}` : ""}.
        </h1>
        <p className="body-md text-body mt-2">
          Browse courses, create a new one, or jump back into something you&apos;ve already started.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          href="/dashboard/courses"
          className="border border-hairline rounded-lg p-6 bg-canvas hover:border-hairline-strong transition-colors flex items-center justify-between gap-4"
        >
          <div>
            <Compass size={18} className="text-ink mb-3" />
            <h3 className="body-strong text-ink mb-1">Browse courses</h3>
            <p className="body-sm text-body">See everything available on the platform.</p>
          </div>
          <ArrowRight size={16} className="text-mute flex-shrink-0" />
        </Link>

        <Link
          href="/dashboard/courses/new"
          className="border border-hairline rounded-lg p-6 bg-canvas hover:border-hairline-strong transition-colors flex items-center justify-between gap-4"
        >
          <div>
            <Plus size={18} className="text-ink mb-3" />
            <h3 className="body-strong text-ink mb-1">Create a course</h3>
            <p className="body-sm text-body">Generate a new course outline with AI.</p>
          </div>
          <ArrowRight size={16} className="text-mute flex-shrink-0" />
        </Link>
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="heading-md text-ink">Your progress</h2>
        </div>
        <ProgressOverview />
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="heading-md text-ink">Your courses</h2>
          {myCourses && myCourses.length > 0 && (
            <Link href="/dashboard/courses/my" className="body-sm text-body hover:text-ink transition-colors">
              View all
            </Link>
          )}
        </div>

        <CourseGrid
          courses={recentCourses}
          isLoading={isLoading}
          isError={isError}
          emptyTitle="You haven't created a course yet"
          emptyDescription="Create your first course and we'll generate a module roadmap for it."
        />
      </div>
    </main>
  );
}
