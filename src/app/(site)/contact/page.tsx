import type { Metadata } from "next";
import Contact from "@/Components/Frontend/Pages/Contact/Contact";

export const metadata: Metadata = {
  title: "Contact Us | ByteSpace",
  description: "Get in touch with the ByteSpace team about courses, payments, your account or becoming a creator.",
};

export default function ContactPage() {
  return <Contact />;
}
