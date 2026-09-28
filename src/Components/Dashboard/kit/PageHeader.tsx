import type { ReactNode } from "react";

export default function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="a-page-head">
      <div>
        <h1 className="a-page-head__title">{title}</h1>
        {description && <p className="a-page-head__sub">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
  tone = "brand",
  icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "brand" | "signal" | "ember" | "coral" | "sky";
  icon?: ReactNode;
}) {
  const toneVar = {
    brand: ["var(--a-brand-tint)", "var(--a-brand)"],
    signal: ["var(--a-signal-tint)", "var(--a-signal)"],
    ember: ["var(--a-ember-tint)", "var(--a-ember)"],
    coral: ["var(--a-coral-tint)", "#ff8a8d"],
    sky: ["var(--a-sky-tint)", "var(--a-sky)"],
  }[tone];

  return (
    <div className="a-card a-card--pad flex items-start justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        <span
          className="text-[0.72rem] font-semibold uppercase tracking-[0.08em]"
          style={{ color: "var(--a-text-3)" }}
        >
          {label}
        </span>
        <strong className="font-heading text-[1.7rem] font-extrabold leading-none text-white">
          {value}
        </strong>
        {hint && (
          <span className="a-clamp-1 text-[0.74rem]" style={{ color: "var(--a-text-3)" }}>
            {hint}
          </span>
        )}
      </div>

      {icon && (
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-[11px]"
          style={{ background: toneVar[0], color: toneVar[1] }}
        >
          {icon}
        </span>
      )}
    </div>
  );
}
