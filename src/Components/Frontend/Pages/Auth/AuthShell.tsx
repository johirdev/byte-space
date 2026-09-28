import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import squiggle from "@/assets/hero/left-site-Mask.png";
import happyStudents from "@/assets/hero/happy-students.png";

/** Decorative stat pill on the mini course cards. */
const Pill = ({ children }: { children: React.ReactNode }) => (
  <span className="rounded-full bg-white/30 px-2.5 py-1 text-[11px] whitespace-nowrap text-white backdrop-blur-md">{children}</span>
);

const Avatars = () => (
  <span className="flex items-center">
    {[11, 32, 47, 15].map((n, i) => (
      <Image
        key={n}
        src={`https://i.pravatar.cc/64?img=${n}`}
        alt=""
        width={26}
        height={26}
        unoptimized
        className="-ml-2 size-[26px] rounded-full border-2 border-white object-cover first:ml-0"
        style={{ zIndex: 5 - i }}
      />
    ))}
    <span className="-ml-2 grid size-[26px] place-items-center rounded-full border-2 border-white bg-neutral-950 text-[9px] font-bold text-white">
      26+
    </span>
  </span>
);

function MiniCard({ title, seed, className = "" }: { title: string; seed: string; className?: string }) {
  return (
    <div className={`rounded-2xl bg-white p-3.5 shadow-[0_30px_60px_-20px_rgb(0_0_0/0.35)] ${className}`}>
      <div className="relative aspect-[341/195] overflow-hidden rounded-xl bg-neutral-200">
        <Image src={`https://picsum.photos/seed/${seed}/480/280`} alt="" fill sizes="340px" unoptimized className="object-cover" />
        <div className="absolute inset-x-2 bottom-2 flex justify-between gap-1">
          <Pill>17 Lessons</Pill>
          <Pill>2 hours 16 mins</Pill>
          <Pill>59 Comments</Pill>
        </div>
      </div>
      <div className="mt-3 flex items-start justify-between gap-2">
        <p className="font-heading text-lg leading-tight font-semibold text-neutral-950">{title}</p>
        <span className="flex items-center gap-1 text-neutral-500">
          4.5 <Star className="size-4 fill-secondary-400 text-secondary-400" />
        </span>
      </div>
      <p className="mt-0.5 text-xs text-neutral-500">
        by <span className="text-primary-600">purepearl studio</span>
      </p>
      <div className="mt-3 flex items-center gap-3">
        <span className="rounded-full bg-neutral-50 px-3 py-1.5 text-xs text-neutral-700">▮ Beginner</span>
        <Avatars />
      </div>
      <p className="mt-3 font-heading text-lg font-bold text-primary-600">
        $25<span className="font-body text-xs font-normal text-neutral-500">/lifetime</span>
      </p>
    </div>
  );
}

/** The collage from the Figma sign-in/sign-up screens, built from real UI. */
function Illustration() {
  return (
    <div className="relative mx-auto mt-14 h-[560px] w-full max-w-[500px]" aria-hidden="true">
      <MiniCard title="Build Digital Asset" seed="digital-asset" className="absolute top-[100px] left-0 w-[300px] -rotate-0 opacity-95" />
      <MiniCard title="the Power of Big Data" seed="the-power-of-big-data" className="absolute top-0 left-[112px] w-[372px]" />

      {/* Lime torus */}
      <span
        className="absolute top-[42px] left-[52px] size-[100px] -rotate-[25deg] rounded-full border-[26px] border-secondary-400 shadow-[inset_-6px_-8px_14px_rgb(0_0_0/0.12),0_12px_24px_-8px_rgb(0_0_0/0.3)]"
        style={{ borderColor: "#d4fb20" }}
      />

      {/* White squiggle (the hero shape, recoloured) */}
      <Image src={squiggle} alt="" className="absolute top-[350px] left-[380px] w-[110px] -rotate-12 brightness-0 invert" />

      {/* Lime pyramid */}
      <svg viewBox="0 0 130 140" className="absolute top-[420px] left-0 w-[130px]">
        <defs>
          <linearGradient id="pyr-a" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#e4ff54" />
            <stop offset="1" stopColor="#cbfc01" />
          </linearGradient>
          <linearGradient id="pyr-b" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#b8e600" />
            <stop offset="1" stopColor="#8cb400" />
          </linearGradient>
        </defs>
        <polygon points="80,0 0,105 125,138" fill="url(#pyr-a)" />
        <polygon points="80,0 125,138 118,70" fill="url(#pyr-b)" />
      </svg>

      {/* Happy students */}
      <div className="absolute top-[435px] left-[226px] w-[258px] rounded-2xl bg-secondary-400 p-4">
        <p className="text-base text-neutral-950">Happy Students</p>
        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-neutral-700">
          <span className="font-medium text-neutral-950">4.5</span> (240)
          <Star className="size-3 fill-primary-600 text-primary-600" />
        </p>
        <div className="mt-2 flex items-center">
          <Image src={happyStudents} alt="" className="h-[42px] w-auto" />
          <span className="-ml-3 grid size-[42px] place-items-center rounded-full bg-neutral-950 text-xs font-bold text-white">2K+</span>
        </div>
      </div>
    </div>
  );
}

export default function AuthShell({
  heading,
  text,
  children,
}: {
  heading: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <main className="bg-hero-grid min-h-screen overflow-x-clip">
      <div className="container-site grid min-h-screen items-start gap-10 py-8 lg:grid-cols-12 lg:py-[120px]">
        {/* Left: pitch + illustration */}
        <section className="lg:col-span-5">
          <Link href="/" aria-label="ByteSpace home" className="inline-flex items-end gap-2 lg:-mt-[86px]">
            <Image src="/logo.png" alt="" width={29} height={32} className="h-8 w-auto" preload />
            <span className="font-body text-[22px] leading-[0.85] font-bold text-white lg:hidden">ByteSpace</span>
          </Link>
          <h1 className="mt-8 font-heading text-xl font-semibold text-white lg:mt-[45px]">{heading}</h1>
          <p className="mt-4 max-w-[480px] text-base leading-[1.8] text-white/90 lg:text-lg">{text}</p>
          <div className="hidden lg:block">
            <Illustration />
          </div>
        </section>

        {/* Right: form card */}
        <section className="lg:col-span-6 lg:col-start-7 lg:-mt-0">
          <div className="rounded-3xl bg-white px-6 py-10 shadow-[0_40px_80px_-30px_rgb(0_0_0/0.4)] sm:px-12 md:px-16 md:py-16">{children}</div>
        </section>
      </div>
    </main>
  );
}
