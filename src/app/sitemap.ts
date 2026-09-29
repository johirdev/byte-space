import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/config/site";
import { connectDB } from "@/app/lib/db";
import { listCourses } from "@/app/services/course.service";
import { listCreators } from "@/app/services/creator.service";
import type { ICourse } from "@/app/types";

// Rebuilt at most once an hour so new courses show up without a redeploy.
export const revalidate = 3600;

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" }[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/courses", priority: 0.9, changeFrequency: "daily" },
  { path: "/creator-profile", priority: 0.7, changeFrequency: "weekly" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.5, changeFrequency: "monthly" },
  { path: "/register", priority: 0.4, changeFrequency: "monthly" },
  { path: "/login", priority: 0.3, changeFrequency: "monthly" },
];

async function allPublishedCourses(): Promise<ICourse[]> {
  const courses: ICourse[] = [];
  for (let page = 1; ; page++) {
    const { data, meta } = await listCourses({ page, limit: 100, sort: "newest" });
    courses.push(...data);
    if (page >= meta.totalPages) return courses;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  // A database hiccup must never break the sitemap — fall back to the static routes.
  try {
    await connectDB();
    const [courses, creators] = await Promise.all([allPublishedCourses(), listCreators()]);

    for (const course of courses) {
      entries.push({
        url: absoluteUrl(`/courses/${course.slug}`),
        lastModified: course.updatedAt ? new Date(course.updatedAt) : now,
        changeFrequency: "weekly",
        priority: course.is_featured ? 0.8 : 0.7,
        images: course.thumbnail ? [course.thumbnail] : undefined,
      });
    }

    for (const creator of creators) {
      entries.push({
        url: absoluteUrl(`/creator-profile/${creator.slug}`),
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  } catch (err) {
    console.error("[sitemap] dynamic routes skipped:", err);
  }

  return entries;
}
