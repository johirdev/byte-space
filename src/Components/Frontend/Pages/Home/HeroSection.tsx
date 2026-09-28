import Image from "next/image";

import ellipse from "@/assets/hero/Ellipse.png";
import happyStudents from "@/assets/hero/happy-students.png";
import leftMask from "@/assets/hero/left-site-Mask.png";
import manImage from "@/assets/hero/man-image.png";
import rightCone from "@/assets/hero/right-site-Cone.png";
import rightWhiteMask from "@/assets/hero/right-site-white-mask.png";
import whiteMask from "@/assets/hero/white-Mask.png";
import whiteRightCone from "@/assets/hero/white-right-site-Cone.png";
import whiteRoundMask from "@/assets/hero/white-round-Mask.png";

import "./HeroSection.css";

/*
 * Positions below are taken 1:1 from the 1440 × 1024 design
 * (claude/pages/HeroSection/Hero_page.png).
 * Decorative shapes are multiplied by --s so they shrink on smaller screens
 * (1 on xl, 0.8 lg, 0.65 md, 0.5 sm, 0.4 mobile).
 */

const SearchIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <circle cx="7.5" cy="7.5" r="6" />
    <path d="M12 12l4.5 4.5" />
  </svg>
);

const StarIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 1.5l3.1 6.6 7.2.9-5.3 5 1.4 7.2L12 17.6l-6.4 3.6 1.4-7.2-5.3-5 7.2-.9z" />
  </svg>
);

const HeroSection = () => {
  return (
    <section className="hero-grid relative isolate overflow-hidden pt-18 md:pt-30 md:[--s:0.5] lg:[--s:0.8] xl:[--s:1]">
      {/* ---------- Decorative shapes (top) ---------- */}
      <Image
        src={leftMask}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute top-[221px] left-0 -z-10 hidden md:block h-auto w-[calc(266px*var(--s))] select-none"
      />
      <Image
        src={whiteMask}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute top-[477px] left-[calc(50%-536px*var(--s))] -z-10 hidden lg:block h-auto w-[calc(176px*var(--s))] select-none"
      />
      <Image
        src={rightCone}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute top-[220px] right-0 -z-10 hidden md:block h-auto w-[calc(213px*var(--s))] select-none"
      />
      <Image
        src={whiteRightCone}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute top-[464px] left-[calc(50%+384px*var(--s))] -z-10 hidden lg:block h-auto w-[calc(190px*var(--s))] select-none"
      />

      {/* ---------- Center content ---------- */}
      <div className="container-site relative z-20 text-center">
        <h1 className="mx-auto mt-8 max-w-[13em] font-heading text-[clamp(2rem,1rem+4.2vw,4.5rem)] leading-[1.2] font-semibold tracking-[-0.015em] text-balance text-white md:mt-12">
          Get Access to Hundreds Courses Available
        </h1>

        <p className="mx-auto mt-4 max-w-[560px] font-body lg:max-w-[700px] xl:max-w-[920px] text-base leading-[1.6] text-neutral-100 sm:text-lg md:mt-8">
          Unlock your creativity, gain valuable knowledge, and grow your business
          with our wide range of courses.
        </p>

        <form
          action="/courses"
          role="search"
          className="mx-auto mt-8 flex max-w-[580px] items-start justify-center gap-2 sm:gap-[18px] md:mt-[60px]"
        >
          <label className="relative block min-w-0 flex-1 sm:max-w-[460px]">
            <span className="sr-only">Search courses</span>
            <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-neutral-400 sm:left-[27px]">
              <SearchIcon />
            </span>
            <input
              type="search"
              name="q"
              placeholder="Course, topic, creator"
              className="h-[52px] w-full rounded-full bg-white pr-5 pl-11 font-body text-base text-neutral-950 outline-none placeholder:text-neutral-400 focus-visible:ring-4 focus-visible:ring-secondary-400/60 sm:pr-6 sm:pl-14 sm:text-lg"
            />
          </label>
          <button
            type="submit"
            className="h-[52px] shrink-0 cursor-pointer rounded-full bg-secondary-400 px-5 font-body text-base font-medium text-neutral-950 transition-colors hover:bg-secondary-300 focus-visible:ring-4 focus-visible:ring-white/60 focus-visible:outline-none sm:h-[46px] sm:px-6 sm:text-lg"
          >
            Search
          </button>
        </form>
      </div>

      {/* ---------- Visual: ellipse + man + cards ---------- */}
      <div className="mt-14 flex justify-center md:mt-[68px]">
        <div className="hero-visual relative w-[max(100%,440px)] max-w-[1149px] shrink-0">
          <Image
            src={ellipse}
            alt=""
            aria-hidden="true"
            sizes="(min-width: 1149px) 1149px, 100vw"
            className="pointer-events-none absolute inset-0 size-full select-none"
          />

          {/* Decorative shapes (bottom), positioned relative to the ellipse */}
          <Image
            src={whiteRoundMask}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute top-[22.4%] left-[-11.36%] h-auto w-[29.94%] select-none"
          />
          <Image
            src={rightWhiteMask}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute top-[20.36%] left-[85.16%] h-auto w-[27.59%] select-none"
          />

          <Image
            src={manImage}
            alt="Smiling student with headphones holding a laptop"
            sizes="(min-width: 1149px) 722px, 63vw"
            loading="eager"
            fetchPriority="high"
            className="absolute bottom-0 left-[23.02%] h-auto w-[62.84%] select-none"
          />

          {/* Card: UI/UX Design */}
          <div className="absolute top-[12.9%] left-[22.5%] w-[208px] origin-top-left scale-[0.55] rounded-2xl bg-white px-4 pt-4 pb-[17px] text-left shadow-card sm:scale-[0.7] md:scale-[0.8] lg:scale-90 xl:scale-100">
            <p className="font-body text-base leading-[1.2] text-neutral-950">
              UI/UX Design
            </p>
            <p className="mt-1 flex items-center gap-2 font-body text-xs leading-[1.2] text-neutral-400">
              <span>200 Courses</span>
              <span className="size-[3px] rounded-full bg-neutral-400" />
              <span>1000+ Students</span>
            </p>
          </div>

          {/* Card: Learning Progress */}
          <div className="absolute top-[15.61%] right-[19.19%] w-[232px] origin-top-right scale-[0.55] rounded-2xl bg-white p-4 text-left shadow-card sm:scale-[0.7] md:scale-[0.8] lg:scale-90 xl:scale-100">
            <p className="font-body text-sm leading-[1.2] text-neutral-950">
              Learning Progress
            </p>
            <p className="mt-[11px] font-heading text-5xl leading-[1.2] font-medium text-neutral-950">
              55%
            </p>
            <div
              className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-neutral-50"
              role="progressbar"
              aria-label="Learning progress"
              aria-valuenow={55}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="h-full w-[56%] rounded-full bg-secondary-400" />
            </div>
          </div>

          {/* Card: Happy Students */}
          <div className="absolute top-[57.69%] left-[15.88%] w-[258px] origin-top-left scale-[0.55] rounded-2xl bg-white px-4 pt-4 pb-3.5 text-left shadow-card sm:scale-[0.7] md:scale-[0.8] lg:scale-90 xl:scale-100">
            <p className="font-body text-base leading-[1.2] text-neutral-950">
              Happy Students
            </p>
            <p className="mt-0.5 flex items-center gap-1 font-body text-xs leading-[1.2] text-neutral-950">
              4.5 <span className="text-neutral-400">(240)</span>
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
                2K+
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
