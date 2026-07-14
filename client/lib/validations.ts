import { z } from "zod";
import { CourseCategoryEnum } from "@/lib/categories";

export const LoginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format")
    .max(255, "Email must be less than 255 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(255, "Password must be less than 255 characters"),
});

export const RegisterSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format")
    .max(255, "Email must be less than 255 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(255, "Password must be less than 255 characters"),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const SkillLevelEnum = z.enum(["beginner", "intermediate", "advanced"]);
export const CategoryEnum = z.enum(CourseCategoryEnum);

export const CreateCourseSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title must be less than 255 characters"),
  topic: z
    .string()
    .min(1, "Topic is required")
    .max(255, "Topic must be less than 255 characters"),
  skillLevel: SkillLevelEnum,
  category: CategoryEnum,
});

export type CreateCourseInput = z.infer<typeof CreateCourseSchema>;
