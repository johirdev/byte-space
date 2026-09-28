import Image from "next/image";
import {
  Award,
  CircleCheck,
  FileText,
  Headset,
  Video,
  type LucideIcon,
} from "lucide-react";
import type { ICourse } from "@/app/types";
import { formatHours, formatPrice, imageProps, pad2 } from "../../utils/course";

/** Picks an icon for a "This course include" line by keyword. */
const includeIcon = (text: string): LucideIcon => {
  const t = text.toLowerCase();
  if (/video|lesson/.test(t)) return Video;
  if (/certif/.test(t)) return Award;
  if (/consult|support|mentor|call/.test(t)) return Headset;
  if (/resource|download|file|material/.test(t)) return FileText;
  return CircleCheck;
};

const PREVIEW_COUNT = 3;

export default function CourseSideCard({
  course,
  onEnroll,
}: {
  course: ICourse;
  onEnroll: () => void;
}) {
  const lessons = course.modules.flatMap((m) => m.lessons);
  const preview = lessons.slice(0, PREVIEW_COUNT);
  const more = lessons.length - preview.length;
  const pitch = course.creator?.bio || "Ready to Dive In? Enroll Now and Start Building Your Future!";

  return (
    <aside className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-card md:p-10 lg:p-[38px]">
      <h2 className="font-heading text-xl font-medium text-neutral-950">
        {course.total_lessons} Lessons{" "}
        <span className="whitespace-nowrap">({formatHours(course.total_duration)})</span>
      </h2>

      {preview.length > 0 && (
        <ol className="mt-4 space-y-3">
          {preview.map((lesson, i) => (
            <li key={`${lesson.title}-${i}`} className="flex items-start gap-3 text-sm text-neutral-950">
              <span className="w-5 shrink-0">{pad2(i + 1)}</span>
              <span className="flex-1 leading-tight">{lesson.title}</span>
              <span className="shrink-0 pl-3 text-primary-600">{lesson.duration} mins</span>
            </li>
          ))}
        </ol>
      )}
      {more > 0 && <p className="mt-4 text-sm text-neutral-500">{more} more videos</p>}

      <p className="mt-6 text-sm leading-[1.6] text-neutral-500">{pitch}</p>

      <p className="mt-5 flex items-baseline gap-0.5">
        <span className="font-heading text-[28px] font-bold text-primary-600">{formatPrice(course.price)}</span>
        {course.price > 0 && <span className="text-sm text-neutral-500">/{course.price_label || "lifetime"}</span>}
      </p>

      <button
        type="button"
        onClick={onEnroll}
        className="mt-5 h-[46px] w-full cursor-pointer rounded-full bg-secondary-400 font-medium text-neutral-950 transition-colors hover:bg-secondary-300"
      >
        Enroll Now
      </button>

      {course.includes.length > 0 && (
        <>
          <h3 className="mt-6 font-heading text-lg font-medium">This course include</h3>
          <ul className="mt-4 space-y-3">
            {course.includes.map((item) => {
              const Icon = includeIcon(item);
              return (
                <li key={item} className="flex items-center gap-3 text-sm text-neutral-500">
                  <Icon className="size-[18px] shrink-0 text-primary-600" aria-hidden="true" />
                  {item}
                </li>
              );
            })}
          </ul>
        </>
      )}

      {/* Creator */}
      <div className="mt-6 border-t border-neutral-100 pt-6">
        <div className="flex items-center gap-3">
          <span className="relative size-10 shrink-0 overflow-hidden rounded-full bg-neutral-100">
            {course.creator?.avatar ? (
              <Image src={course.creator.avatar} alt="" fill sizes="40px" className="object-cover" {...imageProps(course.creator.avatar)} />
            ) : (
              <span className="grid size-full place-items-center font-heading font-semibold text-neutral-500">
                {course.creator?.name?.[0]?.toUpperCase() ?? "B"}
              </span>
            )}
          </span>
          <span className="flex flex-col">
            <span className="text-base text-neutral-950">{course.creator?.name}</span>
            {course.creator?.title && <span className="text-sm text-neutral-500">{course.creator.title}</span>}
          </span>
        </div>
        <p className="mt-6 text-sm leading-[1.6] text-neutral-500">{pitch}</p>
        <a
          href="#"
          className="mt-5 inline-flex h-8 items-center rounded-full border border-neutral-200 px-3 text-sm text-neutral-950 transition-colors hover:border-neutral-950"
        >
          See Full Profile
        </a>
      </div>
    </aside>
  );
}
