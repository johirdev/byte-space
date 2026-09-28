"use client";

import { useContext, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeDollarSign,
  BookOpenText,
  Check,
  CircleAlert,
  ExternalLink,
  ImageIcon,
  Layers,
  ListChecks,
  Loader2,
  Save,
  Send,
  Sparkles,
  UserRound,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import { toast } from "react-toastify";
import { AuthContext } from "@/app/dashboard/AuthProvider";
import { apiRequest, ApiClientError } from "@/app/lib/apiClient";
import {
  COURSE_LEVELS,
  DEFAULT_COURSE_INCLUDES,
  type CourseFormValues,
  type CourseLevel,
  type ICourse,
  type ICourseCategory,
  type ICourseModule,
} from "@/app/types";
import { categoryOf } from "@/Components/Frontend/utils/course";
import CoursesCard from "@/Components/Frontend/Card/CoursesCard";
import { Field } from "../kit/Fields";
import { ImageUpload, MultiImageUpload } from "../kit/ImageUpload";
import CurriculumBuilder from "./CurriculumBuilder";
import ListEditor from "./ListEditor";

type FormState = Omit<CourseFormValues, "price" | "students_count"> & {
  price: number | "";
  students_count: number | "";
};
type Errors = Record<string, string>;

const EMPTY: FormState = {
  title: "",
  slug: "",
  subtitle: "",
  category: "",
  level: "Beginner",
  price: "",
  price_label: "lifetime",
  thumbnail: "",
  preview_video: "",
  description: "",
  sneak_peek: [],
  key_points: [],
  includes: [...DEFAULT_COURSE_INCLUDES],
  modules_intro: "",
  lesson_content_info: "",
  progress_info: "",
  modules: [],
  creator: { name: "", title: "", avatar: "", bio: "" },
  students_count: 0,
  tags: [],
  is_featured: false,
  status: "draft",
};

const URL_RX = /^https?:\/\/\S+$/i;

const omit = (errors: Errors, keys: string[]): Errors =>
  Object.fromEntries(Object.entries(errors).filter(([k]) => !keys.includes(k)));

/** Mirrors the server rules so most mistakes are caught before a round trip. */
function validate(v: FormState, publishing: boolean): Errors {
  const e: Errors = {};
  const title = v.title.trim();
  if (!title) e.title = "Title is required";
  else if (title.length < 5) e.title = "Title must be at least 5 characters";
  else if (title.length > 140) e.title = "Title must be 140 characters or less";
  if (!v.category) e.category = "Choose a category";
  if (!v.thumbnail) e.thumbnail = "Upload a thumbnail";
  else if (!URL_RX.test(v.thumbnail)) e.thumbnail = "Must start with http:// or https://";
  if (v.preview_video && !URL_RX.test(v.preview_video)) e.preview_video = "Must start with http:// or https://";
  const desc = v.description.trim();
  if (!desc) e.description = "Description is required";
  else if (desc.length < 50) e.description = `Description must be at least 50 characters (${desc.length}/50)`;
  if (v.price !== "" && (Number(v.price) < 0 || Number(v.price) > 100000)) e.price = "Price must be between 0 and 100000";
  if (v.students_count !== "" && Number(v.students_count) < 0) e.students_count = "Cannot be negative";
  if (!v.creator.name.trim()) e["creator.name"] = "Creator name is required";
  if (v.creator.avatar && !URL_RX.test(v.creator.avatar)) e["creator.avatar"] = "Must start with http:// or https://";
  v.modules.forEach((m, i) => {
    if (!m.title.trim()) e[`modules.${i}.title`] = "Module title is required";
    m.lessons.forEach((l, j) => {
      if (!l.title.trim()) e[`modules.${i}.lessons.${j}.title`] = "Lesson title is required";
      if (l.duration < 0 || l.duration > 600) e[`modules.${i}.lessons.${j}.duration`] = "Duration must be 0–600 minutes";
    });
  });
  const lessonCount = v.modules.reduce((n, m) => n + m.lessons.length, 0);
  if (publishing && lessonCount === 0) e.modules = "Add at least one lesson before publishing";
  return e;
}

const toForm = (course: ICourse): FormState => ({
  ...EMPTY,
  ...course,
  category: categoryOf(course)?._id ?? String(course.category ?? ""),
  creator: { ...EMPTY.creator, ...course.creator },
  modules: course.modules ?? [],
});

const toPayload = (v: FormState) => ({
  ...v,
  price: v.price === "" ? 0 : Number(v.price),
  students_count: v.students_count === "" ? 0 : Number(v.students_count),
});

type SectionId = "setup" | "basics" | "media" | "content" | "curriculum" | "pricing" | "creator";

const SECTIONS: { id: SectionId; title: string; icon: LucideIcon; fields: string[] }[] = [
  { id: "setup", title: "Category & AI auto-fill", icon: Sparkles, fields: ["category"] },
  { id: "basics", title: "Basics", icon: BookOpenText, fields: ["title", "slug", "subtitle", "level", "tags"] },
  { id: "media", title: "Media", icon: ImageIcon, fields: ["thumbnail", "preview_video", "sneak_peek"] },
  { id: "content", title: "Description & highlights", icon: ListChecks, fields: ["description", "key_points", "includes"] },
  { id: "curriculum", title: "Curriculum", icon: Layers, fields: ["modules", "modules_intro", "lesson_content_info", "progress_info"] },
  { id: "pricing", title: "Pricing & stats", icon: BadgeDollarSign, fields: ["price", "price_label", "students_count"] },
  { id: "creator", title: "Creator", icon: UserRound, fields: ["creator"] },
];

const sectionOf = (errorKey: string): SectionId =>
  SECTIONS.find((s) => s.fields.some((f) => errorKey === f || errorKey.startsWith(`${f}.`)))?.id ?? "basics";

export default function CourseForm({ courseId }: { courseId?: string }) {
  const isEdit = Boolean(courseId);
  const router = useRouter();
  const { token, isReadOnly } = useContext(AuthContext);

  const [values, setValues] = useState<FormState>(EMPTY);
  const [initialJson, setInitialJson] = useState(JSON.stringify(EMPTY));
  const [errors, setErrors] = useState<Errors>({});
  const [categories, setCategories] = useState<ICourseCategory[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState<null | "draft" | "published">(null);
  const [filling, setFilling] = useState(false);
  const [confirmFill, setConfirmFill] = useState(false);
  const [glow, setGlow] = useState(0);
  const [liveSlug, setLiveSlug] = useState<string | null>(null);

  const refs = useRef<Partial<Record<SectionId, HTMLElement | null>>>({});
  const dirty = JSON.stringify(values) !== initialJson;
  const disabled = isReadOnly || Boolean(saving);

  // Categories for the picker.
  useEffect(() => {
    apiRequest<ICourseCategory[]>("/course-categories", { token, query: { scope: "admin" } })
      .then(({ data }) => setCategories(data ?? []))
      .catch(() => toast.error("Could not load categories"));
  }, [token]);

  // Existing course when editing.
  useEffect(() => {
    if (!courseId) return;
    apiRequest<ICourse>(`/courses/${courseId}`, { token, query: { scope: "admin" } })
      .then(({ data }) => {
        const form = toForm(data);
        setValues(form);
        setInitialJson(JSON.stringify(form));
        setLiveSlug(data.status === "published" ? data.slug : null);
      })
      .catch((err) => setLoadError(err instanceof ApiClientError ? err.message : "Could not load course"))
      .finally(() => setLoading(false));
  }, [courseId, token]);

  // Warn before leaving with unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key as string]) setErrors((prev) => omit(prev, [key as string]));
  };
  const setCreator = (patch: Partial<FormState["creator"]>) => {
    setValues((prev) => ({ ...prev, creator: { ...prev.creator, ...patch } }));
    setErrors((prev) => omit(prev, ["creator.name", "creator.avatar"]));
  };

  const register = (id: SectionId, el: HTMLElement | null) => {
    refs.current[id] = el;
  };
  const scrollTo = (id: SectionId) =>
    refs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });

  // ── AI auto-fill ──────────────────────────────────────────────────────
  const hasContent = Boolean(values.description.trim() || values.modules.length || values.key_points.length);

  const autofill = async () => {
    if (!values.category) {
      setErrors((e) => ({ ...e, category: "Choose a category first" }));
      scrollTo("setup");
      return;
    }
    setConfirmFill(false);
    setFilling(true);
    try {
      const { data, message } = await apiRequest<Omit<FormState, "category" | "status">>("/courses/autofill", {
        method: "POST",
        token,
        body: {
          category: values.category,
          title: values.title.trim() || undefined,
          level: values.level,
          creatorName: values.creator.name.trim() || undefined,
        },
      });
      setValues((prev) => ({
        ...prev,
        ...data,
        // Keep anything the admin already chose that the generator doesn't own.
        category: prev.category,
        thumbnail: prev.thumbnail,
        preview_video: prev.preview_video,
        sneak_peek: prev.sneak_peek,
        status: prev.status,
        is_featured: prev.is_featured,
        students_count: prev.students_count,
        creator: { ...prev.creator, ...data.creator, avatar: prev.creator.avatar },
      }));
      setErrors({});
      setGlow((g) => g + 1);
      toast.success(`${message} — review and tweak before saving`);
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Auto-fill failed");
    } finally {
      setFilling(false);
    }
  };

  // ── Save ──────────────────────────────────────────────────────────────
  const save = async (status: "draft" | "published") => {
    const found = validate(values, status === "published");
    setErrors(found);
    if (Object.keys(found).length) {
      toast.error(`Please fix ${Object.keys(found).length} highlighted field(s)`);
      scrollTo(sectionOf(Object.keys(found)[0]));
      return;
    }

    setSaving(status);
    try {
      const body = toPayload({ ...values, status });
      const { data } = isEdit
        ? await apiRequest<ICourse>(`/courses/${courseId}`, { method: "PATCH", token, body })
        : await apiRequest<ICourse>("/courses", { method: "POST", token, body });

      const form = toForm(data);
      setValues(form);
      setInitialJson(JSON.stringify(form));
      setLiveSlug(data.status === "published" ? data.slug : null);
      toast.success(
        status === "published"
          ? isEdit ? "Course updated and live" : "Course published 🎉"
          : isEdit ? "Changes saved" : "Draft saved",
      );
      if (!isEdit) router.replace(`/dashboard/courses/${data._id}/edit`);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setErrors(err.errors ?? {});
        toast.error(err.message);
        const first = Object.keys(err.errors ?? {})[0];
        if (first) scrollTo(sectionOf(first));
      } else {
        toast.error("Could not save the course");
      }
    } finally {
      setSaving(null);
    }
  };

  // ── Derived UI state ──────────────────────────────────────────────────
  const selectedCategory = categories.find((c) => c._id === values.category);
  const lessonCount = values.modules.reduce((n, m) => n + m.lessons.length, 0);
  const minutes = values.modules.reduce((n, m) => n + m.lessons.reduce((s, l) => s + (l.duration || 0), 0), 0);

  const checklist = useMemo(
    () => [
      { label: "Category chosen", done: Boolean(values.category), section: "setup" as const },
      { label: "Title & subtitle", done: values.title.trim().length >= 5 && Boolean(values.subtitle?.trim()), section: "basics" as const },
      { label: "Thumbnail uploaded", done: Boolean(values.thumbnail), section: "media" as const },
      { label: "Description (50+ chars)", done: values.description.trim().length >= 50, section: "content" as const },
      { label: "Key points", done: values.key_points.length >= 3, section: "content" as const },
      { label: "At least one lesson", done: lessonCount > 0, section: "curriculum" as const },
      { label: "Creator details", done: Boolean(values.creator.name.trim()), section: "creator" as const },
    ],
    [values, lessonCount],
  );
  const completeness = Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100);
  const errorCount = Object.keys(errors).length;

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <div className="a-skeleton h-12 w-72" />
        <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
          <div className="flex flex-col gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="a-skeleton h-56" />
            ))}
          </div>
          <div className="a-skeleton h-96" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="a-card a-card--pad flex flex-col items-center gap-3 py-14 text-center">
        <CircleAlert size={24} style={{ color: "#ff8a8d" }} />
        <p className="text-white">{loadError}</p>
        <Link href="/dashboard/courses" className="a-btn a-btn--ghost">
          Back to courses
        </Link>
      </div>
    );
  }

  const preview = {
    _id: "preview",
    slug: "#",
    title: values.title || "Your course title",
    thumbnail: values.thumbnail,
    creator: { name: values.creator.name || "Creator name" },
    level: values.level,
    price: Number(values.price) || 0,
    price_label: values.price_label,
    rating_avg: 0,
    rating_count: 0,
    total_lessons: lessonCount,
    total_duration: minutes,
    students_count: Number(values.students_count) || 0,
  };

  return (
    <div>
      {/* Header */}
      <div className="a-page-head">
        <div>
          <Link
            href="/dashboard/courses"
            className="mb-2 inline-flex items-center gap-1.5 text-[0.78rem] font-medium hover:text-white"
            style={{ color: "var(--a-text-3)" }}
          >
            <ArrowLeft size={14} /> All courses
          </Link>
          <h1 className="a-page-head__title flex flex-wrap items-center gap-2.5">
            {isEdit ? "Edit course" : "Create a course"}
            <span className={`a-badge ${values.status === "published" ? "a-badge--signal" : "a-badge--muted"}`}>
              {values.status === "published" ? "Published" : "Draft"}
            </span>
            {dirty && <span className="a-badge a-badge--ember">Unsaved changes</span>}
          </h1>
          <p className="a-page-head__sub">
            Pick a category, let AI draft the content, then polish and publish.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {liveSlug && (
            <a href={`/courses/${liveSlug}`} target="_blank" rel="noopener noreferrer" className="a-btn a-btn--ghost">
              <ExternalLink size={15} /> View live
            </a>
          )}
          <button type="button" className="a-btn a-btn--ghost" onClick={() => save("draft")} disabled={disabled}>
            {saving === "draft" ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {isEdit && values.status === "draft" ? "Save draft" : isEdit ? "Save as draft" : "Save draft"}
          </button>
          <button type="button" className="a-btn a-btn--primary" onClick={() => save("published")} disabled={disabled}>
            {saving === "published" ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            {values.status === "published" && isEdit ? "Update live course" : "Publish"}
          </button>
        </div>
      </div>

      {errorCount > 0 && (
        <div
          className="mb-4 flex items-start gap-2.5 rounded-[12px] px-4 py-3 text-[0.82rem]"
          style={{ background: "var(--a-coral-tint)", border: "1px solid rgba(245,72,76,.3)", color: "#ffb4b6" }}
          role="alert"
        >
          <CircleAlert size={16} className="mt-0.5 shrink-0" />
          <span>
            {errorCount} field{errorCount > 1 ? "s need" : " needs"} attention:{" "}
            {Array.from(new Set(Object.keys(errors).map(sectionOf))).map((id, i) => (
              <button key={id} type="button" onClick={() => scrollTo(id)} className="font-semibold underline underline-offset-2">
                {i > 0 && ", "}
                {SECTIONS.find((s) => s.id === id)?.title}
              </button>
            ))}
          </span>
        </div>
      )}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* ── Main column ───────────────────────────────────── */}
        <div className="flex min-w-0 flex-col gap-5">
          {/* Setup + AI */}
          <Section
            id="setup"
            register={register}
            icon={Sparkles}
            title="Start with a category"
            sub="The AI draft is tailored to the category, working title and level you pick."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="a-field">
                <label className="a-label" htmlFor="category">
                  Category<span className="req">*</span>
                </label>
                <select
                  id="category"
                  className="a-select"
                  value={values.category}
                  disabled={disabled}
                  aria-invalid={Boolean(errors.category)}
                  onChange={(e) => set("category", e.target.value)}
                >
                  <option value="">Select a category…</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                      {c.is_active === false ? " (hidden)" : ""}
                    </option>
                  ))}
                </select>
                {errors.category ? (
                  <p className="a-error">{errors.category}</p>
                ) : categories.length === 0 ? (
                  <p className="a-hint">
                    No categories yet —{" "}
                    <Link href="/dashboard/course-categories" className="underline">
                      create one first
                    </Link>
                    .
                  </p>
                ) : null}
              </div>

              <div className="a-field">
                <label className="a-label" htmlFor="level">
                  Level
                </label>
                <select
                  id="level"
                  className="a-select"
                  value={values.level}
                  disabled={disabled}
                  onChange={(e) => set("level", e.target.value as CourseLevel)}
                >
                  {COURSE_LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div
              className="mt-4 flex flex-col gap-3 rounded-[12px] p-4 sm:flex-row sm:items-center sm:justify-between"
              style={{
                background: "linear-gradient(135deg, rgba(203,252,1,.08), rgba(31,224,160,.06))",
                border: "1px solid rgba(203,252,1,.2)",
              }}
            >
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px]" style={{ background: "rgba(203,252,1,.14)", color: "#cbfc01" }}>
                  <Wand2 size={17} />
                </span>
                <div>
                  <p className="text-[0.86rem] font-semibold text-white">AI auto-fill</p>
                  <p className="text-[0.76rem]" style={{ color: "var(--a-text-2)" }}>
                    {selectedCategory
                      ? `Drafts the subtitle, description, key points, curriculum, pricing and creator copy for “${selectedCategory.name}”. Media stays as-is.`
                      : "Choose a category to enable it. Add a working title first for a more specific draft."}
                  </p>
                </div>
              </div>

              {confirmFill ? (
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-[0.74rem]" style={{ color: "var(--a-text-2)" }}>
                    Replace current content?
                  </span>
                  <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={() => setConfirmFill(false)}>
                    Cancel
                  </button>
                  <button type="button" className="a-btn a-btn--magic a-btn--sm" onClick={autofill}>
                    Replace
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="a-btn a-btn--magic shrink-0"
                  disabled={disabled || filling || !values.category}
                  onClick={() => (hasContent ? setConfirmFill(true) : autofill())}
                >
                  {filling ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                  {filling ? "Generating…" : hasContent ? "Regenerate" : "Auto-fill with AI"}
                </button>
              )}
            </div>
          </Section>

          {/* Basics */}
          <Section id="basics" register={register} icon={BookOpenText} title="Basics" sub="How the course appears in search and on its page." glow={glow}>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="title"
                label="Title"
                required
                span={2}
                value={values.title}
                max={140}
                error={errors.title}
                disabled={disabled}
                placeholder="Build Digital Asset: A Comprehensive Guide"
                onChange={(v) => set("title", v)}
              />
              <TextField
                id="subtitle"
                label="Subtitle"
                span={2}
                value={values.subtitle ?? ""}
                max={200}
                error={errors.subtitle}
                disabled={disabled}
                placeholder="Unlock the Power of Digital Creation with Expert Guidance"
                onChange={(v) => set("subtitle", v)}
              />
              <TextField
                id="slug"
                label="URL slug"
                value={values.slug ?? ""}
                error={errors.slug}
                disabled={disabled}
                placeholder="auto-generated-from-title"
                hint={`/courses/${values.slug || "auto-generated-from-title"}`}
                onChange={(v) => set("slug", v)}
              />
              <Field
                field={{ name: "tags", label: "Tags", type: "tags", placeholder: "figma, design…" }}
                value={values.tags}
                onChange={(v) => set("tags", v as string[])}
              />
            </div>
          </Section>

          {/* Media */}
          <Section id="media" register={register} icon={ImageIcon} title="Media" sub="Uploaded to imgbb. The thumbnail is used on cards and the page hero.">
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="a-field">
                <span className="a-label">
                  Thumbnail<span className="req">*</span>
                </span>
                <ImageUpload value={values.thumbnail} onChange={(url) => set("thumbnail", url)} invalid={Boolean(errors.thumbnail)} hint="16:9 · JPG, PNG or WEBP · up to 5 MB" />
                {errors.thumbnail && <p className="a-error">{errors.thumbnail}</p>}
              </div>
              <div className="flex flex-col gap-4">
                <TextField
                  id="preview_video"
                  label="Preview video URL"
                  value={values.preview_video ?? ""}
                  error={errors.preview_video}
                  disabled={disabled}
                  placeholder="https://www.youtube.com/watch?v=…"
                  hint="YouTube, Vimeo or a direct .mp4 link — plays from the thumbnail."
                  onChange={(v) => set("preview_video", v)}
                />
              </div>
            </div>
            <div className="a-field mt-5">
              <span className="a-label">Sneak peek gallery</span>
              <MultiImageUpload value={values.sneak_peek} onChange={(urls) => set("sneak_peek", urls)} invalid={Boolean(errors.sneak_peek)} />
              {errors.sneak_peek && <p className="a-error">{errors.sneak_peek}</p>}
            </div>
          </Section>

          {/* Content */}
          <Section id="content" register={register} icon={ListChecks} title="Description & highlights" sub="The About tab. Separate paragraphs with a blank line." glow={glow}>
            <div className="a-field">
              <label className="a-label" htmlFor="description">
                Description<span className="req">*</span>
              </label>
              <textarea
                id="description"
                className="a-textarea"
                rows={9}
                value={values.description}
                disabled={disabled}
                aria-invalid={Boolean(errors.description)}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Embark on an enlightening exploration…"
              />
              <div className="flex justify-between gap-3">
                {errors.description ? <p className="a-error">{errors.description}</p> : <p className="a-hint">At least 50 characters.</p>}
                <span className="a-hint tabular-nums">{values.description.trim().length} chars</span>
              </div>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <div className="a-field">
                <span className="a-label">Key points</span>
                <ListEditor values={values.key_points} onChange={(v) => set("key_points", v)} placeholder="e.g. Design Principles Mastery" disabled={disabled} />
                {errors.key_points && <p className="a-error">{errors.key_points}</p>}
              </div>
              <Field
                field={{
                  name: "includes",
                  label: "This course includes",
                  type: "tags",
                  hint: "Icons are picked by keyword: video, certificate, resources, consultation.",
                }}
                value={values.includes}
                onChange={(v) => set("includes", v as string[])}
              />
            </div>
          </Section>

          {/* Curriculum */}
          <Section id="curriculum" register={register} icon={Layers} title="Curriculum" sub="Modules and lessons for the Lessons tab and the side card." glow={glow}>
            <CurriculumBuilder
              modules={values.modules}
              onChange={(modules: ICourseModule[]) => {
                setValues((prev) => ({ ...prev, modules }));
                setErrors((prev) =>
                  Object.fromEntries(Object.entries(prev).filter(([k]) => !k.startsWith("modules"))),
                );
              }}
              errors={errors}
              disabled={disabled}
            />
            <details className="mt-5 rounded-[12px] border" style={{ borderColor: "var(--a-line)" }}>
              <summary className="cursor-pointer px-4 py-3 text-[0.82rem] font-semibold" style={{ color: "var(--a-text-2)" }}>
                Lessons tab copy (optional)
              </summary>
              <div className="flex flex-col gap-4 px-4 pb-4">
                <TextArea id="modules_intro" label="“Explore the Modules” intro" value={values.modules_intro ?? ""} disabled={disabled} onChange={(v) => set("modules_intro", v)} />
                <TextArea id="lesson_content_info" label="“Lesson Content” text" value={values.lesson_content_info ?? ""} disabled={disabled} onChange={(v) => set("lesson_content_info", v)} />
                <TextArea id="progress_info" label="“Lesson Progress Tracking” text" value={values.progress_info ?? ""} disabled={disabled} onChange={(v) => set("progress_info", v)} />
              </div>
            </details>
          </Section>

          {/* Pricing */}
          <Section id="pricing" register={register} icon={BadgeDollarSign} title="Pricing & stats" glow={glow}>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="a-field">
                <label className="a-label" htmlFor="price">
                  Price (USD)
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[0.86rem]" style={{ color: "var(--a-text-3)" }}>
                    $
                  </span>
                  <input
                    id="price"
                    type="number"
                    min={0}
                    step="0.01"
                    className="a-input !pl-7"
                    value={values.price}
                    disabled={disabled}
                    aria-invalid={Boolean(errors.price)}
                    placeholder="0 = free"
                    onChange={(e) => set("price", e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </div>
                {errors.price ? <p className="a-error">{errors.price}</p> : <p className="a-hint">Leave 0 for a free course.</p>}
              </div>
              <TextField id="price_label" label="Price suffix" value={values.price_label ?? ""} disabled={disabled} placeholder="lifetime" hint="Shown as $25/lifetime" onChange={(v) => set("price_label", v)} />
              <div className="a-field">
                <label className="a-label" htmlFor="students_count">
                  Students
                </label>
                <input
                  id="students_count"
                  type="number"
                  min={0}
                  className="a-input"
                  value={values.students_count}
                  disabled={disabled}
                  aria-invalid={Boolean(errors.students_count)}
                  onChange={(e) => set("students_count", e.target.value === "" ? "" : Number(e.target.value))}
                />
                {errors.students_count ? <p className="a-error">{errors.students_count}</p> : <p className="a-hint">Shown in the page hero.</p>}
              </div>
            </div>
          </Section>

          {/* Creator */}
          <Section id="creator" register={register} icon={UserRound} title="Creator" sub="Shown under the title and in the side card." glow={glow}>
            <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
              <div className="a-field">
                <span className="a-label">Avatar</span>
                <ImageUpload value={values.creator.avatar ?? ""} onChange={(url) => setCreator({ avatar: url })} aspect="1/1" hint="Square image" invalid={Boolean(errors["creator.avatar"])} />
                {errors["creator.avatar"] && <p className="a-error">{errors["creator.avatar"]}</p>}
              </div>
              <div className="flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField id="creator_name" label="Name" required value={values.creator.name} error={errors["creator.name"]} disabled={disabled} placeholder="PurePearl Studio" onChange={(v) => setCreator({ name: v })} />
                  <TextField id="creator_title" label="Title" value={values.creator.title ?? ""} disabled={disabled} placeholder="Professional Creator" onChange={(v) => setCreator({ title: v })} />
                </div>
                <TextArea id="creator_bio" label="Short pitch" value={values.creator.bio ?? ""} disabled={disabled} placeholder="Ready to Dive In? Enroll Now and Start Building Your Digital Future!" onChange={(v) => setCreator({ bio: v })} />
              </div>
            </div>
          </Section>
        </div>

        {/* ── Side column ───────────────────────────────────── */}
        <aside className="flex flex-col gap-4 xl:sticky xl:top-0">
          <div className="a-card a-card--pad">
            <div className="flex items-center justify-between">
              <p className="a-section__title">Publishing</p>
              <span className="text-[0.74rem] font-semibold tabular-nums" style={{ color: completeness === 100 ? "var(--a-signal)" : "var(--a-text-2)" }}>
                {completeness}% ready
              </span>
            </div>
            <div className="a-bar mt-3">
              <span style={{ width: `${completeness}%` }} />
            </div>
            <ul className="mt-4 flex flex-col gap-1">
              {checklist.map((item) => (
                <li key={item.label}>
                  <button
                    type="button"
                    onClick={() => scrollTo(item.section)}
                    className="flex w-full items-center gap-2.5 rounded-[8px] px-2 py-1.5 text-left text-[0.8rem] transition-colors hover:bg-[var(--a-panel-2)]"
                    style={{ color: item.done ? "var(--a-text-2)" : "var(--a-text-3)" }}
                  >
                    <span
                      className="grid h-4.5 w-4.5 shrink-0 place-items-center rounded-full"
                      style={{
                        background: item.done ? "var(--a-signal-tint)" : "transparent",
                        border: item.done ? "none" : "1px dashed var(--a-line-strong)",
                        color: "var(--a-signal)",
                        width: 18,
                        height: 18,
                      }}
                    >
                      {item.done && <Check size={11} />}
                    </span>
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-center justify-between gap-3 rounded-[10px] px-3 py-2.5" style={{ background: "var(--a-surface)", border: "1px solid var(--a-line)" }}>
              <span className="flex flex-col">
                <span className="text-[0.8rem] font-semibold text-white">Featured</span>
                <span className="a-hint">Listed first under “Featured”.</span>
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={values.is_featured}
                aria-label="Featured"
                onClick={() => set("is_featured", !values.is_featured)}
                className="switch"
                data-on={values.is_featured}
                disabled={disabled}
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" className="a-btn a-btn--ghost" onClick={() => save("draft")} disabled={disabled}>
                {saving === "draft" ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Draft
              </button>
              <button type="button" className="a-btn a-btn--primary" onClick={() => save("published")} disabled={disabled}>
                {saving === "published" ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Publish
              </button>
            </div>
          </div>

          <div className="a-card a-card--pad">
            <p className="a-section__title mb-3">Card preview</p>
            <div className="pointer-events-none rounded-[18px] bg-white p-1.5">
              <CoursesCard course={preview} />
            </div>
            {selectedCategory && (
              <p className="a-hint mt-2.5">
                Listed under <strong className="text-white">{selectedCategory.name}</strong>
              </p>
            )}
          </div>

          <nav className="a-card p-2" aria-label="Form sections">
            {SECTIONS.map((s) => {
              const hasErr = Object.keys(errors).some((k) => sectionOf(k) === s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => scrollTo(s.id)}
                  className="flex w-full items-center gap-2.5 rounded-[9px] px-3 py-2 text-left text-[0.8rem] transition-colors hover:bg-[var(--a-panel-2)]"
                  style={{ color: hasErr ? "#ff8a8d" : "var(--a-text-2)" }}
                >
                  <s.icon size={15} style={{ color: hasErr ? "#ff8a8d" : "var(--a-text-3)" }} />
                  {s.title}
                  {hasErr && <CircleAlert size={13} className="ml-auto" />}
                </button>
              );
            })}
          </nav>
        </aside>
      </div>
    </div>
  );
}

/* ── Small building blocks ───────────────────────────────────────────── */

function Section({
  id,
  register,
  icon: Icon,
  title,
  sub,
  glow = 0,
  children,
}: {
  id: SectionId;
  register: (id: SectionId, el: HTMLElement | null) => void;
  icon: LucideIcon;
  title: string;
  sub?: string;
  glow?: number;
  children: React.ReactNode;
}) {
  return (
    <section
      // Re-keying on each auto-fill replays the highlight animation.
      key={glow}
      ref={(el) => {
        register(id, el);
      }}
      className={`a-card a-section ${glow ? "a-magic-glow" : ""}`}
      aria-labelledby={`sec-${id}`}
    >
      <header className="a-section__head">
        <span className="a-section__icon">
          <Icon size={17} />
        </span>
        <div>
          <h2 id={`sec-${id}`} className="a-section__title">
            {title}
          </h2>
          {sub && <p className="a-section__sub">{sub}</p>}
        </div>
      </header>
      <div className="a-section__body">{children}</div>
    </section>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  required,
  placeholder,
  max,
  span,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  placeholder?: string;
  max?: number;
  span?: 2;
  disabled?: boolean;
}) {
  return (
    <div className={`a-field ${span === 2 ? "sm:col-span-2" : ""}`}>
      <label className="a-label flex justify-between" htmlFor={id}>
        <span>
          {label}
          {required && <span className="req">*</span>}
        </span>
        {max && (
          <span className="font-normal tabular-nums" style={{ color: value.length > max ? "#ff8a8d" : "var(--a-text-3)" }}>
            {value.length}/{max}
          </span>
        )}
      </label>
      <input
        id={id}
        className="a-input"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        onChange={(e) => onChange(e.target.value)}
      />
      {error ? <p className="a-error">{error}</p> : hint ? <p className="a-hint a-clamp-1">{hint}</p> : null}
    </div>
  );
}

function TextArea({
  id,
  label,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div className="a-field">
      <label className="a-label" htmlFor={id}>
        {label}
      </label>
      <textarea id={id} className="a-textarea !min-h-[80px]" rows={3} value={value} disabled={disabled} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
