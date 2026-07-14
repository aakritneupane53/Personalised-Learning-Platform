import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  content: string;
  orderIndex: number;
  estimatedMinutes: number;
  examples: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuizQuestion {
  id: string;
  moduleId: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string | null;
  createdAt: string;
  updatedAt: string;
}

interface GenerateContentResponse {
  lessons: Lesson[];
  quiz: QuizQuestion[];
}

const courseContentKeys = {
  lessons: (moduleId: string) => ["course-content", "lessons", moduleId] as const,
  quizzes: (moduleId: string) => ["course-content", "quizzes", moduleId] as const,
  lesson: (lessonId: string) => ["course-content", "lesson", lessonId] as const,
  quiz: (quizId: string) => ["course-content", "quiz", quizId] as const,
};

export const useLessonsQuery = (moduleId: string) =>
  useQuery<Lesson[]>({
    queryKey: courseContentKeys.lessons(moduleId),
    queryFn: async () =>
      (await api.get(`/course-content/modules/${moduleId}/lessons`)).data,
    enabled: !!moduleId,
  });

export const useQuizzesQuery = (moduleId: string) =>
  useQuery<QuizQuestion[]>({
    queryKey: courseContentKeys.quizzes(moduleId),
    queryFn: async () =>
      (await api.get(`/course-content/modules/${moduleId}/quizzes`)).data,
    enabled: !!moduleId,
  });

export const useGenerateContentMutation = (moduleId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<GenerateContentResponse>(
        `/course-content/modules/${moduleId}/generate`,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseContentKeys.lessons(moduleId) });
      queryClient.invalidateQueries({ queryKey: courseContentKeys.quizzes(moduleId) });
    },
  });
};

export const useLessonQuery = (lessonId: string) =>
  useQuery<Lesson>({
    queryKey: courseContentKeys.lesson(lessonId),
    queryFn: async () => (await api.get(`/course-content/lessons/${lessonId}`)).data,
    enabled: !!lessonId,
  });

export const useQuizQuery = (quizId: string) =>
  useQuery<QuizQuestion>({
    queryKey: courseContentKeys.quiz(quizId),
    queryFn: async () => (await api.get(`/course-content/quizzes/${quizId}`)).data,
    enabled: !!quizId,
  });
