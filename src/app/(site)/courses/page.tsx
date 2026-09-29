import type { Metadata } from "next";
import { pageMetadata } from "@/config/seo";
import Courses, { type CourseFilters } from "@/Components/Frontend/Pages/Courses/Courses";

// Filters live in the query string; the canonical stays on /courses so
// every filtered variant consolidates into one indexable page.
export const metadata: Metadata = pageMetadata({
  title: "Browse Online Courses",
  description:
    "Search and filter ByteSpace courses by category, level, price and rating. Learn design, development, marketing and business from verified creators.",
  path: "/courses",
});

const first = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value) ?? "";

const CoursesPage = async ({ searchParams }: PageProps<"/courses">) => {
  const params = await searchParams;

  // The URL is the source of truth, so shared/bookmarked searches reopen as-is.
  const initial: Partial<CourseFilters> = {
    q: first(params.q),
    category: first(params.category),
    level: first(params.level),
    sort: first(params.sort) || "relevant",
    price: first(params.price),
    rating: first(params.rating),
    page: Math.max(1, Number(first(params.page)) || 1),
  };

  return <Courses initial={initial} />;
};

export default CoursesPage;
