"use client";

import React, { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLessonsQuery, useQuizzesQuery } from "@/lib/queries/course-content";
import LessonList from "@/components/course-content/LessonList";
import QuizList from "@/components/course-content/QuizList";
import GenerateContentGate from "@/components/course-content/GenerateContentGate";

export default function ModuleContentPage({
  params,
}: {
  params: Promise<{ courseId: string; moduleId: string }>;
}) {
  const { courseId, moduleId } = use(params);

  const { data: lessons, isLoading: isLessonsLoading, isError: isLessonsError } =
    useLessonsQuery(moduleId);
  const { data: quizzes, isLoading: isQuizzesLoading, isError: isQuizzesError } =
    useQuizzesQuery(moduleId);

  const isLoading = isLessonsLoading || isQuizzesLoading;
  const isError = isLessonsError || isQuizzesError;
  const hasContent = (lessons?.length ?? 0) > 0;

  return (
    <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-12 flex flex-col gap-8 text-left">
      <Link
        href={`/dashboard/courses/${courseId}`}
        className="body-sm text-body hover:text-ink transition-colors flex items-center gap-1.5 w-fit"
      >
        <ArrowLeft size={14} />
        Back to course
      </Link>

      {isLoading && (
        <div className="flex flex-col gap-4 animate-pulse">
          <div className="h-40 bg-surface-soft rounded-lg w-full" />
          <div className="h-40 bg-surface-soft rounded-lg w-full" />
        </div>
      )}

      {!isLoading && isError && (
        <div className="border border-hairline rounded-lg p-12 text-center bg-canvas flex flex-col items-center gap-4">
          <h3 className="heading-sm text-ink">Something went wrong</h3>
          <p className="body-sm text-body max-w-sm">
            We couldn&apos;t load this module&apos;s content right now. Please try again shortly.
          </p>
        </div>
      )}

      {!isLoading && !isError && !hasContent && <GenerateContentGate moduleId={moduleId} />}

      {!isLoading && !isError && hasContent && (
        <div className="flex flex-col gap-10">
          <LessonList lessons={lessons!} />
          {quizzes && quizzes.length > 0 && <QuizList quizzes={quizzes} />}
        </div>
      )}
    </main>
  );
}
