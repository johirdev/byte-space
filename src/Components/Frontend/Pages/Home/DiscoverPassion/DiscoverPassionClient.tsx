"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, SearchX } from "lucide-react";
import { apiRequest } from "@/app/lib/apiClient";
import type { ICourse, ICourseCategory } from "@/app/types";
import CoursesCard, { CoursesCardSkeleton } from "@/Components/Frontend/Card/CoursesCard";

/** Courses shown in the grid; more than this reveals "See More Courses". */
export const PAGE_SIZE = 9;
/** Category chips shown before "+ More". */
const VISIBLE_CATEGORIES = 17;

export default function DiscoverPassionClient({
  categories,
  initialCourses,
  initialTotal,
}: {
  categories: ICourseCategory[];
  initialCourses: ICourse[];
  initialTotal: number;
}) {
  // "" = Featured (all courses, featured first).
  const [active, setActive] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [courses, setCourses] = useState(initialCourses);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const firstRender = useRef(true);

  useEffect(() => {
    // The server already rendered the Featured grid.
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      try {
        const { data, meta } = await apiRequest<ICourse[]>("/courses", {
          signal: controller.signal,
          query: { category: active, sort: "relevant", page: 1, limit: PAGE_SIZE },
        });
        setCourses(data ?? []);
        setTotal(meta?.total ?? data.length);
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        setCourses([]);
        setTotal(0);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [active]);

  const hasMoreCategories = categories.length > VISIBLE_CATEGORIES;
  // Keep a selected category visible even when the list is collapsed.
  const shown = expanded
    ? categories
    : categories.filter((c, i) => i < VISIBLE_CATEGORIES || c.slug === active);
  const activeName = categories.find((c) => c.slug === active)?.name;
  const seeMoreHref = active ? `/courses?category=${encodeURIComponent(active)}` : "/courses";

  return (
    <section aria-labelledby="discover-heading" className="bg-white py-16 md:py-[100px] xl:py-[120px]">
      <div className="container-site">
        {/* Heading */}
        <div className="mx-auto max-w-[920px] text-center">
          <h2
            id="discover-heading"
            className="font-heading text-[clamp(1.875rem,1.3rem+2.2vw,2.75rem)] leading-[1.2] font-semibold tracking-[-0.01em] text-neutral-950"
          >
            Discover Your Passion,
            <br />
            Build Your Skills
          </h2>
          <p className="mx-auto mt-4 max-w-[900px] text-base leading-[1.6] text-neutral-500 md:mt-5 md:text-lg">
            At Bytespace Courses, we bring you closer to life-changing knowledge. Explore a variety of courses across
            different fields, from technology to the arts, and make a difference in your career and life.
          </p>
        </div>

        {/* Category chips */}
        <ul
          className="mx-auto mt-10 flex max-w-[1100px] flex-wrap items-center justify-center gap-x-3 gap-y-3 md:mt-12 md:gap-x-4 md:gap-y-6"
          aria-label="Filter courses by category"
        >
          <li>
            <Chip active={active === ""} onClick={() => setActive("")}>
              Featured
            </Chip>
          </li>
          {shown.map((category) => (
            <li key={category._id}>
              <Chip active={active === category.slug} onClick={() => setActive(category.slug)}>
                {category.name}
              </Chip>
            </li>
          ))}
          {hasMoreCategories && (
            <li>
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                className="h-10 cursor-pointer px-2 text-sm text-primary-600 transition-colors hover:text-primary-800 md:text-base"
              >
                {expanded ? "− Less" : `+ More`}
              </button>
            </li>
          )}
        </ul>

        {/* Course grid */}
        <div className="mt-12 md:mt-[72px]" aria-live="polite" aria-busy={loading}>
          {loading && courses.length === 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
              {Array.from({ length: 3 }, (_, i) => (
                <CoursesCardSkeleton key={i} />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-neutral-200 px-6 py-16 text-center">
              <SearchX className="size-7 text-neutral-300" aria-hidden="true" />
              <p className="mt-3 font-heading text-lg font-semibold text-neutral-950">
                {activeName ? `No ${activeName} courses yet` : "Courses are on their way"}
              </p>
              <p className="mt-1 text-sm text-neutral-500">
                {activeName ? "Try another category — new courses are added regularly." : "Check back soon."}
              </p>
            </div>
          ) : (
            <ul
              className={`grid gap-6 transition-opacity duration-300 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10 ${
                loading ? "opacity-50" : "opacity-100"
              }`}
            >
              {courses.map((course, i) => (
                <li key={course._id}>
                  <CoursesCard course={course} priority={i < 3} />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* See more → full search page */}
        {total > PAGE_SIZE && (
          <div className="mt-12 flex justify-center md:mt-16">
            <Link
              href={seeMoreHref}
              className="group inline-flex h-[52px] items-center gap-2 rounded-full bg-secondary-400 px-8 text-lg font-medium text-neutral-950 transition-colors hover:bg-secondary-300"
            >
              See More Courses
              <span className="text-base text-neutral-700">({total})</span>
              <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`h-10 cursor-pointer rounded-full font-medium px-4 text-sm whitespace-nowrap transition-colors md:text-base ${
        active
          ? "bg-secondary-400  text-neutral-950"
          : "bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
      }`}
    >
      {children}
    </button>
  );
}
