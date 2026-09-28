import { ChevronLeft, ChevronRight } from "lucide-react";

/** Page numbers with ellipses: 1 … 4 5 6 … 12 */
const pagesFor = (page: number, total: number): (number | "…")[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(total - 1, page + 1);
  if (start > 2) pages.push("…");
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < total - 1) pages.push("…");
  pages.push(total);
  return pages;
};

export default function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const arrow =
    "grid size-10 cursor-pointer place-items-center rounded-full border border-neutral-200 text-neutral-950 transition-colors hover:border-neutral-950 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-neutral-200";

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-2 sm:gap-3">
      <button
        type="button"
        className={arrow}
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="size-5" />
      </button>

      <ul className="flex items-center gap-1">
        {pagesFor(page, totalPages).map((p, i) =>
          p === "…" ? (
            <li key={`gap-${i}`} className="px-1 text-neutral-400">
              …
            </li>
          ) : (
            <li key={p}>
              <button
                type="button"
                onClick={() => onChange(p)}
                aria-current={p === page ? "page" : undefined}
                className={`grid size-8 cursor-pointer place-items-center rounded-full text-base transition-colors ${
                  p === page ? "text-neutral-300" : "font-medium text-neutral-950 hover:bg-neutral-50"
                }`}
              >
                {p}
              </button>
            </li>
          ),
        )}
      </ul>

      <button
        type="button"
        className={arrow}
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        <ChevronRight className="size-5" />
      </button>
    </nav>
  );
}
