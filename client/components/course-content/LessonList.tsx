import React from "react";
import { Lesson } from "@/lib/queries/course-content";
import LessonItem from "./LessonItem";

export default function LessonList({ lessons }: { lessons: Lesson[] }) {
  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="heading-md text-ink mb-1">Lessons</h2>
        <p className="body-sm text-mute">Work through these in order.</p>
      </div>
      <div className="flex flex-col gap-6">
        {lessons.map((lesson, index) => (
          <LessonItem key={lesson.id} lesson={lesson} index={index} />
        ))}
      </div>
    </section>
  );
}
