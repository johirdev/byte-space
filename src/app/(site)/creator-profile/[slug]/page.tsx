import type { Metadata } from "next";
import CreatorProfile from "@/Components/Frontend/Pages/CreatorProfile/CreatorProfile";
import { connectDB } from "@/app/lib/db";
import { getCreator } from "@/app/services/creator.service";

export async function generateMetadata({ params }: PageProps<"/creator-profile/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  try {
    await connectDB();
    const creator = await getCreator(slug);
    return {
      title: `${creator.name} | ByteSpace Creator`,
      description: creator.title || `Courses by ${creator.name} on ByteSpace`,
      openGraph: { images: creator.avatar ? [creator.avatar] : undefined },
    };
  } catch {
    return { title: "Creator | ByteSpace" };
  }
}

export default async function CreatorProfilePage({ params }: PageProps<"/creator-profile/[slug]">) {
  const { slug } = await params;
  return <CreatorProfile slug={slug} />;
}
