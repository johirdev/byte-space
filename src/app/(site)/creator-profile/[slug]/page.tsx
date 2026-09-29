import { cache } from "react";
import type { Metadata } from "next";
import CreatorProfile from "@/Components/Frontend/Pages/CreatorProfile/CreatorProfile";
import JsonLd from "@/Components/Shared/JsonLd";
import { connectDB } from "@/app/lib/db";
import { getCreator } from "@/app/services/creator.service";
import { pageMetadata } from "@/config/seo";
import { absoluteUrl } from "@/config/site";
import type { CreatorProfile as CreatorProfileData } from "@/app/types";

// cache() shares one lookup between generateMetadata and the page render.
const loadCreator = cache(async (slug: string): Promise<CreatorProfileData | null> => {
  try {
    await connectDB();
    return await getCreator(slug);
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }: PageProps<"/creator-profile/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const creator = await loadCreator(slug);
  if (!creator) return { title: "Creator Not Found", robots: { index: false } };

  const courses = creator.stats.courses;
  return pageMetadata({
    title: `${creator.name} — ${creator.title || "Course Creator"}`,
    description:
      creator.bio?.slice(0, 155) ||
      `Learn from ${creator.name} on ByteSpace — ${courses} course${courses === 1 ? "" : "s"} and ${creator.stats.students} students.`,
    path: `/creator-profile/${creator.slug}`,
    images: creator.avatar ? [creator.avatar] : undefined,
    type: "profile",
  });
}

export default async function CreatorProfilePage({ params }: PageProps<"/creator-profile/[slug]">) {
  const { slug } = await params;
  const creator = await loadCreator(slug);

  return (
    <>
      {creator && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            url: absoluteUrl(`/creator-profile/${creator.slug}`),
            mainEntity: {
              "@type": "Person",
              name: creator.name,
              jobTitle: creator.title || undefined,
              description: creator.bio || undefined,
              image: creator.avatar || undefined,
            },
          }}
        />
      )}
      <CreatorProfile slug={slug} />
    </>
  );
}
