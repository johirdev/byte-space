"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star, UsersRound } from "lucide-react";
import { apiRequest } from "@/app/lib/apiClient";
import type { CreatorSummary } from "@/app/types";
import PageHero from "../../Shared/PageHero";
import UserAvatar from "../../Shared/UserAvatar";
import { formatCount } from "../../utils/course";

export default function CreatorsIndex() {
  const [creators, setCreators] = useState<CreatorSummary[] | null>(null);

  useEffect(() => {
    apiRequest<CreatorSummary[]>("/creators")
      .then(({ data }) => setCreators(data))
      .catch(() => setCreators([]));
  }, []);

  return (
    <main>
      <PageHero title="Meet Our Creators" subtitle="Learn from the people behind every ByteSpace course." crumbs={[{ label: "Home", href: "/" }, { label: "Creators" }]} />
      <section className="container-site py-10 md:py-16">
        {!creators ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl bg-neutral-50" />
            ))}
          </div>
        ) : !creators.length ? (
          <div className="flex flex-col items-center py-16 text-center">
            <UsersRound className="size-10 text-neutral-300" />
            <p className="mt-4 text-neutral-500">No creators yet — they appear once a course is published.</p>
          </div>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {creators.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/creator-profile/${c.slug}`}
                  className="group flex h-full flex-col rounded-2xl border border-neutral-100 bg-white p-6 transition-shadow hover:shadow-card-hover"
                >
                  <div className="flex items-center gap-4">
                    <UserAvatar name={c.name} src={c.avatar} size={64} rounded="rounded-2xl" />
                    <div className="min-w-0">
                      <p className="truncate font-heading text-lg font-semibold group-hover:text-primary-600">{c.name}</p>
                      <p className="truncate text-sm text-neutral-500">{c.title || "Creator"}</p>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2 text-sm">
                    <span className="rounded-full bg-neutral-50 px-3 py-1.5">
                      <span className="text-primary-600">{c.stats.courses}</span> courses
                    </span>
                    <span className="rounded-full bg-neutral-50 px-3 py-1.5">
                      <span className="text-primary-600">{formatCount(c.stats.students)}</span> students
                    </span>
                    {c.stats.rating > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-neutral-50 px-3 py-1.5">
                        <Star className="size-3.5 fill-primary-600 text-primary-600" /> {c.stats.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <span className="mt-5 self-start rounded-full bg-secondary-400 px-5 py-2 text-sm font-medium text-neutral-950 group-hover:bg-secondary-300">
                    View profile
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
