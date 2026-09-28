"use client";

import { useSyncExternalStore } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, FreeMode, A11y } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import "./TrustedBrand.css";

import logo1 from "@/assets/TrustedBrand/logo1.png";
import logo2 from "@/assets/TrustedBrand/logo2.png";
import logo3 from "@/assets/TrustedBrand/logo3.png";
import logo4 from "@/assets/TrustedBrand/logo4.png";
import logo5 from "@/assets/TrustedBrand/logo5.png";

const LOGOS = [logo1, logo2, logo3, logo4, logo5];

// Loop mode needs more slides than are visible at once, so the set repeats.
const SLIDES = [...LOGOS, ...LOGOS, ...LOGOS];

/** Full cycle speed: ms to glide one slide width. Higher = slower. */
const SPEED = 4500;

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(reducedMotionQuery);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/** Honour the OS "reduce motion" setting (no auto-scroll, still draggable). */
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(reducedMotionQuery).matches,
    () => false,
  );
}

/**
 * "Trusted by" logo strip (claude/TrustedBrand/TrustedBrand.png).
 * A continuous, linear marquee that pauses on hover, and can be dragged or
 * flicked on touch and mouse.
 */
const TrustedBrand = () => {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <section aria-labelledby="trusted-heading" className="bg-neutral-50">
      <h2 id="trusted-heading" className="sr-only">
        Trusted by leading brands
      </h2>

      <div className="container-site py-12 md:py-[80px]">
        <Swiper
          key={reducedMotion ? "static" : "marquee"}
          modules={[Autoplay, FreeMode, A11y]}
          className="trusted-swiper"
          loop
          grabCursor
          allowTouchMove
          speed={reducedMotion ? 400 : SPEED}
          freeMode={{ enabled: true, momentum: true, momentumRatio: 0.6, sticky: false }}
          autoplay={
            reducedMotion
              ? false
              : { delay: 0, disableOnInteraction: false, pauseOnMouseEnter: true }
          }
          a11y={{ enabled: true, slideRole: "listitem", containerRole: "list", containerRoleDescriptionMessage: "brand logos" }}
          slidesPerView={2}
          spaceBetween={24}
          breakpoints={{
            480: { slidesPerView: 3, spaceBetween: 24 },
            768: { slidesPerView: 4, spaceBetween: 32 },
            1024: { slidesPerView: 5, spaceBetween: 40 },
          }}
        >
          {SLIDES.map((logo, i) => (
            <SwiperSlide key={i} className="!flex items-center justify-center">
              <Image
                src={logo}
                alt={`Trusted partner ${(i % LOGOS.length) + 1}`}
                draggable={false}
                sizes="170px"
                className="h-[34px] w-auto opacity-80 transition-opacity duration-300 select-none hover:opacity-100 md:h-[41px]"
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};

export default TrustedBrand;
