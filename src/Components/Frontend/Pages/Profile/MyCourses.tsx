"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BarChart3, BookOpen, ListFilter, PlayCircle, Search, Shapes, Star } from "lucide-react";
import { apiRequest, ApiClientError } from "@/app/lib/apiClient";
import { COURSE_LEVELS, type EnrolledCourse, type ICourseCategory } from "@/app/types";
import Dropdown from "../Courses/Dropdown";
import ReviewModal, { type MyReview } from "../../Shared/ReviewModal";
import { LevelIcon } from "../../Card/CoursesCard";
import { categoryOf, formatDuration, imageProps, timeAgo } from "../../utils/course";

const SORTS = [
  { value: "", label: "Recently enrolled" },
  { value: "progress", label: "Most progress" },
  { value: "title", label: "Title (A–Z)" },
  { value: "rating", label: "Highest rated" },
  { value: "oldest", label: "Oldest first" },
];

export default function MyCourses() {
  const [filters, setFilters] = useState({ q: "", level: "", category: "", sort: "" });
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<EnrolledCourse[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<ICourseCategory[]>([]);
  const [reviewing, setReviewing] = useState<EnrolledCourse | null>(null);

  useEffect(() => {
    apiRequest<ICourseCategory[]>("/course-categories")
      .then(({ data }) => setCategories(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => (f.q === search ? f : { ...f, q: search })), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    apiRequest<EnrolledCourse[]>("/users/me/enrollments", { auth: "user", query: filters, signal: controller.signal })
      .then(({ data }) => {
        setRows(data);
        setError(null);
      })
      .catch((err) => {
        if ((err as Error)?.name === "AbortError") return;
        setError(err instanceof ApiClientError ? err.message : "Could not load your courses");
      });
    return () => controller.abort();
  }, [filters]);

  const filtered = Boolean(filters.q || filters.level || filters.category);
  const activeCategory = categories.find((c) => c.slug === filters.category);
  const categoryOptions = useMemo(
    () => [{ value: "", label: "All categories" }, ...categories.map((c) => ({ value: c.slug, label: c.name }))],
    [categories],
  );

  const onReviewSaved = (courseId: string, review: MyReview | null) =>
    setRows((prev) =>
      prev?.map((r) => (String(r.course._id) === courseId ? { ...r, my_review: review && { ...review, status: "approved" } } : r)) ?? prev,
    );

  return (
    <div>
      {/* Filters — same look as the course search / creator profile design */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <label className="relative">
            <span className="sr-only">Search my courses</span>
            <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search my courses"
              className="h-10 w-52 rounded-full border border-neutral-200 pr-4 pl-10 text-sm outline-none focus:border-primary-600"
            />
          </label>
          <Dropdown
            label={filters.level || "Level"}
            value={filters.level}
            icon={<BarChart3 className="size-4" />}
            options={[{ value: "", label: "All levels" }, ...COURSE_LEVELS.map((l) => ({ value: l, label: l }))]}
            onChange={(level) => setFilters((f) => ({ ...f, level }))}
          />
          <Dropdown
            label={activeCategory?.name ?? "Category"}
            value={filters.category}
            icon={<Shapes className="size-4" />}
            options={categoryOptions}
            onChange={(category) => setFilters((f) => ({ ...f, category }))}
          />
        </div>
        <Dropdown
          label={SORTS.find((s) => s.value === filters.sort)?.label ?? "Recently enrolled"}
          icon={<ListFilter className="size-4" />}
          options={SORTS}
          value={filters.sort}
          onChange={(sort) => setFilters((f) => ({ ...f, sort }))}
          align="right"
        />
      </div>

      <div className="mt-8 md:mt-10">
        {error ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</p>
        ) : rows === null ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[360px] animate-pulse rounded-2xl bg-neutral-50" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-neutral-200 px-6 py-16 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-primary-50 text-primary-600">
              <BookOpen className="size-6" />
            </span>
            <h3 className="mt-4 font-heading text-lg font-semibold">{filtered ? "No courses match" : "You haven't enrolled yet"}</h3>
            <p className="mt-1 text-sm text-neutral-500">
              {filtered ? "Try another search or filter." : "Find a course you love and it will show up here."}
            </p>
            {!filtered && (
              <Link href="/courses" className="mt-5 rounded-full bg-secondary-400 px-6 py-2.5 text-sm font-medium hover:bg-secondary-300">
                Browse courses
              </Link>
            )}
          </div>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
            {rows.map((row) => (
              <li key={String(row._id)}>
                <EnrolledCard row={row} onReview={() => setReviewing(row)} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {reviewing && (
        <ReviewModal
          open
          course={{ _id: String(reviewing.course._id), title: reviewing.course.title }}
          existing={reviewing.my_review}
          onClose={() => setReviewing(null)}
          onSaved={(review) => onReviewSaved(String(reviewing.course._id), review)}
        />
      )}
    </div>
  );
}

function EnrolledCard({ row, onReview }: { row: EnrolledCourse; onReview: () => void }) {
  const { course } = row;
  const category = categoryOf(course);
  const done = row.progress >= 100;

  return (
    <article className="group flex h-full flex-col rounded-2xl border border-neutral-100 bg-white p-2 transition-shadow hover:shadow-card-hover">
      <Link href={`/courses/${course.slug}#lessons`} className="relative block aspect-video overflow-hidden rounded-xl bg-neutral-100">
        {course.thumbnail && (
          <Image
            src={course.thumbnail}
            alt=""
            fill
            sizes="(min-width: 1024px) 360px, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            {...imageProps(course.thumbnail)}
          />
        )}
        <span className="absolute inset-0 grid place-items-center bg-neutral-950/0 opacity-0 transition-all group-hover:bg-neutral-950/30 group-hover:opacity-100">
          <PlayCircle className="size-12 text-white" />
        </span>
        {category && (
          <span className="absolute top-2 left-2 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-neutral-950">{category.name}</span>
        )}
        {done && (
          <span className="absolute top-2 right-2 rounded-full bg-secondary-400 px-2.5 py-1 text-[11px] font-medium text-neutral-950">Completed</span>
        )}
      </Link>

      <div className="flex flex-1 flex-col px-2 pt-4 pb-2">
        <Link href={`/courses/${course.slug}`} className="line-clamp-1 font-heading font-semibold text-neutral-950 hover:text-primary-600">
          {course.title}
        </Link>
        <p className="mt-0.5 text-xs text-neutral-500">
          by <span className="text-primary-600">{course.creator?.name}</span> · enrolled {timeAgo(row.createdAt)}
        </p>

        <div className="mt-3 flex items-center gap-3 text-xs text-neutral-500">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-50 px-3 py-1.5 text-neutral-700">
            <LevelIcon level={course.level} className="text-neutral-950" /> {course.level}
          </span>
          <span>
            {course.total_lessons} lessons · {formatDuration(course.total_duration)}
          </span>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-xs">
            <span className="text-neutral-500">Progress</span>
            <span className="font-medium text-neutral-950">{row.progress}%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-neutral-100" role="progressbar" aria-valuenow={row.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`${course.title} progress`}>
            <div className="h-full rounded-full bg-secondary-400" style={{ width: `${row.progress}%` }} />
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <button type="button" onClick={onReview} className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-neutral-700 hover:text-primary-600">
            {row.my_review ? (
              <>
                <span className="flex">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} className={`size-3.5 ${n <= row.my_review!.rating ? "fill-secondary-500 text-secondary-500" : "fill-neutral-200 text-neutral-200"}`} />
                  ))}
                </span>
                Edit
              </>
            ) : (
              <>
                <Star className="size-4" /> Rate course
              </>
            )}
          </button>
          <Link
            href={`/courses/${course.slug}#lessons`}
            className="rounded-full bg-secondary-400 px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-secondary-300"
          >
            {row.progress > 0 ? (done ? "Review" : "Continue") : "Start"}
          </Link>
        </div>
      </div>
    </article>
  );
}
