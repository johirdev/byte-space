"use client";

import { useState, type KeyboardEvent } from "react";
import Image from "next/image";
import { ImageOff, Plus, X } from "lucide-react";
import type { FieldDef, FormValues, SimpleField } from "./types";

type FieldProps = {
  field: FieldDef;
  value: unknown;
  error?: string;
  onChange: (value: unknown) => void;
};

/** Renders one schema field. Every input is controlled by the parent form. */
export function Field({ field, value, error, onChange }: FieldProps) {
  const id = `f-${field.name}`;
  const invalid = Boolean(error);

  const label = (
    <label className="a-label" htmlFor={id}>
      {field.label}
      {field.required && <span className="req">*</span>}
    </label>
  );

  const footer = (
    <>
      {error && <p className="a-error">{error}</p>}
      {!error && field.hint && <p className="a-hint">{field.hint}</p>}
    </>
  );

  switch (field.type) {
    case "switch":
      return (
        <div className="a-field">
          <div
            className="flex items-center justify-between gap-4 rounded-[10px] border px-3.5 py-3"
            style={{ borderColor: "var(--a-line)", background: "var(--a-surface)" }}
          >
            <span className="flex flex-col gap-0.5">
              <span className="a-label !text-[0.82rem]">{field.label}</span>
              {field.hint && <span className="a-hint">{field.hint}</span>}
            </span>

            <button
              type="button"
              role="switch"
              aria-checked={Boolean(value)}
              aria-label={field.label}
              onClick={() => onChange(!value)}
              className="switch"
              data-on={Boolean(value)}
            />
          </div>
          {error && <p className="a-error">{error}</p>}
        </div>
      );

    case "select":
      return (
        <div className="a-field">
          {label}
          <select
            id={id}
            className="a-select"
            aria-invalid={invalid}
            value={value === undefined || value === null ? "" : String(value)}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">Select…</option>
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {footer}
        </div>
      );

    case "tags":
      return (
        <div className="a-field">
          {label}
          <TagsInput
            id={id}
            values={Array.isArray(value) ? (value as string[]) : []}
            placeholder={field.placeholder}
            onChange={onChange}
          />
          {footer}
        </div>
      );

    case "image":
      return (
        <div className="a-field">
          {label}
          <div className="flex gap-3">
            <ImagePreview src={typeof value === "string" ? value : ""} />
            <input
              id={id}
              type="url"
              className="a-input"
              aria-invalid={invalid}
              placeholder={field.placeholder ?? "https://…"}
              value={typeof value === "string" ? value : ""}
              onChange={(e) => onChange(e.target.value)}
            />
          </div>
          {footer}
        </div>
      );

    case "group":
      return (
        <div className="a-field">
          {label}
          <RepeatableGroup
            fields={field.fields}
            rows={Array.isArray(value) ? (value as FormValues[]) : []}
            addLabel={field.addLabel ?? `Add ${field.label.toLowerCase()}`}
            max={field.max}
            onChange={onChange}
          />
          {footer}
        </div>
      );

    case "textarea":
    case "html":
      return (
        <div className="a-field">
          {label}
          <textarea
            id={id}
            className="a-textarea"
            aria-invalid={invalid}
            rows={field.rows ?? (field.type === "html" ? 16 : 4)}
            placeholder={field.placeholder}
            style={
              field.type === "html"
                ? { fontFamily: "ui-monospace, SFMono-Regular, monospace", fontSize: "0.82rem" }
                : undefined
            }
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
          />
          {footer}
        </div>
      );

    default:
      return (
        <div className="a-field">
          {label}
          <input
            id={id}
            type={field.type === "number" ? "number" : field.type}
            className="a-input"
            aria-invalid={invalid}
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            step={field.step}
            value={
              value === undefined || value === null ? "" : String(value)
            }
            onChange={(e) =>
              onChange(
                field.type === "number"
                  ? e.target.value === ""
                    ? ""
                    : Number(e.target.value)
                  : e.target.value,
              )
            }
          />
          {footer}
        </div>
      );
  }
}

/* ── Tag chips ───────────────────────────────────────────────────────── */
function TagsInput({
  id,
  values,
  placeholder,
  onChange,
}: {
  id: string;
  values: string[];
  placeholder?: string;
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    const tag = draft.trim();
    if (!tag) return;
    if (!values.includes(tag)) onChange([...values, tag]);
    setDraft("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Enter or comma commits; backspace on an empty field removes the last chip.
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && !draft && values.length) {
      onChange(values.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          id={id}
          className="a-input"
          value={draft}
          placeholder={placeholder ?? "Type and press Enter"}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={commit}
        />
        <button
          type="button"
          onClick={commit}
          className="a-btn a-btn--ghost shrink-0"
          disabled={!draft.trim()}
        >
          <Plus size={15} />
          Add
        </button>
      </div>

      {values.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {values.map((tag, i) => (
            <li key={`${tag}-${i}`}>
              <span className="a-badge a-badge--brand !pr-1.5">
                {tag}
                <button
                  type="button"
                  onClick={() => onChange(values.filter((_, idx) => idx !== i))}
                  aria-label={`Remove ${tag}`}
                  className="ml-1 opacity-70 transition-opacity hover:opacity-100"
                >
                  <X size={12} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ── Image preview ───────────────────────────────────────────────────── */
function ImagePreview({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  const usable = /^https?:\/\/|^\//.test(src) && !failed;

  return (
    <span
      className="relative grid h-[42px] w-[56px] shrink-0 place-items-center overflow-hidden rounded-[9px] border"
      style={{ borderColor: "var(--a-line)", background: "var(--a-panel-2)" }}
      aria-hidden="true"
    >
      {usable ? (
        <Image
          src={src}
          alt=""
          fill
          sizes="56px"
          className="object-cover"
          onError={() => setFailed(true)}
          unoptimized
        />
      ) : (
        <ImageOff size={16} style={{ color: "var(--a-text-3)" }} />
      )}
    </span>
  );
}

/* ── Repeatable rows ─────────────────────────────────────────────────── */
function RepeatableGroup({
  fields,
  rows,
  addLabel,
  max,
  onChange,
}: {
  fields: (SimpleField | Extract<FieldDef, { type: "select" }>)[];
  rows: FormValues[];
  addLabel: string;
  max?: number;
  onChange: (next: FormValues[]) => void;
}) {
  const update = (index: number, key: string, value: unknown) => {
    onChange(rows.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((row, index) => (
        <div
          key={index}
          className="relative rounded-[10px] border p-3.5"
          style={{ borderColor: "var(--a-line)", background: "var(--a-surface)" }}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="a-badge a-badge--muted">#{index + 1}</span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label="Move up"
                className="a-btn a-btn--ghost a-btn--icon !h-7 !w-7"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === rows.length - 1}
                aria-label="Move down"
                className="a-btn a-btn--ghost a-btn--icon !h-7 !w-7"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => onChange(rows.filter((_, i) => i !== index))}
                aria-label="Remove row"
                className="a-btn a-btn--danger a-btn--icon !h-7 !w-7"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((sub) => (
              <div key={sub.name} className={sub.span === 2 ? "sm:col-span-2" : ""}>
                <Field
                  field={sub}
                  value={row[sub.name]}
                  onChange={(value) => update(index, sub.name, value)}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...rows, {}])}
        disabled={max !== undefined && rows.length >= max}
        className="a-btn a-btn--ghost self-start"
      >
        <Plus size={15} />
        {addLabel}
      </button>
    </div>
  );
}
