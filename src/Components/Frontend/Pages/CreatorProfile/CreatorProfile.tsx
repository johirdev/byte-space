"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { BadgeCheck, BarChart3, Filter, Globe, ListFilter, SearchX, Shapes, Star, UserRoundX } from "lucide-react";
import { apiRequest, ApiClientError } from "@/app/lib/apiClient";
import {
  COURSE_LEVELS,
  COURSE_SORTS,
  COURSE_SORT_LABELS,
  type ApiMeta,
  type CreatorProfile as Creator,
  type ICourse,
} from "@/app/types";
import { useFollowStore } from "@/store/followStore";
import CoursesCard, { CoursesCardSkeleton } from "../../Card/CoursesCard";
import UserAvatar from "../../Shared/UserAvatar";
import Dropdown from "../Courses/Dropdown";
import Pagination from "../Courses/Pagination";
import FollowButton from "./FollowButton";
import { formatCount } from "../../utils/course";

const PAGE_SIZE = 9;

type Filters = { level: string; category: string; sort: string; price: string; rating: string; page: number };
const EMPTY: Filters = { level: "", category: "", sort: "relevant", price: "", rating: "", page: 1 };

export default function CreatorProfile({
  slug,
  ownerActions,
  belowHero,
  coursesTitle,
}: {
  slug: string;
  /** Shown instead of Follow when a creator views their own profile. */
  ownerActions?: ReactNode;
  /** Extra panel between the hero and the course grid (e.g. account settings). */
  belowHero?: ReactNode;
  /** Optional heading above the course filters. */
  coursesTitle?: string;
}) {
  const [creator, setCreator] = useState<Creator | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [courses, setCourses] = useState<ICourse[]>([]);
  const [meta, setMeta] = useState<ApiMeta>();
  const [loading, setLoading] = useState(true);
  const gridRef = useRef<HTMLElement>(null);

  const following = useFollowStore((s) => s.following.includes(slug));

  useEffect(() => {
    void useFollowStore.persist.rehydrate();
  }, []);

  // Profile
  useEffect(() => {
    const controller = new AbortController();
    apiRequest<Creator>(`/creators/${encodeURIComponent(slug)}`, { signal: controller.signal })
      .then(({ data }) => setCreator(data))
      .catch((err) => {
        if ((err as Error)?.name === "AbortError") return;
        if (err instanceof ApiClientError && err.status === 404) setNotFound(true);
        else setLoadError(err instanceof ApiClientError ? err.message : "Could not load this creator");
      });
    return () => controller.abort();
  }, [slug]);

  // Their courses — same API/filters as the course search page.
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      try {
        const { data, meta: m } = await apiRequest<ICourse[]>("/courses", {
          signal: controller.signal,
          query: { creator: slug, ...filters, limit: PAGE_SIZE },
        });
        setCourses(data);
        setMeta(m);
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        setCourses([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [slug, filters]);

  const set = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, page: 1, ...patch }));
  const extra = Number(Boolean(filters.price)) + Number(Boolean(filters.rating));
  const hasFilters = Boolean(filters.level || filters.category || filters.price || filters.rating);

  const categoryOptions = useMemo(
    () => [
      { value: "", label: "All categories" },
      ...(creator?.categories ?? []).map((c) => ({ value: c.slug, label: `${c.name} (${c.count})` })),
    ],
    [creator],
  );

  if (notFound || loadError) {
    return (
      <main>
        <section className="bg-hero-grid pt-[72px] md:pt-[120px]">
          <div className="container-site flex flex-col items-center py-20 text-center text-white">
            <UserRoundX className="size-12" />
            <h1 className="mt-4 font-heading text-2xl font-semibold text-white">
              {notFound ? "Creator not found" : "Something went wrong"}
            </h1>
            <p className="mt-2 text-white/80">{notFound ? "They may not have any published courses yet." : loadError}</p>
            <Link href="/creator-profile" className="mt-8 rounded-full bg-secondary-400 px-6 py-3 font-medium text-neutral-950 hover:bg-secondary-300">
              See all creators
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const first = creator?.name.split(" ")[0];
  // Demo count: the base number plus you, once you follow.
  const followers = (creator?.followers ?? 0) + (following ? 1 : 0);

  return (
    <main>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="bg-hero-grid pt-[72px] md:pt-[120px]">
        <div className="container-site pt-8 pb-12 md:pt-10 md:pb-[76px]">
          {!creator ? (
            <div className="animate-pulse">
              <div className="flex items-center gap-5">
                <div className="size-[90px] rounded-[20px] bg-white/20" />
                <div className="space-y-3">
                  <div className="h-10 w-72 rounded-lg bg-white/20" />
                  <div className="h-5 w-48 rounded bg-white/15" />
                </div>
              </div>
              <div className="mt-12 h-20 max-w-5xl rounded-lg bg-white/10" />
              <div className="mt-10 flex gap-4">
                <div className="h-11 w-36 rounded-full bg-white/20" />
                <div className="h-11 w-36 rounded-full bg-white/20" />
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
                <UserAvatar name={creator.name} src={creator.avatar} size={90} rounded="rounded-[20px]" />
                <div className="min-w-0">
                  <h1 className="flex flex-wrap items-center gap-3 font-heading text-[clamp(1.75rem,1.2rem+1.6vw,2.25rem)] leading-tight font-semibold text-white">
                    {creator.name}
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full bg-secondary-400 px-5 py-1 font-body text-base font-medium text-neutral-950"
                      title={creator.verified ? "Verified by ByteSpace" : undefined}
                    >
                      {creator.verified && <BadgeCheck className="size-4" aria-label="Verified" />}
                      Creator
                    </span>
                  </h1>
                  {creator.title && <p className="mt-2 text-lg text-white">{creator.title}</p>}
                </div>
              </div>

              <div className="mt-8 max-w-[1120px] space-y-1 text-base leading-[1.75] text-white md:mt-12 md:text-lg">
                {creator.bio ? (
                  <p className="whitespace-pre-line">{creator.bio}</p>
                ) : (
                  <>
                    <p>
                      Welcome to the creative world of {creator.name}. Here, you&apos;ll discover the passion, expertise,
                      and inspiration that drive my creative journey. Let&apos;s explore and learn together!
                    </p>
                    <p>
                      Dive into my courses, each one built from real projects and hands-on practice. Explore the world of
                      learning with me.
                    </p>
                  </>
                )}
              </div>

              {(creator.expertise?.length || creator.linkedin || creator.website) && (
                <div className="mt-6 flex flex-wrap items-center gap-2">
                  {creator.expertise?.map((topic) => (
                    <span key={topic} className="rounded-full bg-white/15 px-3 py-1 text-sm text-white">
                      {topic}
                    </span>
                  ))}
                  {creator.linkedin && (
                    <a href={creator.linkedin} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/40 px-3 py-1 text-sm text-white hover:bg-white/15">
                      LinkedIn ↗
                    </a>
                  )}
                  {creator.website && (
                    <a href={creator.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full border border-white/40 px-3 py-1 text-sm text-white hover:bg-white/15">
                      <Globe className="size-3.5" /> Website ↗
                    </a>
                  )}
                </div>
              )}

              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 md:mt-10">
                <ul className="flex flex-wrap gap-3 md:gap-4">
                  <Pill value={creator.stats.courses} label={creator.stats.courses === 1 ? "Product" : "Products"} />
                  <Pill value={followers} label={followers === 1 ? "Follower" : "Followers"} animateKey={following ? "on" : "off"} />
                  {creator.stats.students > 0 && <Pill value={formatCount(creator.stats.students)} label="Students" />}
                  {creator.stats.rating > 0 && (
                    <li className="inline-flex h-11 items-center gap-1.5 rounded-full bg-white px-5 text-lg text-neutral-950">
                      <Star className="size-4 fill-primary-600 text-primary-600" />
                      <span className="text-primary-600">{creator.stats.rating.toFixed(1)}</span>
                      <span className="text-base text-neutral-500">({creator.stats.reviews})</span>
                    </li>
                  )}
                </ul>
                {ownerActions ?? <FollowButton slug={slug} name={first ?? creator.name} />}
              </div>
            </>
          )}
        </div>
      </section>

      {belowHero}

      {/* ── Courses ──────────────────────────────────────── */}
      <section ref={gridRef} className="container-site scroll-mt-4 pt-10 pb-16 md:pt-[58px] md:pb-[120px]">
        {coursesTitle && (
          <h2 className="mb-6 font-heading text-2xl font-semibold text-neutral-950 md:mb-8">
            {coursesTitle}
            {meta && <span className="ml-2 text-base font-normal text-neutral-500">({meta.total})</span>}
          </h2>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Dropdown label={extra ? `Filter (${extra})` : "Filter"} value={extra ? "on" : ""} icon={<Filter className="size-4" />}>
              {(close) => (
                <div className="w-64 space-y-3 p-2">
                  {[
                    { title: "Price", key: "price" as const, options: [["", "Any price"], ["free", "Free"], ["paid", "Paid"]] },
                    { title: "Rating", key: "rating" as const, options: [["", "Any rating"], ["4.5", "4.5 & up"], ["4", "4.0 & up"], ["3", "3.0 & up"]] },
                  ].map((group) => (
                    <fieldset key={group.key}>
                      <legend className="mb-2 text-xs font-medium tracking-wide text-neutral-500 uppercase">{group.title}</legend>
                      <div className="flex flex-wrap gap-1.5">
                        {group.options.map(([value, label]) => (
                          <button
                            key={label}
                            type="button"
                            aria-pressed={filters[group.key] === value}
                            onClick={() => set({ [group.key]: value })}
                            className={`cursor-pointer rounded-full px-3 py-1.5 text-xs ${
                              filters[group.key] === value ? "bg-primary-600 text-white" : "bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                  ))}
                  <div className="flex justify-between border-t border-neutral-100 pt-3">
                    <button type="button" onClick={() => set({ price: "", rating: "" })} className="cursor-pointer text-sm text-neutral-500 hover:text-neutral-950">
                      Reset
                    </button>
                    <button type="button" onClick={close} className="cursor-pointer rounded-full bg-neutral-950 px-4 py-1.5 text-sm font-medium text-white">
                      Done
                    </button>
                  </div>
                </div>
              )}
            </Dropdown>
            <Dropdown
              label={filters.level || "Level"}
              value={filters.level}
              icon={<BarChart3 className="size-4" />}
              options={[{ value: "", label: "All levels" }, ...COURSE_LEVELS.map((l) => ({ value: l, label: l }))]}
              onChange={(level) => set({ level })}
            />
            <Dropdown
              label={creator?.categories.find((c) => c.slug === filters.category)?.name ?? "Category"}
              value={filters.category}
              icon={<Shapes className="size-4" />}
              options={categoryOptions}
              onChange={(category) => set({ category })}
            />
          </div>
          <Dropdown
            label={COURSE_SORT_LABELS[filters.sort as keyof typeof COURSE_SORT_LABELS] ?? "Most relevant"}
            icon={<ListFilter className="size-4" />}
            options={COURSE_SORTS.map((s) => ({ value: s, label: COURSE_SORT_LABELS[s] }))}
            value={filters.sort === "relevant" ? "" : filters.sort}
            onChange={(sort) => set({ sort: sort || "relevant" })}
            align="right"
          />
        </div>

        <div className="mt-8 md:mt-10" aria-live="polite" aria-busy={loading}>
          {loading && !courses.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
              {Array.from({ length: 3 }, (_, i) => (
                <CoursesCardSkeleton key={i} />
              ))}
            </div>
          ) : !courses.length ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-neutral-200 px-6 py-16 text-center">
              <SearchX className="size-8 text-neutral-300" />
              <h2 className="mt-4 font-heading text-lg font-semibold">{hasFilters ? "No courses match these filters" : "No courses yet"}</h2>
              {hasFilters && (
                <button type="button" onClick={() => setFilters(EMPTY)} className="mt-5 cursor-pointer rounded-full bg-secondary-400 px-5 py-2.5 text-sm font-medium hover:bg-secondary-300">
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className={`grid gap-6 transition-opacity sm:grid-cols-2 lg:grid-cols-3 lg:gap-10 ${loading ? "opacity-50" : ""}`}>
              {courses.map((course, i) => (
                <CoursesCard key={course._id} course={course} priority={i < 3} />
              ))}
            </div>
          )}
        </div>

        {meta && meta.totalPages > 1 && (
          <div className="mt-12 md:mt-16">
            <Pagination
              page={filters.page}
              totalPages={meta.totalPages}
              onChange={(page) => {
                setFilters((f) => ({ ...f, page }));
                gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            />
          </div>
        )}
      </section>
    </main>
  );
}

function Pill({ value, label, animateKey }: { value: number | string; label: string; animateKey?: string }) {
  return (
    <li className="inline-flex h-11 items-center gap-1.5 overflow-hidden rounded-full bg-white px-5 text-lg text-neutral-950">
      <span key={animateKey} className={`text-primary-600 ${animateKey ? "animate-count-up" : ""}`}>
        {value}
      </span>
      {label}
    </li>
  );
}
