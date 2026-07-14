import React from "react";
import { QuizQuestion } from "@/lib/queries/course-content";
import QuizItem from "./QuizItem";

export default function QuizList({ quizzes }: { quizzes: QuizQuestion[] }) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="heading-md text-ink mb-1">Quiz</h2>
        <p className="body-sm text-mute">
          Self-check only — your answers aren&apos;t saved or scored.
        </p>
      </div>
      <div className="flex flex-col gap-4">
        {quizzes.map((quiz, index) => (
          <QuizItem key={quiz.id} quiz={quiz} index={index} />
        ))}
      </div>
    </section>
  );
}
