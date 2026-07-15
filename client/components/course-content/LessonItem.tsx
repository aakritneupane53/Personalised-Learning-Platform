import React from "react";
import { Clock, Check } from "lucide-react";
import { Lesson } from "@/lib/queries/course-content";

export default function LessonItem({
  lesson,
  index,
  completed,
  onToggleComplete,
  isToggling,
}: {
  lesson: Lesson;
  index: number;
  completed: boolean;
  onToggleComplete: () => void;
  isToggling: boolean;
}) {
  return (
    <article
      className={`border rounded-lg p-6 md:p-8 bg-canvas transition-colors ${
        completed ? "border-green-600/40" : "border-hairline"
      }`}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <h3 className="heading-sm text-ink">
          <span className="text-mute font-normal mr-2">{index + 1}.</span>
          {lesson.title}
        </h3>
        <span className="flex-shrink-0 flex items-center gap-1 text-xs text-mute px-2.5 py-1 rounded-full border border-hairline">
          <Clock size={12} />
          {lesson.estimatedMinutes} min
        </span>
      </div>

      <div className="body-md text-body whitespace-pre-wrap leading-relaxed">{lesson.content}</div>

      {lesson.examples && (
        <div className="mt-6 bg-surface-soft rounded-lg p-4 overflow-x-auto">
          <p className="caption-sm text-mute uppercase tracking-wide mb-2">Examples</p>
          <pre className="code-sm text-ink whitespace-pre-wrap">{lesson.examples}</pre>
        </div>
      )}

      <button
        type="button"
        onClick={onToggleComplete}
        disabled={isToggling}
        className={`mt-6 h-9 px-4 rounded-full button-md flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 ${
          completed
            ? "bg-green-50 text-green-800 border border-green-600/40 hover:bg-green-100"
            : "bg-ink text-white hover:bg-ink-deep"
        }`}
      >
        <Check size={14} />
        {completed ? "Completed" : "Mark as complete"}
      </button>
    </article>
  );
}
