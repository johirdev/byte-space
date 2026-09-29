import { cache } from "react";
import type { Metadata } from "next";
import CourseDetails from "@/Components/Frontend/Pages/CourseDetails/CourseDetails";
import JsonLd from "@/Components/Shared/JsonLd";
import { connectDB } from "@/app/lib/db";
import { getCourse } from "@/app/services/course.service";
import { pageMetadata } from "@/config/seo";
import { SITE, absoluteUrl } from "@/config/site";
import type { ICourse } from "@/app/types";

// Metadata and structured data read the service directly (no HTTP hop); the
// page body loads through the public API so it stays in sync with the dashboard.
// cache() shares one DB read between generateMetadata and the page render.
const loadCourse = cache(async (id: string): Promise<ICourse | null> => {
  try {
    await connectDB();
    return await getCourse(id);
  } catch {
    return null;
  }
});

const summarize = (text = "", max = 155) => {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
};

export async function generateMetadata({ params }: PageProps<"/courses/[id]">): Promise<Metadata> {
  const { id } = await params;
  const course = await loadCourse(id);
  if (!course) return { title: "Course Not Found", robots: { index: false } };

  return pageMetadata({
    title: course.title,
    description: summarize(course.subtitle || course.description),
    path: `/courses/${course.slug}`,
    images: course.thumbnail ? [course.thumbnail] : undefined,
    type: "article",
  });
}

function courseJsonLd(course: ICourse) {
  const url = absoluteUrl(`/courses/${course.slug}`);
  const category = typeof course.category === "object" ? course.category : null;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Course",
        "@id": `${url}#course`,
        name: course.title,
        description: summarize(course.subtitle || course.description, 300),
        url,
        image: course.thumbnail || undefined,
        inLanguage: "en",
        educationalLevel: course.level,
        about: category?.name,
        keywords: course.tags?.join(", ") || undefined,
        provider: { "@type": "Organization", name: SITE.name, sameAs: SITE.url },
        ...(course.creator?.name
          ? { instructor: { "@type": "Person", name: course.creator.name, jobTitle: course.creator.title || undefined } }
          : {}),
        offers: {
          "@type": "Offer",
          category: course.price === 0 ? "Free" : "Paid",
          price: course.price,
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          url,
        },
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "Online",
          courseWorkload: course.total_duration ? `PT${course.total_duration}M` : undefined,
        },
        ...(course.rating_count > 0
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: course.rating_avg,
                ratingCount: course.rating_count,
                bestRating: 5,
                worstRating: 1,
              },
            }
          : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "Courses", item: absoluteUrl("/courses") },
          { "@type": "ListItem", position: 3, name: course.title, item: url },
        ],
      },
    ],
  };
}

const CourseDetailsPage = async ({ params }: PageProps<"/courses/[id]">) => {
  const { id } = await params;
  const course = await loadCourse(id);

  return (
    <>
      {course && <JsonLd data={courseJsonLd(course)} />}
      <CourseDetails slug={id} />
    </>
  );
};

export default CourseDetailsPage;
