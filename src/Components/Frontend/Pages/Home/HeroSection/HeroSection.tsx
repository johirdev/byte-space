"use client";

import { useEffect, useState } from "react";
import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import {
  LazyMotion,
  MotionConfig,
  animate,
  domAnimation,
  m,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
  type Variants,
} from "motion/react";

import ellipse from "@/assets/hero/Ellipse.png";
import happyStudents from "@/assets/hero/happy-students.png";
import leftMask from "@/assets/hero/left-site-Mask.png";
import manImage from "@/assets/hero/man-image.png";
import rightCone from "@/assets/hero/right-site-Cone.png";
import rightWhiteMask from "@/assets/hero/right-site-white-mask.png";
import whiteMask from "@/assets/hero/white-Mask.png";
import whiteRightCone from "@/assets/hero/white-right-site-Cone.png";
import whiteRoundMask from "@/assets/hero/white-round-Mask.png";

import HeroSearch from "./HeroSearch";
import "./HeroSection.css";

/*
 * Positions are taken 1:1 from the 1440 × 1024 design. Side shapes scale by
 * --s (1 on xl, 0.8 lg, 0.5 md). On phones the visual gets a wider stage
 * (560px, centred and clipped) so the man and the stat cards stay readable.
 */

const EASE = [0.22, 1, 0.36, 1] as const;
const HEADLINE = "Get Access to Hundreds Courses Available";
const POPULAR = [
  { label: "UI/UX Design", q: "design" },
  { label: "Web Development", q: "development" },
  { label: "Marketing", q: "marketing" },
  { label: "Data Science", q: "data" },
];

/** When the stat cards finish landing — counters start after this. */
const CARDS_IN_AT = 1.05;
const COUNT_DURATION = 1.6;

const StarIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 1.5l3.1 6.6 7.2.9-5.3 5 1.4 7.2L12 17.6l-6.4 3.6 1.4-7.2-5.3-5 7.2-.9z" />
  </svg>
);

/* ── Motion helpers ─────────────────────────────────────────────────────── */

const wordsParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};
const word: Variants = {
  hidden: { opacity: 0, y: "0.6em", filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: EASE },
  },
};

/** Counts 0 → value after `delay` seconds (instant with reduced motion). */
function CountUp({
  value,
  decimals = 0,
  suffix = "",
  delay = CARDS_IN_AT,
  duration = COUNT_DURATION,
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  delay?: number;
  duration?: number;
}) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? value : 0);

  useEffect(() => {
    if (reduce) return;
    const controls = animate(0, value, {
      delay,
      duration,
      ease: EASE,
      onUpdate: setShown,
    });
    return () => controls.stop();
  }, [value, delay, duration, reduce]);

  return (
    <span className="tabular-nums">
      {shown.toFixed(decimals)}
      {suffix}
    </span>
  );
}

/**
 * Absolutely-positioned piece that enters from `from`, drifts with the
 * pointer (depth) and floats. Position classes go in `className`.
 */
function Floating({
  className,
  from,
  delay,
  depth,
  float,
  pointerX,
  pointerY,
  children,
}: {
  className: string;
  from: { x?: number; y?: number; rotate?: number; scale?: number };
  delay: number;
  depth: number;
  float: "hero-float-a" | "hero-float-b" | "hero-float-c";
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  children: React.ReactNode;
}) {
  const x = useTransform(pointerX, (v) => v * -depth);
  const y = useTransform(pointerY, (v) => v * -depth);

  return (
    <m.div
      className={className}
      initial={{
        opacity: 0,
        x: from.x ?? 0,
        y: from.y ?? 0,
        rotate: from.rotate ?? 0,
        scale: from.scale ?? 0.6,
      }}
      animate={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 70,
        damping: 14,
        mass: 0.9,
        delay,
      }}
    >
      <m.div style={{ x, y }}>
        <div className={float}>{children}</div>
      </m.div>
    </m.div>
  );
}

const Shape = ({
  src,
  className,
}: {
  src: StaticImageData;
  className?: string;
}) => (
  <Image
    src={src}
    alt=""
    aria-hidden="true"
    draggable={false}
    className={`pointer-events-none h-auto w-full select-none ${className ?? ""}`}
  />
);

/* ── Hero ───────────────────────────────────────────────────────────────── */

const HeroSection = () => {
  const reduce = useReducedMotion();
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const pointerX = useSpring(rawX, { stiffness: 50, damping: 16 });
  const pointerY = useSpring(rawY, { stiffness: 50, damping: 16 });

  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (reduce || e.pointerType !== "mouse") return;
    const rect = e.currentTarget.getBoundingClientRect();
    rawX.set((e.clientX - rect.left) / rect.width - 0.5);
    rawY.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const onPointerLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  const shared = { pointerX, pointerY };

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <section
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
          className="hero-grid relative isolate overflow-hidden pt-18 md:pt-20 md:[--s:0.5] lg:[--s:0.8] xl:[--s:1]"
        >
          {/* ---------- Decorative side shapes ---------- */}
          <Floating
            {...shared}
            className="pointer-events-none absolute top-[221px] left-0 -z-10 hidden w-[calc(266px*var(--s))] md:block"
            from={{ x: -220, rotate: -25 }}
            delay={0.35}
            depth={26}
            float="hero-float-a"
          >
            <Shape src={leftMask} />
          </Floating>
          <Floating
            {...shared}
            className="pointer-events-none absolute top-[477px] left-[calc(50%-536px*var(--s))] -z-10 hidden w-[calc(176px*var(--s))] lg:block"
            from={{ y: 160, rotate: 30 }}
            delay={0.55}
            depth={40}
            float="hero-float-b"
          >
            <Shape src={whiteMask} />
          </Floating>
          <Floating
            {...shared}
            className="pointer-events-none absolute top-[220px] right-0 -z-10 hidden w-[calc(213px*var(--s))] md:block"
            from={{ x: 220, rotate: 20 }}
            delay={0.45}
            depth={22}
            float="hero-float-c"
          >
            <Shape src={rightCone} />
          </Floating>
          <Floating
            {...shared}
            className="pointer-events-none absolute top-[464px] left-[calc(50%+384px*var(--s))] -z-10 hidden w-[calc(190px*var(--s))] lg:block"
            from={{ y: 160, rotate: -30 }}
            delay={0.65}
            depth={44}
            float="hero-float-a"
          >
            <Shape src={whiteRightCone} />
          </Floating>

          {/* ---------- Center content ---------- */}
          <div className="container-site relative z-20 text-center">
            <m.h1
              initial="hidden"
              animate="show"
              variants={wordsParent}
              aria-label={HEADLINE}
              className="mx-auto mt-8 max-w-[13em] font-heading text-[clamp(2.125rem,1rem+4.2vw,4.5rem)] leading-[1.15] font-semibold tracking-[-0.015em] text-balance text-white md:mt-12 md:leading-[1.2]"
            >
              {HEADLINE.split(" ").map((w, i) => (
                <m.span
                  key={`${w}-${i}`}
                  variants={word}
                  aria-hidden="true"
                  className="inline-block whitespace-pre"
                >
                  {w}
                  {i < HEADLINE.split(" ").length - 1 ? " " : ""}
                </m.span>
              ))}
            </m.h1>

            <m.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.55 }}
              className="mx-auto mt-4 max-w-[560px] font-body text-base leading-[1.6] text-neutral-100 sm:text-lg md:mt-8 lg:max-w-[700px] xl:max-w-[920px]"
            >
              Unlock your creativity, gain valuable knowledge, and grow your
              business with our wide range of courses.
            </m.p>

            <m.div
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.7 }}
            >
              <HeroSearch />
            </m.div>

            {/* Popular searches — quick entry points into the catalogue */}
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="mx-auto mt-5 flex max-w-[640px] flex-wrap items-center justify-center gap-2 text-sm"
            >
              <span className="text-white/70">Popular:</span>
              {POPULAR.map((p) => (
                <Link
                  key={p.q}
                  href={`/courses?q=${p.q}`}
                  className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-white backdrop-blur-sm transition-colors hover:border-secondary-400 hover:bg-secondary-400 hover:text-neutral-950"
                >
                  {p.label}
                </Link>
              ))}
            </m.div>
          </div>

          {/* ---------- Visual: ellipse + man + cards ---------- */}
          <div className="mt-10 flex justify-center md:mt-[68px]">
            <div className="hero-visual relative w-[max(100%,560px)] max-w-[1149px] shrink-0 sm:w-[max(100%,440px)]">
              <m.div
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, ease: EASE, delay: 0.3 }}
              >
                <Image
                  src={ellipse}
                  alt=""
                  aria-hidden="true"
                  sizes="(min-width: 1149px) 1149px, 100vw"
                  className="pointer-events-none size-full select-none"
                />
              </m.div>
              {/* Soft pulsing glow behind the man */}
              <span
                aria-hidden="true"
                className="hero-glow pointer-events-none absolute bottom-0 left-1/2 aspect-square w-[46%] -translate-x-1/2 rounded-full"
              />

              {/* Decorative shapes (bottom), positioned relative to the ellipse */}
              <Floating
                {...shared}
                className="pointer-events-none absolute top-[22.4%] left-[-11.36%] w-[29.94%]"
                from={{ x: -120, rotate: -20 }}
                delay={0.7}
                depth={18}
                float="hero-float-b"
              >
                <Shape src={whiteRoundMask} />
              </Floating>
              <Floating
                {...shared}
                className="pointer-events-none absolute top-[20.36%] left-[85.16%] w-[27.59%]"
                from={{ x: 120, rotate: 20 }}
                delay={0.75}
                depth={18}
                float="hero-float-c"
              >
                <Shape src={rightWhiteMask} />
              </Floating>

              <m.div
                className="absolute bottom-0 left-[23.02%] w-[62.84%]"
                initial={{ opacity: 0, y: 80 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.1, ease: EASE, delay: 0.4 }}
              >
                <Image
                  src={manImage}
                  alt="Smiling student with headphones holding a laptop"
                  sizes="(min-width: 1149px) 722px, (min-width: 640px) 63vw, 352px"
                  loading="eager"
                  fetchPriority="high"
                  className="h-auto w-full select-none"
                />
              </m.div>

              {/* Card: UI/UX Design */}
              <Floating
                {...shared}
                className="absolute top-[12.9%] left-[22.5%] z-10"
                from={{ x: -60, y: -20, scale: 0.7 }}
                delay={0.85}
                depth={12}
                float="hero-float-c"
              >
                <div className="w-[208px] origin-top-left scale-[0.62] rounded-2xl bg-white px-4 pt-4 pb-[17px] text-left shadow-card sm:scale-[0.7] md:scale-[0.8] lg:scale-90 xl:scale-100">
                  <p className="font-body text-base leading-[1.2] text-neutral-950">
                    UI/UX Design
                  </p>
                  <p className="mt-1 flex items-center gap-2 font-body text-xs leading-[1.2] text-neutral-400">
                    <span>
                      <CountUp value={200} /> Courses
                    </span>
                    <span className="size-[3px] rounded-full bg-neutral-400" />
                    <span>
                      <CountUp value={1000} suffix="+" duration={1.9} />{" "}
                      Students
                    </span>
                  </p>
                </div>
              </Floating>

              {/* Card: Learning Progress */}
              <Floating
                {...shared}
                className="absolute top-[15.61%] right-[19.19%] z-10"
                from={{ x: 60, y: -20, scale: 0.7 }}
                delay={0.95}
                depth={14}
                float="hero-float-a"
              >
                <div className="w-[232px] origin-top-right scale-[0.62] rounded-2xl bg-white p-4 text-left shadow-card sm:scale-[0.7] md:scale-[0.8] lg:scale-90 xl:scale-100">
                  <p className="font-body text-sm leading-[1.2] text-neutral-950">
                    Learning Progress
                  </p>
                  <p className="mt-[11px] font-heading text-5xl leading-[1.2] font-medium text-neutral-950">
                    <CountUp value={55} suffix="%" />
                  </p>
                  <div
                    className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-neutral-50"
                    role="progressbar"
                    aria-label="Learning progress"
                    aria-valuenow={55}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    {/* Fills in step with the 55% counter (same delay, duration, easing). */}
                    <m.div
                      className="h-full rounded-full bg-secondary-400"
                      initial={{ width: "0%" }}
                      animate={{ width: "56%" }}
                      transition={{
                        duration: COUNT_DURATION,
                        ease: EASE,
                        delay: CARDS_IN_AT,
                      }}
                    />
                  </div>
                </div>
              </Floating>

              {/* Card: Happy Students */}
              <Floating
                {...shared}
                className="absolute top-[57.69%] left-[18%] z-10 sm:left-[15.88%]"
                from={{ x: -60, y: 30, scale: 0.7 }}
                delay={1.05}
                depth={16}
                float="hero-float-b"
              >
                <div className="w-[258px] origin-top-left scale-[0.62] rounded-2xl bg-white px-4 pt-4 pb-3.5 text-left shadow-card sm:scale-[0.7] md:scale-[0.8] lg:scale-90 xl:scale-100">
                  <p className="font-body text-base leading-[1.2] text-neutral-950">
                    Happy Students
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 font-body text-xs leading-[1.2] text-neutral-950">
                    <CountUp value={4.5} decimals={1} />{" "}
                    <span className="text-neutral-400">
                      (<CountUp value={240} />)
                    </span>
                    <span className="text-secondary-400">
                      <StarIcon />
                    </span>
                  </p>
                  <div className="relative mt-2 h-[47px] w-[233px]">
                    <Image
                      src={happyStudents}
                      alt="Happy students"
                      className="h-[47px] w-[192px]"
                    />
                    <span className="absolute top-0.5 left-[190px] flex size-[43px] items-center justify-center rounded-full bg-secondary-400 font-body text-xs font-bold text-neutral-950">
                      <CountUp value={2} suffix="K+" duration={1.2} />
                    </span>
                  </div>
                </div>
              </Floating>
            </div>
          </div>
        </section>
      </MotionConfig>
    </LazyMotion>
  );
};

export default HeroSection;
