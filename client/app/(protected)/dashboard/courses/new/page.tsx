import React from "react";
import CourseForm from "@/components/courses/CourseForm";

export default function NewCoursePage() {
  return (
    <main className="flex-1 w-full mx-auto px-6 py-12 flex flex-col items-center gap-8 text-left">
      <div className="w-full max-w-lg text-center">
        <h1 className="display-lg text-ink font-medium mb-2">Create a course</h1>
        <p className="body-md text-body">
          Give us a title, topic, and skill level — we&apos;ll generate a module roadmap with AI.
        </p>
      </div>

      <CourseForm />
    </main>
  );
}
