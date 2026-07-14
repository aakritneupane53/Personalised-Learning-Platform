import { z } from 'zod';

const QuizItemSchema = z
  .object({
    question: z.string().trim().min(1, 'Quiz question is required').max(500),
    options: z
      .array(z.string().trim().min(1))
      .length(4, 'Quiz questions must have exactly 4 options'),
    correctAnswer: z.string().trim().min(1, 'correctAnswer is required'),
    explanation: z
      .string()
      .trim()
      .max(1000)
      .default('No detailed explanation provided.'),
  })
  .refine((item) => item.options.includes(item.correctAnswer), {
    message: 'correctAnswer must exactly match one of the provided options',
    path: ['correctAnswer'],
  });

export const ModuleContentSchema = z.object({
  lessons: z
    .array(
      z.object({
        title: z.string().trim().min(1, 'Lesson title is required').max(255),
        content: z.string().trim().min(1, 'Lesson content is required'),
        estimatedMinutes: z.number().int().min(1).max(180).default(10),
        examples: z.string().trim().max(4000).default('No examples provided.'),
      }),
    )
    .min(2, 'At least 2 lessons are required')
    .max(3, 'At most 3 lessons are allowed'),
  quiz: z
    .array(QuizItemSchema)
    .length(3, 'Exactly 3 quiz questions are required'),
});

export interface GeneratedLessonItem {
  title: string;
  content: string;
  estimatedMinutes: number;
  examples: string;
}

export interface QuizQuestionItem {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface GeneratedModuleContent {
  lessons: GeneratedLessonItem[];
  quiz: QuizQuestionItem[];
}
