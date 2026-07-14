"use client";

import React, { useState } from "react";
import { Check, X } from "lucide-react";
import { QuizQuestion } from "@/lib/queries/course-content";

export default function QuizItem({ quiz, index }: { quiz: QuizQuestion; index: number }) {
  const [selected, setSelected] = useState<string | null>(null);

  const hasAnswered = selected !== null;

  return (
    <div className="border border-hairline rounded-lg p-6 bg-canvas">
      <p className="body-strong text-ink mb-4">
        <span className="text-mute font-normal mr-2">{index + 1}.</span>
        {quiz.question}
      </p>

      <div className="flex flex-col gap-2">
        {quiz.options.map((option) => {
          const isSelected = selected === option;
          const isCorrectOption = option === quiz.correctAnswer;
          const showCorrect = hasAnswered && isCorrectOption;
          const showIncorrect = hasAnswered && isSelected && !isCorrectOption;

          return (
            <button
              key={option}
              type="button"
              onClick={() => setSelected(option)}
              disabled={hasAnswered}
              className={`flex items-center justify-between gap-3 text-left px-4 py-2.5 rounded-full border text-sm transition-colors ${
                showCorrect
                  ? "border-green-600 bg-green-50 text-green-800"
                  : showIncorrect
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-hairline text-ink hover:border-hairline-strong"
              } ${hasAnswered ? "cursor-default" : "cursor-pointer"}`}
            >
              <span>{option}</span>
              {showCorrect && <Check size={14} />}
              {showIncorrect && <X size={14} />}
            </button>
          );
        })}
      </div>

      {hasAnswered && quiz.explanation && (
        <p className="body-sm text-body mt-4 pt-4 border-t border-hairline">{quiz.explanation}</p>
      )}
    </div>
  );
}
