export interface GeneratedLessonItem {
  title: string;
  content: string;
  estimatedMinutes: number;
  examples: string; // Plain string block matching your updated entity layout
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
