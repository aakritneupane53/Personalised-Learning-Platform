"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateCourseSchema, CreateCourseInput } from "@/lib/validations";
import { useCreateCourseMutation } from "@/lib/queries/courses";
import { parseServerError } from "@/lib/axios";

const SKILL_LEVELS: CreateCourseInput["skillLevel"][] = [
  "beginner",
  "intermediate",
  "advanced",
];

export default function CourseForm() {
  const router = useRouter();
  const createCourseMutation = useCreateCourseMutation();
  const [apiError, setApiError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateCourseInput>({
    resolver: zodResolver(CreateCourseSchema),
    defaultValues: {
      title: "",
      topic: "",
      skillLevel: "beginner",
    },
  });

  const onSubmit = (data: CreateCourseInput) => {
    setApiError(null);
    createCourseMutation.mutate(data, {
      onSuccess: (course) => {
        router.push(`/dashboard/courses/${course.id}`);
      },
      onError: (err: unknown) => {
        setApiError(parseServerError(err));
      },
    });
  };

  return (
    <div className="w-full max-w-lg bg-canvas border border-hairline rounded-lg p-8">
      {apiError && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md text-center px-4 leading-relaxed">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="title" className="body-sm-strong text-ink px-1">
            Course title
          </label>
          <input
            id="title"
            type="text"
            placeholder="e.g. Foundations of Transformers"
            {...register("title")}
            className={`w-full h-10 border bg-canvas text-ink text-sm px-4 rounded-full outline-none transition-colors ${
              errors.title ? "border-red-500 focus:border-red-500" : "border-hairline focus:border-ink"
            }`}
          />
          {errors.title && (
            <p className="text-xs text-red-600 px-1 font-medium mt-0.5">{errors.title.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="topic" className="body-sm-strong text-ink px-1">
            Topic
          </label>
          <input
            id="topic"
            type="text"
            placeholder="e.g. Large Language Models"
            {...register("topic")}
            className={`w-full h-10 border bg-canvas text-ink text-sm px-4 rounded-full outline-none transition-colors ${
              errors.topic ? "border-red-500 focus:border-red-500" : "border-hairline focus:border-ink"
            }`}
          />
          {errors.topic && (
            <p className="text-xs text-red-600 px-1 font-medium mt-0.5">{errors.topic.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="skillLevel" className="body-sm-strong text-ink px-1">
            Skill level
          </label>
          <select
            id="skillLevel"
            {...register("skillLevel")}
            className={`w-full h-10 border bg-canvas text-ink text-sm px-4 rounded-full outline-none transition-colors capitalize ${
              errors.skillLevel ? "border-red-500 focus:border-red-500" : "border-hairline focus:border-ink"
            }`}
          >
            {SKILL_LEVELS.map((level) => (
              <option key={level} value={level} className="capitalize">
                {level}
              </option>
            ))}
          </select>
          {errors.skillLevel && (
            <p className="text-xs text-red-600 px-1 font-medium mt-0.5">{errors.skillLevel.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={createCourseMutation.isPending}
          className="w-full h-10 bg-ink text-white hover:bg-ink-deep disabled:bg-surface-soft disabled:text-mute rounded-full button-md flex items-center justify-center transition-colors mt-2 cursor-pointer"
        >
          {createCourseMutation.isPending ? "Creating course..." : "Create course"}
        </button>
      </form>
    </div>
  );
}
