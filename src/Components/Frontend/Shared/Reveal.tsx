"use client";

import { LazyMotion, MotionConfig, domAnimation, m } from "motion/react";

/**
 * Fades + lifts its children in the first time they scroll into view.
 * Lets otherwise-static Server Component pages get the site's motion.
 */
export default function Reveal({
  children,
  delay = 0,
  y = 24,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article";
}) {
  const Tag = m[as];
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <Tag
          className={className}
          initial={{ opacity: 0, y }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }}
        >
          {children}
        </Tag>
      </MotionConfig>
    </LazyMotion>
  );
}
