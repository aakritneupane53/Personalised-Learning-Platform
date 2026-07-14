import Link from "next/link";
import Image from "next/image";
import { Course } from "@/lib/queries/courses";
import { getCategoryMeta } from "@/lib/categories";

export default function CourseCard({ course }: { course: Course }) {
  const { label, image, icon: Icon } = getCategoryMeta(course.category);

  return (
    <Link
      href={`/dashboard/courses/${course.id}`}
      className="flex flex-col border border-hairline rounded-lg bg-canvas hover:border-hairline-strong transition-colors overflow-hidden"
    >
      <div className="relative w-full aspect-video bg-surface-soft flex items-center justify-center">
        {image ? (
          <Image src={image} alt="" fill className="object-cover" />
        ) : (
          <Icon className="text-mute" size={32} strokeWidth={1.5} />
        )}
      </div>

      <div className="flex flex-col gap-3 p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="heading-sm text-ink line-clamp-2">{course.title}</h3>
          <span className="shrink-0 text-xs font-medium uppercase tracking-wide px-2.5 py-1 rounded-full border border-hairline-strong text-charcoal">
            {course.skillLevel}
          </span>
        </div>
        <p className="body-sm text-body line-clamp-2">{course.topic}</p>
        <span className="text-xs text-mute">{label}</span>
      </div>
    </Link>
  );
}
