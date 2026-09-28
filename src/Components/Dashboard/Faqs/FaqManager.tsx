"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import { AnimatePresence, LazyMotion, MotionConfig, domMax, m } from "motion/react";
import { ArrowDown, ArrowUp, Eye, EyeOff, HelpCircle, Pencil, Plus, RefreshCw, RotateCcw, Search, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "react-toastify";
import { AuthContext } from "@/app/dashboard/AuthProvider";
import { useAdminResource } from "@/hooks/useAdminResource";
import { apiRequest, ApiClientError } from "@/app/lib/apiClient";
import { FAQ_CATEGORIES, type IFaq } from "@/app/types";
import PageHeader from "../kit/PageHeader";
import Drawer from "../kit/Drawer";
import { Field } from "../kit/Fields";
import type { FieldDef, FormValues } from "../kit/types";
import DeleteModal from "@/Layout/DeleteModal/DeleteModal";

const FIELDS: FieldDef[] = [
  { name: "question", label: "Question", type: "text", required: true, span: 2, placeholder: "How do I enroll in a course?" },
  { name: "answer", label: "Answer", type: "textarea", required: true, span: 2, rows: 7, hint: "15–2000 characters. Plain text." },
  { name: "category", label: "Category", type: "select", required: true, options: FAQ_CATEGORIES.map((c) => ({ label: c, value: c })) },
  { name: "is_active", label: "Visible on the site", type: "switch" },
];

const EMPTY: FormValues = { category: "General", is_active: true };

export default function FaqManager() {
  const { token, isReadOnly } = useContext(AuthContext);
  const resource = useAdminResource<IFaq>("/faqs", { label: "FAQ", query: { scope: "admin" } });

  const [items, setItems] = useState<IFaq[]>([]);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<IFaq | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [deleting, setDeleting] = useState<IFaq | null>(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(resource.items);
  }, [resource.items]);

  const filtering = category !== "All" || search.trim() !== "";
  const shown = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter(
      (f) =>
        (category === "All" || f.category === category) &&
        (!term || f.question.toLowerCase().includes(term) || f.answer.toLowerCase().includes(term)),
    );
  }, [items, category, search]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { All: items.length };
    for (const f of items) map[f.category] = (map[f.category] ?? 0) + 1;
    return map;
  }, [items]);

  const openCreate = () => {
    setEditing(null);
    setValues({ ...EMPTY, category: category === "All" ? "General" : category });
    resource.setFieldErrors({});
    setDrawerOpen(true);
  };
  const openEdit = (f: IFaq) => {
    setEditing(f);
    setValues({ ...f });
    resource.setFieldErrors({});
    setDrawerOpen(true);
  };

  const save = async () => {
    const body = { question: values.question, answer: values.answer, category: values.category, is_active: values.is_active !== false };
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
      await apiRequest("/faqs/reorder", { method: "PATCH", token, body: { ids: next.map((f) => f._id) } });
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Could not save the order");
      setItems(resource.items);
    }
  };

  const toggle = async (f: IFaq) => {
    if (!f._id) return;
    setItems((prev) => prev.map((x) => (x._id === f._id ? { ...x, is_active: !x.is_active } : x)));
    await resource.update(f._id, { is_active: !f.is_active });
  };

  const restore = async () => {
    setRestoring(true);
    try {
      const { message } = await apiRequest("/faqs/restore-defaults", { method: "POST", token });
      toast.success(message);
      await resource.refetch();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Could not restore defaults");
    } finally {
      setRestoring(false);
    }
  };

  const visible = items.filter((f) => f.is_active).length;

  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user">
        <PageHeader
          title="FAQs"
          description="Questions shown in the FAQ section of the home page, in this order. Changes go live immediately."
          actions={
            <>
              <button type="button" onClick={resource.refetch} className="a-btn a-btn--ghost" disabled={resource.loading}>
                <RefreshCw size={15} className={resource.loading ? "animate-spin" : undefined} /> Refresh
              </button>
              {!isReadOnly && (
                <>
                  <button type="button" onClick={restore} className="a-btn a-btn--ghost" disabled={restoring} title="Re-add any default question you deleted">
                    <RotateCcw size={15} /> {restoring ? "Restoring…" : "Restore defaults"}
                  </button>
                  <button type="button" onClick={openCreate} className="a-btn a-btn--primary">
                    <Plus size={16} /> New FAQ
                  </button>
                </>
              )}
            </>
          }
        />

        <div className="a-card a-card--pad mb-4 flex flex-wrap items-center gap-2.5">
          <div className="a-seg" role="group" aria-label="Category">
            {["All", ...FAQ_CATEGORIES].map((c) => (
              <button key={c} type="button" aria-pressed={category === c} onClick={() => setCategory(c)}>
                {c}
                <span className="ml-1.5 opacity-60">{counts[c] ?? 0}</span>
              </button>
            ))}
          </div>
          <div className="relative min-w-[200px] flex-1">
            <Search size={15} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2" style={{ color: "var(--a-text-3)" }} />
            <input className="a-input !pl-10" placeholder="Search questions and answers…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search FAQs" />
          </div>
          <span className="text-[0.78rem]" style={{ color: "var(--a-text-3)" }}>
            <strong className="text-white">{visible}</strong> visible · {items.length - visible} hidden
          </span>
        </div>
        {filtering && items.length > 1 && (
          <p className="a-hint mb-3">Clear the search and pick “All” to reorder questions.</p>
        )}

        {resource.loading && !items.length ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="a-skeleton h-20" />
            ))}
          </div>
        ) : resource.error ? (
          <div className="a-card a-card--pad flex flex-col items-center gap-3 py-12 text-center">
            <TriangleAlert size={22} style={{ color: "#ff8a8d" }} />
            <p style={{ color: "var(--a-text-2)" }}>{resource.error}</p>
          </div>
        ) : !shown.length ? (
          <div className="a-card a-card--pad flex flex-col items-center gap-3 py-14 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full" style={{ background: "var(--a-brand-tint)", color: "var(--a-brand)" }}>
              <HelpCircle size={22} />
            </span>
            <p className="font-semibold text-white">{filtering ? "No FAQs match" : "No FAQs yet"}</p>
            {!filtering && <p className="a-page-head__sub !mt-0">The home page FAQ section stays hidden until at least one is visible.</p>}
            {!isReadOnly && !filtering && (
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                <button type="button" onClick={openCreate} className="a-btn a-btn--primary">
                  <Plus size={16} /> Add a question
                </button>
                <button type="button" onClick={restore} className="a-btn a-btn--ghost" disabled={restoring}>
                  <RotateCcw size={15} /> Restore the default FAQs
                </button>
              </div>
            )}
          </div>
        ) : (
          <m.ul layout className="flex flex-col gap-2.5">
            <AnimatePresence initial={false} mode="popLayout">
              {shown.map((f) => {
                const index = items.findIndex((x) => x._id === f._id);
                return (
                  <m.li
                    key={f._id}
                    layout
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: f.is_active ? 1 : 0.55, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.18 } }}
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    className="a-card flex flex-col gap-3 p-4 md:flex-row md:items-start md:p-5"
                  >
                    <span className="a-badge a-badge--muted shrink-0 self-start">#{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[0.92rem] font-semibold text-white">{f.question}</p>
                      </div>
                      <p className="a-clamp-2 mt-1 text-[0.82rem] leading-relaxed" style={{ color: "var(--a-text-2)" }}>
                        {f.answer}
                      </p>
                      <div className="mt-2 flex gap-1.5">
                        <span className="a-badge a-badge--brand">{f.category}</span>
                        <span className={`a-badge ${f.is_active ? "a-badge--signal" : "a-badge--muted"}`}>{f.is_active ? "Visible" : "Hidden"}</span>
                      </div>
                    </div>
                    {!isReadOnly && (
                      <div className="flex shrink-0 gap-1 self-end md:self-start">
                        <button type="button" className="a-btn a-btn--ghost a-btn--icon" onClick={() => move(index, -1)} disabled={filtering || index === 0} aria-label="Move up" title="Move up">
                          <ArrowUp size={14} />
                        </button>
                        <button type="button" className="a-btn a-btn--ghost a-btn--icon" onClick={() => move(index, 1)} disabled={filtering || index === items.length - 1} aria-label="Move down" title="Move down">
                          <ArrowDown size={14} />
                        </button>
                        <button type="button" className="a-btn a-btn--ghost a-btn--icon" onClick={() => toggle(f)} aria-label={f.is_active ? "Hide" : "Show"} title={f.is_active ? "Hide from site" : "Show on site"}>
                          {f.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button type="button" className="a-btn a-btn--ghost a-btn--icon" onClick={() => openEdit(f)} aria-label="Edit" title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button type="button" className="a-btn a-btn--danger a-btn--icon" onClick={() => setDeleting(f)} aria-label="Delete" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </m.li>
                );
              })}
            </AnimatePresence>
          </m.ul>
        )}

        <Drawer
          open={drawerOpen}
          title={editing ? "Edit FAQ" : "New FAQ"}
          description={editing ? "Changes show on the site immediately." : "Added to the end of the list."}
          onClose={() => setDrawerOpen(false)}
          footer={
            <>
              <button type="button" className="a-btn a-btn--ghost" onClick={() => setDrawerOpen(false)} disabled={resource.saving}>
                Cancel
              </button>
              <button type="button" className="a-btn a-btn--primary" onClick={save} disabled={resource.saving || isReadOnly}>
                {resource.saving ? "Saving…" : editing ? "Save changes" : "Create FAQ"}
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

          <p className="a-label mt-6 mb-2">Preview</p>
          <div className="rounded-[16px] bg-white text-neutral-950 shadow-lg">
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <span className="font-heading font-medium">{String(values.question || "Your question")}</span>
              <span className="grid h-8 w-8 shrink-0 rotate-45 place-items-center rounded-full bg-secondary-400">
                <Plus size={16} />
              </span>
            </div>
            <p className="px-5 pb-5 text-[0.92rem] leading-relaxed text-neutral-600">{String(values.answer || "The answer appears here when the question is opened.")}</p>
          </div>
        </Drawer>

        <DeleteModal
          open={Boolean(deleting)}
          title="Delete this FAQ?"
          message="You can bring back default questions later with “Restore defaults”."
          itemName={deleting ? `“${deleting.question}”` : undefined}
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
