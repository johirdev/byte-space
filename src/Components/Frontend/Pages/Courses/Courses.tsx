"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, Filter, ListFilter, SearchX, Shapes } from "lucide-react";
import { apiRequest, buildQuery, ApiClientError } from "@/app/lib/apiClient";
import {
  COURSE_LEVELS,
  COURSE_SORTS,
  COURSE_SORT_LABELS,
  type ApiMeta,
  type ICourse,
  type ICourseCategory,
} from "@/app/types";
import CoursesCard, { CoursesCardSkeleton } from "../../Card/CoursesCard";
import Dropdown from "./Dropdown";
import Pagination from "./Pagination";

export type CourseFilters = {
  q: string;
  category: string;
  level: string;
  sort: string;
  price: string;
  rating: string;
  page: number;
};

const PAGE_SIZE = 12;

const EMPTY: CourseFilters = {
  q: "",
  category: "",
  level: "",
  sort: "relevant",
  price: "",
  rating: "",
  page: 1,
};

const PRICE_OPTIONS = [
  { value: "", label: "Any price" },
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
];

const RATING_OPTIONS = [
  { value: "", label: "Any rating" },
  { value: "4.5", label: "4.5 & up" },
  { value: "4", label: "4.0 & up" },
  { value: "3", label: "3.0 & up" },
];

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="7.5" cy="7.5" r="6" />
    <path d="M12 12l4.5 4.5" />
  </svg>
);

/** Filters ↔ `?q=…&category=…` — defaults are left out to keep URLs short. */
const toQuery = (f: CourseFilters) =>
  buildQuery({
    q: f.q.trim(),
    category: f.category,
    level: f.level,
    sort: f.sort === "relevant" ? "" : f.sort,
    price: f.price,
    rating: f.rating,
    page: f.page > 1 ? f.page : "",
  });

export default function Courses({ initial }: { initial?: Partial<CourseFilters> }) {
  const router = useRouter();
  const [filters, setFilters] = useState<CourseFilters>({ ...EMPTY, ...initial });
  const [searchInput, setSearchInput] = useState(filters.q);

  const [categories, setCategories] = useState<ICourseCategory[]>([]);
  const [courses, setCourses] = useState<ICourse[]>([]);
  const [meta, setMeta] = useState<ApiMeta | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);

  const update = (patch: Partial<CourseFilters>) =>
    setFilters((prev) => ({ ...prev, page: 1, ...patch }));

  // Categories for the chips and dropdowns — loaded once.
  useEffect(() => {
    const controller = new AbortController();
    apiRequest<ICourseCategory[]>("/course-categories", { signal: controller.signal })
      .then(({ data }) => setCategories(data ?? []))
      .catch(() => {});
    return () => controller.abort();
  }, []);

  // Debounce typing into the search box.
  useEffect(() => {
    if (searchInput === filters.q) return;
    const timer = setTimeout(
      () => setFilters((prev) => ({ ...prev, q: searchInput, page: 1 })),
      350,
    );
    return () => clearTimeout(timer);
  }, [searchInput, filters.q]);

  // Fetch whenever the filters change, and mirror them into the URL.
  useEffect(() => {
    const controller = new AbortController();
    const query = toQuery(filters);
    router.replace(`/courses${query}`, { scroll: false });

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, meta: m } = await apiRequest<ICourse[]>("/courses", {
          signal: controller.signal,
          query: {
            q: filters.q.trim(),
            category: filters.category,
            level: filters.level,
            sort: filters.sort,
            price: filters.price,
            rating: filters.rating,
            page: filters.page,
            limit: PAGE_SIZE,
          },
        });
        setCourses(data ?? []);
        setMeta(m);
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        setError(err instanceof ApiClientError ? err.message : "Could not load courses");
        setCourses([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [filters, router]);

  const categoryOptions = useMemo(
    () => [
      { value: "", label: "All categories" },
      ...categories.map((c) => ({ value: c.slug, label: `${c.name} (${c.course_count ?? 0})` })),
    ],
    [categories],
  );

  const activeCategory = categories.find((c) => c.slug === filters.category);
  const extraFilters = Number(Boolean(filters.price)) + Number(Boolean(filters.rating));
  const hasFilters = Boolean(
    filters.q || filters.category || filters.level || filters.price || filters.rating,
  );

  const goToPage = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const clearAll = () => {
    setSearchInput("");
    setFilters({ ...EMPTY });
  };

  return (
    <main>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="bg-hero-grid pt-[72px] md:pt-[120px]">
        <div className="container-site pt-10 pb-12 text-center md:pt-6 md:pb-[62px]">
          <h1 className="font-heading text-[clamp(1.75rem,1.2rem+1.6vw,2.25rem)] leading-[1.2] font-semibold text-white">
            Find Your Next Course
          </h1>

          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              update({ q: searchInput });
            }}
            className="mx-auto mt-6 flex max-w-[640px] flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-[18px]"
          >
            <label className="relative block min-w-0 flex-1">
              <span className="sr-only">Search courses</span>
              <span className="pointer-events-none absolute top-1/2 left-5 -translate-y-1/2 text-neutral-400 sm:left-[27px]">
                <SearchIcon />
              </span>
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search"
                className="h-[46px] w-full rounded-full bg-white pr-5 pl-12 text-base text-neutral-950 outline-none placeholder:text-neutral-400 focus-visible:ring-4 focus-visible:ring-secondary-400/60 sm:pl-14"
              />
            </label>

            <Dropdown
              variant="lime"
              label={activeCategory?.name ?? "Courses"}
              options={categoryOptions}
              value={filters.category}
              onChange={(category) => update({ category })}
              align="right"
            />
          </form>
        </div>
      </section>

      {/* ── Filters ──────────────────────────────────────────── */}
      <section ref={resultsRef} className="container-site scroll-mt-4 pt-10 md:pt-[52px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Dropdown
              label={extraFilters ? `Filter (${extraFilters})` : "Filter"}
              value={extraFilters ? "on" : ""}
              icon={<Filter className="size-4" aria-hidden="true" />}
            >
              {(close) => (
                <div className="w-64 p-2">
                  <FilterGroup
                    title="Price"
                    options={PRICE_OPTIONS}
                    value={filters.price}
                    onChange={(price) => update({ price })}
                  />
                  <FilterGroup
                    title="Rating"
                    options={RATING_OPTIONS}
                    value={filters.rating}
                    onChange={(rating) => update({ rating })}
                  />
                  <div className="mt-3 flex justify-between gap-2 border-t border-neutral-100 pt-3">
                    <button
                      type="button"
                      onClick={() => update({ price: "", rating: "" })}
                      className="cursor-pointer text-sm text-neutral-500 hover:text-neutral-950"
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={close}
                      className="cursor-pointer rounded-full bg-neutral-950 px-4 py-1.5 text-sm font-medium text-white"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </Dropdown>

            <Dropdown
              label={filters.level || "Level"}
              value={filters.level}
              icon={<BarChart3 className="size-4" aria-hidden="true" />}
              options={[{ value: "", label: "All levels" }, ...COURSE_LEVELS.map((l) => ({ value: l, label: l }))]}
              onChange={(level) => update({ level })}
            />

            <Dropdown
              label={activeCategory?.name ?? "Category"}
              value={filters.category}
              icon={<Shapes className="size-4" aria-hidden="true" />}
              options={categoryOptions}
              onChange={(category) => update({ category })}
            />
          </div>

          <Dropdown
            label={COURSE_SORT_LABELS[filters.sort as keyof typeof COURSE_SORT_LABELS] ?? "Most relevant"}
            icon={<ListFilter className="size-4" aria-hidden="true" />}
            options={COURSE_SORTS.map((s) => ({ value: s, label: COURSE_SORT_LABELS[s] }))}
            value={filters.sort === "relevant" ? "" : filters.sort}
            onChange={(sort) => update({ sort: sort || "relevant" })}
            align="right"
          />
        </div>

        {/* Category chips — "Featured" is the default, featured-first view. */}
        <div className="no-scrollbar -mx-[var(--grid-margin)] mt-6 overflow-x-auto px-[var(--grid-margin)] md:mt-7">
          <ul className="flex w-max gap-3">
            <li>
              <Chip active={!filters.category} onClick={() => update({ category: "", sort: "relevant" })}>
                Featured
              </Chip>
            </li>
            {categories.map((category) => (
              <li key={category._id}>
                <Chip
                  active={filters.category === category.slug}
                  onClick={() => update({ category: category.slug })}
                >
                  {category.name}
                </Chip>
              </li>
            ))}
          </ul>
        </div>

        {hasFilters && !loading && meta && (
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-neutral-500">
            <span>
              <strong className="font-medium text-neutral-950">{meta.total}</strong>{" "}
              {meta.total === 1 ? "course" : "courses"} found
              {filters.q && (
                <>
                  {" "}for “<span className="text-neutral-950">{filters.q}</span>”
                </>
              )}
            </span>
            <button type="button" onClick={clearAll} className="cursor-pointer font-medium text-primary-600 hover:underline">
              Clear all
            </button>
          </div>
        )}
      </section>

      {/* ── Results ──────────────────────────────────────────── */}
      <section className="container-site pt-8 pb-16 md:pt-10 md:pb-[120px]" aria-live="polite" aria-busy={loading}>
        {error ? (
          <EmptyState title="Something went wrong" text={error} action="Try again" onAction={() => setFilters((f) => ({ ...f }))} />
        ) : loading && !courses.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
            {Array.from({ length: 6 }, (_, i) => (
              <CoursesCardSkeleton key={i} />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <EmptyState
            title="No courses match your search"
            text="Try a different keyword or remove some filters."
            action={hasFilters ? "Clear filters" : undefined}
            onAction={clearAll}
          />
        ) : (
          <div
            className={`grid gap-6 transition-opacity sm:grid-cols-2 lg:grid-cols-3 lg:gap-10 ${
              loading ? "opacity-50" : "opacity-100"
            }`}
          >
            {courses.map((course, i) => (
              <CoursesCard key={course._id} course={course} priority={i < 3} />
            ))}
          </div>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="mt-12 md:mt-16">
            <Pagination page={filters.page} totalPages={meta.totalPages} onChange={goToPage} />
          </div>
        )}
      </section>
    </main>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`h-10 cursor-pointer rounded-full font-medium px-4 text-sm whitespace-nowrap transition-colors ${
        active
          ? "bg-secondary-400  text-neutral-950"
          : "bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
      }`}
    >
      {children}
    </button>
  );
}

function FilterGroup({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className="mb-3">
      <legend className="mb-2 text-xs font-medium tracking-wide text-neutral-500 uppercase">{title}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <button
            key={option.value || "any"}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={value === option.value}
            className={`cursor-pointer rounded-full px-3 py-1.5 text-xs transition-colors ${
              value === option.value
                ? "bg-primary-600 text-white"
                : "bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function EmptyState({
  title,
  text,
  action,
  onAction,
}: {
  title: string;
  text: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-neutral-200 px-6 py-16 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-primary-50 text-primary-600">
        <SearchX className="size-6" aria-hidden="true" />
      </span>
      <h2 className="mt-4 font-heading text-lg font-semibold">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-neutral-500">{text}</p>
      {action && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 cursor-pointer rounded-full bg-secondary-400 px-5 py-2.5 text-sm font-medium text-neutral-950 hover:bg-secondary-300"
        >
          {action}
        </button>
      )}
    </div>
  );
}
