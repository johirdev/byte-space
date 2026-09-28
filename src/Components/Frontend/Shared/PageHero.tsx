import Link from "next/link";
import { ChevronRight } from "lucide-react";

/** Blue grid header used by cart / checkout (the navbar floats on top of it). */
export default function PageHero({
  title,
  subtitle,
  crumbs,
  children,
}: {
  title: string;
  subtitle?: React.ReactNode;
  crumbs: { label: string; href?: string }[];
  children?: React.ReactNode;
}) {
  return (
    <section className="bg-hero-grid pt-[72px] md:pt-[120px]">
      <div className="container-site pt-6 pb-10 md:pt-4 md:pb-14">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-white/70">
            {crumbs.map((crumb, i) => (
              <li key={crumb.label} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="size-3.5" aria-hidden="true" />}
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-white">
                    {crumb.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="text-white">
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <h1 className="mt-3 font-heading text-[clamp(1.75rem,1.2rem+1.6vw,2.25rem)] font-semibold text-white">{title}</h1>
        {subtitle && <p className="mt-2 text-white/85">{subtitle}</p>}
        {children}
      </div>
    </section>
  );
}
