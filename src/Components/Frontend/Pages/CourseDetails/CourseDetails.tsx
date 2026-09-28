"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Share2, Star, UsersRound } from "lucide-react";
import { apiRequest, ApiClientError } from "@/app/lib/apiClient";
import type { ICourse } from "@/app/types";
import { LevelIcon } from "../../Card/CoursesCard";
import { categoryOf, creatorHref } from "../../utils/course";
import CourseVideo from "./CourseVideo";
import CourseSideCard from "./CourseSideCard";
import AboutTab from "./AboutTab";
import LessonsTab from "./LessonsTab";
import ReviewsTab from "./ReviewsTab";

const TABS = [
  { id: "about", label: "About" },
  { id: "lessons", label: "Lessons" },
  { id: "reviews", label: "Reviews" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const isTab = (value: string): value is TabId => TABS.some((t) => t.id === value);

export default function CourseDetails({ slug }: { slug: string }) {
  const [course, setCourse] = useState<ICourse | null>(null);
  const [error, setError] = useState<{ status: number; message: string } | null>(null);
  const [tab, setTab] = useState<TabId>("about");
  const [shared, setShared] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    apiRequest<ICourse>(`/courses/${encodeURIComponent(slug)}`, { signal: controller.signal })
      .then(({ data }) => setCourse(data))
      .catch((err) => {
        if ((err as Error)?.name === "AbortError") return;
        setError({
          status: err instanceof ApiClientError ? err.status : 0,
          message: err instanceof ApiClientError ? err.message : "Could not load this course",
        });
      });
    return () => controller.abort();
  }, [slug]);

  // Deep links: /courses/x#reviews opens the Reviews tab.
  useEffect(() => {
    const fromHash = () => {
      const hash = window.location.hash.slice(1);
      if (isTab(hash)) setTab(hash);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  const selectTab = (id: TabId) => {
    setTab(id);
    history.replaceState(null, "", `#${id}`);
  };

  const share = async () => {
    const url = window.location.href.split("#")[0];
    try {
      if (navigator.share) {
        await navigator.share({ title: course?.title, text: course?.subtitle, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      /* user cancelled the share sheet */
    }
  };

  if (error) return <DetailsError {...error} />;
  if (!course) return <DetailsSkeleton />;

  const category = categoryOf(course);

  return (
    <main className="overflow-x-clip">
      <div className="container-site relative isolate grid grid-cols-1 gap-x-10 pt-[72px] md:pt-[120px] lg:grid-cols-12 lg:grid-rows-[auto_auto_1fr]">
        {/* Blue band behind the header + video rows, bleeding to the viewport edges. */}
        <div
          aria-hidden="true"
          className="bg-hero-grid pointer-events-none col-[1/-1] row-[1/3] -z-10 mx-[calc(50%-50vw)] -mt-[72px] md:-mt-[120px]"
        />

        {/* ── Header ───────────────────────────────────────── */}
        <header className="col-[1/-1] row-start-1 flex flex-col-reverse gap-4 pt-6 pb-10 sm:flex-row sm:items-start sm:justify-between md:pt-4 md:pb-11">
          <div className="min-w-0">
            {category && (
              <Link
                href={`/courses?category=${category.slug}`}
                className="mb-3 inline-block rounded-full bg-white/15 px-3 py-1 text-xs text-white backdrop-blur hover:bg-white/25"
              >
                {category.name}
              </Link>
            )}
            <h1 className="font-heading text-[clamp(1.6rem,1.1rem+1.6vw,2.25rem)] leading-[1.2] font-semibold text-white">
              {course.title}
            </h1>
            {course.subtitle && (
              <p className="mt-1 font-heading text-base font-semibold text-white md:text-lg">
                {course.subtitle}
              </p>
            )}
            <p className="mt-4 text-base text-white">
              by{" "}
              <Link
                href={creatorHref(course.creator?.name)}
                className="text-secondary-400 hover:underline"
              >
                {course.creator?.name}
              </Link>
            </p>

            <ul className="mt-4 flex flex-wrap gap-3">
              <HeroPill>
                <LevelIcon
                  level={course.level}
                  className="size-3.5 text-primary-600"
                />
                {course.level}
              </HeroPill>
              <HeroPill>
                <Star
                  className="size-4 fill-primary-600 text-primary-600"
                  aria-hidden="true"
                />
                {course.rating_avg ? course.rating_avg.toFixed(1) : "New"} (
                {course.rating_count} reviews)
              </HeroPill>
              <HeroPill>
                <UsersRound
                  className="size-4 text-primary-600"
                  aria-hidden="true"
                />
                {course.students_count} Students
              </HeroPill>
            </ul>
          </div>

          <button
            type="button"
            onClick={share}
            className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 self-end rounded-full bg-secondary-400 px-6 text-sm font-medium text-neutral-950 transition-colors hover:bg-secondary-300 sm:self-auto xl:-mr-[62px]"
          >
            {shared ? (
              <Check className="size-4" aria-hidden="true" />
            ) : (
              <Share2 className="size-4" aria-hidden="true" />
            )}
            {shared ? "Link copied" : "Share"}
          </button>
        </header>

        {/* ── Video ────────────────────────────────────────── */}
        <div className="col-[1/-1] row-start-2 pb-8 md:pb-[62px] lg:col-[1/span_7]">
          <CourseVideo
            thumbnail={course.thumbnail}
            video={course.preview_video}
            title={course.title}
          />
        </div>

        {/* ── Side card (spans into the white area on desktop) ── */}
        <div className="col-[1/-1] row-start-3 lg:col-[8/span_5] lg:row-[2/4] xl:w-full xl:max-w-[410px] xl:justify-self-end">
          <CourseSideCard course={course} />
        </div>

        {/* ── Tabs ─────────────────────────────────────────── */}
        <div className="col-[1/-1] row-start-4 pt-10 pb-16 md:pt-[62px] md:pb-[120px] lg:col-[1/span_7] lg:row-start-3">
          <div
            role="tablist"
            aria-label="Course sections"
            className="flex gap-3"
          >
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                id={`tab-${t.id}`}
                aria-selected={tab === t.id}
                aria-controls={`panel-${t.id}`}
                onClick={() => selectTab(t.id)}
                className={`h-10 cursor-pointer rounded-full font-medium px-4 text-sm transition-colors ${
                  tab === t.id
                    ? "bg-secondary-400  text-neutral-950"
                    : "bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div
            role="tabpanel"
            id={`panel-${tab}`}
            aria-labelledby={`tab-${tab}`}
            className="mt-8 md:mt-10"
          >
            {tab === "about" && <AboutTab course={course} />}
            {tab === "lessons" && <LessonsTab course={course} />}
            {tab === "reviews" && <ReviewsTab course={course} />}
          </div>
        </div>
      </div>
    </main>
  );
}

function HeroPill({ children }: { children: React.ReactNode }) {
  return (
    <li className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-5 text-sm text-neutral-950">
      {children}
    </li>
  );
}

function DetailsSkeleton() {
  return (
    <main aria-busy="true">
      <div className="bg-hero-grid pt-[72px] md:pt-[120px]">
        <div className="container-site animate-pulse pt-6 pb-16">
          <div className="h-9 w-2/3 rounded-lg bg-white/20" />
          <div className="mt-3 h-5 w-1/2 rounded bg-white/15" />
          <div className="mt-6 flex gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-10 w-32 rounded-full bg-white/20" />
            ))}
          </div>
          <div className="mt-10 grid gap-10 lg:grid-cols-12">
            <div className="aspect-[722/480] rounded-2xl bg-white/20 lg:col-span-7" />
            <div className="hidden h-96 rounded-2xl bg-white/30 lg:col-span-5 lg:block xl:col-span-4 xl:col-start-9" />
          </div>
        </div>
      </div>
    </main>
  );
}

function DetailsError({ status, message }: { status: number; message: string }) {
  return (
    <main>
      <div className="bg-hero-grid pt-[72px] md:pt-[120px]">
        <div className="container-site py-20 text-center text-white">
          <p className="font-heading text-6xl font-semibold">{status === 404 ? "404" : "Oops"}</p>
          <h1 className="mt-4 font-heading text-2xl font-semibold text-white">
            {status === 404 ? "This course isn't available" : "Something went wrong"}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-neutral-100">
            {status === 404 ? "It may have been unpublished or the link is wrong." : message}
          </p>
          <Link
            href="/courses"
            className="mt-8 inline-flex h-11 items-center rounded-full bg-secondary-400 px-6 font-medium text-neutral-950 hover:bg-secondary-300"
          >
            Browse all courses
          </Link>
        </div>
      </div>
    </main>
  );
}
