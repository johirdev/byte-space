import { Star } from "lucide-react";

/** Read-only star row. `value` may be fractional; it is rounded to the nearest star. */
export default function Stars({
  value,
  size = "size-4",
  filled = "fill-neutral-700 text-neutral-700",
  empty = "fill-neutral-200 text-neutral-200",
  label = true,
}: {
  value: number;
  size?: string;
  filled?: string;
  empty?: string;
  label?: boolean;
}) {
  const rounded = Math.round(value);
  return (
    <span
      className="inline-flex items-center gap-1"
      role={label ? "img" : undefined}
      aria-label={label ? `${value} out of 5 stars` : undefined}
      aria-hidden={label ? undefined : true}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`${size} ${i < rounded ? filled : empty}`} aria-hidden="true" />
      ))}
    </span>
  );
}
