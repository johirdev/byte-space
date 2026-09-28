"use client";

import { useEffect, useState } from "react";
import { Loader2, Star, Trash2, X } from "lucide-react";
import { toast } from "react-toastify";
import { apiRequest, ApiClientError } from "@/app/lib/apiClient";
import { useAuthStore } from "@/store/authStore";

export type MyReview = { _id: string; rating: number; comment: string };

const LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

/**
 * Write / edit / delete the signed-in learner's review for one course.
 * Used from the profile ("My courses") and the course Reviews tab.
 */
export default function ReviewModal({
  open,
  course,
  existing,
  onClose,
  onSaved,
}: {
  open: boolean;
  course: { _id: string; title: string };
  existing?: MyReview | null;
  onClose: () => void;
  onSaved: (review: MyReview | null) => void;
}) {
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<null | "save" | "delete">(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, busy, onClose]);

  if (!open) return null;

  const save = async () => {
    const found: Record<string, string> = {};
    if (!rating) found.rating = "Pick a star rating";
    if (comment.trim().length < 10) found.comment = "Tell others a bit more (10+ characters)";
    setErrors(found);
    if (Object.keys(found).length) return;

    setBusy("save");
    try {
      const body = { course: course._id, rating, comment: comment.trim() };
      const { data, message } = existing
        ? await apiRequest<MyReview>(`/users/me/reviews/${existing._id}`, { method: "PATCH", body, auth: "user" })
        : await apiRequest<MyReview>("/users/me/reviews", { method: "POST", body, auth: "user" });
      toast.success(message);
      onSaved({ _id: data._id, rating: data.rating, comment: data.comment });
      void useAuthStore.getState().load();
      onClose();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setErrors(err.errors ?? {});
        toast.error(err.message);
      } else toast.error("Could not save your review");
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!existing) return;
    setBusy("delete");
    try {
      await apiRequest(`/users/me/reviews/${existing._id}`, { method: "DELETE", auth: "user" });
      toast.success("Review deleted");
      onSaved(null);
      void useAuthStore.getState().load();
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Could not delete your review");
    } finally {
      setBusy(null);
    }
  };

  const shown = hover || rating;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center p-4">
      <div className="absolute inset-0 bg-neutral-950/50 backdrop-blur-sm" onClick={() => !busy && onClose()} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-labelledby="review-title" className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-card-hover md:p-8">
        <button
          type="button"
          onClick={onClose}
          disabled={Boolean(busy)}
          aria-label="Close"
          className="absolute top-4 right-4 grid size-9 cursor-pointer place-items-center rounded-full text-neutral-500 hover:bg-neutral-50 hover:text-neutral-950"
        >
          <X className="size-5" />
        </button>

        <p className="text-sm text-primary-600">{existing ? "Edit your review" : "Rate this course"}</p>
        <h2 id="review-title" className="mt-1 pr-8 font-heading text-xl font-semibold">
          {course.title}
        </h2>

        <div className="mt-6">
          <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
                onMouseEnter={() => setHover(n)}
                onClick={() => {
                  setRating(n);
                  setErrors((e) => ({ ...e, rating: "" }));
                }}
                className="cursor-pointer rounded-md p-1 transition-transform hover:scale-110"
              >
                <Star className={`size-8 ${n <= shown ? "fill-secondary-400 text-secondary-500" : "fill-neutral-100 text-neutral-200"}`} />
              </button>
            ))}
            <span className="ml-3 text-sm text-neutral-500">{LABELS[shown]}</span>
          </div>
          {errors.rating && <p className="mt-1 text-sm text-red-600">{errors.rating}</p>}
        </div>

        <label htmlFor="review-comment" className="mt-5 block text-sm text-neutral-950">
          Your review
        </label>
        <textarea
          id="review-comment"
          rows={5}
          value={comment}
          maxLength={2000}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What did you like? What could be better? Would you recommend it?"
          aria-invalid={Boolean(errors.comment)}
          className={`mt-2 w-full resize-y rounded-xl border px-4 py-3 text-sm leading-relaxed outline-none focus:border-primary-600 focus:ring-4 focus:ring-primary-600/10 ${
            errors.comment ? "border-red-400" : "border-neutral-200"
          }`}
        />
        <div className="mt-1 flex justify-between text-xs">
          <span className="text-red-600">{errors.comment}</span>
          <span className="text-neutral-400 tabular-nums">{comment.trim().length}/2000</span>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          {existing ? (
            <button
              type="button"
              onClick={remove}
              disabled={Boolean(busy)}
              className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-red-600 hover:underline disabled:opacity-50"
            >
              {busy === "delete" ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />} Delete
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={Boolean(busy)}
              className="h-11 cursor-pointer rounded-full border border-neutral-200 px-5 text-sm font-medium hover:border-neutral-950"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={Boolean(busy)}
              className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-secondary-400 px-6 text-sm font-medium text-neutral-950 hover:bg-secondary-300 disabled:opacity-60"
            >
              {busy === "save" && <Loader2 className="size-4 animate-spin" />}
              {existing ? "Update review" : "Post review"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
