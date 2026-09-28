"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { MessageSquareText, Star } from "lucide-react";
import { apiRequest, ApiClientError } from "@/app/lib/apiClient";
import type { ApiMeta, ICourse, ICourseReview, ReviewSummary } from "@/app/types";
import { imageProps, timeAgo } from "../../utils/course";
import Stars from "./Stars";

const PAGE_SIZE = 4;
const RATING_FILTERS = [5, 4, 3, 2, 1] as const;

type ReviewsPayload = { reviews: ICourseReview[]; summary: ReviewSummary };

export default function ReviewsTab({ course }: { course: ICourse }) {
  const [rating, setRating] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [reviews, setReviews] = useState<ICourseReview[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [meta, setMeta] = useState<ApiMeta | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, meta: m } = await apiRequest<ReviewsPayload>(`/courses/${course.slug}/reviews`, {
          signal: controller.signal,
          query: { rating: rating ?? undefined, page, limit: PAGE_SIZE },
        });
        setSummary(data.summary);
        // Page 1 replaces the list (new filter); later pages append ("Load more").
        setReviews((prev) => (page === 1 ? data.reviews : [...prev, ...data.reviews]));
        setMeta(m);
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        setError(err instanceof ApiClientError ? err.message : "Could not load reviews");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [course.slug, rating, page]);

  const chooseRating = (value: number | null) => {
    setRating(value);
    setPage(1);
  };

  const total = summary?.total ?? 0;
  const maxCount = Math.max(1, ...Object.values(summary?.breakdown ?? { 1: 0 }));
  const hasMore = meta ? page < meta.totalPages : false;

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-heading text-xl font-medium">What Learners Are Saying</h2>
        <p className="mt-6 text-sm leading-[1.75] text-neutral-500 md:text-[15px]">
          Discover what our learners have to say about their experience with &lsquo;{course.title}.&rsquo; Read
          reviews and ratings from individuals who have embarked on this learning journey.
        </p>
      </section>

      {/* Summary */}
      <section className="flex flex-col gap-6 rounded-2xl border border-neutral-200 p-5 sm:flex-row sm:items-center md:p-8">
        <div className="grid h-[112px] w-full shrink-0 place-items-center content-center rounded-lg bg-secondary-400 sm:size-[112px]">
          <span className="text-xs text-neutral-950">Ratings</span>
          <span className="font-heading text-[28px] leading-tight font-semibold text-neutral-950">
            {summary ? summary.average.toFixed(1) : "–"}
          </span>
        </div>

        <ul className="flex-1 space-y-2">
          {RATING_FILTERS.map((star) => {
            const count = summary?.breakdown[String(star) as keyof ReviewSummary["breakdown"]] ?? 0;
            return (
              <li key={star} className="flex items-center gap-3">
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100">
                  <span
                    className="block h-full rounded-full bg-secondary-400 transition-[width] duration-500"
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </span>
                <Stars value={star} size="size-3.5" label={false} />
                <span className="w-9 text-right text-xs text-neutral-500 tabular-nums">{count}</span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Individual reviews */}
      <section>
        <h2 className="font-heading text-xl font-medium">Individual Reviews:</h2>

        <div className="mt-5 flex flex-wrap gap-3" role="group" aria-label="Filter reviews by rating">
          <FilterChip active={rating === null} onClick={() => chooseRating(null)}>
            All rating
          </FilterChip>
          {RATING_FILTERS.map((star) => (
            <FilterChip key={star} active={rating === star} onClick={() => chooseRating(star)}>
              <Star className="size-4 fill-current" aria-hidden="true" />
              <span className="sr-only">Only</span> {star}
              <span className="sr-only">star reviews</span>
            </FilterChip>
          ))}
        </div>

        <div className="mt-6 space-y-5">
          {error ? (
            <p className="rounded-2xl border border-neutral-200 p-6 text-sm text-neutral-500">{error}</p>
          ) : loading && reviews.length === 0 ? (
            Array.from({ length: 2 }, (_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl border border-neutral-100 bg-neutral-50" aria-hidden="true" />
            ))
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-neutral-200 px-6 py-12 text-center">
              <MessageSquareText className="size-6 text-neutral-400" aria-hidden="true" />
              <p className="mt-3 text-sm text-neutral-500">
                {rating ? `No ${rating}-star reviews yet.` : total ? "No reviews match." : "No reviews yet — be the first!"}
              </p>
            </div>
          ) : (
            reviews.map((review) => <ReviewCard key={review._id} review={review} />)
          )}
        </div>

        {hasMore && (
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={loading}
            className="mt-6 h-11 w-full cursor-pointer rounded-full border border-neutral-200 text-sm font-medium text-neutral-950 transition-colors hover:border-neutral-950 disabled:opacity-50"
          >
            {loading ? "Loading…" : `Load more reviews (${(meta?.total ?? 0) - reviews.length} left)`}
          </button>
        )}
      </section>
    </div>
  );
}

function FilterChip({
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
      className={`inline-flex h-9 cursor-pointer items-center gap-1 rounded-full px-4 text-sm transition-colors ${
        active ? "bg-secondary-400 text-neutral-950" : "bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
      }`}
    >
      {children}
    </button>
  );
}

function ReviewCard({ review }: { review: ICourseReview }) {
  return (
    <article className="rounded-2xl border border-neutral-200 p-5 md:p-6">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="relative size-10 shrink-0 overflow-hidden rounded-full bg-neutral-100">
            {review.avatar ? (
              <Image src={review.avatar} alt="" fill sizes="40px" className="object-cover" {...imageProps(review.avatar)} />
            ) : (
              <span className="grid size-full place-items-center font-heading text-sm font-semibold text-neutral-500">
                {review.name[0]?.toUpperCase()}
              </span>
            )}
          </span>
          <span className="flex flex-col">
            <span className="text-base text-neutral-950">{review.name}</span>
            {review.designation && <span className="text-sm text-neutral-500">{review.designation}</span>}
          </span>
        </div>
        <time dateTime={String(review.createdAt)} className="shrink-0 text-xs text-neutral-500">
          {timeAgo(review.createdAt)}
        </time>
      </header>

      <div className="mt-5">
        <Stars value={review.rating} />
      </div>

      <p className="mt-4 text-sm leading-[1.75] text-neutral-500">{review.comment}</p>
    </article>
  );
}
