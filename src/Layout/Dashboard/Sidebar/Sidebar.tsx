"use client";

import { useContext } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  BadgeCheck,
  BookOpen,
  Inbox,
  ExternalLink,
  FolderTree,
  GraduationCap,
  HelpCircle,
  Receipt,
  UsersRound,
  LayoutDashboard,
  LogOut,
  MessageSquareQuote,
  Plus,
  Quote,
  ShieldCheck,
  UserCog,
  X,
  type LucideIcon,
} from "lucide-react";
import { AuthContext } from "@/app/dashboard/AuthProvider";
import type { AdminRole } from "@/app/types";
import { CONTENT_EDITORS } from "@/app/lib/roles";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Omit to allow every panel role. */
  roles?: AdminRole[];
};

type NavGroup = { title: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Courses",
    items: [
      { label: "All courses", href: "/dashboard/courses", icon: BookOpen },
      { label: "Add course", href: "/dashboard/courses/create", icon: Plus, roles: CONTENT_EDITORS },
      { label: "Categories", href: "/dashboard/course-categories", icon: FolderTree },
      { label: "Reviews", href: "/dashboard/course-reviews", icon: MessageSquareQuote },
    ],
  },
  {
    title: "Site content",
    items: [
      { label: "Testimonials", href: "/dashboard/testimonials", icon: Quote },
      { label: "FAQs", href: "/dashboard/faqs", icon: HelpCircle },
    ],
  },
  {
    title: "Creators",
    items: [
      { label: "Creator requests", href: "/dashboard/creator-requests", icon: Inbox },
      { label: "Verified creators", href: "/dashboard/creators", icon: BadgeCheck },
    ],
  },
  {
    title: "Students & sales",
    items: [
      { label: "Students", href: "/dashboard/students", icon: UsersRound },
      { label: "Orders", href: "/dashboard/orders", icon: Receipt },
      { label: "Enrollments", href: "/dashboard/enrollments", icon: GraduationCap },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "My account", href: "/dashboard/account", icon: UserCog },
      {
        label: "Admin management",
        href: "/dashboard/all-admin",
        icon: ShieldCheck,
        roles: ["superadmin"],
      },
    ],
  },
];

const ALL_HREFS = NAV.flatMap((g) => g.items.map((i) => i.href));

/**
 * The most specific nav entry that prefixes the current path wins, so
 * /dashboard/courses/create highlights "Add course", not "All courses".
 */
const activeHref = (pathname: string) =>
  ALL_HREFS.filter((href) =>
    href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`),
  ).sort((a, b) => b.length - a.length)[0];

export default function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { adminData, logOut } = useContext(AuthContext);
  const role = adminData?.role;
  const current = activeHref(pathname);

  return (
    <>
      {/* Mobile scrim */}
      {isOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          width: "var(--a-sidebar-w)",
          background:
            "radial-gradient(120% 60% at 0% 0%, rgba(124,92,255,.10), transparent 60%), var(--a-surface)",
          borderRight: "1px solid var(--a-line)",
        }}
      >
        {/* Brand */}
        <div
          className="flex h-[var(--a-topbar-h)] shrink-0 items-center justify-between px-5"
          style={{ borderBottom: "1px solid var(--a-line)" }}
        >
          <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onClose}>
            <Image src="/logo.png" alt="" width={26} height={29} className="h-7 w-auto" />
            <span className="flex flex-col leading-none">
              <span className="font-heading text-[0.95rem] font-bold text-white">ByteSpace</span>
              <span className="mt-1 text-[0.64rem] font-semibold tracking-[0.12em] uppercase" style={{ color: "var(--a-text-3)" }}>
                Admin panel
              </span>
            </span>
          </Link>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="a-btn a-btn--ghost a-btn--icon lg:hidden"
          >
            <X size={17} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV.map((group) => {
            const items = group.items.filter(
              (item) => !item.roles || (role && item.roles.includes(role)),
            );
            if (!items.length) return null;

            return (
              <div key={group.title} className="mb-5 last:mb-0">
                <p
                  className="mb-2 px-3 text-[0.64rem] font-bold tracking-[0.14em] uppercase"
                  style={{ color: "var(--a-text-3)" }}
                >
                  {group.title}
                </p>

                <ul className="flex flex-col gap-0.5">
                  {items.map((item) => {
                    const active = item.href === current;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          aria-current={active ? "page" : undefined}
                          className="group relative flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[0.845rem] font-medium transition-colors hover:bg-[var(--a-panel-2)]"
                          style={{
                            background: active ? "var(--a-brand-tint)" : undefined,
                            color: active ? "#fff" : "var(--a-text-2)",
                            boxShadow: active ? "inset 0 0 0 1px rgba(124,92,255,.26)" : undefined,
                          }}
                        >
                          {active && (
                            <span
                              className="absolute top-1/2 -left-3 h-5 w-[3px] -translate-y-1/2 rounded-r-full"
                              style={{ background: "var(--a-brand)" }}
                              aria-hidden="true"
                            />
                          )}
                          <item.icon
                            size={17}
                            strokeWidth={1.8}
                            style={{ color: active ? "var(--a-brand)" : "var(--a-text-3)" }}
                          />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="flex flex-col gap-1 px-3 pt-3 pb-4" style={{ borderTop: "1px solid var(--a-line)" }}>
          <a
            href="/courses"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[0.82rem] font-medium transition-colors hover:bg-[var(--a-panel-2)]"
            style={{ color: "var(--a-text-2)" }}
          >
            <ExternalLink size={16} strokeWidth={1.8} style={{ color: "var(--a-text-3)" }} />
            View live courses
          </a>

          {adminData && (
            <div className="mt-2 flex items-center gap-2.5 rounded-[12px] p-2.5" style={{ background: "var(--a-panel)" }}>
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[0.8rem] font-bold text-white"
                style={{ background: "linear-gradient(135deg,#8f6dff,#6234e8)" }}
              >
                {adminData.name?.trim()?.[0]?.toUpperCase() ?? "A"}
              </span>
              <span className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="a-clamp-1 text-[0.8rem] font-semibold text-white">{adminData.name}</span>
                <span className="text-[0.68rem] capitalize" style={{ color: "var(--a-text-3)" }}>
                  {adminData.role}
                </span>
              </span>
              <button
                type="button"
                onClick={logOut}
                aria-label="Sign out"
                title="Sign out"
                className="a-btn a-btn--ghost a-btn--icon shrink-0"
              >
                <LogOut size={15} />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
