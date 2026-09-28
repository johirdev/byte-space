import { connectDB } from "@/app/lib/db";
import { listCategories } from "@/app/services/courseCategory.service";
import { listCourses } from "@/app/services/course.service";
import type { ICourse, ICourseCategory } from "@/app/types";
import DiscoverPassionClient, { PAGE_SIZE } from "./DiscoverPassionClient";

/** Mongo docs → plain JSON for the client component. */
const plain = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/**
 * "Discover Your Passion, Build Your Skills" (claude/DiscoverPassion).
 * The first render is server-side — categories + the featured-first course
 * grid — so the section paints complete with no loading flash; switching
 * categories then fetches from the API on the client.
 */
export default async function DiscoverPassion() {
  let categories: ICourseCategory[] = [];
  let courses: ICourse[] = [];
  let total = 0;

  try {
    await connectDB();
    const [cats, list] = await Promise.all([
      listCategories(),
      listCourses({ sort: "relevant", page: 1, limit: PAGE_SIZE }),
    ]);
    categories = plain(cats);
    courses = plain(list.data);
    total = list.meta.total;
  } catch {
    // DB unavailable — the client component shows its empty/retry state.
  }

  return <DiscoverPassionClient categories={categories} initialCourses={courses} initialTotal={total} />;
}
