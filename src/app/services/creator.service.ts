import { CourseModel } from "../models/course.model";
import type { CreatorProfile, CreatorSummary } from "../types";
import { ApiError } from "../lib/apiError";
import { slugify } from "../lib/validate";
import { findVerifiedBySlug } from "./verifiedCreator.service";

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

/** Exact creator name for a slug, or null. Verified creators win. */
export async function creatorNameForSlug(slug: string): Promise<string | null> {
  const key = slugify(slug);
  if (!key) return null;
  const verified = await findVerifiedBySlug(key);
  if (verified) return verified.name;
  const names = await CourseModel.distinct("creator.name", { status: "published" });
  return (names as string[]).find((name) => name && slugify(name) === key) ?? null;
}

export async function getCreator(slug: string): Promise<CreatorProfile> {
  const verified = await findVerifiedBySlug(slug);
  const name = verified?.name ?? (await creatorNameForSlug(slug));
  if (!name) throw new ApiError(404, "Creator not found");

  // A verified creator has a profile even before their first course.
  const row: Row | undefined =
    (await aggregateCreators()).find((r) => r._id === name) ??
    (verified
      ? { _id: name, title: "", avatar: "", bio: "", courses: 0, students: 0, reviews: 0, ratingSum: 0 }
      : undefined);
  if (!row) throw new ApiError(404, "Creator not found");

  const categories = await CourseModel.aggregate<{ _id: string; name: string; slug: string; count: number }>([
    { $match: { status: "published", "creator.name": name } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $lookup: { from: "course_categories", localField: "_id", foreignField: "_id", as: "c" } },
    { $unwind: "$c" },
    { $project: { name: "$c.name", slug: "$c.slug", count: 1 } },
    { $sort: { count: -1 } },
  ]);

  const summary = toSummary(row);
  const profile: CreatorProfile = {
    ...summary,
    categories: categories.map((c) => ({ name: c.name, slug: c.slug, count: c.count })),
  };
  if (!verified) return profile;

  return {
    ...profile,
    slug: verified.slug,
    title: verified.title || summary.title,
    avatar: verified.avatar || summary.avatar,
    bio: verified.bio || summary.bio,
    verified: true,
    linkedin: verified.linkedin ?? "",
    website: verified.website ?? "",
    expertise: verified.expertise ?? [],
    followers: verified.followers ? verified.followers : summary.followers,
  };
}
