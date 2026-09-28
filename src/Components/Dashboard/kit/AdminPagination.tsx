"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ApiMeta } from "@/app/types";

const PAGE_SIZES = [10, 20, 50];

/** "Showing 11–20 of 57" + page buttons + page-size picker. */
export default function AdminPagination({
  meta,
  onPage,
  onLimit,
}: {
  meta?: ApiMeta;
  onPage: (page: number) => void;
  onLimit?: (limit: number) => void;
}) {
  if (!meta || meta.total === 0) return null;

  const { page, limit, total, totalPages } = meta;
  const from = (page - 1) * limit + 1;
  const to = Math.min(total, page * limit);

  const pages: (number | "…")[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) pages.push(p);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[0.8rem]" style={{ color: "var(--a-text-3)" }}>
      <div className="flex items-center gap-3">
        <span>
          Showing <strong className="text-white">{from}–{to}</strong> of{" "}
          <strong className="text-white">{total}</strong>
        </span>
        {onLimit && (
          <select
            className="a-select !w-auto !py-1.5 !text-[0.78rem]"
            value={limit}
            onChange={(e) => onLimit(Number(e.target.value))}
            aria-label="Rows per page"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
        )}
      </div>

      {totalPages > 1 && (
        <nav className="flex items-center gap-1" aria-label="Pagination">
          <button
            type="button"
            className="a-btn a-btn--ghost a-btn--icon"
            onClick={() => onPage(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft size={15} />
          </button>
          {pages.map((p, i) =>
            p === "…" ? (
              <span key={`gap-${i}`} className="px-1.5">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPage(p)}
                aria-current={p === page ? "page" : undefined}
                className={`a-btn a-btn--icon ${p === page ? "a-btn--primary" : "a-btn--ghost"}`}
              >
                {p}
              </button>
            ),
          )}
          <button
            type="button"
            className="a-btn a-btn--ghost a-btn--icon"
            onClick={() => onPage(page + 1)}
            disabled={page >= totalPages}
            aria-label="Next page"
          >
            <ChevronRight size={15} />
          </button>
        </nav>
      )}
    </div>
  );
}
