import type { Metadata } from "next";
import { pageMetadata } from "@/config/seo";
import CreatorsIndex from "@/Components/Frontend/Pages/CreatorProfile/CreatorsIndex";

export const metadata: Metadata = pageMetadata({
  title: "Verified Course Creators",
  description:
    "Meet the verified creators teaching on ByteSpace — see their courses, students and ratings, and learn from people who do the work.",
  path: "/creator-profile",
});

export default function CreatorsPage() {
  return <CreatorsIndex />;
}
