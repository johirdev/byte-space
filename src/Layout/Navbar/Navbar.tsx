"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, ChevronDown, LogOut, Receipt, Settings, UserRound } from "lucide-react";
import { toast } from "react-toastify";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import UserAvatar from "@/Components/Frontend/Shared/UserAvatar";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Courses", href: "/courses" },
  { label: "Creators", href: "/creator-profile" },
];

const ACCOUNT_LINKS = [
  { label: "My profile", href: "/profile", icon: UserRound },
  { label: "My courses", href: "/profile?tab=courses", icon: BookOpen },
  { label: "Orders", href: "/profile?tab=orders", icon: Receipt },
  { label: "Settings", href: "/profile?tab=settings", icon: Settings },
];

/** Verified creators have no learner tabs — their profile is their courses. */
const accountLinksFor = (user: { creator: { slug: string } | null } | null) =>
  user?.creator
    ? [
        { label: "My creator profile", href: "/profile", icon: UserRound },
        { label: "Public profile", href: `/creator-profile/${user.creator.slug}`, icon: BookOpen },
        { label: "Settings", href: "/profile?tab=settings", icon: Settings },
      ]
    : ACCOUNT_LINKS;

const BagIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 7h14v14H5z" />
    <path d="M9 10V5a3 3 0 0 1 6 0v5" strokeLinecap="round" />
  </svg>
);

function CartLink({ className = "" }: { className?: string }) {
  const count = useCartStore((s) => s.items.length);
  const hydrated = useCartStore((s) => s.hydrated);
  const show = hydrated && count > 0;

  return (
    <Link
      href="/cart"
      aria-label={show ? `Cart, ${count} item${count > 1 ? "s" : ""}` : "Cart"}
      className={`relative text-neutral-50 transition-opacity hover:opacity-80 ${className}`}
    >
      <BagIcon />
      {show && (
        <span className="absolute -top-2 -right-2.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-secondary-400 px-1 text-[10px] leading-none font-bold text-neutral-950 ring-2 ring-primary-800">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}

function AccountMenu() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;

  const signOut = async () => {
    setOpen(false);
    await logout();
    toast.success("Signed out");
    router.push("/");
    router.refresh();
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex cursor-pointer items-center gap-2 rounded-full bg-white/10 py-1 pr-3 pl-1 text-white transition-colors hover:bg-white/20"
      >
        <UserAvatar name={user.name} src={user.avatar} size={32} />
        <span className="max-w-[120px] truncate text-sm font-medium">{user.name.split(" ")[0]}</span>
        <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {open && (
        <div role="menu" className="absolute top-[calc(100%+10px)] right-0 z-50 w-64 overflow-hidden rounded-2xl border border-neutral-100 bg-white p-2 shadow-card-hover">
          <div className="flex items-center gap-3 px-3 py-3">
            <UserAvatar name={user.name} src={user.avatar} size={40} />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-neutral-950">{user.name}</span>
              <span className="block truncate text-xs text-neutral-500">{user.email}</span>
            </span>
          </div>
          <div className="my-1 border-t border-neutral-100" />
          {accountLinksFor(user).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-neutral-950"
            >
              <link.icon className="size-4" aria-hidden="true" />
              {link.label}
              {link.label === "My courses" && user.stats.courses > 0 && (
                <span className="ml-auto rounded-full bg-primary-50 px-2 py-0.5 text-xs text-primary-600">{user.stats.courses}</span>
              )}
            </Link>
          ))}
          <div className="my-1 border-t border-neutral-100" />
          <button
            type="button"
            role="menuitem"
            onClick={signOut}
            className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const next = pathname && pathname !== "/" ? `?next=${encodeURIComponent(pathname)}` : "";

  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <nav className="container-site relative flex h-[72px] items-center justify-between md:h-[120px]">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-end gap-[9px] md:-mt-4 md:ml-0.5"
          aria-label="ByteSpace home"
        >
          <Image
            src="/logo.png"
            alt=""
            width={29}
            height={32}
            className="h-7 w-auto md:h-8"
            preload
          />
          <span className="font-body text-[22px] leading-[0.85] font-bold tracking-[-0.02em] text-white md:text-[26px] md:tracking-[0.02em]">
            ByteSpace
          </span>
        </Link>

        {/* Center links (desktop) */}
        <ul className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <li key={link.label}>
              <Link
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={`text-base leading-none text-neutral-50 transition-opacity hover:opacity-80 ${
                  isActive(link.href) ? "relative -top-0.5 font-medium" : "font-normal"
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right actions (desktop) */}
        <div className="hidden items-center gap-6 md:flex">
          {status === "authenticated" ? (
            <AccountMenu />
          ) : (
            <span className={`flex items-center gap-6 transition-opacity ${status === "idle" || status === "loading" ? "opacity-0" : "opacity-100"}`}>
              <Link href={`/login${next}`} className="text-base leading-none text-neutral-50 transition-opacity hover:opacity-80">
                Sign In
              </Link>
              <Link href={`/register${next}`} className="text-base leading-none text-neutral-50 transition-opacity hover:opacity-80">
                Join Us
              </Link>
            </span>
          )}
          <CartLink className="ml-1" />
        </div>

        {/* Mobile actions */}
        <div className="flex items-center gap-4 md:hidden">
          <CartLink />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={`container-site grid transition-[grid-template-rows,opacity] duration-300 md:hidden ${
          open ? "grid-rows-[1fr] opacity-100" : "pointer-events-none grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="rounded-2xl bg-white p-4 shadow-card">
            {user && (
              <Link href="/profile" onClick={() => setOpen(false)} className="mb-2 flex items-center gap-3 rounded-xl bg-neutral-50 p-3">
                <UserAvatar name={user.name} src={user.avatar} size={40} />
                <span className="min-w-0">
                  <span className="block truncate font-medium text-neutral-950">{user.name}</span>
                  <span className="block truncate text-xs text-neutral-500">{user.email}</span>
                </span>
              </Link>
            )}
            <ul className="flex flex-col">
              {[...navLinks, ...(user ? accountLinksFor(user).slice(1) : [])].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={`block rounded-xl px-4 py-3 text-base text-neutral-950 hover:bg-neutral-50 ${
                      isActive(link.href) ? "font-medium" : ""
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-3 grid grid-cols-2 gap-3 border-t border-neutral-100 pt-4">
              {user ? (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    void logout();
                  }}
                  className="col-span-2 rounded-full border border-neutral-200 py-3 text-center text-base font-medium text-red-600"
                >
                  Sign out
                </button>
              ) : (
                <>
                  <Link
                    href={`/login${next}`}
                    onClick={() => setOpen(false)}
                    className="rounded-full border border-neutral-200 py-3 text-center text-base font-medium text-neutral-950"
                  >
                    Sign In
                  </Link>
                  <Link
                    href={`/register${next}`}
                    onClick={() => setOpen(false)}
                    className="rounded-full bg-secondary-400 py-3 text-center text-base font-medium text-neutral-950"
                  >
                    Join Us
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
