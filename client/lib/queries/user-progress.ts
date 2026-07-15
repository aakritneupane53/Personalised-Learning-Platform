import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { CourseCategory } from "@/lib/categories";

export interface UserProgress {
  id: string;
  userId: string;
  lessonId: string;
  completed: boolean;
  completedAt: string | null;
}

export interface CourseProgressSummary {
  courseId: string;
  title: string;
  category: CourseCategory;
  status: string;
  totalLessons: number;
  completedLessons: number;
  percentComplete: number;
  lastActivityAt: string | null;
}

export interface UserProgressSummary {
  totalCourses: number;
  coursesCompleted: number;
  coursesInProgress: number;
  coursesNotStarted: number;
  totalLessonsCompleted: number;
  totalLessons: number;
  overallPercentComplete: number;
  courses: CourseProgressSummary[];
}

const userProgressKeys = {
  module: (moduleId: string) => ["user-progress", "module", moduleId] as const,
  summary: ["user-progress", "summary"] as const,
};

export const useProgressSummaryQuery = () =>
  useQuery<UserProgressSummary>({
    queryKey: userProgressKeys.summary,
    queryFn: async () => (await api.get("/user-progress/summary")).data,
  });

export const useModuleProgressQuery = (moduleId: string) =>
  useQuery<UserProgress[]>({
    queryKey: userProgressKeys.module(moduleId),
    queryFn: async () => (await api.get(`/user-progress/modules/${moduleId}`)).data,
    enabled: !!moduleId,
  });

export const useMarkLessonProgressMutation = (moduleId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      lessonId,
      completed,
    }: {
      lessonId: string;
      completed: boolean;
    }) => {
      const response = await api.patch<UserProgress>(
        `/user-progress/lessons/${lessonId}`,
        { completed },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userProgressKeys.module(moduleId) });
      queryClient.invalidateQueries({ queryKey: userProgressKeys.summary });
    },
  });
};
