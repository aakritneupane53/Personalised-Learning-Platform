import {
  Code2,
  LineChart,
  Palette,
  Briefcase,
  Megaphone,
  Calculator,
  FlaskConical,
  Languages,
  Sparkles,
  HeartPulse,
  BookOpen,
  type LucideIcon,
} from "lucide-react";

export const CourseCategoryEnum = [
  "programming",
  "data_science",
  "design",
  "business",
  "marketing",
  "mathematics",
  "science",
  "language",
  "personal_development",
  "health_fitness",
  "other",
] as const;

export type CourseCategory = (typeof CourseCategoryEnum)[number];

interface CategoryMeta {
  label: string;
  image: string | null;
  icon: LucideIcon;
}

export const CATEGORY_META: Record<CourseCategory, CategoryMeta> = {
  programming: { label: "Programming", image: "/category/Programming.png", icon: Code2 },
  data_science: { label: "Data Science", image: "/category/DataScience.png", icon: LineChart },
  design: { label: "Design", image: "/category/Design.png", icon: Palette },
  business: { label: "Business", image: null, icon: Briefcase },
  marketing: { label: "Marketing", image: "/category/Marketing.png", icon: Megaphone },
  mathematics: { label: "Mathematics", image: "/category/Mathematics.png", icon: Calculator },
  science: { label: "Science", image: "/category/Science.png", icon: FlaskConical },
  language: { label: "Language", image: "/category/Language.png", icon: Languages },
  personal_development: {
    label: "Personal Development",
    image: "/category/PersonalDevelopment.png",
    icon: Sparkles,
  },
  health_fitness: { label: "Health & Fitness", image: "/category/HealthAndFitness.png", icon: HeartPulse },
  other: { label: "Other", image: null, icon: BookOpen },
};

export function getCategoryMeta(category: CourseCategory | string | undefined | null): CategoryMeta {
  if (category && category in CATEGORY_META) {
    return CATEGORY_META[category as CourseCategory];
  }
  return CATEGORY_META.other;
}
