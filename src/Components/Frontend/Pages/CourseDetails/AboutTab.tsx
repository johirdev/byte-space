import Image from "next/image";
import { CircleCheck } from "lucide-react";
import type { ICourse } from "@/app/types";
import { imageProps } from "../../utils/course";

export default function AboutTab({ course }: { course: ICourse }) {
  const paragraphs = course.description.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-heading text-xl font-medium">Description</h2>
        <div className="mt-6 space-y-6 text-sm leading-[1.75] text-neutral-500 md:text-[15px]">
          {paragraphs.map((p, i) => (
            <p key={i} className="whitespace-pre-line">
              {p}
            </p>
          ))}
        </div>
      </section>

      {course.sneak_peek.length > 0 && (
        <section>
          <h2 className="font-heading text-xl font-medium">Sneak Peak</h2>
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 md:gap-5">
            {course.sneak_peek.map((src, i) => (
              <li key={src + i}>
                <a
                  href={src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative block aspect-[168/126] overflow-hidden rounded-xl bg-neutral-100"
                  aria-label={`Open preview image ${i + 1}`}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 170px, 45vw"
                    className="object-cover transition-transform duration-500 hover:scale-105"
                    {...imageProps(src)}
                  />
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {course.key_points.length > 0 && (
        <section>
          <h2 className="font-heading text-xl font-medium">Key Points</h2>
          <ul className="mt-5 space-y-3">
            {course.key_points.map((point) => (
              <li key={point} className="flex items-center gap-3 text-sm text-neutral-500 md:text-[15px]">
                <CircleCheck className="size-5 shrink-0 fill-primary-600 text-white" aria-hidden="true" />
                {point}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
