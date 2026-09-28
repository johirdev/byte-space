"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Courses", href: "#courses" },
  { label: "Creators", href: "#creators" },
];

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

const Navbar = () => {
  const [open, setOpen] = useState(false);

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
          {navLinks.map((link, i) => (
            <li key={link.label}>
              <Link
                href={link.href}
                className={`text-base leading-none text-neutral-50 transition-opacity hover:opacity-80 ${
                  i === 0 ? "relative -top-0.5 font-medium" : "font-normal"
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right actions (desktop) */}
        <div className="hidden items-center gap-6 md:flex">
          <Link
            href="#signin"
            className="text-base leading-none text-neutral-50 transition-opacity hover:opacity-80"
          >
            Sign In
          </Link>
          <Link
            href="#join"
            className="text-base leading-none text-neutral-50 transition-opacity hover:opacity-80"
          >
            Join Us
          </Link>
          <Link
            href="#cart"
            aria-label="Cart"
            className="ml-1 text-neutral-50 transition-opacity hover:opacity-80"
          >
            <BagIcon />
          </Link>
        </div>

        {/* Mobile actions */}
        <div className="flex items-center gap-4 md:hidden">
          <Link href="#cart" aria-label="Cart" className="text-neutral-50">
            <BagIcon />
          </Link>
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
            <ul className="flex flex-col">
              {navLinks.map((link, i) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={`block rounded-xl px-4 py-3 text-base text-neutral-950 hover:bg-neutral-50 ${
                      i === 0 ? "font-medium" : ""
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-3 grid grid-cols-2 gap-3 border-t border-neutral-100 pt-4">
              <Link
                href="#signin"
                onClick={() => setOpen(false)}
                className="rounded-full border border-neutral-200 py-3 text-center text-base font-medium text-neutral-950"
              >
                Sign In
              </Link>
              <Link
                href="#join"
                onClick={() => setOpen(false)}
                className="rounded-full bg-secondary-400 py-3 text-center text-base font-medium text-neutral-950"
              >
                Join Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
