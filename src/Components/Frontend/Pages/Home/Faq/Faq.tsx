import { connectDB } from "@/app/lib/db";
import { listFaqs } from "@/app/services/faq.service";
import type { IFaq } from "@/app/types";
import FaqClient from "./FaqClient";

/**
 * FAQ section. Content is managed in the dashboard (/dashboard/faqs); a set of
 * course-platform defaults is seeded the first time it's read.
 */
export default async function Faq() {
  let items: IFaq[] = [];
  try {
    await connectDB();
    items = JSON.parse(JSON.stringify(await listFaqs())) as IFaq[];
  } catch {
    // Database unavailable — skip the section rather than break the page.
  }
  if (!items.length) return null;

  // Lets search engines show these as rich FAQ results.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // JSON.stringify output is safe here; "<" is escaped to avoid closing the tag early.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <FaqClient items={items} />
    </>
  );
}
