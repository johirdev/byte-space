"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  GripVertical,
  ListVideo,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import type { ICourseLesson, ICourseModule } from "@/app/types";
import { formatDuration } from "@/Components/Frontend/utils/course";

type Errors = Record<string, string>;

const emptyLesson = (): ICourseLesson => ({ title: "", duration: 10, is_preview: false });
const emptyModule = (n: number): ICourseModule => ({
  title: `Module ${n}: `,
  description: "",
  lessons: [emptyLesson()],
});

const move = <T,>(list: T[], from: number, to: number): T[] => {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
};

/**
 * Modules → lessons editor. Errors use the same keys the API returns
 * (`modules.2.lessons.0.title`), so server validation lands on the right row.
 */
export default function CurriculumBuilder({
  modules,
  onChange,
  errors,
  disabled,
}: {
  modules: ICourseModule[];
  onChange: (modules: ICourseModule[]) => void;
  errors: Errors;
  disabled?: boolean;
}) {
  // Collapsed state is by index; new modules start open.
  const [collapsed, setCollapsed] = useState<number[]>([]);

  const lessons = modules.flatMap((m) => m.lessons);
  const totalMinutes = lessons.reduce((s, l) => s + (Number(l.duration) || 0), 0);

  const updateModule = (i: number, patch: Partial<ICourseModule>) =>
    onChange(modules.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));

  const updateLesson = (mi: number, li: number, patch: Partial<ICourseLesson>) =>
    updateModule(mi, {
      lessons: modules[mi].lessons.map((l, idx) => (idx === li ? { ...l, ...patch } : l)),
    });

  const toggle = (i: number) =>
    setCollapsed((c) => (c.includes(i) ? c.filter((x) => x !== i) : [...c, i]));

  return (
    <div className="flex flex-col gap-3">
      {/* Summary strip */}
      <div
        className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-[10px] px-3.5 py-2.5 text-[0.78rem]"
        style={{ background: "var(--a-surface)", border: "1px solid var(--a-line)", color: "var(--a-text-2)" }}
      >
        <span>
          <strong className="text-white">{modules.length}</strong> modules
        </span>
        <span>
          <strong className="text-white">{lessons.length}</strong> lessons
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock size={13} /> <strong className="text-white">{formatDuration(totalMinutes)}</strong>
        </span>
        {modules.length > 1 && (
          <button
            type="button"
            className="ml-auto text-[0.74rem] font-semibold hover:text-white"
            onClick={() => setCollapsed(collapsed.length === modules.length ? [] : modules.map((_, i) => i))}
          >
            {collapsed.length === modules.length ? "Expand all" : "Collapse all"}
          </button>
        )}
      </div>

      {errors.modules && <p className="a-error">{errors.modules}</p>}

      {modules.map((mod, mi) => {
        const isCollapsed = collapsed.includes(mi);
        const minutes = mod.lessons.reduce((s, l) => s + (Number(l.duration) || 0), 0);
        const moduleHasError = Object.keys(errors).some((k) => k.startsWith(`modules.${mi}.`));

        return (
          <div
            key={mi}
            className="overflow-hidden rounded-[12px] border"
            style={{
              borderColor: moduleHasError ? "rgba(245,72,76,.45)" : "var(--a-line)",
              background: "var(--a-surface)",
            }}
          >
            {/* Module header */}
            <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: isCollapsed ? undefined : "1px solid var(--a-line)" }}>
              <GripVertical size={15} style={{ color: "var(--a-text-3)" }} aria-hidden="true" />
              <span className="a-badge a-badge--brand">#{mi + 1}</span>
              <button
                type="button"
                onClick={() => toggle(mi)}
                className="a-clamp-1 flex-1 text-left text-[0.84rem] font-semibold text-white"
                aria-expanded={!isCollapsed}
              >
                {mod.title.trim() || "Untitled module"}
                <span className="ml-2 text-[0.72rem] font-normal" style={{ color: "var(--a-text-3)" }}>
                  {mod.lessons.length} lessons · {formatDuration(minutes)}
                </span>
              </button>
              <div className="flex shrink-0 items-center gap-1">
                <IconBtn label="Move up" onClick={() => onChange(move(modules, mi, mi - 1))} disabled={disabled || mi === 0}>
                  <ChevronUp size={14} />
                </IconBtn>
                <IconBtn label="Move down" onClick={() => onChange(move(modules, mi, mi + 1))} disabled={disabled || mi === modules.length - 1}>
                  <ChevronDown size={14} />
                </IconBtn>
                <IconBtn
                  label="Duplicate module"
                  disabled={disabled}
                  onClick={() => {
                    const copy = structuredClone(mod);
                    onChange([...modules.slice(0, mi + 1), copy, ...modules.slice(mi + 1)]);
                  }}
                >
                  <Copy size={13} />
                </IconBtn>
                <IconBtn label="Delete module" danger disabled={disabled} onClick={() => onChange(modules.filter((_, i) => i !== mi))}>
                  <Trash2 size={13} />
                </IconBtn>
              </div>
            </div>

            {!isCollapsed && (
              <div className="flex flex-col gap-3 p-3.5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="a-field">
                    <label className="a-label" htmlFor={`m-${mi}-title`}>
                      Module title<span className="req">*</span>
                    </label>
                    <input
                      id={`m-${mi}-title`}
                      className="a-input"
                      value={mod.title}
                      disabled={disabled}
                      aria-invalid={Boolean(errors[`modules.${mi}.title`])}
                      onChange={(e) => updateModule(mi, { title: e.target.value })}
                      placeholder="Module 1: Introduction"
                    />
                    {errors[`modules.${mi}.title`] && <p className="a-error">{errors[`modules.${mi}.title`]}</p>}
                  </div>
                  <div className="a-field">
                    <label className="a-label" htmlFor={`m-${mi}-desc`}>
                      Short description
                    </label>
                    <input
                      id={`m-${mi}-desc`}
                      className="a-input"
                      value={mod.description ?? ""}
                      disabled={disabled}
                      onChange={(e) => updateModule(mi, { description: e.target.value })}
                      placeholder="Shown under the module on the Lessons tab"
                    />
                  </div>
                </div>

                {/* Lessons */}
                <div className="flex flex-col gap-2">
                  <p className="a-label">Lessons</p>
                  {mod.lessons.length === 0 && (
                    <p className="a-hint">No lessons yet — add at least one.</p>
                  )}
                  {mod.lessons.map((lesson, li) => {
                    const titleErr = errors[`modules.${mi}.lessons.${li}.title`];
                    const durErr = errors[`modules.${mi}.lessons.${li}.duration`];
                    return (
                      <div key={li} className="flex flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                          <span className="w-6 shrink-0 text-center text-[0.72rem] font-semibold" style={{ color: "var(--a-text-3)" }}>
                            {String(li + 1).padStart(2, "0")}
                          </span>
                          <input
                            className="a-input min-w-0 flex-1"
                            value={lesson.title}
                            disabled={disabled}
                            aria-label={`Lesson ${li + 1} title`}
                            aria-invalid={Boolean(titleErr)}
                            onChange={(e) => updateLesson(mi, li, { title: e.target.value })}
                            placeholder="Lesson title"
                          />
                          <div className="relative w-[104px] shrink-0">
                            <input
                              type="number"
                              min={0}
                              max={600}
                              className="a-input !pr-11"
                              value={lesson.duration}
                              disabled={disabled}
                              aria-label={`Lesson ${li + 1} duration in minutes`}
                              aria-invalid={Boolean(durErr)}
                              onChange={(e) => updateLesson(mi, li, { duration: Math.max(0, Number(e.target.value) || 0) })}
                            />
                            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[0.72rem]" style={{ color: "var(--a-text-3)" }}>
                              min
                            </span>
                          </div>
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => updateLesson(mi, li, { is_preview: !lesson.is_preview })}
                            className={`a-badge shrink-0 cursor-pointer ${lesson.is_preview ? "a-badge--sky" : "a-badge--muted"}`}
                            aria-pressed={Boolean(lesson.is_preview)}
                            title="Free preview lesson"
                          >
                            Preview
                          </button>
                          <IconBtn
                            label="Remove lesson"
                            danger
                            disabled={disabled}
                            onClick={() => updateModule(mi, { lessons: mod.lessons.filter((_, i) => i !== li) })}
                          >
                            <X size={13} />
                          </IconBtn>
                        </div>
                        {(titleErr || durErr) && <p className="a-error pl-8">{titleErr ?? durErr}</p>}
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => updateModule(mi, { lessons: [...mod.lessons, emptyLesson()] })}
                    className="a-btn a-btn--ghost a-btn--sm self-start"
                  >
                    <Plus size={13} /> Add lesson
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange([...modules, emptyModule(modules.length + 1)])}
        className="flex items-center justify-center gap-2 rounded-[12px] border border-dashed py-3.5 text-[0.84rem] font-semibold transition-colors hover:bg-[var(--a-panel-2)]"
        style={{ borderColor: "var(--a-line-strong)", color: "var(--a-text-2)" }}
      >
        <ListVideo size={16} style={{ color: "var(--a-brand)" }} /> Add module
      </button>
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`a-btn a-btn--icon !h-7 !w-7 shrink-0 ${danger ? "a-btn--danger" : "a-btn--ghost"}`}
    >
      {children}
    </button>
  );
}
