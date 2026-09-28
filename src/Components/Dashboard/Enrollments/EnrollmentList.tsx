"use client";

import { useContext, useEffect, useState } from "react";
import Link from "next/link";
import { GraduationCap, RefreshCw, Search, TriangleAlert } from "lucide-react";
import { AuthContext } from "@/app/dashboard/AuthProvider";
import { useAdminResource } from "@/hooks/useAdminResource";
import { apiRequest } from "@/app/lib/apiClient";
import type { ICourse, IEnrollment } from "@/app/types";
import PageHeader from "../kit/PageHeader";
import AdminPagination from "../kit/AdminPagination";
import { Avatar, DateCell, Money, Thumb } from "../kit/cells";

export default function EnrollmentList() {
  const { token } = useContext(AuthContext);
  const [filters, setFilters] = useState({ q: "", course: "", page: 1, limit: 20 });
  const [search, setSearch] = useState("");
  const [courses, setCourses] = useState<ICourse[]>([]);

  const enrollments = useAdminResource<IEnrollment>("/enrollments", { label: "Enrollment", query: filters });

  useEffect(() => {
    apiRequest<ICourse[]>("/courses", { token, query: { scope: "admin", limit: 100, sort: "title", page: 1 } })
      .then(({ data }) => setCourses(data))
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    if (search === filters.q) return;
    const t = setTimeout(() => setFilters((f) => ({ ...f, q: search, page: 1 })), 350);
    return () => clearTimeout(t);
  }, [search, filters.q]);

  const rows = enrollments.items;

  return (
    <>
      <PageHeader
        title="Enrollments"
        description="Who is enrolled in what — with the student's id, name, email and photo captured at checkout."
        actions={
          <button type="button" onClick={enrollments.refetch} className="a-btn a-btn--ghost" disabled={enrollments.loading}>
            <RefreshCw size={15} className={enrollments.loading ? "animate-spin" : undefined} /> Refresh
          </button>
        }
      />

      <div className="a-card a-card--pad mb-4 flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[220px] flex-1">
          <Search size={15} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2" style={{ color: "var(--a-text-3)" }} />
          <input className="a-input !pl-10" placeholder="Search student name or email…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search enrollments" />
        </div>
        <select
          className="a-select !w-auto max-w-[300px] min-w-[220px]"
          value={filters.course}
          onChange={(e) => setFilters((f) => ({ ...f, course: e.target.value, page: 1 }))}
          aria-label="Filter by course"
        >
          <option value="">All courses</option>
          {courses.map((c) => (
            <option key={c._id} value={c._id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      {enrollments.loading && !rows.length ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="a-skeleton h-14" />
          ))}
        </div>
      ) : enrollments.error ? (
        <div className="a-card a-card--pad flex flex-col items-center gap-3 py-12 text-center">
          <TriangleAlert size={22} style={{ color: "#ff8a8d" }} />
          <p style={{ color: "var(--a-text-2)" }}>{enrollments.error}</p>
        </div>
      ) : !rows.length ? (
        <div className="a-card a-card--pad flex flex-col items-center gap-3 py-14 text-center">
          <GraduationCap size={24} style={{ color: "var(--a-brand)" }} />
          <p className="font-semibold text-white">No enrollments found</p>
        </div>
      ) : (
        <div className={`a-table-wrap ${enrollments.loading ? "opacity-60" : ""}`}>
          <table className="a-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th style={{ textAlign: "right" }}>Paid</th>
                <th style={{ width: 180 }}>Progress</th>
                <th>Enrolled</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => {
                const course = typeof e.course === "object" ? e.course : null;
                return (
                  <tr key={String(e._id)}>
                    <td style={{ minWidth: 220 }}>
                      <Avatar src={e.student.avatar} name={e.student.name} />
                      <span className="ml-[42px] block text-[0.72rem]" style={{ color: "var(--a-text-3)" }}>
                        {e.student.email} · id {e.student.user_id.slice(-6)}
                      </span>
                    </td>
                    <td style={{ minWidth: 240 }}>
                      {course ? (
                        <div className="flex items-center gap-3">
                          <Thumb src={course.thumbnail} />
                          <Link href={`/dashboard/courses/${course._id}`} className="a-clamp-1 hover:underline">
                            {course.title}
                          </Link>
                        </div>
                      ) : (
                        "Deleted course"
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {e.price_paid ? <Money amount={e.price_paid} /> : <span className="a-badge a-badge--signal">Free</span>}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="a-bar flex-1">
                          <span style={{ width: `${e.progress}%` }} />
                        </div>
                        <span className="w-9 text-right text-[0.76rem] tabular-nums">{e.progress}%</span>
                      </div>
                    </td>
                    <td>
                      <DateCell value={e.createdAt} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <AdminPagination
        meta={enrollments.meta}
        onPage={(page) => setFilters((f) => ({ ...f, page }))}
        onLimit={(limit) => setFilters((f) => ({ ...f, limit, page: 1 }))}
      />
    </>
  );
}
