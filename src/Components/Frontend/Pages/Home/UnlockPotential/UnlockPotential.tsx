"use client";

import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import {
  LazyMotion,
  MotionConfig,
  domAnimation,
  m,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
  type Variants,
} from "motion/react";
import limeSquiggleTop from "@/assets/UnlockPotential/left-site-secondary-500-shap.png";
import whiteSquiggle from "@/assets/UnlockPotential/left-site-white-dash-dash.png";
import whiteConeLeft from "@/assets/UnlockPotential/Cone-white.png";
import limeTorus from "@/assets/UnlockPotential/Cone-buttom.png";
import limePyramid from "@/assets/UnlockPotential/right-site-Cone.png";
import whiteCylinder from "@/assets/UnlockPotential/right-site-white-Cone.png";
import limeSquiggleBottom from "@/assets/UnlockPotential/right-site-bottom-secandary-color-dashdash.png";
import "./UnlockPotential.css";

type Edge = { left?: number; right?: number; top?: number; bottom?: number };

type Shape = {
  src: StaticImageData;
  /** Offsets from the section edges, in px on the 1440 × 488 Figma frame. */
  at: Edge;
  /** Where it flies in from (px / deg). */
  from: { x?: number; y?: number; rotate?: number };
  /** Mouse-parallax strength (px at the pointer's extreme). */
  depth: number;
  float: string;
  /** Inner shapes would cover the heading on phones. */
  hideOnMobile?: boolean;
};

// Assets are exported pre-cropped to the frame, so each sits flush to its edges.
const SHAPES: Shape[] = [
  { src: limeSquiggleTop, at: { left: 0, top: 0 }, from: { x: -140, y: -90, rotate: -24 }, depth: 18, float: "up-float-a" },
  { src: whiteSquiggle, at: { left: 182, top: 7 }, from: { y: -120, rotate: 28 }, depth: 30, float: "up-float-b", hideOnMobile: true },
  { src: whiteConeLeft, at: { left: 0, top: 214 }, from: { x: -150, rotate: -32 }, depth: 22, float: "up-float-c" },
  { src: limeTorus, at: { left: 16, bottom: 0 }, from: { y: 170, rotate: 36 }, depth: 14, float: "up-float-b" },
  { src: limePyramid, at: { right: 165, top: 2 }, from: { y: -130, rotate: 32 }, depth: 34, float: "up-float-c", hideOnMobile: true },
  { src: whiteCylinder, at: { right: 0, top: 6 }, from: { x: 170, rotate: 18 }, depth: 16, float: "up-float-a" },
  { src: limeSquiggleBottom, at: { right: 0, bottom: 0 }, from: { y: 170, rotate: -26 }, depth: 20, float: "up-float-c" },
];

const EASE = [0.22, 1, 0.36, 1] as const;

const textStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.25 } },
};
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

/** Scales a Figma px value by the section's --s (1 at xl, smaller below). */
const scaled = (px: number) => `calc(${px}px * var(--s))`;

function FloatingShape({
  shape,
  index,
  pointerX,
  pointerY,
}: {
  shape: Shape;
  index: number;
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
}) {
  // Pointer is -0.5…0.5; deeper shapes travel further, opposite the cursor.
  const x = useTransform(pointerX, (v) => v * -shape.depth);
  const y = useTransform(pointerY, (v) => v * -shape.depth);

  const position: React.CSSProperties = {
    width: scaled(shape.src.width),
    ...(shape.at.left !== undefined && { left: scaled(shape.at.left) }),
    ...(shape.at.right !== undefined && { right: scaled(shape.at.right) }),
    ...(shape.at.top !== undefined && { top: scaled(shape.at.top) }),
    ...(shape.at.bottom !== undefined && { bottom: scaled(shape.at.bottom) }),
  };

  return (
    <m.div
      aria-hidden="true"
      className={`pointer-events-none absolute ${shape.hideOnMobile ? "hidden md:block" : ""}`}
      style={position}
      variants={{
        hidden: { opacity: 0, scale: 0.55, x: shape.from.x ?? 0, y: shape.from.y ?? 0, rotate: shape.from.rotate ?? 0 },
        show: {
          opacity: 1,
          scale: 1,
          x: 0,
          y: 0,
          rotate: 0,
          transition: { type: "spring", stiffness: 60, damping: 13, mass: 0.9, delay: 0.08 * index },
        },
      }}
    >
      <m.div style={{ x, y }}>
        <div className={shape.float}>
          <Image src={shape.src} alt="" draggable={false} sizes={`${shape.src.width}px`} className="h-auto w-full select-none" />
        </div>
      </m.div>
    </m.div>
  );
}

/**
 * "Unlock Your Potential as a Creator with ByteSpace" (claude/UnlockPotential),
 * 1440 × 488 frame. Shapes spring in from their edges, float, and follow the
 * mouse with depth parallax on desktop.
 */
const UnlockPotential = () => {
  const reduce = useReducedMotion();
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const pointerX = useSpring(rawX, { stiffness: 60, damping: 18 });
  const pointerY = useSpring(rawY, { stiffness: 60, damping: 18 });

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

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <m.section
          aria-labelledby="unlock-heading"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
          className="bg-hero-grid relative isolate overflow-hidden [--s:0.45] sm:[--s:0.6] md:[--s:0.72] lg:[--s:0.86] xl:[--s:1]"
        >
          {SHAPES.map((shape, i) => (
            <FloatingShape key={shape.src.src} shape={shape} index={i} pointerX={pointerX} pointerY={pointerY} />
          ))}

          <m.div
            variants={textStagger}
            className="relative z-10 container-site flex flex-col items-center py-24 text-center sm:py-28 md:pt-[83px] md:pb-[84px]"
          >
            <m.h2
              id="unlock-heading"
              variants={fadeUp}
              className="max-w-[600px] font-heading text-[clamp(1.75rem,1.2rem+2.2vw,2.75rem)] leading-[1.2] font-semibold tracking-[-0.01em] text-balance text-white md:text-wrap"
            >
              Unlock Your Potential as a Creator with ByteSpace
            </m.h2>
            <m.p
              variants={fadeUp}
              className="mt-6 max-w-[960px] text-base leading-[1.6] text-white/95 md:mt-[42px] md:text-lg"
            >
              Experience the collaboration of numerous creators and an expanding selection of courses. Register now and
              become a part of a community comprising over 10,000 local and international creators. Utilize our Course
              Editor, and showcase your expertise by publishing your finest course on the ByteSpace Course Library.
            </m.p>
            <m.div variants={fadeUp} className="mt-8 md:mt-10">
              <Link
                href="/register?next=/creator-profile"
                className="group inline-flex h-[46px] items-center rounded-full bg-secondary-400 px-6 text-lg font-medium text-neutral-950 shadow-[0_10px_30px_-10px_rgb(203_252_1/0.7)] transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-secondary-300 focus-visible:ring-4 focus-visible:ring-white/60 focus-visible:outline-none"
              >
                Join as Creator
              </Link>
            </m.div>
          </m.div>
        </m.section>
      </MotionConfig>
    </LazyMotion>
  );
};

export default UnlockPotential;
