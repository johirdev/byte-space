import Link from "next/link";
import {
  Building2,
  LaptopMinimal,
  Megaphone,
  PencilRuler,
  SquareUserRound,
  type LucideIcon,
} from "lucide-react";

/** Phone with a </> glyph — lucide has no "smartphone-code" icon. */
const DevelopmentIcon: LucideIcon = (({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <rect x="5" y="2" width="14" height="20" rx="2.5" />
    <path d="M10 9.5 8 12l2 2.5M14 9.5l2 2.5-2 2.5" />
    <path d="M11 18.5h2" />
  </svg>
)) as unknown as LucideIcon;

type Path = { label: string; icon: LucideIcon; href: string };

/** Top-level learning paths; each opens the course search for that field. */
const PATHS: Path[] = [
  { label: "Design", icon: PencilRuler, href: "/courses?q=design" },
  { label: "Development", icon: DevelopmentIcon, href: "/courses?q=development" },
  { label: "IT & Software", icon: LaptopMinimal, href: "/courses?q=software" },
  { label: "Business", icon: Building2, href: "/courses?q=business" },
  { label: "Marketing", icon: Megaphone, href: "/courses?q=marketing" },
  { label: "Photography", icon: SquareUserRound, href: "/courses?q=photography" },
];

/**
 * "Explore Diverse Learning Paths at Bytespace" (claude/DiverseLearningPath).
 * Desktop: one row of six 167px tiles, 40px apart (1202px, per Figma).
 * Tablet: 3 per row. Mobile: 2 per row.
 */
export const DiverseLearningPath = () => {
  return (
    <section aria-labelledby="paths-heading" className="bg-white pb-16 md:pb-[100px] xl:pb-[120px]">
      <div className="container-site">
        <div className="mx-auto max-w-[940px] text-center">
          <h2
            id="paths-heading"
            className="font-heading text-[clamp(1.625rem,1.2rem+1.6vw,2.25rem)] leading-[1.2] font-semibold tracking-[-0.01em] text-balance text-neutral-950"
          >
            Explore Diverse Learning Paths at Bytespace
          </h2>
          <p className="mx-auto mt-4 text-base leading-[1.6] text-neutral-500 md:text-lg">
            At Bytespace, we believe in empowering individuals through knowledge. Our diverse range of courses spans
            various fields, ensuring there&apos;s something for everyone. Unleash your potential and explore our
            carefully curated categories.
          </p>
        </div>

        <ul className="mx-auto mt-10 grid max-w-[1202px] grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:mt-[72px] lg:grid-cols-6 lg:gap-6 xl:gap-10">
          {PATHS.map(({ label, icon: Icon, href }) => (
            <li key={label}>
              <Link
                href={href}
                className="group flex aspect-square flex-col items-center justify-center gap-4 rounded-2xl border border-neutral-200 bg-white p-3 text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary-600 hover:shadow-card-hover focus-visible:border-primary-600 md:gap-5"
              >
                <span className="grid size-12 place-items-center rounded-full bg-secondary-400 text-neutral-950 transition-transform duration-300 group-hover:scale-110">
                  <Icon className="size-6" strokeWidth={2.2} aria-hidden="true" />
                </span>
                <span className="text-base leading-tight text-neutral-950 md:text-lg">{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default DiverseLearningPath;
