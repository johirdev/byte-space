import type { Metadata } from "next";
import { pageMetadata } from "@/config/seo";
import About from "@/Components/Frontend/Pages/About/About";

export const metadata: Metadata = pageMetadata({
  title: "About Us",
  description:
    "ByteSpace connects verified creators with learners who want practical skills — honest reviews, lifetime access and courses built from real experience.",
  path: "/about",
});

export default function AboutPage() {
  return <About />;
}
