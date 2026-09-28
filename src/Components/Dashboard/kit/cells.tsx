import Image from "next/image";
import { Check, ImageOff, Star, X } from "lucide-react";

/** Small, reusable table-cell renderers shared by the management screens. */

export function Thumb({ src, alt = "" }: { src?: string; alt?: string }) {
  if (!src) {
    return (
      <span
        className="grid h-10 w-14 place-items-center rounded-[8px] border"
        style={{ borderColor: "var(--a-line)", background: "var(--a-panel-2)" }}
        aria-hidden="true"
      >
        <ImageOff size={14} style={{ color: "var(--a-text-3)" }} />
      </span>
    );
  }

  return (
    <span className="relative block h-10 w-14 overflow-hidden rounded-[8px]">
      {/* `unoptimized` because these are arbitrary admin-entered URLs. */}
      <Image src={src} alt={alt} fill sizes="56px" className="object-cover" unoptimized />
    </span>
  );
}

export function Avatar({ src, name }: { src?: string; name: string }) {
  return (
    <span className="flex items-center gap-2.5">
      {src ? (
        <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full">
          <Image src={src} alt={name} fill sizes="32px" className="object-cover" unoptimized />
        </span>
      ) : (
        <span
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[0.72rem] font-bold text-white"
          style={{ background: "linear-gradient(135deg,#8f6dff,#6234e8)" }}
        >
          {name.trim()[0]?.toUpperCase() ?? "?"}
        </span>
      )}
      <span className="a-strong a-clamp-1">{name}</span>
    </span>
  );
}

export function Truncate({ text, lines = 1 }: { text?: string; lines?: 1 | 2 }) {
  if (!text) return <span style={{ color: "var(--a-text-3)" }}>—</span>;
  return (
    <span className={lines === 2 ? "a-clamp-2" : "a-clamp-1"} title={text}>
      {text}
    </span>
  );
}

export function BoolPill({ value, on = "Live", off = "Hidden" }: {
  value?: boolean;
  on?: string;
  off?: string;
}) {
  const active = value !== false;
  return (
    <span className={`a-badge ${active ? "a-badge--signal" : "a-badge--muted"}`}>
      {active ? <Check size={11} /> : <X size={11} />}
      {active ? on : off}
    </span>
  );
}

export function Rating({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      <Star size={13} className="fill-current" style={{ color: "var(--a-ember)" }} />
      <span className="a-strong">{value}.0</span>
    </span>
  );
}

export function DateCell({ value }: { value?: string | Date | null }) {
  if (!value) return <span style={{ color: "var(--a-text-3)" }}>—</span>;
  return (
    <span className="whitespace-nowrap">
      {new Date(value).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })}
    </span>
  );
}

export function TagList({ items, max = 2 }: { items?: string[]; max?: number }) {
  if (!items?.length) return <span style={{ color: "var(--a-text-3)" }}>—</span>;

  return (
    <span className="flex flex-wrap gap-1">
      {items.slice(0, max).map((item) => (
        <span key={item} className="a-badge a-badge--muted">
          {item}
        </span>
      ))}
      {items.length > max && (
        <span className="a-badge a-badge--muted">+{items.length - max}</span>
      )}
    </span>
  );
}

export function Money({ amount, currency = "USD" }: { amount?: number; currency?: string }) {
  if (amount === undefined || amount === null) {
    return <span style={{ color: "var(--a-text-3)" }}>—</span>;
  }
  const symbol = { USD: "$", EUR: "€", GBP: "£", BDT: "৳" }[currency] ?? "$";
  return (
    <span className="a-strong whitespace-nowrap">
      {symbol}
      {amount.toLocaleString()}
    </span>
  );
}
