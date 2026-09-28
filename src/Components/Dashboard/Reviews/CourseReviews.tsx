"use client";

import { useContext, useEffect, useState } from "react";
import Link from "next/link";
import {
  Check,
  EyeOff,
  MessageSquareQuote,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { AuthContext } from "@/app/dashboard/AuthProvider";
import { useAdminResource } from "@/hooks/useAdminResource";
import { apiRequest } from "@/app/lib/apiClient";
import type { CourseRef, ICourse, ICourseReview } from "@/app/types";
import PageHeader from "../kit/PageHeader";
import Drawer from "../kit/Drawer";
import AdminPagination from "../kit/AdminPagination";
import { Field } from "../kit/Fields";
import { Avatar, DateCell, Truncate } from "../kit/cells";
import type { FieldDef, FormValues } from "../kit/types";
import DeleteModal from "@/Layout/DeleteModal/DeleteModal";

type Filters = { q: string; course: string; rating: string; status: string; page: number; limit: number };

const REVIEW_FIELDS: FieldDef[] = [
  { name: "name", label: "Reviewer name", type: "text", required: true },
  { name: "designation", label: "Role / designation", type: "text", placeholder: "UI/UX Designer" },
  { name: "avatar", label: "Avatar", type: "image", span: 2 },
  { name: "comment", label: "Comment", type: "textarea", required: true, span: 2, rows: 5, hint: "At least 10 characters." },
  {
    name: "status",
    label: "Status",
    type: "select",
    span: 2,
    options: [
      { label: "Approved — visible", value: "approved" },
      { label: "Pending — hidden", value: "pending" },
    ],
  },
];

const courseOf = (review: ICourseReview): CourseRef | null =>
  review.course && typeof review.course === "object" ? review.course : null;

/**
 * Review moderation. Reviews are admin-authored (demo) for now; when learner
 * accounts arrive, public submissions will land here as "pending".
 * Pass `courseId` to scope the screen to one course (used on course details).
 */
export default function CourseReviews({ courseId, embedded = false }: { courseId?: string; embedded?: boolean }) {
  const { token, isReadOnly } = useContext(AuthContext);
  const [filters, setFilters] = useState<Filters>({
    q: "",
    course: courseId ?? "",
    rating: "",
    status: "",
    page: 1,
    limit: embedded ? 5 : 10,
  });
  const [search, setSearch] = useState("");
  const [courses, setCourses] = useState<ICourse[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ICourseReview | null>(null);
  const [values, setValues] = useState<FormValues>({});
  const [deleting, setDeleting] = useState<ICourseReview | null>(null);

  const reviews = useAdminResource<ICourseReview>("/course-reviews", { label: "Review", query: filters });

  // Course options for the filter and the form.
  useEffect(() => {
    apiRequest<ICourse[]>("/courses", { token, query: { scope: "admin", limit: 100, sort: "title", page: 1 } })
      .then(({ data }) => setCourses(data ?? []))
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    if (search === filters.q) return;
    const timer = setTimeout(() => setFilters((f) => ({ ...f, q: search, page: 1 })), 350);
    return () => clearTimeout(timer);
  }, [search, filters.q]);

  const set = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, page: 1, ...patch }));

  const openCreate = () => {
    setEditing(null);
    setValues({ course: courseId ?? filters.course ?? "", rating: 5, status: "approved", designation: "" });
    reviews.setFieldErrors({});
    setDrawerOpen(true);
  };

  const openEdit = (review: ICourseReview) => {
    setEditing(review);
    setValues({ ...review, course: courseOf(review)?._id ?? String(review.course) });
    reviews.setFieldErrors({});
    setDrawerOpen(true);
  };

  const save = async () => {
    const body = { ...values, rating: Number(values.rating) };
    const saved = editing?._id ? await reviews.update(editing._id, body) : await reviews.create(body);
    if (saved) setDrawerOpen(false);
  };

  const setStatus = (review: ICourseReview, status: "approved" | "pending") =>
    review._id && reviews.update(review._id, { status });

  const rows = reviews.items;

  return (
    <>
      {embedded ? (
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="a-section__title">Reviews</h2>
          {!isReadOnly && (
            <button type="button" onClick={openCreate} className="a-btn a-btn--primary a-btn--sm">
              <Plus size={14} /> Add review
            </button>
          )}
        </div>
      ) : (
        <PageHeader
          title="Course reviews"
          description="Demo reviews shown on each course's Reviews tab. Only approved reviews count toward ratings."
          actions={
            <>
              <button type="button" onClick={reviews.refetch} className="a-btn a-btn--ghost" disabled={reviews.loading}>
                <RefreshCw size={15} className={reviews.loading ? "animate-spin" : undefined} /> Refresh
              </button>
              {!isReadOnly && (
                <button type="button" onClick={openCreate} className="a-btn a-btn--primary">
                  <Plus size={16} /> New review
                </button>
              )}
            </>
          }
        />
      )}

      {/* Filters */}
      <div className={`mb-4 flex flex-wrap items-center gap-2.5 ${embedded ? "" : "a-card a-card--pad"}`}>
        <div className="relative min-w-[200px] flex-1">
          <Search size={15} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2" style={{ color: "var(--a-text-3)" }} aria-hidden="true" />
          <input
            className="a-input !pl-10"
            placeholder="Search name, role or comment…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search reviews"
          />
        </div>
        {!courseId && (
          <select className="a-select !w-auto min-w-[200px] max-w-[280px]" value={filters.course} onChange={(e) => set({ course: e.target.value })} aria-label="Filter by course">
            <option value="">All courses</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title}
              </option>
            ))}
          </select>
        )}
        <select className="a-select !w-auto" value={filters.rating} onChange={(e) => set({ rating: e.target.value })} aria-label="Filter by rating">
          <option value="">Any rating</option>
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={r}>
              {"★".repeat(r)} ({r})
            </option>
          ))}
        </select>
        <div className="a-seg" role="group" aria-label="Status">
          {[
            ["", "All"],
            ["approved", "Approved"],
            ["pending", "Pending"],
          ].map(([value, label]) => (
            <button key={label} type="button" aria-pressed={filters.status === value} onClick={() => set({ status: value })}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {reviews.loading && rows.length === 0 ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="a-skeleton h-16" aria-hidden="true" />
          ))}
        </div>
      ) : reviews.error ? (
        <div className="a-card a-card--pad flex flex-col items-center gap-3 py-10 text-center">
          <TriangleAlert size={22} style={{ color: "#ff8a8d" }} />
          <p className="text-[0.86rem]" style={{ color: "var(--a-text-2)" }}>
            {reviews.error}
          </p>
          <button type="button" onClick={reviews.refetch} className="a-btn a-btn--ghost">
            Try again
          </button>
        </div>
      ) : rows.length === 0 ? (
        <div className="a-card a-card--pad flex flex-col items-center gap-3 py-12 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full" style={{ background: "var(--a-brand-tint)", color: "var(--a-brand)" }}>
            <MessageSquareQuote size={22} />
          </span>
          <p className="text-[0.9rem] font-semibold text-white">No reviews found</p>
          {!isReadOnly && (
            <button type="button" onClick={openCreate} className="a-btn a-btn--primary">
              <Plus size={16} /> Add a demo review
            </button>
          )}
        </div>
      ) : (
        <div className={`a-table-wrap transition-opacity ${reviews.loading ? "opacity-60" : ""}`}>
          <table className="a-table">
            <thead>
              <tr>
                <th>Reviewer</th>
                {!courseId && <th>Course</th>}
                <th>Rating</th>
                <th>Comment</th>
                <th>Status</th>
                <th>Date</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((review) => {
                const course = courseOf(review);
                return (
                  <tr key={review._id}>
                    <td style={{ minWidth: 180 }}>
                      <Avatar src={review.avatar} name={review.name} />
                      {review.designation && (
                        <span className="ml-[42px] block text-[0.72rem]" style={{ color: "var(--a-text-3)" }}>
                          {review.designation}
                        </span>
                      )}
                    </td>
                    {!courseId && (
                      <td style={{ maxWidth: 220 }}>
                        {course ? (
                          <Link href={`/dashboard/courses/${course._id}`} className="a-clamp-1 hover:underline" title={course.title}>
                            {course.title}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                    )}
                    <td className="whitespace-nowrap">
                      <span className="inline-flex gap-0.5" aria-label={`${review.rating} stars`}>
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            size={13}
                            className={i < review.rating ? "fill-current" : ""}
                            style={{ color: i < review.rating ? "var(--a-ember)" : "var(--a-text-3)" }}
                          />
                        ))}
                      </span>
                    </td>
                    <td style={{ maxWidth: 360 }}>
                      <Truncate text={review.comment} lines={2} />
                    </td>
                    <td>
                      <span className={`a-badge ${review.status === "approved" ? "a-badge--signal" : "a-badge--ember"}`}>{review.status}</span>
                    </td>
                    <td>
                      <DateCell value={review.createdAt} />
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1.5">
                        {!isReadOnly && (
                          <>
                            {review.status === "approved" ? (
                              <button type="button" className="a-btn a-btn--ghost a-btn--icon" onClick={() => setStatus(review, "pending")} aria-label="Hide (mark pending)" title="Hide (mark pending)">
                                <EyeOff size={14} />
                              </button>
                            ) : (
                              <button type="button" className="a-btn a-btn--ghost a-btn--icon" onClick={() => setStatus(review, "approved")} aria-label="Approve" title="Approve">
                                <Check size={14} />
                              </button>
                            )}
                            <button type="button" className="a-btn a-btn--ghost a-btn--icon" onClick={() => openEdit(review)} aria-label="Edit" title="Edit">
                              <Pencil size={14} />
                            </button>
                            <button type="button" className="a-btn a-btn--danger a-btn--icon" onClick={() => setDeleting(review)} aria-label="Delete" title="Delete">
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <AdminPagination
        meta={reviews.meta}
        onPage={(page) => setFilters((f) => ({ ...f, page }))}
        onLimit={embedded ? undefined : (limit) => set({ limit })}
      />

      <Drawer
        open={drawerOpen}
        title={editing ? "Edit review" : "New review"}
        description="Approved reviews appear on the course page and update its rating."
        onClose={() => setDrawerOpen(false)}
        footer={
          <>
            <button type="button" onClick={() => setDrawerOpen(false)} className="a-btn a-btn--ghost" disabled={reviews.saving}>
              Cancel
            </button>
            <button type="button" onClick={save} className="a-btn a-btn--primary" disabled={reviews.saving || isReadOnly}>
              {reviews.saving ? "Saving…" : editing ? "Save changes" : "Create review"}
            </button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {!courseId && (
            <div className="sm:col-span-2">
              <Field
                field={{
                  name: "course",
                  label: "Course",
                  type: "select",
                  required: true,
                  options: courses.map((c) => ({ label: c.title, value: c._id ?? "" })),
                }}
                value={values.course}
                error={reviews.fieldErrors.course}
                onChange={(v) => setValues((p) => ({ ...p, course: v }))}
              />
            </div>
          )}

          <div className="a-field sm:col-span-2">
            <span className="a-label">
              Rating<span className="req">*</span>
            </span>
            <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((r) => (
                <button
                  key={r}
                  type="button"
                  role="radio"
                  aria-checked={Number(values.rating) === r}
                  aria-label={`${r} star${r > 1 ? "s" : ""}`}
                  onClick={() => setValues((p) => ({ ...p, rating: r }))}
                  className="rounded-md p-1 transition-transform hover:scale-110"
                >
                  <Star
                    size={24}
                    className={r <= Number(values.rating) ? "fill-current" : ""}
                    style={{ color: r <= Number(values.rating) ? "var(--a-ember)" : "var(--a-text-3)" }}
                  />
                </button>
              ))}
            </div>
            {reviews.fieldErrors.rating && <p className="a-error">{reviews.fieldErrors.rating}</p>}
          </div>

          {REVIEW_FIELDS.map((field) => (
            <div key={field.name} className={field.span === 2 ? "sm:col-span-2" : ""}>
              <Field
                field={field}
                value={values[field.name]}
                error={reviews.fieldErrors[field.name]}
                onChange={(v) => setValues((p) => ({ ...p, [field.name]: v }))}
              />
            </div>
          ))}
        </div>
      </Drawer>

      <DeleteModal
        open={Boolean(deleting)}
        title="Delete this review?"
        message="The course rating is recalculated."
        itemName={deleting ? `${deleting.name}'s review` : undefined}
        busy={reviews.saving}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting?._id && (await reviews.remove(deleting._id))) setDeleting(null);
        }}
      />
    </>
  );
}
