"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, SearchX, Star } from "lucide-react";
import { apiRequest } from "@/app/lib/apiClient";
import type { ApiMeta, ICourse } from "@/app/types";
import { formatPrice, imageProps } from "../../../utils/course";

/** Wait this long after the last keystroke before searching. */
const DEBOUNCE_MS = 300;
const MIN_CHARS = 2;
const MAX_RESULTS = 6;

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="7.5" cy="7.5" r="6" />
    <path d="M12 12l4.5 4.5" />
  </svg>
);

type Result = { query: string; courses: ICourse[]; total: number };

/**
 * Hero search with live results: typing searches published courses
 * (debounced), results open in a dropdown, and picking one goes straight to
 * the course. Enter with nothing highlighted opens the full /courses search.
 */
export default function HeroSearch() {
  const router = useRouter();
  const listId = useId();
  const boxRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const term = query.trim();
  const searchable = term.length >= MIN_CHARS;

  // Debounced search; stale requests are aborted so results never arrive out of order.
  useEffect(() => {
    if (!searchable) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data, meta } = await apiRequest<ICourse[]>("/courses", {
          query: { q: term, limit: MAX_RESULTS, page: 1 },
          signal: controller.signal,
        });
        setResult({ query: term, courses: data ?? [], total: (meta as ApiMeta | undefined)?.total ?? data.length });
        setActive(-1);
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") setResult({ query: term, courses: [], total: 0 });
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term, searchable]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  const courses = searchable && result ? result.courses : [];
  const pending = searchable && (loading || result?.query !== term);
  const showPanel = open && searchable;
  // Rows: each course, then the "see all" link.
  const rowCount = courses.length + (courses.length ? 1 : 0);
  const allHref = `/courses?q=${encodeURIComponent(term)}`;

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!showPanel || !rowCount) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % rowCount);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? rowCount - 1 : i - 1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      go(active < courses.length ? `/courses/${courses[active].slug}` : allHref);
    }
  };

  return (
    <form
      action="/courses"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        go(term ? allHref : "/courses");
      }}
      className="mx-auto mt-8 flex max-w-[580px] items-start justify-center gap-2 sm:gap-[18px] md:mt-[60px]"
    >
      <div ref={boxRef} className="relative min-w-0 flex-1 sm:max-w-[460px]">
        <label className="relative block">
          <span className="sr-only">Search courses</span>
          <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-neutral-400 sm:left-[27px]">
            {pending ? <Loader2 className="size-[18px] animate-spin" aria-hidden="true" /> : <SearchIcon />}
          </span>
          <input
            type="search"
            name="q"
            value={query}
            autoComplete="off"
            placeholder="Course, topic, creator"
            role="combobox"
            aria-expanded={showPanel}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={showPanel && active >= 0 ? `${listId}-${active}` : undefined}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            className="h-[52px] w-full rounded-full bg-white pr-5 pl-11 font-body text-base text-neutral-950 outline-none placeholder:text-neutral-400 focus-visible:ring-4 focus-visible:ring-secondary-400/60 sm:pr-6 sm:pl-14 sm:text-lg"
          />
        </label>

        {showPanel && (
          <div
            id={listId}
            role="listbox"
            aria-label="Course suggestions"
            className="absolute inset-x-0 top-[calc(100%+10px)] z-50 overflow-hidden rounded-2xl bg-white text-left shadow-[0_24px_60px_-12px_rgb(0_0_0/0.35)]"
          >
            {pending && !courses.length ? (
              <ul className="space-y-1 p-2" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <li key={i} className="flex animate-pulse items-center gap-3 p-2">
                    <span className="aspect-video w-16 rounded-lg bg-neutral-100" />
                    <span className="flex-1 space-y-2">
                      <span className="block h-3 w-3/4 rounded bg-neutral-100" />
                      <span className="block h-2.5 w-1/3 rounded bg-neutral-100" />
                    </span>
                  </li>
                ))}
              </ul>
            ) : !courses.length ? (
              <div className="flex flex-col items-center px-6 py-8 text-center">
                <SearchX className="size-6 text-neutral-300" aria-hidden="true" />
                <p className="mt-2 text-sm text-neutral-700">
                  No courses found for “<span className="font-medium text-neutral-950">{term}</span>”
                </p>
                <Link href="/courses" onClick={() => setOpen(false)} className="mt-3 text-sm font-medium text-primary-600 hover:underline">
                  Browse all courses
                </Link>
              </div>
            ) : (
              <>
                <ul className={`max-h-[360px] overflow-y-auto p-2 transition-opacity ${pending ? "opacity-60" : ""}`}>
                  {courses.map((course, i) => (
                    <li key={course._id} id={`${listId}-${i}`} role="option" aria-selected={active === i}>
                      <Link
                        href={`/courses/${course.slug}`}
                        onClick={() => setOpen(false)}
                        onMouseEnter={() => setActive(i)}
                        className={`flex items-center gap-3 rounded-xl p-2 transition-colors ${active === i ? "bg-neutral-50" : ""}`}
                      >
                        <span className="relative aspect-video w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                          {course.thumbnail && (
                            <Image src={course.thumbnail} alt="" fill sizes="64px" className="object-cover" {...imageProps(course.thumbnail)} />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-neutral-950">{course.title}</span>
                          <span className="mt-0.5 flex items-center gap-2 text-xs text-neutral-500">
                            <span className="truncate">by {course.creator?.name || "ByteSpace"}</span>
                            {course.rating_avg > 0 && (
                              <span className="inline-flex shrink-0 items-center gap-0.5">
                                <Star className="size-3 fill-secondary-500 text-secondary-500" aria-hidden="true" />
                                {course.rating_avg.toFixed(1)}
                              </span>
                            )}
                          </span>
                        </span>
                        <span className="shrink-0 font-heading text-sm font-bold text-primary-600">{formatPrice(course.price)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  id={`${listId}-${courses.length}`}
                  role="option"
                  aria-selected={active === courses.length}
                  href={allHref}
                  onClick={() => setOpen(false)}
                  onMouseEnter={() => setActive(courses.length)}
                  className={`flex items-center justify-between gap-2 border-t border-neutral-100 px-4 py-3 text-sm font-medium text-primary-600 transition-colors ${
                    active === courses.length ? "bg-neutral-50" : ""
                  }`}
                >
                  See all {result && result.total > courses.length ? result.total : ""} results for “{term}”
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </>
            )}
          </div>
        )}
      </div>

      <button
        type="submit"
        className="h-[52px] shrink-0 cursor-pointer rounded-full bg-secondary-400 px-5 font-body text-base font-medium text-neutral-950 transition-colors hover:bg-secondary-300 focus-visible:ring-4 focus-visible:ring-white/60 focus-visible:outline-none sm:h-[46px] sm:px-6 sm:text-lg"
      >
        Search
      </button>
    </form>
  );
}
