"use client";

import React from "react";
import Link from "next/link";
import { BookOpen, CheckCircle2, Flame, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useProgressSummaryQuery } from "@/lib/queries/user-progress";
import { getCategoryMeta } from "@/lib/categories";

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <Card className="gap-3 py-5">
      <CardContent className="px-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-surface-soft border border-hairline flex items-center justify-center shrink-0">
          <Icon size={16} className="text-ink" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <p className="heading-sm text-ink leading-tight">{value}</p>
          <p className="caption-sm text-mute truncate">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function CourseProgressSkeleton() {
  return (
    <Card className="py-5">
      <CardContent className="px-5 flex items-center gap-4">
        <Skeleton className="w-9 h-9 rounded-full shrink-0" />
        <div className="flex-1 flex flex-col gap-2">
          <Skeleton className="h-4 w-1/3 rounded-full" />
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
        <Skeleton className="h-4 w-10 rounded-full shrink-0" />
      </CardContent>
    </Card>
  );
}

export default function ProgressOverview() {
  const { data: summary, isLoading, isError } = useProgressSummaryQuery();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="gap-3 py-5">
              <CardContent className="px-5 flex items-center gap-4">
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                <div className="flex-1 flex flex-col gap-2">
                  <Skeleton className="h-4 w-10 rounded-full" />
                  <Skeleton className="h-3 w-16 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <CourseProgressSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !summary) {
    return (
      <div className="border border-hairline rounded-lg p-8 text-center bg-canvas">
        <p className="body-md text-body">
          We couldn&apos;t load your progress right now. Please try again shortly.
        </p>
      </div>
    );
  }

  if (summary.totalCourses === 0) {
    return (
      <div className="border border-hairline rounded-lg p-8 text-center bg-canvas">
        <p className="body-sm text-body">
          Once you create a course and start completing lessons, your progress will show up here.
        </p>
      </div>
    );
  }

  const startedCourses = summary.courses.filter((c) => c.totalLessons > 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} label="Courses" value={String(summary.totalCourses)} />
        <StatCard icon={Flame} label="In progress" value={String(summary.coursesInProgress)} />
        <StatCard icon={CheckCircle2} label="Completed" value={String(summary.coursesCompleted)} />
        <StatCard
          icon={Target}
          label={`${summary.totalLessonsCompleted}/${summary.totalLessons} lessons`}
          value={`${summary.overallPercentComplete}%`}
        />
      </div>

      {startedCourses.length > 0 && (
        <div className="flex flex-col gap-3">
          {startedCourses.map((course) => {
            const { label, icon: Icon } = getCategoryMeta(course.category);
            const isComplete = course.percentComplete === 100;

            return (
              <Link key={course.courseId} href={`/dashboard/courses/${course.courseId}`}>
                <Card className="py-5 hover:border-hairline-strong transition-colors">
                  <CardContent className="px-5 flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full bg-surface-soft border border-hairline flex items-center justify-center shrink-0">
                      <Icon size={14} className="text-mute" strokeWidth={1.75} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <p className="body-sm-strong text-ink truncate">{course.title}</p>
                        {isComplete && (
                          <Badge variant="secondary" className="shrink-0">
                            Complete
                          </Badge>
                        )}
                      </div>
                      <Progress value={course.percentComplete} className="h-1.5" />
                    </div>
                    <div className="text-right shrink-0">
                      <p className="body-sm-strong text-ink">{course.percentComplete}%</p>
                      <p className="caption-sm text-mute">
                        {course.completedLessons}/{course.totalLessons} · {label}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
