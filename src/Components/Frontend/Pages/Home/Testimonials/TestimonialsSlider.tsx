"use client";

import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Autoplay, Keyboard } from "swiper/modules";
import type { Swiper as SwiperInstance } from "swiper";
import { LazyMotion, MotionConfig, domAnimation, m, type Variants } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ITestimonial } from "@/app/types";
import UserAvatar from "../../../Shared/UserAvatar";
import "swiper/css";
import "./Testimonials.css";

const EASE = [0.22, 1, 0.36, 1] as const;

const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } };
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

export default function TestimonialsSlider({ items }: { items: ITestimonial[] }) {
  const [swiper, setSwiper] = useState<SwiperInstance | null>(null);
  const [active, setActive] = useState(0);
  const [perView, setPerView] = useState(1);

  // Loop only when there's more to show than fits; otherwise it duplicates slides.
  const loop = items.length > 3;
  const scrollable = items.length > perView;
  const pages = Math.max(1, loop ? items.length : items.length - perView + 1);

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <section aria-labelledby="testimonials-heading" className="tm-section relative isolate overflow-hidden py-16 md:py-20">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
            <span className="tm-glow tm-glow--lime-center" />
            <span className="tm-glow tm-glow--lime-right" />
            <span className="tm-glow tm-glow--blue-left" />
          </div>

          <div className="container-site">
            {/* Header */}
            <m.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.4 }}
              variants={stagger}
              className="grid items-center gap-6 lg:grid-cols-[1fr_572px] lg:gap-10"
            >
              <m.h2
                id="testimonials-heading"
                variants={fadeUp}
                className="max-w-[520px] font-heading text-[clamp(1.875rem,1.3rem+2.2vw,2.75rem)] leading-[1.2] font-semibold tracking-[-0.01em] text-neutral-950"
              >
                Discover What Our Community Is Saying
              </m.h2>
              <m.p variants={fadeUp} className="text-base leading-[1.6] text-neutral-600 md:text-lg">
                At ByteSpace, our vibrant community of learners and creators is at the heart of what we do. Hear directly
                from those who have experienced the transformative journey of learning and creating on our platform.
                Explore testimonials that reflect the diverse perspectives of enthusiastic learners and accomplished
                creators.
              </m.p>
            </m.div>

            {/* Slider */}
            <m.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.15 }}
              className="mt-12 md:mt-[76px]"
            >
              <Swiper
                modules={[A11y, Autoplay, Keyboard]}
                className="tm-swiper !overflow-visible"
                onSwiper={setSwiper}
                onSlideChange={(s) => setActive(loop ? s.realIndex : s.activeIndex)}
                onBreakpoint={(s) => setPerView(Number(s.params.slidesPerView) || 1)}
                onInit={(s) => setPerView(Number(s.params.slidesPerView) || 1)}
                loop={loop}
                speed={700}
                grabCursor
                keyboard={{ enabled: true, onlyInViewport: true }}
                autoplay={items.length > 1 ? { delay: 5500, disableOnInteraction: false, pauseOnMouseEnter: true } : false}
                a11y={{ prevSlideMessage: "Previous testimonial", nextSlideMessage: "Next testimonial" }}
                slidesPerView={1}
                spaceBetween={20}
                breakpoints={{
                  768: { slidesPerView: 2, spaceBetween: 24 },
                  1024: { slidesPerView: 3, spaceBetween: 40 },
                }}
              >
                {items.map((t) => (
                  <SwiperSlide key={t._id} className="!h-auto">
                    <TestimonialCard item={t} />
                  </SwiperSlide>
                ))}
              </Swiper>

              {/* Controls — only when there is something to scroll to */}
              {scrollable && (
                <div className="mt-10 flex items-center justify-center gap-5">
                  <ArrowButton label="Previous testimonial" onClick={() => swiper?.slidePrev()} disabled={!loop && active === 0}>
                    <ChevronLeft className="size-5" />
                  </ArrowButton>
                  <div className="flex items-center gap-2" role="tablist" aria-label="Choose testimonial">
                    {Array.from({ length: pages }, (_, i) => (
                      <button
                        key={i}
                        type="button"
                        role="tab"
                        aria-selected={i === active}
                        aria-label={`Show testimonial ${i + 1}`}
                        onClick={() => (loop ? swiper?.slideToLoop(i) : swiper?.slideTo(i))}
                        className={`h-2 cursor-pointer rounded-full transition-all duration-500 ${
                          i === active ? "w-8 bg-primary-600" : "w-2 bg-neutral-300 hover:bg-neutral-400"
                        }`}
                      />
                    ))}
                  </div>
                  <ArrowButton label="Next testimonial" onClick={() => swiper?.slideNext()} disabled={!loop && active >= pages - 1}>
                    <ChevronRight className="size-5" />
                  </ArrowButton>
                </div>
              )}
            </m.div>
          </div>
        </section>
      </MotionConfig>
    </LazyMotion>
  );
}

function TestimonialCard({ item }: { item: ITestimonial }) {
  return (
    <figure className="group flex flex-col rounded-3xl bg-white p-6 shadow-[0_1px_2px_rgb(36_37_40/0.04)] transition-shadow duration-300 hover:shadow-card-hover">
      <UserAvatar name={item.name} src={item.avatar} size={80} />
      <figcaption className="mt-6">
        <p className="font-heading text-xl font-semibold text-neutral-950">{item.name}</p>
        {item.role && <p className="mt-1 text-lg text-primary-600">{item.role}</p>}
      </figcaption>
      <blockquote className="mt-6 text-lg leading-[1.6] text-neutral-600">&ldquo;{item.quote}&rdquo;</blockquote>
    </figure>
  );
}

function ArrowButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="grid size-11 cursor-pointer place-items-center rounded-full border border-neutral-200 bg-white text-neutral-950 transition-all hover:border-neutral-950 hover:bg-neutral-950 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-neutral-200 disabled:hover:bg-white disabled:hover:text-neutral-950"
    >
      {children}
    </button>
  );
}
