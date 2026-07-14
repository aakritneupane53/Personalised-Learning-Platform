import React from "react";
import { Lesson } from "@/lib/queries/course-content";
import LessonItem from "./LessonItem";

export default function LessonList({ lessons }: { lessons: Lesson[] }) {
  return (
    <div className="flex flex-col gap-6">
      {lessons.map((lesson, index) => (
        <LessonItem key={lesson.id} lesson={lesson} index={index} />
      ))}
    </div>
  );
}
