"use client";

import { useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  ChartNoAxesCombined,
  ExternalLink,
  FileText,
  HelpCircle,
  Inbox,
  LayoutDashboard,
  Layers,
  MessageSquareQuote,
  Tag,
  UserCog,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { AuthContext } from "@/app/dashboard/AuthProvider";
import type { AdminRole } from "@/app/types";

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
    items: [
      { label: "Dashboard", href: "/admins", icon: LayoutDashboard },
      { label: "Leads", href: "/admins/leads", icon: Inbox },
    ],
  },
  {
    title: "Site content",
    items: [
      { label: "Profile & hero", href: "/admins/profile", icon: UserRound },
      { label: "Services", href: "/admins/services", icon: Layers },
      { label: "Portfolio", href: "/admins/add-portfolio", icon: Briefcase },
      { label: "Case studies", href: "/admins/case-studies", icon: ChartNoAxesCombined },
      { label: "Pricing", href: "/admins/add-priceing", icon: Tag },
      { label: "Testimonials", href: "/admins/reviews", icon: MessageSquareQuote },
      { label: "FAQ", href: "/admins/faq", icon: HelpCircle },
      { label: "Blog", href: "/admins/add-blog", icon: FileText },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "My account", href: "/admins/account", icon: UserCog },
      {
        label: "Team",
        href: "/admins/all-admin",
        icon: UserRound,
        roles: ["superadmin"],
      },
    ],
  },
];

export default function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { adminData } = useContext(AuthContext);
  const role = adminData?.role;

  const isActive = (href: string) =>
    href === "/admins" ? pathname === "/admins" : pathname.startsWith(href);

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
          background: "var(--a-surface)",
          borderRight: "1px solid var(--a-line)",
        }}
      >
        {/* Brand */}
        <div
          className="flex h-[var(--a-topbar-h)] shrink-0 items-center justify-between px-5"
          style={{ borderBottom: "1px solid var(--a-line)" }}
        >
          <Link href="/admins" className="flex items-center gap-2.5">
            <span
              className="grid h-8 w-8 place-items-center rounded-[10px] font-heading text-[0.8rem] font-extrabold text-white"
              style={{ background: "linear-gradient(135deg,#8f6dff,#6234e8)" }}
            >
              N
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-heading text-[0.88rem] font-bold text-white">
                Nafi Studio
              </span>
              <span className="mt-0.5 text-[0.66rem]" style={{ color: "var(--a-text-3)" }}>
                Content manager
              </span>
            </span>
          </Link>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="lg:hidden"
            style={{ color: "var(--a-text-3)" }}
          >
            <X size={19} />
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
                  className="mb-2 px-3 text-[0.64rem] font-bold uppercase tracking-[0.14em]"
                  style={{ color: "var(--a-text-3)" }}
                >
                  {group.title}
                </p>

                <ul className="flex flex-col gap-0.5">
                  {items.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          aria-current={active ? "page" : undefined}
                          className="group flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[0.845rem] font-medium transition-colors"
                          style={{
                            background: active ? "var(--a-brand-tint)" : "transparent",
                            color: active ? "#fff" : "var(--a-text-2)",
                            boxShadow: active
                              ? "inset 0 0 0 1px rgba(124,92,255,.26)"
                              : undefined,
                          }}
                        >
                          <item.icon
                            size={17}
                            strokeWidth={1.8}
                            style={{
                              color: active ? "var(--a-brand)" : "var(--a-text-3)",
                            }}
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

        {/* Footer link */}
        <div className="px-3 pb-4" style={{ borderTop: "1px solid var(--a-line)" }}>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[0.82rem] font-medium transition-colors hover:bg-[var(--a-panel-2)]"
            style={{ color: "var(--a-text-2)" }}
          >
            <ExternalLink size={16} strokeWidth={1.8} style={{ color: "var(--a-text-3)" }} />
            View live site
          </a>
        </div>
      </aside>
    </>
  );
}
