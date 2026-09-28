"use client";

import { useContext, useEffect, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Copy, ExternalLink, Inbox, Pencil, RefreshCw, Search, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "react-toastify";
import { AuthContext } from "@/app/dashboard/AuthProvider";
import { useAdminResource } from "@/hooks/useAdminResource";
import type { IVerifiedCreator } from "@/app/types";
import PageHeader from "../kit/PageHeader";
import AdminPagination from "../kit/AdminPagination";
import Drawer from "../kit/Drawer";
import { Field } from "../kit/Fields";
import { Avatar, DateCell } from "../kit/cells";
import type { FieldDef, FormValues } from "../kit/types";
import DeleteModal from "@/Layout/DeleteModal/DeleteModal";

const FIELDS: FieldDef[] = [
  { name: "avatar", label: "Photo", type: "image", span: 2 },
  { name: "name", label: "Name", type: "text", required: true },
  { name: "title", label: "Designation", type: "text" },
  { name: "email", label: "Email", type: "email", required: true },
  { name: "phone", label: "Phone", type: "text" },
  { name: "linkedin", label: "LinkedIn", type: "url" },
  { name: "website", label: "Website", type: "url" },
  { name: "experience_years", label: "Years of experience", type: "number", min: 0 },
  { name: "followers", label: "Followers", type: "number", min: 0, hint: "Shown on the public creator profile." },
  { name: "expertise", label: "Topics", type: "tags", span: 2 },
  { name: "bio", label: "Bio", type: "textarea", span: 2, rows: 5 },
  {
    name: "is_active",
    label: "Verified & active",
    type: "switch",
    span: 2,
    hint: "Inactive creators can't be attached to new courses and lose the creator role.",
  },
];

export default function VerifiedCreators() {
  const { can, isReadOnly } = useContext(AuthContext);
  const canEdit = can("superadmin", "admin");
  const [filters, setFilters] = useState({ q: "", status: "", page: 1, limit: 20 });
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<IVerifiedCreator | null>(null);
  const [values, setValues] = useState<FormValues>({});
  const [deleting, setDeleting] = useState<IVerifiedCreator | null>(null);

  const creators = useAdminResource<IVerifiedCreator>("/verified-creators", { label: "Creator", query: filters });

  useEffect(() => {
    if (search === filters.q) return;
    const t = setTimeout(() => setFilters((f) => ({ ...f, q: search, page: 1 })), 350);
    return () => clearTimeout(t);
  }, [search, filters.q]);

  const openEdit = (c: IVerifiedCreator) => {
    setEditing(c);
    setValues({ ...c });
    creators.setFieldErrors({});
  };

  const save = async () => {
    if (!editing?._id) return;
    const { _id, code, slug, user, application, course_count, createdAt, updatedAt, verified_at, ...body } = values as Record<string, unknown>;
    void [_id, code, slug, user, application, course_count, createdAt, updatedAt, verified_at];
    if (await creators.update(editing._id, body)) setEditing(null);
  };

  const rows = creators.items;

  return (
    <>
      <PageHeader
        title="Verified creators"
        description="Approved creators. Pick them in the course editor by name, email or Creator ID — their profile fills the course."
        actions={
          <>
            <button type="button" onClick={creators.refetch} className="a-btn a-btn--ghost" disabled={creators.loading}>
              <RefreshCw size={15} className={creators.loading ? "animate-spin" : undefined} /> Refresh
            </button>
            <Link href="/dashboard/creator-requests" className="a-btn a-btn--primary">
              <Inbox size={15} /> Creator requests
            </Link>
          </>
        }
      />

      <div className="a-card a-card--pad mb-4 flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[220px] flex-1">
          <Search size={15} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2" style={{ color: "var(--a-text-3)" }} />
          <input className="a-input !pl-10" placeholder="Search name, email, Creator ID (CR-…) or id…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search creators" />
        </div>
        <div className="a-seg" role="group" aria-label="Status">
          {[
            ["", "All"],
            ["active", "Active"],
            ["inactive", "Inactive"],
          ].map(([v, l]) => (
            <button key={l} type="button" aria-pressed={filters.status === v} onClick={() => setFilters((f) => ({ ...f, status: v, page: 1 }))}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {creators.loading && !rows.length ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="a-skeleton h-14" />
          ))}
        </div>
      ) : creators.error ? (
        <div className="a-card a-card--pad flex flex-col items-center gap-3 py-12 text-center">
          <TriangleAlert size={22} style={{ color: "#ff8a8d" }} />
          <p style={{ color: "var(--a-text-2)" }}>{creators.error}</p>
        </div>
      ) : !rows.length ? (
        <div className="a-card a-card--pad flex flex-col items-center gap-3 py-14 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full" style={{ background: "var(--a-brand-tint)", color: "var(--a-brand)" }}>
            <BadgeCheck size={22} />
          </span>
          <p className="font-semibold text-white">No verified creators yet</p>
          <p className="a-page-head__sub !mt-0">Approve a creator request to add the first one.</p>
        </div>
      ) : (
        <div className={`a-table-wrap ${creators.loading ? "opacity-60" : ""}`}>
          <table className="a-table">
            <thead>
              <tr>
                <th>Creator ID</th>
                <th>Creator</th>
                <th>Designation</th>
                <th style={{ textAlign: "center" }}>Courses</th>
                <th style={{ textAlign: "right" }}>Followers</th>
                <th>Verified</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c._id}>
                  <td className="whitespace-nowrap">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 font-mono text-[0.8rem] text-white hover:underline"
                      onClick={() => {
                        void navigator.clipboard?.writeText(c.code);
                        toast.success(`${c.code} copied`);
                      }}
                      title="Copy Creator ID"
                    >
                      {c.code} <Copy size={12} style={{ color: "var(--a-text-3)" }} />
                    </button>
                  </td>
                  <td style={{ minWidth: 220 }}>
                    <Avatar src={c.avatar} name={c.name} />
                    <span className="ml-[42px] block text-[0.72rem]" style={{ color: "var(--a-text-3)" }}>
                      {c.email}
                    </span>
                  </td>
                  <td style={{ maxWidth: 200 }}>
                    <span className="a-clamp-1">{c.title || "—"}</span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span className="a-badge a-badge--brand">{c.course_count ?? 0}</span>
                  </td>
                  <td style={{ textAlign: "right" }}>{(c.followers ?? 0).toLocaleString()}</td>
                  <td>
                    <DateCell value={c.verified_at} />
                  </td>
                  <td>
                    <span className={`a-badge ${c.is_active ? "a-badge--signal" : "a-badge--muted"}`}>{c.is_active ? "Active" : "Inactive"}</span>
                  </td>
                  <td>
                    <div className="flex justify-end gap-1.5">
                      <a href={`/creator-profile/${c.slug}`} target="_blank" rel="noopener noreferrer" className="a-btn a-btn--ghost a-btn--icon" aria-label="Public profile" title="Public profile">
                        <ExternalLink size={14} />
                      </a>
                      {canEdit && !isReadOnly && (
                        <button type="button" className="a-btn a-btn--ghost a-btn--icon" onClick={() => openEdit(c)} aria-label="Edit" title="Edit">
                          <Pencil size={14} />
                        </button>
                      )}
                      {can("superadmin") && (
                        <button type="button" className="a-btn a-btn--danger a-btn--icon" onClick={() => setDeleting(c)} aria-label="Remove" title="Remove">
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

      <AdminPagination meta={creators.meta} onPage={(page) => setFilters((f) => ({ ...f, page }))} onLimit={(limit) => setFilters((f) => ({ ...f, limit, page: 1 }))} />

      <Drawer
        open={Boolean(editing)}
        title={editing ? `Edit ${editing.name}` : "Edit creator"}
        description={editing ? `${editing.code} · changes update every linked course` : undefined}
        onClose={() => setEditing(null)}
        footer={
          <>
            <button type="button" className="a-btn a-btn--ghost" onClick={() => setEditing(null)} disabled={creators.saving}>
              Cancel
            </button>
            <button type="button" className="a-btn a-btn--primary" onClick={save} disabled={creators.saving}>
              {creators.saving ? "Saving…" : "Save changes"}
            </button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map((field) => (
            <div key={field.name} className={field.span === 2 ? "sm:col-span-2" : ""}>
              <Field field={field} value={values[field.name]} error={creators.fieldErrors[field.name]} onChange={(v) => setValues((p) => ({ ...p, [field.name]: v }))} />
            </div>
          ))}
        </div>
      </Drawer>

      <DeleteModal
        open={Boolean(deleting)}
        title="Remove this verified creator?"
        message="Their courses keep the creator details but are unlinked, and the user goes back to a learner account."
        itemName={deleting?.name}
        busy={creators.saving}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting?._id && (await creators.remove(deleting._id))) setDeleting(null);
        }}
      />
    </>
  );
}
