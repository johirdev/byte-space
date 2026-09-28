"use client";

import { useState } from "react";
import { Check, ChevronDown, Video } from "lucide-react";
import type { ICourse } from "@/app/types";
import { formatDuration } from "../../utils/course";

const storageKey = (courseId?: string) => `bytespace:progress:${courseId}`;

/**
 * Per-browser lesson completion. Kept in localStorage until learner accounts
 * exist — then this becomes an API call with the same shape.
 */
function useLessonProgress(courseId: string | undefined, total: number) {
  const [done, setDone] = useState<string[]>(() => {
    try {
      const raw = window.localStorage.getItem(storageKey(courseId));
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  const toggle = (key: string) => {
    setDone((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      try {
        window.localStorage.setItem(storageKey(courseId), JSON.stringify(next));
      } catch {
        /* storage blocked — progress still works for this visit */
      }
      return next;
    });
  };

  const percent = total ? Math.round((done.length / total) * 100) : 0;
  return { done, toggle, percent: Math.min(100, percent) };
}

export default function LessonsTab({ course }: { course: ICourse }) {
  const { done, toggle, percent } = useLessonProgress(course._id, course.total_lessons);
  const [openModule, setOpenModule] = useState<number | null>(null);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-heading text-xl font-medium">Explore the Modules</h2>
        <p className="mt-6 text-sm leading-[1.75] text-neutral-500 md:text-[15px]">
          {course.modules_intro ||
            "Immerse yourself in the course content as we break down each module into comprehensive lessons, providing practical insights and hands-on experiences."}
        </p>
      </section>

      <section>
        <h2 className="font-heading text-xl font-medium">Lesson List</h2>
        {course.modules.length === 0 ? (
          <p className="mt-5 text-sm text-neutral-500">The curriculum is being prepared.</p>
        ) : (
          <ul className="mt-5 space-y-5">
            {course.modules.map((mod, mi) => {
              const expanded = openModule === mi;
              const minutes = mod.lessons.reduce((s, l) => s + l.duration, 0);
              return (
                <li key={`${mod.title}-${mi}`}>
                  <button
                    type="button"
                    onClick={() => setOpenModule(expanded ? null : mi)}
                    aria-expanded={expanded}
                    className="group flex w-full cursor-pointer items-start gap-3 text-left md:gap-4"
                  >
                    <span className="grid size-[52px] shrink-0 place-items-center rounded-xl bg-secondary-400 md:size-[72px] md:rounded-2xl">
                      <Video className="size-6 fill-neutral-950 text-neutral-950 md:size-8" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-3">
                        <span className="text-sm font-medium text-neutral-950 md:text-[15px]">{mod.title}</span>
                        <ChevronDown
                          className={`mt-0.5 size-4 shrink-0 text-neutral-400 transition-transform group-hover:text-neutral-950 ${
                            expanded ? "rotate-180" : ""
                          }`}
                          aria-hidden="true"
                        />
                      </span>
                      {mod.description && (
                        <span className="mt-1 block text-sm leading-[1.6] text-neutral-500">{mod.description}</span>
                      )}
                      <span className="mt-1 block text-xs text-neutral-400">
                        {mod.lessons.length} lessons · {formatDuration(minutes)}
                      </span>
                    </span>
                  </button>

                  {expanded && (
                    <ol className="mt-3 ml-[64px] space-y-1 md:ml-[88px]">
                      {mod.lessons.map((lesson, li) => {
                        const key = `${mi}-${li}`;
                        const complete = done.includes(key);
                        return (
                          <li key={key}>
                            <label className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-neutral-50">
                              <input
                                type="checkbox"
                                checked={complete}
                                onChange={() => toggle(key)}
                                className="peer sr-only"
                              />
                              <span
                                className={`grid size-5 shrink-0 place-items-center rounded-full border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-primary-600 ${
                                  complete ? "border-primary-600 bg-primary-600 text-white" : "border-neutral-300"
                                }`}
                                aria-hidden="true"
                              >
                                {complete && <Check className="size-3" />}
                              </span>
                              <span className={`flex-1 ${complete ? "text-neutral-400 line-through" : "text-neutral-700"}`}>
                                {lesson.title}
                                {lesson.is_preview && (
                                  <span className="ml-2 rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-medium text-primary-600 no-underline">
                                    Preview
                                  </span>
                                )}
                              </span>
                              <span className="shrink-0 text-xs text-primary-600">{lesson.duration} mins</span>
                            </label>
                          </li>
                        );
                      })}
                    </ol>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-heading text-xl font-medium">Lesson Content</h2>
        <p className="mt-6 text-sm leading-[1.75] text-neutral-500 md:text-[15px]">
          {course.lesson_content_info ||
            "Engage with each lesson through captivating video content, detailed textual explanations, and interactive elements."}
        </p>
      </section>

      <section>
        <h2 className="font-heading text-xl font-medium">Lesson Progress Tracking</h2>
        <p className="mt-6 text-sm leading-[1.75] text-neutral-500 md:text-[15px]">
          {course.progress_info ||
            "Witness your growth as you complete lessons, with an intuitive progress tracking feature guiding you through your learning journey."}
        </p>

        <div className="mt-5 rounded-2xl border border-neutral-200 px-4 py-4 md:px-4 md:py-5">
          <p className="text-xs text-neutral-950">Learning Progress</p>
          <p className="mt-1 font-heading text-[28px] leading-tight font-medium text-neutral-950">{percent}%</p>
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-100"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Learning progress"
          >
            <div className="h-full rounded-full bg-secondary-400 transition-[width] duration-500" style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-2 text-xs text-neutral-400">
            {done.length} of {course.total_lessons} lessons completed — open a module and tick lessons as you finish them.
          </p>
        </div>
      </section>
    </div>
  );
}
