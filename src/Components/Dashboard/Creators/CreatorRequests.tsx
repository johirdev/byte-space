"use client";

import { useCallback, useContext, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Check, Eye, Globe, Inbox, RefreshCw, Search, Trash2, TriangleAlert, X } from "lucide-react";
import { toast } from "react-toastify";
import { AuthContext } from "@/app/dashboard/AuthProvider";
import { apiRequest, ApiClientError } from "@/app/lib/apiClient";
import type { ApiMeta, ApplicationStatus, ICreatorApplication, IVerifiedCreator } from "@/app/types";
import PageHeader from "../kit/PageHeader";
import AdminPagination from "../kit/AdminPagination";
import Drawer from "../kit/Drawer";
import { Avatar, DateCell } from "../kit/cells";
import DeleteModal from "@/Layout/DeleteModal/DeleteModal";

type Counts = Record<ApplicationStatus | "all", number>;
type Payload = { applications: ICreatorApplication[]; counts: Counts };

const STATUS_BADGE: Record<ApplicationStatus, string> = {
  pending: "a-badge--ember",
  approved: "a-badge--signal",
  rejected: "a-badge--coral",
};

export default function CreatorRequests() {
  const { token, can } = useContext(AuthContext);
  const canReview = can("superadmin", "admin");
  const [filters, setFilters] = useState({ q: "", status: "pending", page: 1, limit: 20 });
  const [search, setSearch] = useState("");
  const [data, setData] = useState<Payload | null>(null);
  const [meta, setMeta] = useState<ApiMeta>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<ICreatorApplication | null>(null);
  const [deleting, setDeleting] = useState<ICreatorApplication | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<Payload>("/creator-applications", { token, query: filters });
      setData(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not load applications");
    } finally {
      setLoading(false);
    }
  }, [token, filters]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  useEffect(() => {
    if (search === filters.q) return;
    const t = setTimeout(() => setFilters((f) => ({ ...f, q: search, page: 1 })), 350);
    return () => clearTimeout(t);
  }, [search, filters.q]);

  const onReviewed = async () => {
    setViewing(null);
    await load();
  };

  const remove = async () => {
    if (!deleting?._id) return;
    setBusy(true);
    try {
      await apiRequest(`/creator-applications/${deleting._id}`, { method: "DELETE", token });
      toast.success("Application deleted");
      setDeleting(null);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  const rows = data?.applications ?? [];
  const counts = data?.counts;

  return (
    <>
      <PageHeader
        title="Creator requests"
        description="People who applied to teach. Approving one creates a verified creator you can attach to courses."
        actions={
          <>
            <button type="button" onClick={load} className="a-btn a-btn--ghost" disabled={loading}>
              <RefreshCw size={15} className={loading ? "animate-spin" : undefined} /> Refresh
            </button>
            <Link href="/dashboard/creators" className="a-btn a-btn--primary">
              <BadgeCheck size={15} /> Verified creators
            </Link>
          </>
        }
      />

      <div className="a-card a-card--pad mb-4 flex flex-wrap items-center gap-2.5">
        <div className="a-seg" role="group" aria-label="Status">
          {(["pending", "approved", "rejected", ""] as const).map((status) => (
            <button key={status || "all"} type="button" aria-pressed={filters.status === status} onClick={() => setFilters((f) => ({ ...f, status, page: 1 }))}>
              {status ? status[0].toUpperCase() + status.slice(1) : "All"}
              {counts && <span className="ml-1.5 opacity-70">{counts[status || "all"]}</span>}
            </button>
          ))}
        </div>
        <div className="relative min-w-[220px] flex-1">
          <Search size={15} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2" style={{ color: "var(--a-text-3)" }} />
          <input
            className="a-input !pl-10"
            placeholder="Search name, email, phone, designation or topic…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search applications"
          />
        </div>
      </div>

      {loading && !data ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="a-skeleton h-16" />
          ))}
        </div>
      ) : error ? (
        <div className="a-card a-card--pad flex flex-col items-center gap-3 py-12 text-center">
          <TriangleAlert size={22} style={{ color: "#ff8a8d" }} />
          <p style={{ color: "var(--a-text-2)" }}>{error}</p>
          <button type="button" onClick={load} className="a-btn a-btn--ghost">
            Try again
          </button>
        </div>
      ) : !rows.length ? (
        <div className="a-card a-card--pad flex flex-col items-center gap-3 py-14 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full" style={{ background: "var(--a-brand-tint)", color: "var(--a-brand)" }}>
            <Inbox size={22} />
          </span>
          <p className="font-semibold text-white">{filters.status === "pending" ? "No pending requests — you're all caught up" : "No applications found"}</p>
          <p className="a-page-head__sub !mt-0">Applications arrive from the site&apos;s “Become a Creator” page.</p>
        </div>
      ) : (
        <div className={`a-table-wrap ${loading ? "opacity-60" : ""}`}>
          <table className="a-table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Designation</th>
                <th>Topics</th>
                <th style={{ textAlign: "center" }}>Exp.</th>
                <th style={{ textAlign: "right" }}>Followers</th>
                <th>Submitted</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((app) => (
                <tr key={String(app._id)}>
                  <td style={{ minWidth: 220 }}>
                    <Avatar src={app.avatar} name={app.name} />
                    <span className="ml-[42px] block text-[0.72rem]" style={{ color: "var(--a-text-3)" }}>
                      {app.email}
                    </span>
                  </td>
                  <td style={{ maxWidth: 200 }}>
                    <span className="a-clamp-1">{app.designation}</span>
                  </td>
                  <td style={{ maxWidth: 220 }}>
                    <span className="flex flex-wrap gap-1">
                      {app.expertise.slice(0, 2).map((t) => (
                        <span key={t} className="a-badge a-badge--muted">
                          {t}
                        </span>
                      ))}
                      {app.expertise.length > 2 && <span className="a-badge a-badge--muted">+{app.expertise.length - 2}</span>}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>{app.experience_years}y</td>
                  <td style={{ textAlign: "right" }}>{(app.followers ?? 0).toLocaleString()}</td>
                  <td>
                    <DateCell value={app.createdAt} />
                  </td>
                  <td>
                    <span className={`a-badge ${STATUS_BADGE[app.status]}`}>{app.status}</span>
                  </td>
                  <td>
                    <div className="flex justify-end gap-1.5">
                      <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={() => setViewing(app)}>
                        <Eye size={13} /> {app.status === "pending" && canReview ? "Review" : "View"}
                      </button>
                      {can("superadmin") && (
                        <button type="button" className="a-btn a-btn--danger a-btn--icon" onClick={() => setDeleting(app)} aria-label="Delete" title="Delete">
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

      <AdminPagination meta={meta} onPage={(page) => setFilters((f) => ({ ...f, page }))} onLimit={(limit) => setFilters((f) => ({ ...f, limit, page: 1 }))} />

      {viewing && (
        <ReviewDrawer key={String(viewing._id)} app={viewing} canReview={canReview} token={token} onClose={() => setViewing(null)} onReviewed={onReviewed} />
      )}

      <DeleteModal
        open={Boolean(deleting)}
        title="Delete this application?"
        message="The verified creator (if any) is not affected."
        itemName={deleting ? `${deleting.name}'s application` : undefined}
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={remove}
      />
    </>
  );
}

function ReviewDrawer({
  app,
  canReview,
  token,
  onClose,
  onReviewed,
}: {
  app: ICreatorApplication;
  canReview: boolean;
  token: string | null;
  onClose: () => void;
  onReviewed: () => void;
}) {
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState("");
  const [busy, setBusy] = useState<null | "approve" | "reject">(null);
  const pending = app.status === "pending";

  const review = async (action: "approve" | "reject") => {
    if (action === "reject" && note.trim().length < 5) {
      setNoteError("Tell the applicant why (at least 5 characters)");
      return;
    }
    setBusy(action);
    try {
      const { message } = await apiRequest<{ creator: IVerifiedCreator | null }>(`/creator-applications/${app._id}`, {
        method: "PATCH",
        token,
        body: { action, note: note.trim() },
      });
      toast.success(message);
      onReviewed();
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.errors?.note) setNoteError(err.errors.note);
        toast.error(err.message);
      } else toast.error("Review failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Drawer
      open
      title={app.name}
      description={`${app.designation} · applied ${app.createdAt ? new Date(app.createdAt).toLocaleString() : ""}`}
      onClose={onClose}
      footer={
        pending && canReview ? (
          <>
            <button type="button" className="a-btn a-btn--danger" onClick={() => review("reject")} disabled={Boolean(busy)}>
              <X size={15} /> {busy === "reject" ? "Rejecting…" : "Reject"}
            </button>
            <button type="button" className="a-btn a-btn--primary" onClick={() => review("approve")} disabled={Boolean(busy)}>
              <Check size={15} /> {busy === "approve" ? "Approving…" : "Approve & verify"}
            </button>
          </>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-6 text-[0.84rem]">
        <div className="flex items-center gap-4">
          <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[14px]" style={{ background: "var(--a-panel-2)" }}>
            {app.avatar && <Image src={app.avatar} alt="" fill sizes="80px" className="object-cover" unoptimized />}
          </span>
          <div className="min-w-0">
            <p className="font-heading text-lg font-bold text-white">{app.name}</p>
            <p style={{ color: "var(--a-text-2)" }}>{app.designation}</p>
            <span className={`a-badge mt-1.5 ${STATUS_BADGE[app.status]}`}>{app.status}</span>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-3">
          {[
            ["Email", app.email],
            ["Phone", app.phone],
            ["Experience", `${app.experience_years} years`],
            ["Followers", (app.followers ?? 0).toLocaleString()],
          ].map(([k, v]) => (
            <div key={k} className="rounded-[10px] p-3" style={{ background: "var(--a-surface)", border: "1px solid var(--a-line)" }}>
              <dt style={{ color: "var(--a-text-3)" }}>{k}</dt>
              <dd className="mt-0.5 break-all text-white">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-wrap gap-2">
          <a href={app.linkedin} target="_blank" rel="noopener noreferrer" className="a-btn a-btn--ghost a-btn--sm">
            LinkedIn ↗
          </a>
          {app.website && (
            <a href={app.website} target="_blank" rel="noopener noreferrer" className="a-btn a-btn--ghost a-btn--sm">
              <Globe size={13} /> Website ↗
            </a>
          )}
        </div>

        <section>
          <h3 className="a-section__title mb-2">Topics</h3>
          <div className="flex flex-wrap gap-1.5">
            {app.expertise.map((t) => (
              <span key={t} className="a-badge a-badge--brand">
                {t}
              </span>
            ))}
          </div>
        </section>
        <section>
          <h3 className="a-section__title mb-2">Bio</h3>
          <p className="whitespace-pre-line" style={{ color: "var(--a-text-2)" }}>
            {app.bio}
          </p>
        </section>
        <section>
          <h3 className="a-section__title mb-2">Teaching plan</h3>
          <p className="whitespace-pre-line" style={{ color: "var(--a-text-2)" }}>
            {app.teaching_plan}
          </p>
        </section>

        {pending && canReview ? (
          <div className="a-field">
            <label className="a-label" htmlFor="review-note">
              Note to applicant <span style={{ color: "var(--a-text-3)" }}>(required to reject, optional to approve)</span>
            </label>
            <textarea
              id="review-note"
              className="a-textarea !min-h-[90px]"
              value={note}
              aria-invalid={Boolean(noteError)}
              onChange={(e) => {
                setNote(e.target.value);
                setNoteError("");
              }}
              placeholder="e.g. Please add links to published work and apply again."
            />
            {noteError && <p className="a-error">{noteError}</p>}
          </div>
        ) : pending ? (
          <p className="a-hint">Only admins and superadmins can approve or reject.</p>
        ) : (
          <div className="rounded-[10px] p-3" style={{ background: "var(--a-surface)", border: "1px solid var(--a-line)" }}>
            <p style={{ color: "var(--a-text-3)" }}>
              {app.status === "approved" ? "Approved" : "Rejected"} by {app.reviewed_by?.name ?? "—"}
              {app.reviewed_at && ` · ${new Date(app.reviewed_at).toLocaleString()}`}
            </p>
            {app.admin_note && <p className="mt-1 text-white">“{app.admin_note}”</p>}
          </div>
        )}
      </div>
    </Drawer>
  );
}
