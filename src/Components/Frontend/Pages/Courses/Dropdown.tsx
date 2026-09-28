"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";

export type DropdownOption = { value: string; label: string };

/**
 * Pill-shaped trigger with a listbox popover. Closes on outside click and
 * Escape; `align` picks which edge the menu hangs from.
 */
export default function Dropdown({
  label,
  icon,
  options,
  value,
  onChange,
  align = "left",
  variant = "outline",
  showChevron = false,
  children,
}: {
  label: string;
  icon?: ReactNode;
  options?: DropdownOption[];
  value?: string;
  onChange?: (value: string) => void;
  align?: "left" | "right";
  variant?: "outline" | "lime";
  showChevron?: boolean;
  /** Custom panel content instead of an option list. */
  children?: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const active = Boolean(value);
  const trigger =
    variant === "lime"
      ? "h-[46px] bg-secondary-400 px-5 text-neutral-950 hover:bg-secondary-300"
      : `h-10 border px-4 text-neutral-700 hover:border-neutral-300 ${
          active ? "border-primary-600 bg-primary-50 text-primary-700" : "border-neutral-200 bg-white"
        }`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={menuId}
        className={`inline-flex cursor-pointer items-center gap-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${trigger}`}
      >
        {icon}
        {label}
        {(showChevron || variant === "lime") && (
          <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
        )}
      </button>

      {open && (
        <div
          id={menuId}
          className={`absolute top-[calc(100%+8px)] z-40 max-h-80 min-w-56 overflow-y-auto rounded-2xl border border-neutral-100 bg-white p-1.5 text-left shadow-card-hover ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {children ? (
            children(() => setOpen(false))
          ) : (
            <ul role="listbox" aria-label={label}>
              {options?.map((option) => {
                const selected = option.value === (value ?? "");
                return (
                  <li key={option.value || "all"} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange?.(option.value);
                        setOpen(false);
                      }}
                      className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-neutral-50 ${
                        selected ? "font-medium text-primary-600" : "text-neutral-700"
                      }`}
                    >
                      {option.label}
                      {selected && <Check className="size-4" aria-hidden="true" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
