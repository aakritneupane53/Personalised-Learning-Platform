import { z } from 'zod';

// Raw shape the model is asked to produce. sortOrder is deliberately absent —
// it's derived from array position, saving an output field per module.
export const CourseOutlineSchema = z.object({
  title: z.string().trim().min(1, 'Course title is required').max(255),
  topic: z.string().trim().min(1, 'Course topic summary is required').max(1000),
  modules: z
    .array(
      z.object({
        title: z.string().trim().min(1, 'Module title is required').max(255),
        shortDescription: z
          .string()
          .trim()
          .max(500)
          .default('No description provided.'),
      }),
    )
    .min(4, 'Outline must contain at least 4 modules')
    .max(7, 'Outline must contain at most 7 modules'),
});

export interface ModuleItem {
  title: string;
  shortDescription: string;
  sortOrder: number;
}

export interface GeneratedCourseOutline {
  title: string;
  topic: string;
  modules: ModuleItem[];
}
