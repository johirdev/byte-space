import Image from "next/image";
import { imageProps } from "../utils/course";

const PALETTE = ["#0445ff", "#6a8902", "#0b36a4", "#8cb400", "#2872ff", "#546b09"];

/** Photo, or coloured initials when the learner hasn't uploaded one. */
export default function UserAvatar({
  name,
  src,
  size = 40,
  className = "",
  rounded = "rounded-full",
}: {
  name?: string;
  src?: string;
  size?: number;
  className?: string;
  /** Tailwind radius class — pass a literal so it is picked up by the scanner. */
  rounded?: string;
}) {
  const label = name?.trim() || "User";
  const initials = label
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  const color = PALETTE[label.charCodeAt(0) % PALETTE.length];

  return (
    <span
      className={`relative inline-grid shrink-0 place-items-center overflow-hidden ${rounded} font-heading font-semibold text-white ${className}`}
      style={{ width: size, height: size, background: src ? "#e5e6e8" : color, fontSize: size * 0.38 }}
      aria-hidden={src ? undefined : true}
    >
      {src ? (
        <Image src={src} alt={label} fill sizes={`${size}px`} className="object-cover" {...imageProps(src)} />
      ) : (
        initials
      )}
    </span>
  );
}
