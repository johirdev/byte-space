"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MessageSquareText, Pencil } from "lucide-react";
import { apiRequest, ApiClientError } from "@/app/lib/apiClient";
import type { CourseRef, ICourseReview } from "@/app/types";
import ReviewModal from "../../Shared/ReviewModal";
import Stars from "../CourseDetails/Stars";
import { imageProps, timeAgo } from "../../utils/course";

type Row = ICourseReview & { _id: string; course: CourseRef };

export default function MyReviews({ onWriteNew }: { onWriteNew: () => void }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Row | null>(null);

  useEffect(() => {
    apiRequest<Row[]>("/users/me/reviews", { auth: "user" })
      .then(({ data }) => setRows(data.filter((r) => r.course && typeof r.course === "object")))
      .catch((err) => setError(err instanceof ApiClientError ? err.message : "Could not load reviews"));
  }, []);

  if (error) return <p className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</p>;
  if (!rows) return <div className="h-40 animate-pulse rounded-2xl bg-neutral-50" />;
  if (!rows.length) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-neutral-200 px-6 py-16 text-center">
        <MessageSquareText className="size-8 text-neutral-300" />
        <h3 className="mt-4 font-heading text-lg font-semibold">No reviews yet</h3>
        <p className="mt-1 text-sm text-neutral-500">Rate the courses you&apos;re enrolled in to help other learners.</p>
        <button type="button" onClick={onWriteNew} className="mt-5 cursor-pointer rounded-full bg-secondary-400 px-6 py-2.5 text-sm font-medium hover:bg-secondary-300">
          Go to my courses
        </button>
      </div>
    );
  }

  return (
    <>
      <ul className="grid gap-5 md:grid-cols-2">
        {rows.map((review) => (
          <li key={review._id} className="flex flex-col rounded-2xl border border-neutral-200 p-5">
            <div className="flex items-center gap-3">
              <span className="relative aspect-video w-20 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                {review.course.thumbnail && (
                  <Image src={review.course.thumbnail} alt="" fill sizes="80px" className="object-cover" {...imageProps(review.course.thumbnail)} />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <Link href={`/courses/${review.course.slug}#reviews`} className="line-clamp-1 font-medium hover:text-primary-600">
                  {review.course.title}
                </Link>
                <p className="text-xs text-neutral-500">
                  {timeAgo(review.updatedAt ?? review.createdAt)}
                  {review.status === "pending" && <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">Hidden by moderator</span>}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(review)}
                aria-label="Edit review"
                className="grid size-9 cursor-pointer place-items-center rounded-full border border-neutral-200 hover:border-neutral-950"
              >
                <Pencil className="size-4" />
              </button>
            </div>
            <div className="mt-4">
              <Stars value={review.rating} />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-neutral-500">{review.comment}</p>
          </li>
        ))}
      </ul>

      {editing && (
        <ReviewModal
          open
          course={{ _id: String(editing.course._id), title: editing.course.title }}
          existing={{ _id: editing._id, rating: editing.rating, comment: editing.comment }}
          onClose={() => setEditing(null)}
          onSaved={(saved) =>
            setRows((prev) =>
              saved
                ? prev?.map((r) => (r._id === saved._id ? { ...r, ...saved, updatedAt: new Date().toISOString() } : r)) ?? prev
                : prev?.filter((r) => r._id !== editing._id) ?? prev,
            )
          }
        />
      )}
    </>
  );
}
