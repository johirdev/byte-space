import { connectDB } from "@/app/lib/db";
import { listTestimonials } from "@/app/services/testimonial.service";
import type { ITestimonial } from "@/app/types";
import TestimonialsSlider from "./TestimonialsSlider";

/**
 * "Discover What Our Community Is Saying" (claude/Testimonials).
 * Testimonials are managed in the dashboard (/dashboard/testimonials) and
 * rendered server-side; the section hides itself while none are published.
 */
export default async function Testimonials() {
  let items: ITestimonial[] = [];
  try {
    await connectDB();
    items = JSON.parse(JSON.stringify(await listTestimonials())) as ITestimonial[];
  } catch {
    // Database unavailable — skip the section rather than break the page.
  }
  if (!items.length) return null;
  return <TestimonialsSlider items={items} />;
}
