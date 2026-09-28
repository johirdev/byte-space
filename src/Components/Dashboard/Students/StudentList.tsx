"use client";

import { useContext, useEffect, useState } from "react";
import Link from "next/link";
import { Ban, Eye, RefreshCw, RotateCcw, Search, Star, Trash2, TriangleAlert, UsersRound } from "lucide-react";
import { toast } from "react-toastify";
import { AuthContext } from "@/app/dashboard/AuthProvider";
import { useAdminResource } from "@/hooks/useAdminResource";
import { apiRequest, ApiClientError } from "@/app/lib/apiClient";
import { PAYMENT_METHOD_LABELS, type IEnrollment, type IOrder, type ICourseReview, type SafeUser } from "@/app/types";
import PageHeader from "../kit/PageHeader";
import AdminPagination from "../kit/AdminPagination";
import Drawer from "../kit/Drawer";
import { Avatar, DateCell, Money } from "../kit/cells";
import DeleteModal from "@/Layout/DeleteModal/DeleteModal";

type Student = SafeUser & { courses: number; spent: number };
type Detail = { user: SafeUser; enrollments: IEnrollment[]; orders: IOrder[]; reviews: ICourseReview[] };

export default function StudentList() {
  const { token, isReadOnly, can } = useContext(AuthContext);
  const [filters, setFilters] = useState({ q: "", status: "", sort: "newest", page: 1, limit: 20 });
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState<Student | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [deleting, setDeleting] = useState<Student | null>(null);

  const students = useAdminResource<Student>("/users", { label: "Student", query: filters });

  useEffect(() => {
    if (search === filters.q) return;
    const t = setTimeout(() => setFilters((f) => ({ ...f, q: search, page: 1 })), 350);
    return () => clearTimeout(t);
  }, [search, filters.q]);

  useEffect(() => {
    if (!viewing?._id) return;
    apiRequest<Detail>(`/users/${viewing._id}`, { token })
      .then(({ data }) => setDetail(data))
      .catch((err) => toast.error(err instanceof ApiClientError ? err.message : "Could not load student"));
  }, [viewing, token]);

  const set = (patch: Partial<typeof filters>) => setFilters((f) => ({ ...f, page: 1, ...patch }));

  const toggleActive = async (s: Student) => {
    if (!s._id) return;
    await students.update(s._id, { is_active: s.is_active === false });
  };

  const rows = students.items;

  return (
    <>
      <PageHeader
        title="Students"
        description="Learner accounts, what they bought and how they're doing."
        actions={
          <button type="button" onClick={students.refetch} className="a-btn a-btn--ghost" disabled={students.loading}>
            <RefreshCw size={15} className={students.loading ? "animate-spin" : undefined} /> Refresh
          </button>
        }
      />

      <div className="a-card a-card--pad mb-4 flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[220px] flex-1">
          <Search size={15} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2" style={{ color: "var(--a-text-3)" }} />
          <input className="a-input !pl-10" placeholder="Search name, email or phone…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search students" />
        </div>
        <div className="a-seg" role="group" aria-label="Status">
          {[
            ["", "All"],
            ["active", "Active"],
            ["suspended", "Suspended"],
          ].map(([value, label]) => (
            <button key={label} type="button" aria-pressed={filters.status === value} onClick={() => set({ status: value })}>
              {label}
            </button>
          ))}
        </div>
        <select className="a-select !w-auto" value={filters.sort} onChange={(e) => set({ sort: e.target.value })} aria-label="Sort">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name">Name (A–Z)</option>
        </select>
      </div>

      {students.loading && !rows.length ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="a-skeleton h-14" />
          ))}
        </div>
      ) : students.error ? (
        <div className="a-card a-card--pad flex flex-col items-center gap-3 py-12 text-center">
          <TriangleAlert size={22} style={{ color: "#ff8a8d" }} />
          <p style={{ color: "var(--a-text-2)" }}>{students.error}</p>
        </div>
      ) : !rows.length ? (
        <div className="a-card a-card--pad flex flex-col items-center gap-3 py-14 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full" style={{ background: "var(--a-brand-tint)", color: "var(--a-brand)" }}>
            <UsersRound size={22} />
          </span>
          <p className="font-semibold text-white">{filters.q || filters.status ? "No students match" : "No students yet"}</p>
          <p className="a-page-head__sub !mt-0">Learners appear here after they register on the site.</p>
        </div>
      ) : (
        <div className={`a-table-wrap ${students.loading ? "opacity-60" : ""}`}>
          <table className="a-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Email</th>
                <th style={{ textAlign: "center" }}>Courses</th>
                <th style={{ textAlign: "right" }}>Spent</th>
                <th>Joined</th>
                <th>Last sign-in</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s._id}>
                  <td style={{ minWidth: 200 }}>
                    <Avatar src={s.avatar} name={s.name} />
                    {s.headline && (
                      <span className="a-clamp-1 ml-[42px] text-[0.72rem]" style={{ color: "var(--a-text-3)" }}>
                        {s.headline}
                      </span>
                    )}
                  </td>
                  <td>{s.email}</td>
                  <td style={{ textAlign: "center" }}>
                    <span className="a-badge a-badge--brand">{s.courses}</span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <Money amount={s.spent} />
                  </td>
                  <td>
                    <DateCell value={s.createdAt} />
                  </td>
                  <td>
                    <DateCell value={s.last_login} />
                  </td>
                  <td>
                    <span className={`a-badge ${s.is_active === false ? "a-badge--coral" : "a-badge--signal"}`}>
                      {s.is_active === false ? "Suspended" : "Active"}
                    </span>
                  </td>
                  <td>
                    <div className="flex justify-end gap-1.5">
                      <button type="button" className="a-btn a-btn--ghost a-btn--icon" onClick={() => { setDetail(null); setViewing(s); }} aria-label="View" title="View">
                        <Eye size={14} />
                      </button>
                      {!isReadOnly && (
                        <button
                          type="button"
                          className="a-btn a-btn--ghost a-btn--icon"
                          onClick={() => toggleActive(s)}
                          disabled={students.saving}
                          aria-label={s.is_active === false ? "Reactivate" : "Suspend"}
                          title={s.is_active === false ? "Reactivate" : "Suspend"}
                        >
                          {s.is_active === false ? <RotateCcw size={14} /> : <Ban size={14} />}
                        </button>
                      )}
                      {can("superadmin") && (
                        <button type="button" className="a-btn a-btn--danger a-btn--icon" onClick={() => setDeleting(s)} aria-label="Delete" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AdminPagination meta={students.meta} onPage={(page) => setFilters((f) => ({ ...f, page }))} onLimit={(limit) => set({ limit })} />

      <Drawer open={Boolean(viewing)} title={viewing?.name ?? "Student"} description={viewing?.email} onClose={() => setViewing(null)}>
        {!detail ? (
          <div className="flex flex-col gap-3">
            <div className="a-skeleton h-24" />
            <div className="a-skeleton h-40" />
          </div>
        ) : (
          <StudentDetail detail={detail} />
        )}
      </Drawer>

      <DeleteModal
        open={Boolean(deleting)}
        title="Delete this student?"
        message="Their enrollments and reviews are removed. Orders stay for your records."
        itemName={deleting?.name}
        busy={students.saving}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting?._id && (await students.remove(deleting._id))) setDeleting(null);
        }}
      />
    </>
  );
}

function StudentDetail({ detail }: { detail: Detail }) {
  const { user, enrollments, orders, reviews } = detail;
  const spent = orders.filter((o) => o.status === "paid").reduce((s, o) => s + o.total, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Avatar src={user.avatar} name={user.name} />
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {[
          ["Courses", enrollments.length],
          ["Orders", orders.length],
          ["Spent", `$${spent.toFixed(2)}`],
        ].map(([label, value]) => (
          <div key={label} className="a-card p-3 text-center">
            <p className="text-[0.7rem] uppercase" style={{ color: "var(--a-text-3)" }}>
              {label}
            </p>
            <p className="font-heading text-lg font-bold text-white">{value}</p>
          </div>
        ))}
      </div>
      <dl className="grid grid-cols-2 gap-3 text-[0.8rem]">
        {[
          ["Headline", user.headline || "—"],
          ["Phone", user.phone || "—"],
          ["Joined", user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"],
          ["Last sign-in", user.last_login ? new Date(user.last_login).toLocaleString() : "—"],
        ].map(([k, v]) => (
          <div key={k}>
            <dt style={{ color: "var(--a-text-3)" }}>{k}</dt>
            <dd className="text-white">{v}</dd>
          </div>
        ))}
      </dl>

      <section>
        <h3 className="a-section__title mb-2">Enrolled courses</h3>
        {!enrollments.length ? (
          <p className="a-hint">None yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {enrollments.map((e) => {
              const course = typeof e.course === "object" ? e.course : null;
              return (
                <li key={String(e._id)} className="rounded-[10px] p-3" style={{ background: "var(--a-surface)", border: "1px solid var(--a-line)" }}>
                  <div className="flex items-center justify-between gap-2 text-[0.82rem]">
                    <span className="a-clamp-1 font-semibold text-white">{course?.title ?? "Deleted course"}</span>
                    <span style={{ color: "var(--a-text-3)" }}>{e.progress}%</span>
                  </div>
                  <div className="a-bar mt-2">
                    <span style={{ width: `${e.progress}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h3 className="a-section__title mb-2">Orders</h3>
        {!orders.length ? (
          <p className="a-hint">None yet.</p>
        ) : (
          <ul className="flex flex-col gap-2 text-[0.8rem]">
            {orders.map((o) => (
              <li key={o.order_no} className="flex items-center justify-between gap-2 rounded-[10px] p-3" style={{ background: "var(--a-surface)", border: "1px solid var(--a-line)" }}>
                <span>
                  <Link href={`/dashboard/orders?q=${o.order_no}`} className="font-semibold text-white hover:underline">
                    {o.order_no}
                  </Link>
                  <span className="block" style={{ color: "var(--a-text-3)" }}>
                    {o.items.length} course(s) · {PAYMENT_METHOD_LABELS[o.payment.method]}
                  </span>
                </span>
                <span className="text-right">
                  <Money amount={o.total} />
                  <span className={`a-badge ml-2 ${o.status === "paid" ? "a-badge--signal" : "a-badge--ember"}`}>{o.status}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="a-section__title mb-2">Reviews</h3>
        {!reviews.length ? (
          <p className="a-hint">None yet.</p>
        ) : (
          <ul className="flex flex-col gap-2 text-[0.8rem]">
            {reviews.map((r) => (
              <li key={String(r._id)} className="rounded-[10px] p-3" style={{ background: "var(--a-surface)", border: "1px solid var(--a-line)" }}>
                <p className="flex items-center gap-1 text-white">
                  <Star size={12} className="fill-current" style={{ color: "var(--a-ember)" }} /> {r.rating} ·{" "}
                  <span className="a-clamp-1">{typeof r.course === "object" ? r.course.title : ""}</span>
                </p>
                <p className="a-clamp-2 mt-1" style={{ color: "var(--a-text-2)" }}>
                  {r.comment}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
