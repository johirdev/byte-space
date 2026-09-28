"use client";

import { useContext, useEffect, useState } from "react";
import { AnimatePresence, LazyMotion, MotionConfig, domMax, m } from "motion/react";
import { ArrowDown, ArrowUp, Database, Eye, EyeOff, MessageSquareQuote, Pencil, Plus, RefreshCw, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "react-toastify";
import { AuthContext } from "@/app/dashboard/AuthProvider";
import { useAdminResource } from "@/hooks/useAdminResource";
import { apiRequest, ApiClientError } from "@/app/lib/apiClient";
import type { ITestimonial } from "@/app/types";
import PageHeader from "../kit/PageHeader";
import Drawer from "../kit/Drawer";
import { Field } from "../kit/Fields";
import type { FieldDef, FormValues } from "../kit/types";
import { Avatar } from "../kit/cells";
import DeleteModal from "@/Layout/DeleteModal/DeleteModal";

const FIELDS: FieldDef[] = [
  { name: "avatar", label: "Photo", type: "image", span: 2, hint: "Square photo — shown as an 80px circle." },
  { name: "name", label: "Name", type: "text", required: true, placeholder: "Sarah M." },
  { name: "role", label: "Role", type: "text", placeholder: "Enthusiastic Learner" },
  {
    name: "quote",
    label: "Quote",
    type: "textarea",
    required: true,
    span: 2,
    rows: 6,
    hint: "20–700 characters. Quotation marks are added automatically.",
  },
  {
    name: "rating",
    label: "Rating",
    type: "select",
    options: [5, 4, 3, 2, 1].map((n) => ({ label: `${"★".repeat(n)} (${n})`, value: n })),
  },
  { name: "is_active", label: "Visible on the home page", type: "switch", hint: "Hidden testimonials stay here but aren't shown." },
];

const EMPTY: FormValues = { rating: 5, is_active: true };

export default function TestimonialsManager() {
  const { token, isReadOnly } = useContext(AuthContext);
  const resource = useAdminResource<ITestimonial>("/testimonials", { label: "Testimonial", query: { scope: "admin" } });

  // Local copy so reorders animate instantly (optimistic), then persist.
  const [items, setItems] = useState<ITestimonial[]>([]);
  const [editing, setEditing] = useState<ITestimonial | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [deleting, setDeleting] = useState<ITestimonial | null>(null);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(resource.items);
  }, [resource.items]);

  const openCreate = () => {
    setEditing(null);
    setValues(EMPTY);
    resource.setFieldErrors({});
    setDrawerOpen(true);
  };
  const openEdit = (t: ITestimonial) => {
    setEditing(t);
    setValues({ ...t });
    resource.setFieldErrors({});
    setDrawerOpen(true);
  };

  const save = async () => {
    const body = {
      name: values.name,
      role: values.role,
      avatar: values.avatar,
      quote: values.quote,
      rating: Number(values.rating) || 5,
      is_active: values.is_active !== false,
    };
    const saved = editing?._id ? await resource.update(editing._id, body) : await resource.create(body);
    if (saved) setDrawerOpen(false);
  };

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
    try {
      await apiRequest("/testimonials/reorder", { method: "PATCH", token, body: { ids: next.map((t) => t._id) } });
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Could not save the order");
      setItems(resource.items);
    }
  };

  const toggle = async (t: ITestimonial) => {
    if (!t._id) return;
    setItems((prev) => prev.map((x) => (x._id === t._id ? { ...x, is_active: !x.is_active } : x)));
    await resource.update(t._id, { is_active: !t.is_active });
  };

  const seed = async () => {
    setSeeding(true);
    try {
      const { message } = await apiRequest("/testimonials/seed", { method: "POST", token });
      toast.success(message);
      await resource.refetch();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Could not add samples");
    } finally {
      setSeeding(false);
    }
  };

  const visible = items.filter((t) => t.is_active).length;

  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user">
        <PageHeader
          title="Testimonials"
          description="Shown in “Discover What Our Community Is Saying” on the home page, in this order. Changes go live immediately."
          actions={
            <>
              <button type="button" onClick={resource.refetch} className="a-btn a-btn--ghost" disabled={resource.loading}>
                <RefreshCw size={15} className={resource.loading ? "animate-spin" : undefined} /> Refresh
              </button>
              {!isReadOnly && (
                <button type="button" onClick={openCreate} className="a-btn a-btn--primary">
                  <Plus size={16} /> New testimonial
                </button>
              )}
            </>
          }
        />

        {items.length > 0 && (
          <p className="mb-4 text-[0.8rem]" style={{ color: "var(--a-text-3)" }}>
            <strong className="text-white">{visible}</strong> visible · {items.length - visible} hidden
            {visible > 3 ? " · the home page slider scrolls through them" : ""}
          </p>
        )}

        {resource.loading && !items.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="a-skeleton h-72" />
            ))}
          </div>
        ) : resource.error ? (
          <div className="a-card a-card--pad flex flex-col items-center gap-3 py-12 text-center">
            <TriangleAlert size={22} style={{ color: "#ff8a8d" }} />
            <p style={{ color: "var(--a-text-2)" }}>{resource.error}</p>
          </div>
        ) : !items.length ? (
          <div className="a-card a-card--pad flex flex-col items-center gap-3 py-14 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full" style={{ background: "var(--a-brand-tint)", color: "var(--a-brand)" }}>
              <MessageSquareQuote size={22} />
            </span>
            <p className="font-semibold text-white">No testimonials yet</p>
            <p className="a-page-head__sub !mt-0">The home page section stays hidden until at least one is visible.</p>
            {!isReadOnly && (
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                <button type="button" onClick={openCreate} className="a-btn a-btn--primary">
                  <Plus size={16} /> Create the first one
                </button>
                <button type="button" onClick={seed} className="a-btn a-btn--ghost" disabled={seeding}>
                  <Database size={15} /> {seeding ? "Adding…" : "Load the 3 design samples"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <m.ul layout className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence initial={false} mode="popLayout">
              {items.map((t, i) => (
                <m.li
                  key={t._id}
                  layout
                  initial={{ opacity: 0, scale: 0.92, y: 16 }}
                  animate={{ opacity: t.is_active ? 1 : 0.55, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  className="a-card flex flex-col p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <Avatar src={t.avatar} name={t.name} />
                    <span className="flex items-center gap-1.5">
                      <span className="a-badge a-badge--muted">#{i + 1}</span>
                      <span className={`a-badge ${t.is_active ? "a-badge--signal" : "a-badge--muted"}`}>{t.is_active ? "Visible" : "Hidden"}</span>
                    </span>
                  </div>
                  {t.role && (
                    <p className="mt-2 text-[0.8rem]" style={{ color: "var(--a-brand)" }}>
                      {t.role}
                    </p>
                  )}
                  <p className="a-clamp-2 mt-3 text-[0.84rem] leading-relaxed" style={{ color: "var(--a-text-2)", WebkitLineClamp: 5 }}>
                    “{t.quote}”
                  </p>
                  {!isReadOnly && (
                    <div className="mt-4 flex items-center justify-between gap-2 pt-4" style={{ borderTop: "1px solid var(--a-line)" }}>
                      <div className="flex gap-1">
                        <button type="button" className="a-btn a-btn--ghost a-btn--icon" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move earlier" title="Move earlier">
                          <ArrowUp size={14} />
                        </button>
                        <button type="button" className="a-btn a-btn--ghost a-btn--icon" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move later" title="Move later">
                          <ArrowDown size={14} />
                        </button>
                      </div>
                      <div className="flex gap-1">
                        <button type="button" className="a-btn a-btn--ghost a-btn--icon" onClick={() => toggle(t)} aria-label={t.is_active ? "Hide" : "Show"} title={t.is_active ? "Hide from home page" : "Show on home page"}>
                          {t.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button type="button" className="a-btn a-btn--ghost a-btn--icon" onClick={() => openEdit(t)} aria-label="Edit" title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button type="button" className="a-btn a-btn--danger a-btn--icon" onClick={() => setDeleting(t)} aria-label="Delete" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </m.li>
              ))}
            </AnimatePresence>
          </m.ul>
        )}

        <Drawer
          open={drawerOpen}
          title={editing ? "Edit testimonial" : "New testimonial"}
          description={editing ? "Changes show on the home page immediately." : "Added to the end of the slider."}
          onClose={() => setDrawerOpen(false)}
          footer={
            <>
              <button type="button" className="a-btn a-btn--ghost" onClick={() => setDrawerOpen(false)} disabled={resource.saving}>
                Cancel
              </button>
              <button type="button" className="a-btn a-btn--primary" onClick={save} disabled={resource.saving || isReadOnly}>
                {resource.saving ? "Saving…" : editing ? "Save changes" : "Create testimonial"}
              </button>
            </>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {FIELDS.map((field) => (
              <div key={field.name} className={field.span === 2 ? "sm:col-span-2" : ""}>
                <Field field={field} value={values[field.name]} error={resource.fieldErrors[field.name]} onChange={(v) => setValues((p) => ({ ...p, [field.name]: v }))} />
              </div>
            ))}
          </div>

          {/* Live preview in the site's card style */}
          <p className="a-label mt-6 mb-2">Preview</p>
          <div className="rounded-[24px] bg-white p-6 text-neutral-950">
            <div className="flex items-center gap-4">
              <Avatar src={typeof values.avatar === "string" ? values.avatar : undefined} name={String(values.name || "Name")} />
            </div>
            <p className="mt-1 text-[1rem] text-primary-600">{String(values.role || "Role")}</p>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-neutral-600">“{String(values.quote || "Their words will appear here…")}”</p>
          </div>
        </Drawer>

        <DeleteModal
          open={Boolean(deleting)}
          title="Delete this testimonial?"
          itemName={deleting ? `${deleting.name}'s testimonial` : undefined}
          busy={resource.saving}
          onCancel={() => setDeleting(null)}
          onConfirm={async () => {
            if (deleting?._id && (await resource.remove(deleting._id))) setDeleting(null);
          }}
        />
      </MotionConfig>
    </LazyMotion>
  );
}
