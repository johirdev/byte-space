"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  LazyMotion,
  MotionConfig,
  animate,
  domAnimation,
  m,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from "motion/react";
import { CircleCheck } from "lucide-react";
import manImage from "@/assets/ProfessionalGrowth/first-man-section-image.png";
import womanImage from "@/assets/ProfessionalGrowth/first-woman-section-image.png";
import "./ProfessionalGrowth.css";

const STATS = [
  { value: 12, suffix: "K", label: "Students" },
  { value: 70, suffix: "+", label: "Courses" },
  { value: 16, suffix: "", label: "Creators" },
];

const FEATURES = ["Share Your Expertise", "Monetize Your Passion", "Flexibility and Autonomy", "Build a Community"];

const EASE = [0.22, 1, 0.36, 1] as const;

/** Parent: reveals its children one after another. */
const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

const imageIn: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: 40 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.9, ease: EASE } },
};

/** Counts from 0 to `value` the first time it scrolls into view. */
function CountUp({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: reduce ? 0 : 1.6,
      ease: EASE,
      onUpdate: (v) => setShown(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, value, reduce]);

  return (
    <span ref={ref} className="tabular-nums">
      {shown}
      {suffix}
    </span>
  );
}

/** Image that fades/scales in, drifts on scroll (parallax) and floats gently. */
function FloatingImage({
  src,
  alt,
  sizes,
  className,
  float = "pg-float",
}: {
  src: typeof manImage;
  alt: string;
  sizes: string;
  className?: string;
  float?: "pg-float" | "pg-float-alt";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [36, -36]);

  return (
    <m.div ref={ref} variants={imageIn} style={{ y }} className={className}>
      <div className={float}>
        <Image src={src} alt={alt} sizes={sizes} className="h-auto w-full select-none" draggable={false} />
      </div>
    </m.div>
  );
}

/**
 * "Your Path to Professional Growth" + "Create & Manage Courses Easily"
 * (claude/ProfessionalGrowth). Positions follow the 1440px Figma frame 1:1.
 */
export const ProfessionalGrowth = () => {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <section aria-labelledby="growth-heading" className="pg-section relative isolate overflow-hidden">
          {/* Drifting gradient glows */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
            <span className="pg-blob pg-blob--lime-top" />
            <span className="pg-blob pg-blob--lavender-top" />
            <span className="pg-blob pg-blob--blue-left" />
            <span className="pg-blob pg-blob--lime-bottom" />
            <span className="pg-blob pg-blob--blue-bottom" />
          </div>

          <div className="container-site pt-16 md:pt-24 xl:pt-[120px]">
            {/* ── Row 1: learners ───────────────────────────── */}
            <m.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.25 }}
              variants={stagger}
              className="grid items-start gap-10 lg:grid-cols-2 lg:gap-8"
            >
              <div className="lg:pt-[50px] xl:pt-[70px]">
                <m.h2
                  id="growth-heading"
                  variants={fadeUp}
                  className="max-w-[560px] font-heading text-[clamp(1.875rem,1.3rem+2.2vw,2.75rem)] leading-[1.2] font-semibold tracking-[-0.01em] text-neutral-950"
                >
                  Your Path to Professional Growth Starts Here!
                </m.h2>
                <m.p variants={fadeUp} className="mt-6 max-w-[480px] text-base leading-[1.6] text-neutral-600 md:mt-12 md:text-lg">
                  Explore our curated selection of courses tailored to enhance your capabilities and accelerate your
                  career journey. Whether you are looking to sharpen specific skills, gain industry expertise, or embark on
                  a new career path entirely, we have the resources you need.
                </m.p>

                <m.dl variants={fadeUp} className="mt-10 flex flex-wrap gap-x-14 gap-y-6 md:mt-12">
                  {STATS.map((stat) => (
                    <div key={stat.label} className="flex flex-col-reverse">
                      <dt className="mt-1 text-base text-neutral-700 md:text-lg">{stat.label}</dt>
                      <dd className="font-heading text-[2rem] leading-none font-medium text-primary-600 md:text-4xl">
                        <CountUp value={stat.value} suffix={stat.suffix} />
                      </dd>
                    </div>
                  ))}
                </m.dl>
              </div>

              <FloatingImage
                src={manImage}
                alt="Smiling learner with headphones holding a laptop, next to a course card and a 55% learning-progress card"
                sizes="(min-width: 1280px) 703px, (min-width: 1024px) 50vw, 90vw"
                className="mx-auto w-full max-w-[560px] lg:max-w-none xl:-mr-[119px] xl:w-[min(703px,calc(100%+119px))]"
              />
            </m.div>

            {/* ── Row 2: creators ───────────────────────────── */}
            <m.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.25 }}
              variants={stagger}
              className="mt-16 grid items-center gap-10 lg:mt-0 lg:grid-cols-2 lg:gap-8 xl:-mt-[76px] xl:grid-cols-[587px_1fr] xl:gap-[34px]"
            >
              <FloatingImage
                src={womanImage}
                alt="Smiling creator with a headset holding a tablet, with revenue and happy-students cards"
                sizes="(min-width: 1280px) 587px, (min-width: 1024px) 50vw, 90vw"
                float="pg-float-alt"
                className="order-2 mx-auto w-full max-w-[480px] lg:order-1 lg:max-w-none"
              />

              <div className="order-1 lg:order-2 lg:pb-[60px] xl:pb-[90px]">
                <m.h2
                  variants={fadeUp}
                  className="max-w-[440px] font-heading text-[clamp(1.875rem,1.3rem+2.2vw,2.75rem)] leading-[1.2] font-semibold tracking-[-0.01em] text-neutral-950"
                >
                  Create &amp; Manage Courses Easily.
                </m.h2>
                <m.p variants={fadeUp} className="mt-6 max-w-[560px] text-base leading-[1.6] text-neutral-600 md:mt-12 md:text-lg">
                  <strong className="font-semibold text-neutral-950">ByteSpace</strong> supports individuals or entities in
                  the creation, publication, and administration of educational courses.
                </m.p>

                <m.ul variants={stagger} className="mt-8 space-y-4 md:mt-12">
                  {FEATURES.map((feature) => (
                    <m.li key={feature} variants={fadeUp} className="flex items-center gap-3 text-base text-neutral-950 md:text-lg">
                      <CircleCheck className="size-5 shrink-0 fill-primary-600 text-white" aria-hidden="true" />
                      {feature}
                    </m.li>
                  ))}
                </m.ul>
              </div>
            </m.div>
          </div>
        </section>
      </MotionConfig>
    </LazyMotion>
  );
};

export default ProfessionalGrowth;
