import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import type { ICourse } from "@/app/types";
import { CardCartButton } from "../Shared/CartButtons";
import {
  formatCount,
  formatDuration,
  formatPrice,
  imageProps,
  studentAvatars,
  creatorHref,
} from "../utils/course";

export type CourseCardData = Pick<
  ICourse,
  | "_id"
  | "slug"
  | "title"
  | "thumbnail"
  | "creator"
  | "level"
  | "price"
  | "price_label"
  | "rating_avg"
  | "rating_count"
  | "total_lessons"
  | "total_duration"
  | "students_count"
>;

/** Signal-strength icon used for the course level. */
export const LevelIcon = ({ level, className = "" }: { level: string; className?: string }) => {
  const bars = level === "Advanced" ? 3 : level === "Intermediate" ? 2 : level === "All Levels" ? 3 : 1;
  return (
    <svg viewBox="0 0 12 12" className={`size-3 ${className}`} aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={1 + i * 4}
          y={8 - i * 3}
          width="2.4"
          height={3 + i * 3}
          rx="0.6"
          fill="currentColor"
          opacity={i < bars ? 1 : 0.3}
        />
      ))}
    </svg>
  );
};

const Stat = ({ children }: { children: React.ReactNode }) => (
  <span className="rounded-full bg-white/25 px-2.5 py-1 text-[11px] leading-none font-medium whitespace-nowrap text-white backdrop-blur-md">
    {children}
  </span>
);

const CoursesCard = ({
  course,
  priority = false,
  showCart = true,
}: {
  course: CourseCardData;
  priority?: boolean;
  /** Off for static previews (e.g. the admin editor). */
  showCart?: boolean;
}) => {
  const href = `/courses/${course.slug}`;
  const avatars = studentAvatars(course.slug);

  return (
    <article className="group relative flex flex-col rounded-2xl border border-neutral-100 bg-white p-2 transition-shadow duration-300 hover:shadow-card-hover">
      {/* Thumbnail */}
      <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-neutral-100">
        {course.thumbnail && (
          <Image
            src={course.thumbnail}
            alt=""
            fill
            sizes="(min-width: 1280px) 360px, (min-width: 768px) 45vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            preload={priority}
            {...imageProps(course.thumbnail)}
          />
        )}
        <div className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-1.5">
          <Stat>{course.total_lessons} Lessons</Stat>
          <Stat>{formatDuration(course.total_duration)}</Stat>
          <Stat>{course.rating_count} Comments</Stat>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col px-2 pt-4 pb-2">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-1 font-heading text-base font-semibold text-neutral-950">
            {/* Stretched link: the whole card is clickable. */}
            <Link href={href} className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none">
              {course.title}
            </Link>
          </h3>
          <span className="flex shrink-0 items-center gap-1 text-sm text-neutral-500">
            {course.rating_avg ? course.rating_avg.toFixed(1) : "New"}
            <Star className="size-3.5 fill-neutral-300 text-neutral-300" aria-hidden="true" />
          </span>
        </div>

        <p className="mt-0.5 text-xs text-neutral-500">
          by{" "}
          <Link href={creatorHref(course.creator?.name)} className="relative z-10 text-primary-600 hover:underline">
            {course.creator?.name || "ByteSpace"}
          </Link>
        </p>

        <div className="mt-4 flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-50 px-3 py-1.5 text-xs text-neutral-700">
            <LevelIcon level={course.level} className="text-neutral-950" />
            {course.level}
          </span>

          <span className="flex items-center" aria-label={`${course.students_count} students`}>
            {avatars.map((src, i) => (
              <Image
                key={src}
                src={src}
                alt=""
                width={24}
                height={24}
                unoptimized
                className="-ml-1.5 size-6 rounded-full border-2 border-white object-cover first:ml-0"
                style={{ zIndex: avatars.length - i }}
              />
            ))}
            <span className="-ml-1.5 grid h-6 min-w-6 place-items-center rounded-full border-2 border-white bg-secondary-500 px-1 text-[10px] font-bold text-neutral-950">
              {formatCount(course.students_count)}+
            </span>
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="flex items-baseline gap-0.5">
            <span className="font-heading text-lg font-bold text-primary-600">{formatPrice(course.price)}</span>
            {course.price > 0 && (
              <span className="text-xs text-neutral-500">/{course.price_label || "lifetime"}</span>
            )}
          </p>
          {showCart && <CardCartButton course={course} />}
        </div>
      </div>
    </article>
  );
};

export const CoursesCardSkeleton = () => (
  <div className="animate-pulse rounded-2xl border border-neutral-100 bg-white p-2" aria-hidden="true">
    <div className="aspect-[16/9] rounded-xl bg-neutral-100" />
    <div className="space-y-3 px-2 pt-4 pb-2">
      <div className="h-4 w-3/4 rounded bg-neutral-100" />
      <div className="h-3 w-1/3 rounded bg-neutral-100" />
      <div className="h-6 w-1/2 rounded-full bg-neutral-100" />
      <div className="h-5 w-16 rounded bg-neutral-100" />
    </div>
  </div>
);

export default CoursesCard;
