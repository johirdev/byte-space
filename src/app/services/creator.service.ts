import { CourseModel } from "../models/course.model";
import type { CreatorProfile, CreatorSummary } from "../types";
import { ApiError } from "../lib/apiError";
import { slugify } from "../lib/validate";

/**
 * Creators aren't a separate collection — a creator is whoever the admin
 * named in a course's `creator` block. They're identified by the slug of
 * that name, and their profile is assembled from their published courses.
 */

type Row = {
  _id: string; // creator name
  title: string;
  avatar: string;
  bio: string;
  courses: number;
  students: number;
  reviews: number;
  ratingSum: number;
};

/** Deterministic demo follower count — stable per creator, grows with their catalogue. */
export const demoFollowers = (slug: string, students: number) => {
  let h = 0;
  for (const ch of slug) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return 8 + (h % 90) + Math.round(students * 0.35);
};

async function aggregateCreators(): Promise<Row[]> {
  return CourseModel.aggregate<Row>([
    { $match: { status: "published", "creator.name": { $nin: ["", null] } } },
    { $sort: { updatedAt: -1 } },
    {
      $group: {
        _id: "$creator.name",
        // Most recently edited course wins for the profile details.
        title: { $first: "$creator.title" },
        avatar: { $max: "$creator.avatar" },
        bio: { $max: "$creator.bio" },
        courses: { $sum: 1 },
        students: { $sum: "$students_count" },
        reviews: { $sum: "$rating_count" },
        ratingSum: { $sum: { $multiply: ["$rating_avg", "$rating_count"] } },
      },
    },
  ]);
}

const toSummary = (row: Row): CreatorSummary => {
  const slug = slugify(row._id);
  return {
    slug,
    name: row._id,
    title: row.title ?? "",
    avatar: row.avatar ?? "",
    bio: row.bio ?? "",
    stats: {
      courses: row.courses,
      students: row.students,
      reviews: row.reviews,
      rating: row.reviews ? Math.round((row.ratingSum / row.reviews) * 10) / 10 : 0,
    },
    followers: demoFollowers(slug, row.students),
  };
};

export async function listCreators(): Promise<CreatorSummary[]> {
  const rows = await aggregateCreators();
  return rows.map(toSummary).sort((a, b) => b.stats.students - a.stats.students);
}

/** Exact creator name for a slug, or null. */
export async function creatorNameForSlug(slug: string): Promise<string | null> {
  const key = slugify(slug);
  if (!key) return null;
  const names = await CourseModel.distinct("creator.name", { status: "published" });
  return (names as string[]).find((name) => name && slugify(name) === key) ?? null;
}

export async function getCreator(slug: string): Promise<CreatorProfile> {
  const name = await creatorNameForSlug(slug);
  if (!name) throw new ApiError(404, "Creator not found");

  const row = (await aggregateCreators()).find((r) => r._id === name);
  if (!row) throw new ApiError(404, "Creator not found");

  const categories = await CourseModel.aggregate<{ _id: string; name: string; slug: string; count: number }>([
    { $match: { status: "published", "creator.name": name } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $lookup: { from: "course_categories", localField: "_id", foreignField: "_id", as: "c" } },
    { $unwind: "$c" },
    { $project: { name: "$c.name", slug: "$c.slug", count: 1 } },
    { $sort: { count: -1 } },
  ]);

  return { ...toSummary(row), categories: categories.map((c) => ({ name: c.name, slug: c.slug, count: c.count })) };
}
