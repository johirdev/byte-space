"use client";

import { useContext, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CircleAlert,
  Clock,
  DollarSign,
  ExternalLink,
  Pencil,
  Star,
  Trash2,
  UsersRound,
} from "lucide-react";
import { toast } from "react-toastify";
import { AuthContext } from "@/app/dashboard/AuthProvider";
import { apiRequest, ApiClientError } from "@/app/lib/apiClient";
import type { ICourse } from "@/app/types";
import { categoryOf, formatDuration, formatPrice } from "@/Components/Frontend/utils/course";
import { StatTile } from "../kit/PageHeader";
import { DateCell } from "../kit/cells";
import CourseReviews from "../Reviews/CourseReviews";
import DeleteModal from "@/Layout/DeleteModal/DeleteModal";

export default function CourseView({ courseId }: { courseId: string }) {
  const router = useRouter();
  const { token, isReadOnly } = useContext(AuthContext);
  const [course, setCourse] = useState<ICourse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiRequest<ICourse>(`/courses/${courseId}`, { token, query: { scope: "admin" } })
      .then(({ data }) => setCourse(data))
      .catch((err) => setError(err instanceof ApiClientError ? err.message : "Could not load course"));
  }, [courseId, token]);

  const patch = async (body: Partial<ICourse>, message: string) => {
    setBusy(true);
    try {
      const { data } = await apiRequest<ICourse>(`/courses/${courseId}`, { method: "PATCH", token, body });
      setCourse(data);
      toast.success(message);
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await apiRequest(`/courses/${courseId}`, { method: "DELETE", token });
      toast.success("Course deleted");
      router.replace("/dashboard/courses");
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Delete failed");
      setBusy(false);
    }
  };

  if (error) {
    return (
      <div className="a-card a-card--pad flex flex-col items-center gap-3 py-14 text-center">
        <CircleAlert size={24} style={{ color: "#ff8a8d" }} />
        <p className="text-white">{error}</p>
        <Link href="/dashboard/courses" className="a-btn a-btn--ghost">
          Back to courses
        </Link>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col gap-4">
        <div className="a-skeleton h-40" />
        <div className="grid gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="a-skeleton h-24" />
          ))}
        </div>
        <div className="a-skeleton h-72" />
      </div>
    );
  }

  const category = categoryOf(course);
  const published = course.status === "published";

  return (
    <>
      <Link href="/dashboard/courses" className="mb-3 inline-flex items-center gap-1.5 text-[0.78rem] font-medium hover:text-white" style={{ color: "var(--a-text-3)" }}>
        <ArrowLeft size={14} /> All courses
      </Link>

      {/* Hero */}
      <div className="a-card mb-5 flex flex-col gap-5 overflow-hidden p-4 md:flex-row md:p-5">
        <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-[12px] md:w-[300px]" style={{ background: "var(--a-panel-2)" }}>
          {course.thumbnail && <Image src={course.thumbnail} alt="" fill sizes="300px" className="object-cover" unoptimized />}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`a-badge ${published ? "a-badge--signal" : "a-badge--muted"}`}>{published ? "Published" : "Draft"}</span>
            {course.is_featured && (
              <span className="a-badge a-badge--ember">
                <Star size={11} className="fill-current" /> Featured
              </span>
            )}
            {category && <span className="a-badge a-badge--brand">{category.name}</span>}
            <span className="a-badge a-badge--muted">{course.level}</span>
          </div>
          <h1 className="a-page-head__title mt-2.5">{course.title}</h1>
          {course.subtitle && <p className="a-page-head__sub">{course.subtitle}</p>}
          <p className="mt-2 text-[0.8rem]" style={{ color: "var(--a-text-3)" }}>
            by <span className="text-white">{course.creator?.name}</span> · /courses/{course.slug} · updated <DateCell value={course.updatedAt} />
          </p>

          <div className="mt-auto flex flex-wrap gap-2 pt-4">
            {published && (
              <a href={`/courses/${course.slug}`} target="_blank" rel="noopener noreferrer" className="a-btn a-btn--ghost">
                <ExternalLink size={15} /> View live
              </a>
            )}
            {!isReadOnly && (
              <>
                <Link href={`/dashboard/courses/${course._id}/edit`} className="a-btn a-btn--primary">
                  <Pencil size={15} /> Edit course
                </Link>
                <button
                  type="button"
                  className="a-btn a-btn--ghost"
                  disabled={busy}
                  onClick={() => patch({ status: published ? "draft" : "published" }, published ? "Moved to drafts" : "Published")}
                >
                  {published ? "Unpublish" : "Publish"}
                </button>
                <button
                  type="button"
                  className="a-btn a-btn--ghost"
                  disabled={busy}
                  onClick={() => patch({ is_featured: !course.is_featured }, course.is_featured ? "Removed from featured" : "Marked as featured")}
                >
                  <Star size={14} className={course.is_featured ? "fill-current" : ""} />
                  {course.is_featured ? "Unfeature" : "Feature"}
                </button>
                <button type="button" className="a-btn a-btn--danger" disabled={busy} onClick={() => setConfirmDelete(true)}>
                  <Trash2 size={15} /> Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatTile label="Rating" value={course.rating_avg ? course.rating_avg.toFixed(1) : "—"} hint={`${course.rating_count} approved reviews`} tone="ember" icon={<Star size={18} />} />
        <StatTile label="Students" value={course.students_count} tone="sky" icon={<UsersRound size={18} />} />
        <StatTile label="Lessons" value={course.total_lessons} hint={`${course.modules.length} modules`} tone="brand" icon={<BookOpen size={18} />} />
        <StatTile label="Duration" value={formatDuration(course.total_duration)} tone="signal" icon={<Clock size={18} />} />
        <StatTile label="Price" value={formatPrice(course.price)} hint={course.price ? `/${course.price_label}` : undefined} tone="coral" icon={<DollarSign size={18} />} />
      </div>

      <div className="mb-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* Curriculum */}
        <div className="a-card a-card--pad">
          <h2 className="a-section__title mb-3">Curriculum</h2>
          {course.modules.length === 0 ? (
            <p className="a-hint">No modules yet.</p>
          ) : (
            <ol className="flex flex-col gap-2">
              {course.modules.map((mod, mi) => (
                <li key={mi} className="rounded-[10px] border p-3" style={{ borderColor: "var(--a-line)", background: "var(--a-surface)" }}>
                  <p className="text-[0.85rem] font-semibold text-white">{mod.title}</p>
                  {mod.description && <p className="mt-0.5 text-[0.76rem]" style={{ color: "var(--a-text-3)" }}>{mod.description}</p>}
                  <ul className="mt-2 flex flex-col gap-1">
                    {mod.lessons.map((lesson, li) => (
                      <li key={li} className="flex items-center justify-between gap-3 text-[0.78rem]" style={{ color: "var(--a-text-2)" }}>
                        <span className="a-clamp-1">
                          {String(li + 1).padStart(2, "0")} · {lesson.title}
                          {lesson.is_preview && <span className="a-badge a-badge--sky ml-2 !py-0">Preview</span>}
                        </span>
                        <span className="shrink-0 tabular-nums">{lesson.duration} min</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Highlights */}
        <div className="flex flex-col gap-5">
          <div className="a-card a-card--pad">
            <h2 className="a-section__title mb-3">Key points</h2>
            {course.key_points.length ? (
              <ul className="flex flex-col gap-1.5 text-[0.8rem]" style={{ color: "var(--a-text-2)" }}>
                {course.key_points.map((p) => (
                  <li key={p}>✓ {p}</li>
                ))}
              </ul>
            ) : (
              <p className="a-hint">None added.</p>
            )}
          </div>
          {course.sneak_peek.length > 0 && (
            <div className="a-card a-card--pad">
              <h2 className="a-section__title mb-3">Sneak peek</h2>
              <div className="grid grid-cols-4 gap-2">
                {course.sneak_peek.map((src, i) => (
                  <span key={i} className="relative aspect-[4/3] overflow-hidden rounded-[8px]">
                    <Image src={src} alt="" fill sizes="80px" className="object-cover" unoptimized />
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="a-card a-card--pad">
        {course._id && <CourseReviews courseId={course._id} embedded />}
      </div>

      <DeleteModal
        open={confirmDelete}
        title="Delete this course?"
        message="Its reviews are deleted too. This cannot be undone."
        itemName={course.title}
        busy={busy}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={remove}
      />
    </>
  );
}
