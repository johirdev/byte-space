"use client";

import { useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LogOut, Menu, Settings, UserRound } from "lucide-react";
import { AuthContext } from "@/app/dashboard/AuthProvider";
import type { AdminRole } from "@/app/types";

const ROLE_LABEL: Record<AdminRole, { text: string; className: string }> = {
  superadmin: { text: "Superadmin", className: "a-badge--brand" },
  admin: { text: "Admin", className: "a-badge--sky" },
  editor: { text: "Editor", className: "a-badge--signal" },
  viewOnly: { text: "View only", className: "a-badge--muted" },
};

export default function Navbar({ onMenuToggle }: { onMenuToggle: () => void }) {
  const { adminData, logOut } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Dismiss the account menu on outside click or Escape.
  useEffect(() => {
    if (!open) return;

    const onPointer = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const role = adminData?.role ?? "viewOnly";
  const badge = ROLE_LABEL[role];
  const initial = adminData?.name?.trim()?.[0]?.toUpperCase() ?? "A";

  return (
    <header
      className="flex shrink-0 items-center justify-between gap-4 px-4 md:px-6"
      style={{
        height: "var(--a-topbar-h)",
        background: "var(--a-surface)",
        borderBottom: "1px solid var(--a-line)",
      }}
    >
      <div className="flex  items-center gap-3">
        <span className="md:hidden">
          <button
            type="button"
            onClick={onMenuToggle}
            aria-label="Toggle navigation"
            className="a-btn a-btn--ghost a-btn--icon lg:hidden"
          >
            <Menu size={18} />
          </button>
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className={`a-badge ${badge.className} hidden sm:inline-flex`}>
          {badge.text}
        </span>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-haspopup="menu"
            className="flex items-center gap-2.5 rounded-[10px] py-1.5 pl-1.5 pr-2.5 transition-colors hover:bg-[var(--a-panel-2)]"
          >
            <span
              className="grid h-8 w-8 place-items-center rounded-full text-[0.8rem] font-bold text-white"
              style={{ background: "linear-gradient(135deg,#8f6dff,#6234e8)" }}
            >
              {initial}
            </span>
            <span className="hidden flex-col items-start leading-tight md:flex">
              <span className="text-[0.8rem] font-semibold text-white">
                {adminData?.name}
              </span>
              <span
                className="text-[0.7rem]"
                style={{ color: "var(--a-text-3)" }}
              >
                {adminData?.email}
              </span>
            </span>
            <ChevronDown
              size={15}
              style={{ color: "var(--a-text-3)" }}
              className={`transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>

          {open && (
            <div
              role="menu"
              className="a-card absolute right-0 top-[calc(100%+8px)] z-50 w-56 overflow-hidden !rounded-[12px] p-1.5 shadow-2xl"
            >
              <div className="px-3 py-2.5 md:hidden">
                <p className="text-[0.82rem] font-semibold text-white">
                  {adminData?.name}
                </p>
                <p
                  className="text-[0.72rem]"
                  style={{ color: "var(--a-text-3)" }}
                >
                  {adminData?.email}
                </p>
              </div>

              <Link
                href="/admins/account"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-[9px] px-3 py-2.5 text-[0.83rem] transition-colors hover:bg-[var(--a-hover)]"
                style={{ color: "var(--a-text-2)" }}
              >
                <UserRound size={16} />
                My account
              </Link>

              <Link
                href="/admins/profile"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-[9px] px-3 py-2.5 text-[0.83rem] transition-colors hover:bg-[var(--a-hover)]"
                style={{ color: "var(--a-text-2)" }}
              >
                <Settings size={16} />
                Site profile
              </Link>

              <hr
                className="my-1.5 border-0"
                style={{ borderTop: "1px solid var(--a-line)" }}
              />

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  logOut();
                }}
                className="flex w-full items-center gap-2.5 rounded-[9px] px-3 py-2.5 text-[0.83rem] transition-colors hover:bg-[var(--a-coral-tint)]"
                style={{ color: "#ff8a8d" }}
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
