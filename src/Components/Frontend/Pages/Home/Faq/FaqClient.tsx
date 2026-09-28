"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { LazyMotion, MotionConfig, domAnimation, m, type Variants } from "motion/react";
import { ArrowRight, MessageCircleQuestion, Plus } from "lucide-react";
import type { IFaq } from "@/app/types";

const EASE = [0.22, 1, 0.36, 1] as const;
const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

export default function FaqClient({ items }: { items: IFaq[] }) {
  const baseId = useId();
  // Only categories that actually have questions become chips.
  const categories = useMemo(() => [...new Set(items.map((f) => f.category))], [items]);
  const [category, setCategory] = useState<string>("All");
  const shown = category === "All" ? items : items.filter((f) => f.category === category);
  const [openId, setOpenId] = useState<string | null>(items[0]?._id ?? null);

  const pick = (next: string) => {
    setCategory(next);
    const first = next === "All" ? items[0] : items.find((f) => f.category === next);
    setOpenId(first?._id ?? null);
  };

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <section aria-labelledby="faq-heading" className="bg-white py-16 md:py-24 xl:py-[120px]">
          <div className="container-site grid gap-10 lg:grid-cols-12 lg:gap-10">
            {/* ── Intro ─────────────────────────────────────── */}
            <m.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.3 }}
              variants={stagger}
              className="lg:col-span-5"
            >
              <div className="lg:sticky lg:top-8">
                <m.span variants={fadeUp} className="inline-flex items-center gap-2 rounded-full bg-secondary-400 px-4 py-1.5 text-sm font-medium text-neutral-950">
                  <MessageCircleQuestion className="size-4" aria-hidden="true" /> FAQ
                </m.span>
                <m.h2
                  id="faq-heading"
                  variants={fadeUp}
                  className="mt-5 max-w-[460px] font-heading text-[clamp(1.875rem,1.3rem+2.2vw,2.75rem)] leading-[1.2] font-semibold tracking-[-0.01em] text-neutral-950"
                >
                  Frequently Asked Questions
                </m.h2>
                <m.p variants={fadeUp} className="mt-5 max-w-[460px] text-base leading-[1.6] text-neutral-600 md:text-lg">
                  Everything you need to know about learning on ByteSpace — enrolling, payments, progress, and teaching
                  as a creator.
                </m.p>

                <m.div variants={fadeUp} className="bg-hero-grid mt-8 overflow-hidden rounded-3xl p-6 md:p-8">
                  <p className="font-heading text-xl font-semibold text-white">Still have questions?</p>
                  <p className="mt-2 text-white/85">Browse the catalogue, or apply to share your own expertise with learners.</p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      href="/courses"
                      className="inline-flex h-11 items-center gap-2 rounded-full bg-secondary-400 px-5 font-medium text-neutral-950 transition-colors hover:bg-secondary-300"
                    >
                      Browse courses <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                    <Link
                      href="/become-creator"
                      className="inline-flex h-11 items-center rounded-full border border-white/60 px-5 font-medium text-white transition-colors hover:bg-white/15"
                    >
                      Become a creator
                    </Link>
                  </div>
                </m.div>
              </div>
            </m.div>

            {/* ── Questions ─────────────────────────────────── */}
            <div className="lg:col-span-7">
              {categories.length > 1 && (
                <div className="no-scrollbar -mx-[var(--grid-margin)] overflow-x-auto px-[var(--grid-margin)] lg:mx-0 lg:px-0">
                  <ul className="flex w-max gap-2 lg:w-auto lg:flex-wrap" aria-label="FAQ categories">
                    {["All", ...categories].map((c) => (
                      <li key={c}>
                        <button
                          type="button"
                          aria-pressed={category === c}
                          onClick={() => pick(c)}
                          className={`h-10 cursor-pointer rounded-full px-4 text-sm whitespace-nowrap transition-colors md:text-base ${
                            category === c ? "bg-neutral-950 font-medium text-white" : "bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
                          }`}
                        >
                          {c}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Re-keyed per category so the list re-animates on switch. */}
              <m.ul
                key={category}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.1 }}
                variants={stagger}
                className="mt-6 space-y-3"
              >
                {shown.map((faq, i) => {
                  const id = faq._id ?? String(i);
                  const open = openId === id;
                  const panelId = `${baseId}-panel-${i}`;
                  const buttonId = `${baseId}-button-${i}`;
                  return (
                    <m.li
                      key={id}
                      variants={fadeUp}
                      className={`rounded-2xl border transition-[background-color,border-color,box-shadow] duration-300 ${
                        open ? "border-transparent bg-white shadow-card-hover" : "border-neutral-100 bg-white hover:border-neutral-200"
                      }`}
                    >
                      <h3>
                        <button
                          id={buttonId}
                          type="button"
                          aria-expanded={open}
                          aria-controls={panelId}
                          onClick={() => setOpenId(open ? null : id)}
                          className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-5 text-left md:px-6"
                        >
                          <span className="font-heading text-base font-medium text-neutral-950 md:text-lg">{faq.question}</span>
                          <span
                            className={`grid size-9 shrink-0 place-items-center rounded-full transition-[background-color,transform] duration-300 ${
                              open ? "rotate-45 bg-secondary-400" : "bg-neutral-50"
                            }`}
                            aria-hidden="true"
                          >
                            <Plus className="size-5 text-neutral-950" />
                          </span>
                        </button>
                      </h3>
                      {/* Grid-rows 0fr → 1fr animates to the content's real height. */}
                      <div
                        id={panelId}
                        role="region"
                        aria-labelledby={buttonId}
                        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                        }`}
                      >
                        <div className="overflow-hidden">
                          <p className="px-5 pb-6 text-base leading-[1.7] text-neutral-600 md:px-6 md:text-[17px]">{faq.answer}</p>
                        </div>
                      </div>
                    </m.li>
                  );
                })}
              </m.ul>
            </div>
          </div>
        </section>
      </MotionConfig>
    </LazyMotion>
  );
}
