"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const COLUMNS = [
  [
    { label: "Featured Courses", href: "/courses" },
    { label: "Featured Categories", href: "/courses" },
    { label: "Business", href: "/courses?category=business" },
    { label: "IT", href: "/courses?category=development" },
    { label: "Design", href: "/courses?category=uiux-design" },
  ],
  [
    { label: "Development", href: "/courses?category=development" },
    { label: "Marketing", href: "/courses?category=marketing" },
    { label: "Photography", href: "/courses?q=photography" },
    { label: "Finance", href: "/courses?category=finance" },
    { label: "Sport", href: "/courses?q=sport" },
  ],
  [
    { label: "Become a Creator", href: "/become-creator" },
    { label: "Affiliate Program", href: "#" },
    { label: "Contact", href: "/contact" },
    { label: "Help", href: "/contact#faq" },
    { label: "About", href: "/about" },
  ],
];

const LEGAL = ["Privacy Policy", "Terms of Service", "Cookies Settings"];

const Footer = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "invalid" | "done">("idle");

  const subscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // Newsletter storage isn't wired yet — validate and acknowledge.
    setStatus(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()) ? "done" : "invalid");
  };

  return (
    <footer className="border-t border-neutral-100 bg-white">
      <div className="container-site pt-14 md:pt-[72px]">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <Link href="/" className="flex items-end gap-[9px]" aria-label="ByteSpace home">
              <Image src="/logo.png" alt="" width={29} height={32} className="h-7 w-auto md:h-8" />
              <span className="font-body text-[22px] leading-[0.85] font-bold tracking-[0.02em] text-neutral-950 md:text-[26px]">
                ByteSpace
              </span>
            </Link>
            <p className="mt-4 text-sm text-neutral-700">
              Stay Up to date with our latest features and releases by joining our newsletter.
            </p>

            <form onSubmit={subscribe} className="mt-8 flex gap-3 sm:gap-[18px]" noValidate>
              <label className="min-w-0 flex-1">
                <span className="sr-only">Email address</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setStatus("idle");
                  }}
                  placeholder="Enter your email"
                  aria-invalid={status === "invalid"}
                  className="h-[52px] w-full rounded-full border border-neutral-200 px-6 text-base text-neutral-950 outline-none placeholder:text-neutral-500 focus-visible:border-primary-600 aria-invalid:border-red-400"
                />
              </label>
              <button
                type="submit"
                className="h-[46px] shrink-0 cursor-pointer self-center rounded-full bg-secondary-400 px-5 font-medium text-neutral-950 transition-colors hover:bg-secondary-300"
              >
                Subscribe
              </button>
            </form>
            <p className="mt-3 min-h-5 text-xs" aria-live="polite">
              {status === "invalid" && <span className="text-red-500">Enter a valid email address.</span>}
              {status === "done" && <span className="text-primary-600">Thanks! You&apos;re on the list.</span>}
            </p>
            <p className="mt-1 max-w-[460px] text-xs text-neutral-700">
              By subscribing, you agree to our Privacy Policy and consent to receive updates from our company.
            </p>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-6 lg:col-start-7">
            {COLUMNS.map((links, i) => (
              <ul key={i} className="space-y-4">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-neutral-700 transition-colors hover:text-primary-600">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            ))}
          </nav>
        </div>

        <div className="mt-16 flex flex-col-reverse gap-4 border-t border-neutral-200 py-8 text-xs text-neutral-700 sm:flex-row sm:items-center sm:justify-between md:mt-24">
          <p>© {new Date().getFullYear()} ByteSpace. All rights reserved.</p>
          <ul className="flex flex-wrap gap-6">
            {LEGAL.map((item) => (
              <li key={item}>
                <a href="#" className="hover:text-primary-600">
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
