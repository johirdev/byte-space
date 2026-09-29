import type { Metadata } from "next";
import { pageMetadata } from "@/config/seo";
import Contact from "@/Components/Frontend/Pages/Contact/Contact";

export const metadata: Metadata = pageMetadata({
  title: "Contact Us",
  description:
    "Get in touch with the ByteSpace team about courses, payments, your account or becoming a creator. We reply within 24 hours on business days.",
  path: "/contact",
});

export default function ContactPage() {
  return <Contact />;
}
