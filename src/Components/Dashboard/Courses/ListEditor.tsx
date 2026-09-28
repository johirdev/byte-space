"use client";

import { useState, type KeyboardEvent } from "react";
import { CircleCheck, Plus, X } from "lucide-react";

/** Ordered list of short strings (key points), one input per row. */
export default function ListEditor({
  values,
  onChange,
  placeholder,
  max = 20,
  invalid,
  disabled,
}: {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  max?: number;
  invalid?: boolean;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const text = draft.trim();
    if (!text || values.length >= max) return;
    onChange([...values, text]);
    setDraft("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      add();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {values.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {values.map((value, i) => (
            <li key={i} className="flex items-center gap-2">
              <CircleCheck size={16} className="shrink-0" style={{ color: "var(--a-brand)" }} aria-hidden="true" />
              <input
                className="a-input !py-2"
                value={value}
                disabled={disabled}
                aria-label={`Item ${i + 1}`}
                onChange={(e) => onChange(values.map((v, idx) => (idx === i ? e.target.value : v)))}
              />
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(values.filter((_, idx) => idx !== i))}
                aria-label={`Remove item ${i + 1}`}
                className="a-btn a-btn--danger a-btn--icon !h-8 !w-8 shrink-0"
              >
                <X size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {values.length < max && (
        <div className="flex gap-2">
          <input
            className="a-input"
            value={draft}
            disabled={disabled}
            aria-invalid={invalid}
            placeholder={placeholder ?? "Type and press Enter"}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <button type="button" onClick={add} disabled={disabled || !draft.trim()} className="a-btn a-btn--ghost shrink-0">
            <Plus size={15} /> Add
          </button>
        </div>
      )}
      <p className="a-hint">
        {values.length}/{max}
      </p>
    </div>
  );
}
