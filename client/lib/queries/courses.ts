import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { CreateCourseInput } from "@/lib/validations";

export type CourseStatus = "draft" | "published" | "archived";

export interface Course {
  id: string;
  userId: string;
  title: string;
  topic: string;
  skillLevel: string;
  status: CourseStatus;
  createdAt: string;
}

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  shortDescription: string | null;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

const coursesKeys = {
  list: ["courses", "list"] as const,
  my: ["courses", "my"] as const,
  detail: (courseId: string) => ["courses", "detail", courseId] as const,
  modules: (courseId: string) => ["courses", "modules", courseId] as const,
};

export const useCoursesQuery = () =>
  useQuery<Course[]>({
    queryKey: coursesKeys.list,
    queryFn: async () => (await api.get("/courses")).data,
  });

export const useMyCoursesQuery = () =>
  useQuery<Course[]>({
    queryKey: coursesKeys.my,
    queryFn: async () => (await api.get("/courses/user/me")).data,
  });

export const useCourseQuery = (courseId: string) =>
  useQuery<Course>({
    queryKey: coursesKeys.detail(courseId),
    queryFn: async () => (await api.get(`/courses/${courseId}`)).data,
    enabled: !!courseId,
  });

export const useModulesQuery = (courseId: string) =>
  useQuery<CourseModule[]>({
    queryKey: coursesKeys.modules(courseId),
    queryFn: async () => (await api.get(`/courses/modules/${courseId}`)).data,
    enabled: !!courseId,
  });

export const useCreateCourseMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCourseInput) => {
      const response = await api.post<Course>("/courses", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coursesKeys.list });
      queryClient.invalidateQueries({ queryKey: coursesKeys.my });
    },
  });
};
