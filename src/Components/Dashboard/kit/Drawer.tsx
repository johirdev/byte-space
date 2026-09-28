"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

/**
 * Right-hand editing drawer. Locks page scroll, closes on Escape, and keeps
 * its footer pinned so the save button is always reachable in long forms.
 */
export default function Drawer({
  open,
  title,
  description,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="a-drawer-backdrop" onClick={onClose} aria-hidden="true" />

      <aside
        className="a-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header
          className="flex shrink-0 items-start justify-between gap-4 px-6 py-5"
          style={{ borderBottom: "1px solid var(--a-line)" }}
        >
          <div>
            <h2 className="a-page-head__title !text-[1.1rem]">{title}</h2>
            {description && <p className="a-page-head__sub !mt-1">{description}</p>}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="a-btn a-btn--ghost a-btn--icon shrink-0"
          >
            <X size={17} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <footer
            className="flex shrink-0 items-center justify-end gap-2.5 px-6 py-4"
            style={{ borderTop: "1px solid var(--a-line)", background: "var(--a-panel)" }}
          >
            {footer}
          </footer>
        )}
      </aside>
    </>
  );
}
