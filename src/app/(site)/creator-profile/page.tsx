import type { Metadata } from "next";
import CreatorsIndex from "@/Components/Frontend/Pages/CreatorProfile/CreatorsIndex";

export const metadata: Metadata = { title: "Creators | ByteSpace" };

export default function CreatorsPage() {
  return <CreatorsIndex />;
}
