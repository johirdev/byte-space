import { isValidObjectId, Types } from "mongoose";
import { CourseReviewModel } from "../models/courseReview.model";
import { CourseModel } from "../models/course.model";
import { EnrollmentModel } from "../models/enrollment.model";
import {
  REVIEW_STATUSES,
  type ICourseReview,
  type ReviewStatus,
  type ReviewSummary,
} from "../types";
import { ApiError } from "../lib/apiError";
import { buildMeta, type ResponseMeta } from "../lib/sendResponse";
import { FieldCheck, escapeRegex, num, oneOf, str } from "../lib/validate";
import { recomputeCourseRating } from "./course.service";

type ReviewRow = ICourseReview & { _id: string; course: Types.ObjectId };

const COURSE_POPULATE = { path: "course", select: "title slug thumbnail" } as const;

/** Accepts a course id or slug and returns the id, or throws 404. */
const resolveCourseId = async (idOrSlug: string, publishedOnly = false) => {
  const filter = isValidObjectId(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug.toLowerCase() };
  const course = await CourseModel.findOne(
    publishedOnly ? { ...filter, status: "published" } : filter,
  )
    .select("_id")
    .lean<{ _id: Types.ObjectId }>();
  if (!course) throw new ApiError(404, "Course not found");
  return course._id;
};

// ── READ ──────────────────────────────────────────────────────────────────
export type ReviewListArgs = {
  course?: string | null;
  rating?: string | number | null;
  status?: string | null;
  q?: string | null;
  page?: number;
  limit?: number;
  all?: boolean;
};

/** Admin list across every course. */
export const listReviews = async (
  args: ReviewListArgs,
): Promise<{ data: ICourseReview[]; meta: ResponseMeta }> => {
  const page = Math.max(1, args.page ?? 1);
  const limit = Math.min(100, Math.max(1, args.limit ?? 20));
  const filter: Record<string, unknown> = {};

  const courseKey = str(args.course);
  if (courseKey) filter.course = await resolveCourseId(courseKey);

  const rating = num(args.rating);
  if (rating && rating >= 1 && rating <= 5) filter.rating = Math.round(rating);

  const status = str(args.status);
  if (status && REVIEW_STATUSES.includes(status as ReviewStatus)) filter.status = status;

  const q = str(args.q);
  if (q) {
    const rx = { $regex: escapeRegex(q), $options: "i" };
    filter.$or = [{ name: rx }, { comment: rx }, { designation: rx }];
  }

  const query = CourseReviewModel.find(filter)
    .populate(COURSE_POPULATE)
    .sort({ createdAt: -1, _id: -1 });

  if (!args.all) query.skip((page - 1) * limit).limit(limit);

  const [data, total] = await Promise.all([
    query.lean<ICourseReview[]>(),
    CourseReviewModel.countDocuments(filter),
  ]);

  return { data, meta: buildMeta(total, args.all ? 1 : page, args.all ? total : limit) };
};

/** Approved reviews for one course, plus the star breakdown for the summary card. */
export const getCourseReviews = async (
  courseIdOrSlug: string,
  args: { rating?: string | number | null; page?: number; limit?: number },
): Promise<{ data: ICourseReview[]; meta: ResponseMeta; summary: ReviewSummary }> => {
  const courseId = await resolveCourseId(courseIdOrSlug, true);
  const page = Math.max(1, args.page ?? 1);
  const limit = Math.min(50, Math.max(1, args.limit ?? 5));

  const base = { course: courseId, status: "approved" as const };
  const rating = num(args.rating);
  const filter = rating && rating >= 1 && rating <= 5 ? { ...base, rating: Math.round(rating) } : base;

  const [data, total, breakdownRows] = await Promise.all([
    CourseReviewModel.find(filter)
      .select("-course")
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<ICourseReview[]>(),
    CourseReviewModel.countDocuments(filter),
    CourseReviewModel.aggregate<{ _id: number; count: number }>([
      { $match: base },
      { $group: { _id: "$rating", count: { $sum: 1 } } },
    ]),
  ]);

  const breakdown: ReviewSummary["breakdown"] = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
  let sum = 0;
  let count = 0;
  for (const row of breakdownRows) {
    const key = String(row._id) as keyof ReviewSummary["breakdown"];
    if (key in breakdown) breakdown[key] = row.count;
    sum += row._id * row.count;
    count += row.count;
  }

  return {
    data,
    meta: buildMeta(total, page, limit),
    summary: {
      average: count ? Math.round((sum / count) * 10) / 10 : 0,
      total: count,
      breakdown,
    },
  };
};

// ── WRITE ─────────────────────────────────────────────────────────────────
const buildPayload = async (
  body: Record<string, unknown>,
  isCreate: boolean,
): Promise<Record<string, unknown>> => {
  const has = (key: string) => isCreate || body[key] !== undefined;
  const check = new FieldCheck();
  const out: Record<string, unknown> = {};

  if (has("course")) {
    const courseKey = str(body.course);
    if (!courseKey) {
      check.custom("course", false, "Choose a course");
    } else {
      try {
        out.course = await resolveCourseId(courseKey);
      } catch {
        check.custom("course", false, "That course no longer exists");
      }
    }
  }

  if (has("name")) {
    const name = str(body.name);
    check.require("name", name, "Name");
    out.name = name;
  }

  if (has("designation")) out.designation = str(body.designation) ?? "";

  if (has("avatar")) {
    const avatar = str(body.avatar);
    check.url("avatar", avatar);
    out.avatar = avatar ?? "";
  }

  if (has("rating")) {
    const rating = num(body.rating);
    check.custom(
      "rating",
      rating !== undefined && rating >= 1 && rating <= 5,
      "Rating must be between 1 and 5",
    );
    out.rating = Math.round(rating ?? 0);
  }

  if (has("comment")) {
    const comment = str(body.comment);
    check.require("comment", comment, "Comment").minLength("comment", comment, 10, "Comment");
    out.comment = comment;
  }

  if (has("status")) out.status = oneOf(str(body.status), REVIEW_STATUSES, "approved");

  check.throwIfFailed();
  return out;
};

export const createReview = async (body: Record<string, unknown>): Promise<ICourseReview> => {
  const payload = await buildPayload(body, true);
  const created = await CourseReviewModel.create(payload);
  await recomputeCourseRating(created.course);
  return (await CourseReviewModel.findById(created._id)
    .populate(COURSE_POPULATE)
    .lean<ICourseReview>())!;
};

export const updateReview = async (
  id: string,
  body: Record<string, unknown>,
): Promise<ICourseReview> => {
  const existing = await CourseReviewModel.findById(id).lean<ReviewRow>();
  if (!existing) throw new ApiError(404, "Review not found");

  const payload = await buildPayload(body, false);
  if (!Object.keys(payload).length) throw new ApiError(400, "No valid fields supplied to update");

  const updated = await CourseReviewModel.findByIdAndUpdate(
    id,
    { $set: payload },
    { new: true, runValidators: true },
  )
    .populate(COURSE_POPULATE)
    .lean<ICourseReview>();

  // Moving a review between courses changes both averages.
  await recomputeCourseRating(existing.course);
  if (payload.course && String(payload.course) !== String(existing.course)) {
    await recomputeCourseRating(payload.course as Types.ObjectId);
  }
  return updated!;
};

export const deleteReview = async (id: string): Promise<ICourseReview> => {
  const review = await CourseReviewModel.findById(id).lean<ReviewRow>();
  if (!review) throw new ApiError(404, "Review not found");
  await CourseReviewModel.deleteOne({ _id: id });
  await recomputeCourseRating(review.course);
  return review;
};

// ── LEARNER REVIEWS ───────────────────────────────────────────────────────
// Signed-in learners review courses they're enrolled in — one each. Name,
// avatar and headline are copied from their profile (and kept in sync by
// user.service when the profile changes).

type Author = { _id?: string; name: string; avatar?: string; headline?: string };

const learnerFields = (body: Record<string, unknown>, partial: boolean) => {
  const check = new FieldCheck();
  const out: Record<string, unknown> = {};

  if (!partial || body.rating !== undefined) {
    const rating = num(body.rating);
    check.custom("rating", rating !== undefined && rating >= 1 && rating <= 5, "Pick a rating from 1 to 5 stars");
    out.rating = Math.round(rating ?? 0);
  }
  if (!partial || body.comment !== undefined) {
    const comment = str(body.comment);
    check
      .require("comment", comment, "Your review")
      .minLength("comment", comment, 10, "Your review");
    check.custom("comment", (comment?.length ?? 0) <= 2000, "Keep it under 2000 characters");
    out.comment = comment;
  }
  check.throwIfFailed();
  return out;
};

export const listMyReviews = (userId: string) =>
  CourseReviewModel.find({ user: userId })
    .populate(COURSE_POPULATE)
    .sort({ createdAt: -1 })
    .lean<ICourseReview[]>();

export async function createMyReview(author: Author, body: Record<string, unknown>): Promise<ICourseReview> {
  const courseKey = str(body.course);
  if (!courseKey) throw new ApiError(400, "Choose a course", { course: "Choose a course" });
  const courseId = await resolveCourseId(courseKey);

  if (!(await EnrollmentModel.exists({ user: author._id, course: courseId }))) {
    throw new ApiError(403, "Only enrolled learners can review this course");
  }
  if (await CourseReviewModel.exists({ user: author._id, course: courseId })) {
    throw new ApiError(409, "You've already reviewed this course — edit your review instead");
  }

  const created = await CourseReviewModel.create({
    ...learnerFields(body, false),
    course: courseId,
    user: author._id,
    name: author.name,
    avatar: author.avatar ?? "",
    designation: author.headline ?? "",
    status: "approved",
  });
  await recomputeCourseRating(courseId);
  return (await CourseReviewModel.findById(created._id).populate(COURSE_POPULATE).lean<ICourseReview>())!;
}

export async function updateMyReview(
  userId: string,
  id: string,
  body: Record<string, unknown>,
): Promise<ICourseReview> {
  const review = await CourseReviewModel.findOne({ _id: id, user: userId }).lean<ReviewRow>();
  if (!review) throw new ApiError(404, "Review not found");

  const updated = await CourseReviewModel.findByIdAndUpdate(
    id,
    { $set: learnerFields(body, true) },
    { new: true, runValidators: true },
  )
    .populate(COURSE_POPULATE)
    .lean<ICourseReview>();
  await recomputeCourseRating(review.course);
  return updated!;
}

export async function deleteMyReview(userId: string, id: string): Promise<void> {
  const review = await CourseReviewModel.findOne({ _id: id, user: userId }).lean<ReviewRow>();
  if (!review) throw new ApiError(404, "Review not found");
  await CourseReviewModel.deleteOne({ _id: id });
  await recomputeCourseRating(review.course);
}
