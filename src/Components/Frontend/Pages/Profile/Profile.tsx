"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, MessageSquareText, PartyPopper, Receipt, Settings, X } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import AvatarUploader from "./AvatarUploader";
import MyCourses from "./MyCourses";
import MyOrders from "./MyOrders";
import MyReviews from "./MyReviews";
import AccountSettings from "./AccountSettings";
import { formatPrice } from "../../utils/course";

export type ProfileTab = "courses" | "orders" | "reviews" | "settings";

const TABS: { id: ProfileTab; label: string; icon: typeof BookOpen }[] = [
  { id: "courses", label: "My Courses", icon: BookOpen },
  { id: "orders", label: "Orders", icon: Receipt },
  { id: "reviews", label: "Reviews", icon: MessageSquareText },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function Profile({ initialTab, newOrder }: { initialTab: ProfileTab; newOrder?: string }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const [tab, setTab] = useState<ProfileTab>(initialTab);
  const [banner, setBanner] = useState(Boolean(newOrder));

  // The server page already checked the cookie; this covers a session that
  // turned out to be revoked (suspended account, deleted user…).
  useEffect(() => {
    if (status === "guest") router.replace("/login?next=/profile");
  }, [status, router]);

  const selectTab = (id: ProfileTab) => {
    setTab(id);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", id);
    url.searchParams.delete("order");
    window.history.replaceState(null, "", url);
  };

  if (!user) {
    return (
      <main>
        <section className="bg-hero-grid pt-[72px] md:pt-[120px]">
          <div className="container-site animate-pulse pt-10 pb-14">
            <div className="flex items-center gap-5">
              <div className="size-[90px] rounded-[20px] bg-white/20" />
              <div className="space-y-3">
                <div className="h-9 w-64 rounded-lg bg-white/20" />
                <div className="h-5 w-48 rounded bg-white/15" />
              </div>
            </div>
            <div className="mt-8 h-16 max-w-3xl rounded-lg bg-white/10" />
          </div>
        </section>
      </main>
    );
  }

  const first = user.name.split(" ")[0];

  return (
    <main>
      {/* ── Hero (Creator-Profile design) ─────────────────── */}
      <section className="bg-hero-grid pt-[72px] md:pt-[120px]">
        <div className="container-site pt-8 pb-12 md:pt-10 md:pb-[76px]">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <AvatarUploader user={user} />
            <div className="min-w-0">
              <h1 className="flex flex-wrap items-center gap-3 font-heading text-[clamp(1.75rem,1.2rem+1.6vw,2.25rem)] leading-tight font-semibold text-white">
                {user.name}
                <span className="rounded-full bg-secondary-400 px-5 py-1 font-body text-base font-medium text-neutral-950 capitalize">
                  {user.role === "creator" ? "Creator" : "Learner"}
                </span>
              </h1>
              <p className="mt-2 text-lg text-white/95">
                {user.headline || (
                  <button type="button" onClick={() => selectTab("settings")} className="cursor-pointer text-white/70 underline-offset-4 hover:underline">
                    + Add a headline
                  </button>
                )}
              </p>
            </div>
          </div>

          <p className="mt-8 max-w-5xl text-base leading-[1.75] text-white md:mt-12 md:text-lg">
            {user.bio ||
              `Welcome to your learning space, ${first}! Everything you've enrolled in lives here — pick up where you left off, rate the courses you finish, and keep your profile up to date.`}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 md:mt-10">
            <ul className="flex flex-wrap gap-3 md:gap-4">
              {[
                { value: user.stats.courses, label: user.stats.courses === 1 ? "Course" : "Courses", tab: "courses" as const },
                { value: user.stats.reviews, label: user.stats.reviews === 1 ? "Review" : "Reviews", tab: "reviews" as const },
                { value: formatPrice(user.stats.spent), label: "Invested", tab: "orders" as const },
              ].map((stat) => (
                <li key={stat.label}>
                  <button
                    type="button"
                    onClick={() => selectTab(stat.tab)}
                    className="h-11 cursor-pointer rounded-full bg-white px-5 text-lg text-neutral-950 transition-transform hover:-translate-y-0.5"
                  >
                    <span className="text-primary-600">{stat.value}</span> {stat.label}
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => selectTab("settings")}
              className="h-11 cursor-pointer rounded-full bg-secondary-400 px-6 text-lg font-medium text-neutral-950 transition-colors hover:bg-secondary-300"
            >
              Edit Profile
            </button>
          </div>
        </div>
      </section>

      <section className="container-site pt-10 pb-16 md:pt-14 md:pb-[120px]">
        {banner && newOrder && (
          <div role="status" className="mb-8 flex items-start gap-4 rounded-2xl border border-secondary-300 bg-secondary-50 p-5">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary-400">
              <PartyPopper className="size-5" />
            </span>
            <div className="flex-1">
              <p className="font-heading font-semibold">Payment successful — you&apos;re enrolled!</p>
              <p className="mt-0.5 text-sm text-neutral-700">
                Order <strong>{newOrder}</strong> is confirmed. Your new courses are below — happy learning!{" "}
                <button type="button" onClick={() => selectTab("orders")} className="cursor-pointer font-medium text-primary-600 hover:underline">
                  View receipt
                </button>
              </p>
            </div>
            <button type="button" onClick={() => setBanner(false)} aria-label="Dismiss" className="cursor-pointer text-neutral-500 hover:text-neutral-950">
              <X className="size-5" />
            </button>
          </div>
        )}

        <div role="tablist" aria-label="Profile sections" className="no-scrollbar mb-8 flex gap-2 overflow-x-auto border-b border-neutral-100 md:mb-10">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => selectTab(t.id)}
              className={`-mb-px inline-flex shrink-0 cursor-pointer items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                tab === t.id ? "border-primary-600 text-primary-600" : "border-transparent text-neutral-500 hover:text-neutral-950"
              }`}
            >
              <t.icon className="size-4" />
              {t.label}
              {t.id === "courses" && user.stats.courses > 0 && (
                <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs text-primary-600">{user.stats.courses}</span>
              )}
            </button>
          ))}
          <Link href="/courses" className="ml-auto hidden shrink-0 items-center self-center text-sm font-medium text-primary-600 hover:underline sm:inline-flex">
            Browse more courses →
          </Link>
        </div>

        <div role="tabpanel">
          {tab === "courses" && <MyCourses />}
          {tab === "orders" && <MyOrders highlight={newOrder} />}
          {tab === "reviews" && <MyReviews onWriteNew={() => selectTab("courses")} />}
          {tab === "settings" && <AccountSettings user={user} />}
        </div>
      </section>
    </main>
  );
}
