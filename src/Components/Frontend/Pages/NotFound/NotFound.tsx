import Link from "next/link";
import Navbar from "@/Layout/Navbar/Navbar";
import SiteProviders from "@/Layout/SiteProviders";

/**
 * 404 (claude/404/404.png), built 1:1 against the 1440px frame:
 *  - "404" is 480px Poppins (glyphs span y 224→560), scaling as 33.3vw below 1440.
 *  - The 72px headline overlaps the numerals by 113px → -0.235em of the 404 size.
 */
export default function NotFound() {
  return (
    <SiteProviders>
      <div className="relative">
        <Navbar />
        <main className="bg-hero-grid flex min-h-screen flex-col items-center overflow-hidden px-4 pt-[104px] pb-24 text-center md:pt-[152px] md:pb-[125px]">
          <p
            aria-hidden="true"
            className="bs-404-digits mb-[-0.235em] font-heading text-[clamp(9rem,33.3vw,30rem)] leading-none font-semibold tracking-[-0.02em] select-none"
          >
            404
          </p>

          <h1 className="relative z-10 max-w-[920px] font-heading text-[clamp(2.25rem,1.2rem+4.2vw,4.5rem)] leading-[1.2] font-semibold tracking-[-0.01em] text-balance text-white">
            <span className="sr-only">Error 404: </span>
            The page you are looking for doesn&rsquo;t exist
          </h1>

          <p className="relative z-10 mt-6 text-base leading-[1.6] text-white md:mt-9 md:text-lg">
            Try to use a correct url or go back to homepage to start again
          </p>

          <Link
            href="/"
            className="relative z-10 mt-8 inline-flex h-[46px] items-center rounded-full bg-secondary-400 px-6 text-lg font-medium text-neutral-950 transition-colors hover:bg-secondary-300 focus-visible:ring-4 focus-visible:ring-white/60 focus-visible:outline-none"
          >
            Back to Home
          </Link>
        </main>
      </div>
    </SiteProviders>
  );
}
