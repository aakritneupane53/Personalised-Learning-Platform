import React from "react";
import { Lesson } from "@/lib/queries/course-content";
import LessonItem from "./LessonItem";

export default function LessonList({
  lessons,
  completedLessonIds,
  onToggleComplete,
  togglingLessonId,
}: {
  lessons: Lesson[];
  completedLessonIds: Set<string>;
  onToggleComplete: (lessonId: string, completed: boolean) => void;
  togglingLessonId: string | null;
}) {
  const completedCount = lessons.filter((lesson) => completedLessonIds.has(lesson.id)).length;

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="heading-md text-ink mb-1">Lessons</h2>
          <p className="body-sm text-mute">Work through these in order.</p>
        </div>
        <span className="flex-shrink-0 text-xs font-medium uppercase tracking-wide px-2.5 py-1 rounded-full border border-hairline-strong text-charcoal">
          {completedCount}/{lessons.length} completed
        </span>
      </div>
      <div className="flex flex-col gap-6">
        {lessons.map((lesson, index) => {
          const completed = completedLessonIds.has(lesson.id);
          return (
            <LessonItem
              key={lesson.id}
              lesson={lesson}
              index={index}
              completed={completed}
              isToggling={togglingLessonId === lesson.id}
              onToggleComplete={() => onToggleComplete(lesson.id, !completed)}
            />
          );
        })}
      </div>
    </section>
  );
}
