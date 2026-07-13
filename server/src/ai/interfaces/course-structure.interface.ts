// src/ai/interfaces/course-structure.interface.ts

export interface ModuleItem {
  title: string;
  shortDescription: string;
  sortOrder: number;
}

export interface GeneratedCourseOutline {
  title: string;
  topic: string;
  modules: ModuleItem[]; // 🔄 Change this key from 'lessons' or 'Modules' to 'modules'
}
