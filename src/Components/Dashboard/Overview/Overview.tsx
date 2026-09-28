"use client";

import { useCallback, useContext, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  FolderTree,
  MessageSquareQuote,
  Plus,
  RefreshCw,
  Star,
  TriangleAlert,
  UsersRound,
  UserPlus,
  DollarSign,
  GraduationCap,
  ShoppingCart,
} from "lucide-react";
import { AuthContext } from "@/app/dashboard/AuthProvider";
import { apiRequest, ApiClientError } from "@/app/lib/apiClient";
import type { CourseRef, DashboardStats } from "@/app/types";
import { timeAgo } from "@/Components/Frontend/utils/course";
import PageHeader, { StatTile } from "../kit/PageHeader";
import { Money } from "../kit/cells";

export default function Overview() {
  const { token, isReadOnly } = useContext(AuthContext);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiRequest<DashboardStats>("/dashboard/stats", { token });
      setStats(data);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not load stats");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const maxCat = Math.max(1, ...(stats?.byCategory.map((c) => c.count) ?? [1]));

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="A snapshot of your course catalogue, learners and reviews."
        actions={
          <>
            <button type="button" className="a-btn a-btn--ghost" onClick={load} disabled={loading}>
              <RefreshCw size={15} className={loading ? "animate-spin" : undefined} /> Refresh
            </button>
            {!isReadOnly && (
              <Link href="/dashboard/courses/create" className="a-btn a-btn--primary">
                <Plus size={16} /> New course
              </Link>
            )}
          </>
        }
      />

      {error ? (
        <div className="a-card a-card--pad flex flex-col items-center gap-3 py-12 text-center">
          <TriangleAlert size={24} style={{ color: "#ff8a8d" }} />
          <p style={{ color: "var(--a-text-2)" }}>{error}</p>
          <button type="button" className="a-btn a-btn--ghost" onClick={load}>
            Try again
          </button>
        </div>
      ) : !stats ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className={`a-skeleton ${i < 4 ? "h-24" : "h-64 sm:col-span-2"}`} />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              label="Courses"
              value={stats.courses.total}
              hint={`${stats.courses.published} published · ${stats.courses.draft} drafts`}
              icon={<BookOpen size={19} />}
            />
            <StatTile
              label="Students"
              value={stats.students.toLocaleString()}
              hint="Across all courses"
              tone="sky"
              icon={<UsersRound size={19} />}
            />
            <StatTile
              label="Avg. rating"
              value={stats.reviews.average ? stats.reviews.average.toFixed(1) : "—"}
              hint={`${stats.reviews.total} reviews · ${stats.reviews.pending} pending`}
              tone="ember"
              icon={<Star size={19} />}
            />
            <StatTile
              label="Categories"
              value={stats.categories.total}
              hint={`${stats.categories.active} visible`}
              tone="signal"
              icon={<FolderTree size={19} />}
            />
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              label="Learners"
              value={stats.learners.users}
              hint={`${stats.learners.newUsers} joined in the last 30 days`}
              tone="brand"
              icon={<UserPlus size={19} />}
            />
            <StatTile
              label="Revenue"
              value={`$${stats.learners.revenue.toLocaleString()}`}
              hint={`${stats.learners.orders} paid orders (demo)`}
              tone="signal"
              icon={<DollarSign size={19} />}
            />
            <StatTile
              label="Enrollments"
              value={stats.learners.enrollments}
              hint="Course seats sold"
              tone="sky"
              icon={<GraduationCap size={19} />}
            />
            <StatTile
              label="Avg. order"
              value={`$${(stats.learners.orders ? stats.learners.revenue / stats.learners.orders : 0).toFixed(2)}`}
              hint="Revenue ÷ paid orders"
              tone="coral"
              icon={<ShoppingCart size={19} />}
            />
          </div>

          {stats.courses.total === 0 && (
            <div className="a-card a-card--pad mt-5 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-white">Your catalogue is empty</p>
                <p className="a-page-head__sub !mt-1">
                  Create categories, then add a course — or load demo data from the Courses page.
                </p>
              </div>
              <Link href="/dashboard/courses" className="a-btn a-btn--primary">
                Go to courses <ArrowRight size={15} />
              </Link>
            </div>
          )}

          <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
            {/* Recent courses */}
            <Panel title="Recently added" href="/dashboard/courses" linkLabel="All courses">
              {stats.recentCourses.length === 0 ? (
                <Empty text="No courses yet." />
              ) : (
                <ul className="flex flex-col">
                  {stats.recentCourses.map((c) => (
                    <li key={c._id} className="flex items-center gap-3 py-2.5" style={{ borderBottom: "1px solid var(--a-line)" }}>
                      <Thumb src={c.thumbnail} />
                      <Link href={`/dashboard/courses/${c._id}`} className="a-clamp-1 min-w-0 flex-1 text-[0.84rem] font-semibold text-white hover:underline">
                        {c.title}
                      </Link>
                      <span className={`a-badge ${c.status === "published" ? "a-badge--signal" : "a-badge--muted"}`}>{c.status}</span>
                      <span className="hidden w-16 text-right sm:block">
                        {c.price ? <Money amount={c.price} /> : <span className="a-badge a-badge--signal">Free</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            {/* By category */}
            <Panel title="Courses by category" href="/dashboard/course-categories" linkLabel="Manage">
              {stats.byCategory.length === 0 ? (
                <Empty text="No data yet." />
              ) : (
                <ul className="flex flex-col gap-3">
                  {stats.byCategory.map((c) => (
                    <li key={c._id}>
                      <div className="mb-1.5 flex justify-between text-[0.8rem]">
                        <span style={{ color: "var(--a-text-2)" }}>{c.name}</span>
                        <span className="font-semibold text-white tabular-nums">{c.count}</span>
                      </div>
                      <div className="a-bar">
                        <span style={{ width: `${(c.count / maxCat) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            {/* Top rated */}
            <Panel title="Top rated" href="/dashboard/courses" linkLabel="View all">
              {stats.topRated.length === 0 ? (
                <Empty text="Ratings appear once reviews are approved." />
              ) : (
                <ol className="flex flex-col">
                  {stats.topRated.map((c, i) => (
                    <li key={c._id} className="flex items-center gap-3 py-2.5" style={{ borderBottom: "1px solid var(--a-line)" }}>
                      <span className="w-5 text-center text-[0.8rem] font-bold" style={{ color: "var(--a-text-3)" }}>
                        {i + 1}
                      </span>
                      <Thumb src={c.thumbnail} />
                      <Link href={`/dashboard/courses/${c._id}`} className="a-clamp-1 min-w-0 flex-1 text-[0.84rem] font-semibold text-white hover:underline">
                        {c.title}
                      </Link>
                      <span className="inline-flex items-center gap-1 text-[0.8rem]">
                        <Star size={13} className="fill-current" style={{ color: "var(--a-ember)" }} />
                        <span className="font-semibold text-white">{c.rating_avg.toFixed(1)}</span>
                        <span style={{ color: "var(--a-text-3)" }}>({c.rating_count})</span>
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </Panel>

            {/* Recent orders */}
            <Panel title="Recent orders" href="/dashboard/orders" linkLabel="All orders">
              {stats.recentOrders.length === 0 ? (
                <Empty text="No orders yet — they appear after learners check out." />
              ) : (
                <ul className="flex flex-col">
                  {stats.recentOrders.map((o) => (
                    <li key={o.order_no} className="flex items-center gap-3 py-2.5" style={{ borderBottom: "1px solid var(--a-line)" }}>
                      <span className="min-w-0 flex-1">
                        <Link href={`/dashboard/orders?q=${o.order_no}`} className="a-clamp-1 text-[0.84rem] font-semibold text-white hover:underline">
                          {o.customer.name}
                        </Link>
                        <span className="block text-[0.72rem]" style={{ color: "var(--a-text-3)" }}>
                          {o.order_no} · {o.items.length} course{o.items.length > 1 ? "s" : ""} · {timeAgo(o.createdAt)}
                        </span>
                      </span>
                      <span className={`a-badge ${o.status === "paid" ? "a-badge--signal" : "a-badge--ember"}`}>{o.status}</span>
                      <Money amount={o.total} />
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            {/* Recent reviews */}
            <Panel title="Latest reviews" href="/dashboard/course-reviews" linkLabel="Moderate">
              {stats.recentReviews.length === 0 ? (
                <Empty text="No reviews yet." />
              ) : (
                <ul className="flex flex-col gap-3">
                  {stats.recentReviews.map((r) => {
                    const course = typeof r.course === "object" ? (r.course as CourseRef) : null;
                    return (
                      <li key={r._id} className="rounded-[10px] p-3" style={{ background: "var(--a-surface)", border: "1px solid var(--a-line)" }}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[0.8rem] font-semibold text-white">{r.name}</span>
                          <span className="inline-flex items-center gap-0.5 text-[0.74rem]" style={{ color: "var(--a-ember)" }}>
                            {"★".repeat(r.rating)}
                          </span>
                        </div>
                        <p className="a-clamp-2 mt-1 text-[0.76rem]" style={{ color: "var(--a-text-2)" }}>
                          {r.comment}
                        </p>
                        <p className="mt-1.5 flex items-center gap-1.5 text-[0.7rem]" style={{ color: "var(--a-text-3)" }}>
                          <MessageSquareQuote size={11} />
                          <span className="a-clamp-1">{course?.title ?? "—"}</span> · {timeAgo(r.createdAt)}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>
          </div>
        </>
      )}
    </>
  );
}

function Panel({
  title,
  href,
  linkLabel,
  children,
}: {
  title: string;
  href: string;
  linkLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section className="a-card a-card--pad">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="a-section__title">{title}</h2>
        <Link href={href} className="inline-flex items-center gap-1 text-[0.76rem] font-semibold hover:text-white" style={{ color: "var(--a-brand)" }}>
          {linkLabel} <ArrowRight size={13} />
        </Link>
      </div>
      {children}
    </section>
  );
}

function Thumb({ src }: { src?: string }) {
  return (
    <span className="relative h-9 w-14 shrink-0 overflow-hidden rounded-[8px]" style={{ background: "var(--a-panel-2)" }}>
      {src && <Image src={src} alt="" fill sizes="56px" className="object-cover" unoptimized />}
    </span>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-6 text-center text-[0.8rem]" style={{ color: "var(--a-text-3)" }}>{text}</p>;
}
