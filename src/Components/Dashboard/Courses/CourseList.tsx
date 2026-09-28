"use client";

import { useContext, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpDown,
  BookOpen,
  Database,
  ExternalLink,
  Eye,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { AuthContext } from "@/app/dashboard/AuthProvider";
import { useAdminResource } from "@/hooks/useAdminResource";
import { apiRequest, ApiClientError } from "@/app/lib/apiClient";
import {
  COURSE_LEVELS,
  COURSE_SORTS,
  COURSE_SORT_LABELS,
  type ICourse,
  type ICourseCategory,
} from "@/app/types";
import { categoryOf, formatDuration } from "@/Components/Frontend/utils/course";
import PageHeader from "../kit/PageHeader";
import AdminPagination from "../kit/AdminPagination";
import { DateCell, Money, Thumb } from "../kit/cells";
import DeleteModal from "@/Layout/DeleteModal/DeleteModal";

type Filters = {
  q: string;
  category: string;
  level: string;
  status: "" | "published" | "draft";
  sort: string;
  page: number;
  limit: number;
};

const INITIAL: Filters = { q: "", category: "", level: "", status: "", sort: "newest", page: 1, limit: 10 };

export default function CourseList({ initialCategory = "" }: { initialCategory?: string }) {
  const { token, isReadOnly } = useContext(AuthContext);
  const [filters, setFilters] = useState<Filters>({ ...INITIAL, category: initialCategory });
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<ICourse | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const courses = useAdminResource<ICourse>("/courses", {
    label: "Course",
    query: { scope: "admin", ...filters },
  });
  const categories = useAdminResource<ICourseCategory>("/course-categories", {
    label: "Category",
    query: { scope: "admin" },
  });

  // Debounced server-side search.
  useEffect(() => {
    if (search === filters.q) return;
    const timer = setTimeout(() => setFilters((f) => ({ ...f, q: search, page: 1 })), 350);
    return () => clearTimeout(timer);
  }, [search, filters.q]);

  const set = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, page: 1, ...patch }));
  const filtered = Boolean(filters.q || filters.category || filters.level || filters.status);

  /** One-field PATCH for the inline publish / feature toggles. */
  const quickUpdate = async (course: ICourse, body: Partial<ICourse>) => {
    if (!course._id) return;
    setBusyId(course._id);
    await courses.update(course._id, body as Record<string, unknown>);
    setBusyId(null);
  };

  const seed = async () => {
    setSeeding(true);
    try {
      const { message } = await apiRequest("/courses/seed", { method: "POST", token });
      toast.success(message);
      await Promise.all([courses.refetch(), categories.refetch()]);
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Could not load demo data");
    } finally {
      setSeeding(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting?._id) return;
    if (await courses.remove(deleting._id)) setDeleting(null);
  };

  const rows = courses.items;

  return (
    <>
      <PageHeader
        title="Courses"
        description="Create, edit and publish courses. Everything here feeds the public /courses pages."
        actions={
          <>
            <button type="button" onClick={courses.refetch} className="a-btn a-btn--ghost" disabled={courses.loading}>
              <RefreshCw size={15} className={courses.loading ? "animate-spin" : undefined} />
              Refresh
            </button>
            {!isReadOnly && (
              <Link href="/dashboard/courses/create" className="a-btn a-btn--primary">
                <Plus size={16} /> New course
              </Link>
            )}
          </>
        }
      />

      {/* Toolbar */}
      <div className="a-card a-card--pad mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2"
              style={{ color: "var(--a-text-3)" }}
              aria-hidden="true"
            />
            <input
              className="a-input !pl-10"
              placeholder="Search title, subtitle, tag or creator…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search courses"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute top-1/2 right-3 -translate-y-1/2"
                style={{ color: "var(--a-text-3)" }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="a-seg" role="group" aria-label="Status">
            {(["", "published", "draft"] as const).map((status) => (
              <button
                key={status || "all"}
                type="button"
                aria-pressed={filters.status === status}
                onClick={() => set({ status })}
              >
                {status ? status[0].toUpperCase() + status.slice(1) : "All"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            className="a-select !w-auto min-w-[170px]"
            value={filters.category}
            onChange={(e) => set({ category: e.target.value })}
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {categories.items.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} ({c.course_count ?? 0})
              </option>
            ))}
          </select>

          <select
            className="a-select !w-auto min-w-[140px]"
            value={filters.level}
            onChange={(e) => set({ level: e.target.value })}
            aria-label="Filter by level"
          >
            <option value="">All levels</option>
            {COURSE_LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>

          <label className="relative flex items-center">
            <ArrowUpDown size={14} className="pointer-events-none absolute left-3" style={{ color: "var(--a-text-3)" }} aria-hidden="true" />
            <select
              className="a-select !w-auto min-w-[180px] !pl-9"
              value={filters.sort}
              onChange={(e) => set({ sort: e.target.value })}
              aria-label="Sort courses"
            >
              {COURSE_SORTS.map((s) => (
                <option key={s} value={s}>
                  {COURSE_SORT_LABELS[s]}
                </option>
              ))}
            </select>
          </label>

          {filtered && (
            <button
              type="button"
              className="a-btn a-btn--ghost a-btn--sm"
              onClick={() => {
                setSearch("");
                setFilters({ ...INITIAL, sort: filters.sort, limit: filters.limit });
              }}
            >
              <X size={13} /> Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {courses.loading && rows.length === 0 ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="a-skeleton h-16" aria-hidden="true" />
          ))}
        </div>
      ) : courses.error ? (
        <div className="a-card a-card--pad flex flex-col items-center gap-3 py-12 text-center">
          <TriangleAlert size={24} style={{ color: "#ff8a8d" }} />
          <p className="text-[0.86rem]" style={{ color: "var(--a-text-2)" }}>
            {courses.error}
          </p>
          <button type="button" onClick={courses.refetch} className="a-btn a-btn--ghost">
            Try again
          </button>
        </div>
      ) : rows.length === 0 ? (
        <div className="a-card a-card--pad flex flex-col items-center gap-3 py-14 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full" style={{ background: "var(--a-brand-tint)", color: "var(--a-brand)" }}>
            <BookOpen size={22} />
          </span>
          <p className="text-[0.95rem] font-semibold text-white">
            {filtered ? "No courses match these filters" : "No courses yet"}
          </p>
          <p className="a-page-head__sub !mt-0">
            {filtered
              ? "Try a different search or clear the filters."
              : "Create your first course, or load demo categories, courses and reviews to explore the site."}
          </p>
          {!filtered && !isReadOnly && (
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              <Link href="/dashboard/courses/create" className="a-btn a-btn--primary">
                <Plus size={16} /> Create course
              </Link>
              <button type="button" onClick={seed} className="a-btn a-btn--ghost" disabled={seeding}>
                <Database size={15} /> {seeding ? "Loading demo…" : "Load demo data"}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className={`a-table-wrap transition-opacity ${courses.loading ? "opacity-60" : ""}`}>
          <table className="a-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Category</th>
                <th>Level</th>
                <th style={{ textAlign: "right" }}>Price</th>
                <th>Content</th>
                <th>Rating</th>
                <th>Status</th>
                <th>Updated</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((course) => {
                const category = categoryOf(course);
                const busy = busyId === course._id;
                return (
                  <tr key={course._id}>
                    <td style={{ minWidth: 280 }}>
                      <div className="flex items-center gap-3">
                        <Thumb src={course.thumbnail} alt={course.title} />
                        <div className="min-w-0">
                          <Link href={`/dashboard/courses/${course._id}`} className="a-strong a-clamp-1 hover:underline" title={course.title}>
                            {course.title}
                          </Link>
                          <span className="a-clamp-1 text-[0.72rem]" style={{ color: "var(--a-text-3)" }}>
                            by {course.creator?.name || "—"} · /{course.slug}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      {category ? <span className="a-badge a-badge--muted">{category.name}</span> : <span style={{ color: "var(--a-text-3)" }}>—</span>}
                    </td>
                    <td className="whitespace-nowrap">{course.level}</td>
                    <td style={{ textAlign: "right" }}>
                      {course.price === 0 ? <span className="a-badge a-badge--signal">Free</span> : <Money amount={course.price} />}
                    </td>
                    <td className="whitespace-nowrap text-[0.78rem]">
                      {course.total_lessons} lessons
                      <span className="block" style={{ color: "var(--a-text-3)" }}>
                        {formatDuration(course.total_duration)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        <Star size={13} className="fill-current" style={{ color: "var(--a-ember)" }} />
                        <span className="a-strong">{course.rating_avg ? course.rating_avg.toFixed(1) : "—"}</span>
                        <span className="text-[0.72rem]" style={{ color: "var(--a-text-3)" }}>
                          ({course.rating_count})
                        </span>
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={isReadOnly || busy}
                          onClick={() => quickUpdate(course, { status: course.status === "published" ? "draft" : "published" })}
                          title={course.status === "published" ? "Click to unpublish" : "Click to publish"}
                          className={`a-badge cursor-pointer ${course.status === "published" ? "a-badge--signal" : "a-badge--muted"}`}
                        >
                          {course.status === "published" ? "Published" : "Draft"}
                        </button>
                        <button
                          type="button"
                          disabled={isReadOnly || busy}
                          onClick={() => quickUpdate(course, { is_featured: !course.is_featured })}
                          aria-label={course.is_featured ? "Unfeature" : "Feature"}
                          title={course.is_featured ? "Featured — click to unfeature" : "Mark as featured"}
                          className="grid h-6 w-6 cursor-pointer place-items-center rounded-full transition-colors hover:bg-[var(--a-hover)]"
                        >
                          <Star
                            size={14}
                            className={course.is_featured ? "fill-current" : ""}
                            style={{ color: course.is_featured ? "var(--a-ember)" : "var(--a-text-3)" }}
                          />
                        </button>
                      </div>
                    </td>
                    <td>
                      <DateCell value={course.updatedAt} />
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/dashboard/courses/${course._id}`} className="a-btn a-btn--ghost a-btn--icon" aria-label="View details" title="Details">
                          <Eye size={14} />
                        </Link>
                        {course.status === "published" && (
                          <a
                            href={`/courses/${course.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="a-btn a-btn--ghost a-btn--icon"
                            aria-label="Open live page"
                            title="Open live page"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                        {!isReadOnly && (
                          <>
                            <Link href={`/dashboard/courses/${course._id}/edit`} className="a-btn a-btn--ghost a-btn--icon" aria-label="Edit" title="Edit">
                              <Pencil size={14} />
                            </Link>
                            <button
                              type="button"
                              onClick={() => setDeleting(course)}
                              className="a-btn a-btn--danger a-btn--icon"
                              aria-label="Delete"
                              title="Delete"
                            >
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
        meta={courses.meta}
        onPage={(page) => setFilters((f) => ({ ...f, page }))}
        onLimit={(limit) => set({ limit })}
      />

      <DeleteModal
        open={Boolean(deleting)}
        title="Delete this course?"
        message="Its reviews are deleted too. This cannot be undone."
        itemName={deleting?.title}
        busy={courses.saving}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
