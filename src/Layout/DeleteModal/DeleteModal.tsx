"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";

/**
 * Confirmation dialog for destructive actions. The caller owns the deletion
 * itself — this only asks.
 */
export default function DeleteModal({
  open,
  title = "Delete this item?",
  message = "This cannot be undone.",
  itemName,
  confirmLabel = "Delete",
  busy = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title?: string;
  message?: string;
  itemName?: string;
  confirmLabel?: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <>
      <div
        className="a-drawer-backdrop"
        onClick={() => !busy && onCancel()}
        aria-hidden="true"
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="a-card fixed left-1/2 top-1/2 z-[302] w-[min(420px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 p-6"
        style={{ boxShadow: "0 30px 80px rgba(0,0,0,.6)" }}
      >
        <span
          className="mb-4 grid h-11 w-11 place-items-center rounded-full"
          style={{ background: "var(--a-coral-tint)", color: "#ff8a8d" }}
        >
          <TriangleAlert size={20} />
        </span>

        <h2 className="a-page-head__title !text-[1.05rem]">{title}</h2>

        <p className="a-page-head__sub !mt-2">
          {message}
          {itemName && (
            <>
              {" "}
              <strong style={{ color: "var(--a-text)" }}>{itemName}</strong> will be
              removed from the live site immediately.
            </>
          )}
        </p>

        <div className="mt-6 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="a-btn a-btn--ghost"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="a-btn a-btn--danger"
          >
            {busy ? "Deleting…" : confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}
