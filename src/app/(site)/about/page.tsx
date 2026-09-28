import type { Metadata } from "next";
import About from "@/Components/Frontend/Pages/About/About";

export const metadata: Metadata = {
  title: "About Us | ByteSpace",
  description:
    "ByteSpace connects verified creators with learners who want practical skills — honest reviews, lifetime access and courses built from real experience.",
};

export default function AboutPage() {
  return <About />;
}
