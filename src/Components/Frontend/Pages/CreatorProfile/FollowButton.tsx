"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { toast } from "react-toastify";
import { useFollowStore } from "@/store/followStore";

const SPARKS = Array.from({ length: 10 }, (_, i) => ({
  rotate: `${i * 36}deg`,
  color: i % 2 ? "#0445ff" : "#cbfc01",
}));

/** Lime "Follow" pill with a pop + spark burst when you follow. */
export default function FollowButton({ slug, name }: { slug: string; name: string }) {
  const following = useFollowStore((s) => s.following.includes(slug));
  const hydrated = useFollowStore((s) => s.hydrated);
  const toggle = useFollowStore((s) => s.toggle);
  // Bumped on every click so the animation replays (it keys the animated nodes).
  const [burst, setBurst] = useState(0);
  const [hover, setHover] = useState(false);

  const onClick = () => {
    const now = toggle(slug);
    setBurst((b) => b + 1);
    if (now) toast.success(`You're following ${name}`);
  };

  const label = following ? (hover ? "Unfollow" : "Following") : "Follow";

  return (
    <button
      key={burst}
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-pressed={following}
      disabled={!hydrated}
      className={`relative inline-flex h-11 min-w-[124px] cursor-pointer items-center justify-center gap-2 rounded-full px-6 text-lg font-medium transition-colors disabled:opacity-0 ${
        burst ? "animate-follow-pop" : ""
      } ${
        following
          ? "border border-white/70 bg-white/10 text-white hover:border-red-200 hover:bg-red-500/20"
          : "bg-secondary-400 text-neutral-950 hover:bg-secondary-300"
      }`}
    >
      {following ? <Check className="size-5" aria-hidden="true" /> : <Plus className="size-5" aria-hidden="true" />}
      {label}
      {burst > 0 &&
        following &&
        SPARKS.map((s) => (
          <span key={s.rotate} className="follow-spark" style={{ ["--r" as string]: s.rotate, background: s.color }} aria-hidden="true" />
        ))}
    </button>
  );
}
