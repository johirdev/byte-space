"use client";

import { useContext, useMemo, useState, type ReactNode } from "react";
import {
  Inbox,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { AuthContext } from "@/app/dashboard/AuthProvider";
import { useAdminResource } from "@/hooks/useAdminResource";
import Drawer from "./Drawer";
import PageHeader from "./PageHeader";
import { Field } from "./Fields";
import type { Column, FieldDef, FormValues } from "./types";
import DeleteModal from "@/Layout/DeleteModal/DeleteModal";

type Props<T extends { _id?: string }> = {
  /** API path, e.g. "/services". */
  path: string;
  title: string;
  description?: string;
  /** Singular noun used in buttons and toasts. */
  label: string;
  fields: FieldDef[];
  columns: Column<T>[];
  /** Values for a brand-new record. */
  emptyValues?: FormValues;
  /** Maps a record to the form values (defaults to the record itself). */
  toForm?: (row: T) => FormValues;
  /** Maps form values to the request body (defaults to the values). */
  toPayload?: (values: FormValues) => Record<string, unknown>;
  /** Fields searched by the toolbar filter. */
  searchKeys?: (keyof T & string)[];
  /** Label shown in the delete dialog. */
  nameOf?: (row: T) => string;
  /** Extra content above the table (filters, stats). */
  toolbar?: ReactNode;
  query?: Record<string, string | number | boolean | undefined>;
};

/**
 * One screen that lists, creates, edits and deletes a collection — driven by
 * a field schema so each management page only describes its own data shape.
 */
export default function ResourceManager<T extends { _id?: string }>({
  path,
  title,
  description,
  label,
  fields,
  columns,
  emptyValues = {},
  toForm,
  toPayload,
  searchKeys = [],
  nameOf,
  toolbar,
  query,
}: Props<T>) {
  const { isReadOnly } = useContext(AuthContext);
  const resource = useAdminResource<T>(path, { label, query });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [values, setValues] = useState<FormValues>(emptyValues);
  const [deleting, setDeleting] = useState<T | null>(null);
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term || !searchKeys.length) return resource.items;

    return resource.items.filter((row) =>
      searchKeys.some((key) =>
        String(row[key] ?? "").toLowerCase().includes(term),
      ),
    );
  }, [resource.items, search, searchKeys]);

  const openCreate = () => {
    setEditing(null);
    setValues(emptyValues);
    resource.setFieldErrors({});
    setDrawerOpen(true);
  };

  const openEdit = (row: T) => {
    setEditing(row);
    setValues(toForm ? toForm(row) : (row as unknown as FormValues));
    resource.setFieldErrors({});
    setDrawerOpen(true);
  };

  const save = async () => {
    const payload = toPayload ? toPayload(values) : (values as Record<string, unknown>);
    const saved = editing?._id
      ? await resource.update(editing._id, payload)
      : await resource.create(payload);

    // Field errors keep the drawer open so the user can fix them in place.
    if (saved) setDrawerOpen(false);
  };

  const confirmDelete = async () => {
    if (!deleting?._id) return;
    const ok = await resource.remove(deleting._id);
    if (ok) setDeleting(null);
  };

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        actions={
          <>
            <button
              type="button"
              onClick={resource.refetch}
              className="a-btn a-btn--ghost"
              disabled={resource.loading}
              aria-label="Refresh"
            >
              <RefreshCw
                size={15}
                className={resource.loading ? "animate-spin" : undefined}
              />
              Refresh
            </button>

            {!isReadOnly && (
              <button type="button" onClick={openCreate} className="a-btn a-btn--primary">
                <Plus size={16} />
                New {label.toLowerCase()}
              </button>
            )}
          </>
        }
      />

      {toolbar}

      {/* Search */}
      {searchKeys.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
              style={{ color: "var(--a-text-3)" }}
              aria-hidden="true"
            />
            <input
              className="a-input !pl-10"
              placeholder={`Search ${title.toLowerCase()}…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label={`Search ${title}`}
            />
          </div>

          <span className="text-[0.78rem]" style={{ color: "var(--a-text-3)" }}>
            {rows.length} of {resource.items.length}
          </span>
        </div>
      )}

      {/* Table */}
      {resource.loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="a-skeleton h-14" aria-hidden="true" />
          ))}
        </div>
      ) : resource.error ? (
        <div className="a-card a-card--pad flex flex-col items-center gap-3 py-12 text-center">
          <TriangleAlert size={24} style={{ color: "#ff8a8d" }} />
          <p className="text-[0.86rem]" style={{ color: "var(--a-text-2)" }}>
            {resource.error}
          </p>
          <button type="button" onClick={resource.refetch} className="a-btn a-btn--ghost">
            Try again
          </button>
        </div>
      ) : rows.length === 0 ? (
        <div className="a-card a-card--pad flex flex-col items-center gap-3 py-14 text-center">
          <span
            className="grid h-12 w-12 place-items-center rounded-full"
            style={{ background: "var(--a-brand-tint)", color: "var(--a-brand)" }}
          >
            <Inbox size={22} />
          </span>
          <p className="text-[0.9rem] font-semibold text-white">
            {search ? "Nothing matches that search" : `No ${title.toLowerCase()} yet`}
          </p>
          {!search && !isReadOnly && (
            <button type="button" onClick={openCreate} className="a-btn a-btn--primary">
              <Plus size={16} />
              Create the first one
            </button>
          )}
        </div>
      ) : (
        <div className="a-table-wrap">
          <table className="a-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    style={{ width: column.width, textAlign: column.align ?? "left" }}
                  >
                    {column.header}
                  </th>
                ))}
                <th style={{ width: 96, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, i) => (
                <tr key={row._id ?? i}>
                  {columns.map((column) => (
                    <td key={column.key} style={{ textAlign: column.align ?? "left" }}>
                      {column.render
                        ? column.render(row)
                        : String((row as Record<string, unknown>)[column.key] ?? "—")}
                    </td>
                  ))}

                  <td>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        aria-label={`Edit ${label}`}
                        className="a-btn a-btn--ghost a-btn--icon"
                      >
                        <Pencil size={14} />
                      </button>

                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => setDeleting(row)}
                          aria-label={`Delete ${label}`}
                          className="a-btn a-btn--danger a-btn--icon"
                        >
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

      {/* Editor */}
      <Drawer
        open={drawerOpen}
        title={editing ? `Edit ${label.toLowerCase()}` : `New ${label.toLowerCase()}`}
        description={
          editing
            ? "Changes go live as soon as you save."
            : `Add a new ${label.toLowerCase()} to the site.`
        }
        onClose={() => setDrawerOpen(false)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="a-btn a-btn--ghost"
              disabled={resource.saving}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              className="a-btn a-btn--primary"
              disabled={resource.saving || isReadOnly}
            >
              {resource.saving ? "Saving…" : editing ? "Save changes" : `Create ${label.toLowerCase()}`}
            </button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.name} className={field.span === 2 ? "sm:col-span-2" : ""}>
              <Field
                field={field}
                value={values[field.name]}
                error={resource.fieldErrors[field.name]}
                onChange={(value) =>
                  setValues((prev) => ({ ...prev, [field.name]: value }))
                }
              />
            </div>
          ))}
        </div>
      </Drawer>

      <DeleteModal
        open={Boolean(deleting)}
        title={`Delete this ${label.toLowerCase()}?`}
        itemName={deleting && nameOf ? nameOf(deleting) : undefined}
        busy={resource.saving}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
