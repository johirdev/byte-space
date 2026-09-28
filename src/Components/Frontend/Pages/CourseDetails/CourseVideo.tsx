"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { imageProps, toEmbedUrl } from "../../utils/course";

/**
 * Thumbnail with a play button. Clicking swaps in the preview video —
 * YouTube/Vimeo links become an embed, anything else plays in <video>.
 */
export default function CourseVideo({
  thumbnail,
  video,
  title,
}: {
  thumbnail: string;
  video?: string;
  title: string;
}) {
  const [playing, setPlaying] = useState(false);
  const embed = toEmbedUrl(video);

  return (
    <div className="relative aspect-[722/480] overflow-hidden rounded-2xl bg-neutral-200 shadow-card">
      {playing && video ? (
        embed ? (
          <iframe
            src={embed}
            title={`${title} — preview`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 size-full"
          />
        ) : (
          <video src={video} poster={thumbnail} controls autoPlay className="absolute inset-0 size-full bg-black object-contain" />
        )
      ) : (
        <>
          {thumbnail && (
            <Image
              src={thumbnail}
              alt={title}
              fill
              preload
              sizes="(min-width: 1280px) 722px, (min-width: 1024px) 58vw, 100vw"
              className="object-cover"
              {...imageProps(thumbnail)}
            />
          )}
          {video && (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              aria-label="Play course preview"
              className="group absolute top-1/2 left-1/2 grid size-[72px] -translate-x-1/2 -translate-y-1/2 cursor-pointer place-items-center rounded-[18px] bg-neutral-950/35 backdrop-blur-md transition-transform hover:scale-105 md:size-[104px] md:rounded-3xl"
            >
              <span className="grid size-10 place-items-center rounded-full bg-white/85 md:size-12">
                <Play className="ml-0.5 size-4 fill-neutral-700 text-neutral-700 md:size-5" aria-hidden="true" />
              </span>
            </button>
          )}
        </>
      )}
    </div>
  );
}
