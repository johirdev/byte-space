import type { CourseCategoryRef, ICourse } from "@/app/types";

/** 136 → "2 hours 16 mins", 45 → "45 mins". */
export const formatDuration = (minutes = 0): string => {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  const hours = h ? `${h} ${h === 1 ? "hour" : "hours"}` : "";
  const mins = m || !h ? `${m} ${m === 1 ? "min" : "mins"}` : "";
  return [hours, mins].filter(Boolean).join(" ");
};

/** 1440 → "24 hours", 90 → "1.5 hours", 40 → "40 mins". */
export const formatHours = (minutes = 0): string => {
  if (minutes < 60) return `${minutes} mins`;
  const hours = Math.round((minutes / 60) * 10) / 10;
  return `${hours} ${hours === 1 ? "hour" : "hours"}`;
};

export const formatPrice = (price = 0): string =>
  price === 0 ? "Free" : `$${Number.isInteger(price) ? price : price.toFixed(2)}`;

export const formatCount = (n = 0): string =>
  n >= 1000 ? `${Math.round(n / 100) / 10}k` : String(n);

export const pad2 = (n: number) => String(n).padStart(2, "0");

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31_536_000],
  ["month", 2_592_000],
  ["week", 604_800],
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
];

/** "a year ago", "3 days ago". */
export const timeAgo = (date?: string | Date): string => {
  if (!date) return "";
  const seconds = (new Date(date).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "always" });
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) {
      const text = rtf.format(Math.round(seconds / size), unit);
      return text.replace(/^1 (\w+) ago$/, "a $1 ago");
    }
  }
  return "just now";
};

export const categoryOf = (course: Pick<ICourse, "category">): CourseCategoryRef | null =>
  course.category && typeof course.category === "object" ? course.category : null;

/**
 * next/image only optimises whitelisted hosts (imgbb, see next.config.ts);
 * anything else an admin pastes still renders, just unoptimised.
 */
export const imageProps = (src?: string) => ({
  unoptimized: !/^https:\/\/([a-z0-9-]+\.)*ibb\.co\//i.test(src ?? ""),
});

/** YouTube / Vimeo watch URLs → embeddable URL, or null for direct files. */
export const toEmbedUrl = (url?: string): string | null => {
  if (!url) return null;
  const yt = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/i,
  );
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?autoplay=1&rel=0`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/i);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1`;
  return null;
};

/** Stable pseudo-random avatars for the "students" stack on cards. */
export const studentAvatars = (seed: string, count = 4): string[] => {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return Array.from({ length: count }, (_, i) => `https://i.pravatar.cc/64?img=${((h + i * 7) % 70) + 1}`);
};
