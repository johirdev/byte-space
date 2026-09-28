import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  CreditCard,
  GraduationCap,
  HeartHandshake,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  UserPlus,
  UsersRound,
} from "lucide-react";
import leftMask from "@/assets/hero/left-site-Mask.png";
import rightCone from "@/assets/hero/right-site-Cone.png";
import whiteRoundMask from "@/assets/hero/white-round-Mask.png";
import womanImage from "@/assets/ProfessionalGrowth/first-woman-section-image.png";
import TrustedBrand from "../Home/TrustedBrand/TrustedBrand";
import UnlockPotential from "../Home/UnlockPotential/UnlockPotential";
import Reveal from "../../Shared/Reveal";
import "./About.css";

const STATS = [
  { value: "12K+", label: "Learners worldwide" },
  { value: "70+", label: "Published courses" },
  { value: "16", label: "Verified creators" },
  { value: "4.8", label: "Average course rating" },
];

const VALUES = [
  {
    icon: GraduationCap,
    title: "Learners first",
    text: "Practical, project-based lessons you can finish at your own pace — with lifetime access to every course you enroll in.",
  },
  {
    icon: ShieldCheck,
    title: "Quality by review",
    text: "Every creator is reviewed and verified by our team before their courses carry the ByteSpace name.",
  },
  {
    icon: HeartHandshake,
    title: "Creators thrive",
    text: "We give experts the tools, audience and support to turn what they know into courses people love.",
  },
  {
    icon: UsersRound,
    title: "Community-driven",
    text: "Honest reviews, shared progress and a growing network of learners who help each other grow.",
  },
];

const LEARNER_STEPS = [
  { icon: Search, title: "Find your course", text: "Search and filter by category, level, price and rating." },
  { icon: CreditCard, title: "Enroll once", text: "Add several courses to your cart and check out in one go." },
  { icon: BookOpenCheck, title: "Learn & track", text: "Tick off lessons, follow your progress and leave a review." },
];

const CREATOR_STEPS = [
  { icon: UserPlus, title: "Apply", text: "Tell us about your experience and what you'd like to teach." },
  { icon: BadgeCheck, title: "Get verified", text: "Our team reviews your profile and gives you a Creator ID." },
  { icon: Rocket, title: "Publish & grow", text: "Your courses reach learners under your verified profile." },
];

export default function About() {
  return (
    <main>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="bg-hero-grid relative isolate overflow-hidden pt-[72px] md:pt-[120px]">
        <Image src={leftMask} alt="" aria-hidden="true" className="about-float-a pointer-events-none absolute top-40 -left-6 -z-10 hidden w-[180px] select-none md:block lg:w-[230px]" />
        <Image src={rightCone} alt="" aria-hidden="true" className="about-float-b pointer-events-none absolute top-28 -right-4 -z-10 hidden w-[150px] select-none md:block lg:w-[190px]" />

        <div className="container-site pt-10 pb-20 text-center md:pt-12 md:pb-28">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm text-white backdrop-blur">
              <Sparkles className="size-4 text-secondary-400" aria-hidden="true" /> About ByteSpace
            </span>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="mx-auto mt-6 max-w-[16em] font-heading text-[clamp(2.1rem,1.2rem+3.4vw,4rem)] leading-[1.15] font-semibold tracking-[-0.015em] text-balance text-white">
              Where experts teach and curious minds grow
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mx-auto mt-6 max-w-[760px] text-base leading-[1.7] text-white/90 md:text-lg">
              ByteSpace is a course marketplace built around two people: the learner who wants practical skills, and the
              creator who has them to share. We connect the two with verified creators, honest reviews and courses you
              keep for life.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link
                href="/courses"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-secondary-400 px-7 text-lg font-medium text-neutral-950 transition-colors hover:bg-secondary-300"
              >
                Explore courses <ArrowRight className="size-5" aria-hidden="true" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex h-12 items-center rounded-full border border-white/60 px-7 text-lg text-white transition-colors hover:bg-white/15"
              >
                Talk to us
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Stats band (overlaps the hero) ───────────────────── */}
      <section className="container-site relative z-10 -mt-12 md:-mt-14">
        <Reveal>
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-neutral-100 shadow-card-hover lg:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="flex flex-col-reverse bg-white px-6 py-7 text-center md:py-9">
                <dt className="mt-1 text-sm text-neutral-500 md:text-base">{s.label}</dt>
                <dd className="font-heading text-[clamp(1.75rem,1.2rem+1.6vw,2.5rem)] font-semibold text-primary-600">{s.value}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </section>

      {/* ── Mission ──────────────────────────────────────────── */}
      <section className="container-site grid items-center gap-12 py-20 md:py-28 lg:grid-cols-2 lg:gap-16">
        <div>
          <Reveal>
            <p className="text-sm font-medium tracking-[0.14em] text-primary-600 uppercase">Our mission</p>
            <h2 className="mt-3 font-heading text-[clamp(1.875rem,1.3rem+2.2vw,2.75rem)] leading-[1.2] font-semibold text-neutral-950">
              Make great teaching accessible to everyone
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-6 space-y-4 text-base leading-[1.75] text-neutral-600 md:text-lg">
              <p>
                The best way to learn a skill is from someone who uses it every day. ByteSpace gives those people — designers,
                developers, marketers, founders, artists — a home to teach, and gives learners a clear path from curious to
                confident.
              </p>
              <p>
                We keep things simple: a transparent price, lifetime access, progress you can see, and reviews from real
                learners. Behind every course is a creator our team has reviewed and verified.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {["Verified creators only", "Lifetime course access", "Learn at your own pace", "Secure, simple checkout"].map((item) => (
                <li key={item} className="flex items-center gap-3 text-neutral-950">
                  <BadgeCheck className="size-5 shrink-0 fill-primary-600 text-white" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal delay={0.1} className="relative mx-auto w-full max-w-[520px]">
          <div aria-hidden="true" className="about-glow absolute inset-6 -z-10 rounded-full" />
          <Image src={whiteRoundMask} alt="" aria-hidden="true" className="about-float-b pointer-events-none absolute -top-6 -right-6 w-28 select-none md:w-36" />
          <Image
            src={womanImage}
            alt="A ByteSpace creator with her course revenue and happy-students stats"
            sizes="(min-width: 1024px) 520px, 90vw"
            className="h-auto w-full select-none"
          />
        </Reveal>
      </section>

      {/* ── Values ───────────────────────────────────────────── */}
      <section className="bg-neutral-50 py-20 md:py-28">
        <div className="container-site">
          <Reveal className="mx-auto max-w-[720px] text-center">
            <h2 className="font-heading text-[clamp(1.875rem,1.3rem+2.2vw,2.75rem)] leading-[1.2] font-semibold text-neutral-950">
              What we stand for
            </h2>
            <p className="mt-4 text-base leading-[1.6] text-neutral-600 md:text-lg">
              Four ideas guide every feature we ship and every creator we welcome.
            </p>
          </Reveal>
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {VALUES.map((v, i) => (
              <Reveal as="li" key={v.title} delay={i * 0.08} className="group rounded-3xl bg-white p-7 transition-shadow duration-300 hover:shadow-card-hover">
                <span className="grid size-12 place-items-center rounded-2xl bg-secondary-400 text-neutral-950 transition-transform duration-300 group-hover:scale-110">
                  <v.icon className="size-6" aria-hidden="true" />
                </span>
                <h3 className="mt-5 font-heading text-xl font-semibold text-neutral-950">{v.title}</h3>
                <p className="mt-2 leading-[1.65] text-neutral-600">{v.text}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="container-site py-20 md:py-28">
        <Reveal className="mx-auto max-w-[720px] text-center">
          <h2 className="font-heading text-[clamp(1.875rem,1.3rem+2.2vw,2.75rem)] leading-[1.2] font-semibold text-neutral-950">
            How ByteSpace works
          </h2>
          <p className="mt-4 text-base leading-[1.6] text-neutral-600 md:text-lg">One platform, two journeys.</p>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {[
            { title: "For learners", steps: LEARNER_STEPS, href: "/courses", cta: "Browse courses", dark: false },
            { title: "For creators", steps: CREATOR_STEPS, href: "/become-creator", cta: "Become a creator", dark: true },
          ].map((track, t) => (
            <Reveal
              key={track.title}
              delay={t * 0.1}
              className={`flex flex-col rounded-3xl p-7 md:p-10 ${track.dark ? "bg-hero-grid text-white" : "border border-neutral-100 bg-white"}`}
            >
              <h3 className={`font-heading text-2xl font-semibold ${track.dark ? "text-white" : "text-neutral-950"}`}>{track.title}</h3>
              <ol className="mt-8 space-y-6">
                {track.steps.map((s, i) => (
                  <li key={s.title} className="flex gap-4">
                    <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${track.dark ? "bg-white/15" : "bg-primary-50 text-primary-600"}`}>
                      <s.icon className={`size-6 ${track.dark ? "text-secondary-400" : ""}`} aria-hidden="true" />
                    </span>
                    <span>
                      <span className={`block text-sm ${track.dark ? "text-white/60" : "text-neutral-400"}`}>Step {i + 1}</span>
                      <span className={`block text-lg font-medium ${track.dark ? "text-white" : "text-neutral-950"}`}>{s.title}</span>
                      <span className={`block ${track.dark ? "text-white/80" : "text-neutral-600"}`}>{s.text}</span>
                    </span>
                  </li>
                ))}
              </ol>
              <Link
                href={track.href}
                className="mt-10 inline-flex h-12 items-center gap-2 self-start rounded-full bg-secondary-400 px-6 font-medium text-neutral-950 transition-colors hover:bg-secondary-300"
              >
                {track.cta} <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <TrustedBrand />
      <UnlockPotential />
    </main>
  );
}
