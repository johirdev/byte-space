import Image from "next/image";

/**
 * Full-screen branded loader: the ByteSpace mark inside a spinning lime ring.
 * `site`  — brand blue with the 120px grid (public pages, auth).
 * `admin` — the dashboard's dark chrome.
 */
export default function BrandLoader({
  variant = "site",
  label = "Loading",
  fullscreen = true,
}: {
  variant?: "site" | "admin";
  label?: string;
  fullscreen?: boolean;
}) {
  const site = variant === "site";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`${fullscreen ? "fixed inset-0 z-[200]" : "min-h-[60vh] w-full"} grid place-items-center ${
        site ? "bg-hero-grid" : "bg-[#08070f]"
      }`}
    >
      <div className="flex flex-col items-center">
        <div className="relative grid size-24 place-items-center">
          {/* Track + spinning arc */}
          <span className={`absolute inset-0 rounded-full border-[3px] ${site ? "border-white/15" : "border-white/10"}`} aria-hidden="true" />
          <span
            className="bs-loader-arc absolute inset-0 rounded-full border-[3px] border-transparent border-t-secondary-400 border-r-secondary-400/40"
            aria-hidden="true"
          />
          {/* Soft glow behind the mark */}
          <span className="bs-loader-glow absolute size-14 rounded-full bg-secondary-400/25 blur-xl" aria-hidden="true" />
          <Image src="/logo.png" alt="" width={29} height={32} preload className="bs-loader-mark relative h-10 w-auto" />
        </div>

        <p className="mt-6 font-body text-2xl leading-none font-bold tracking-[0.02em] text-white">ByteSpace</p>

        <span className="mt-4 flex gap-1.5" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span key={i} className="bs-loader-dot size-1.5 rounded-full bg-secondary-400" style={{ animationDelay: `${i * 0.16}s` }} />
          ))}
        </span>
        <span className="sr-only">{label}…</span>
      </div>
    </div>
  );
}
