import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CourseModule } from "@/lib/queries/courses";

export default function ModuleRow({
  courseId,
  module,
  index,
}: {
  courseId: string;
  module: CourseModule;
  index: number;
}) {
  return (
    <Link
      href={`/dashboard/courses/${courseId}/modules/${module.id}`}
      className="flex items-center gap-4 py-4 border-b border-hairline last:border-b-0 hover:bg-surface-soft/50 transition-colors -mx-2 px-2 rounded-md"
    >
      <span className="w-8 h-8 rounded-full border border-hairline-strong flex items-center justify-center text-xs font-medium text-charcoal flex-shrink-0">
        {index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <p className="body-strong text-ink truncate">{module.title}</p>
        {module.shortDescription && (
          <p className="body-sm text-body truncate">{module.shortDescription}</p>
        )}
      </div>
      <ChevronRight size={16} className="text-mute flex-shrink-0" />
    </Link>
  );
}
