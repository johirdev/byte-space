import { Types } from "mongoose";
import { EnrollmentModel } from "../models/enrollment.model";
import { CourseReviewModel } from "../models/courseReview.model";
import { CourseModel } from "../models/course.model";
import type { EnrolledCourse, ICourse, IEnrollment } from "../types";
import { ApiError } from "../lib/apiError";
import { buildMeta, type ResponseMeta } from "../lib/sendResponse";
import { escapeRegex, str, strList } from "../lib/validate";
import { findCategory } from "./courseCategory.service";

const CARD_FIELDS =
  "title slug subtitle thumbnail creator level price price_label rating_avg rating_count total_lessons total_duration students_count category status modules";

export const isEnrolled = async (userId: string, courseId: string) =>
  Boolean(await EnrollmentModel.exists({ user: userId, course: courseId }));

/** The learner's library, filtered/sorted like the course search page. */
export async function listMyEnrollments(
  userId: string,
  args: { q?: string | null; category?: string | null; level?: string | null; sort?: string | null },
): Promise<EnrolledCourse[]> {
  const rows = await EnrollmentModel.find({ user: userId })
    .populate({
      path: "course",
      select: CARD_FIELDS,
      populate: { path: "category", select: "name slug" },
    })
    .sort({ createdAt: -1 })
    .lean<(IEnrollment & { course: ICourse | null })[]>();

  // Courses deleted after purchase leave a null populate — hide those.
  let list = rows.filter((r): r is IEnrollment & { course: ICourse } => Boolean(r.course));

  const q = str(args.q)?.toLowerCase();
  if (q) list = list.filter((r) => `${r.course.title} ${r.course.creator?.name ?? ""}`.toLowerCase().includes(q));

  const categoryKey = str(args.category);
  if (categoryKey) {
    const category = await findCategory(categoryKey);
    list = category
      ? list.filter((r) => String((r.course.category as { _id?: unknown })?._id ?? r.course.category) === String(category._id))
      : [];
  }

  const levels = strList(args.level);
  if (levels.length) list = list.filter((r) => levels.includes(r.course.level));

  const sorters: Record<string, (a: typeof list[number], b: typeof list[number]) => number> = {
    title: (a, b) => a.course.title.localeCompare(b.course.title),
    rating: (a, b) => b.course.rating_avg - a.course.rating_avg,
    progress: (a, b) => b.progress - a.progress,
    oldest: (a, b) => +new Date(a.createdAt ?? 0) - +new Date(b.createdAt ?? 0),
  };
  if (args.sort && sorters[args.sort]) list = [...list].sort(sorters[args.sort]);

  const reviews = await CourseReviewModel.find({ user: userId, course: { $in: list.map((r) => String(r.course._id)) } })
    .select("course rating comment status")
    .lean<{ _id: Types.ObjectId; course: Types.ObjectId; rating: number; comment: string; status: string }[]>();
  const byCourse = new Map(reviews.map((r) => [String(r.course), r]));

  return list.map((row) => {
    const review = byCourse.get(String(row.course._id));
    // Modules are only needed to count lessons for progress; don't ship them.
    const { modules: _m, ...course } = row.course as ICourse;
    void _m;
    return {
      ...row,
      course: course as ICourse,
      my_review: review
        ? { _id: String(review._id), rating: review.rating, comment: review.comment, status: review.status }
        : null,
    };
  });
}

export async function getMyEnrollment(userId: string, courseIdOrSlug: string): Promise<IEnrollment | null> {
  const courseId = Types.ObjectId.isValid(courseIdOrSlug)
    ? courseIdOrSlug
    : (await CourseModel.findOne({ slug: courseIdOrSlug.toLowerCase() }).select("_id").lean<{ _id: Types.ObjectId }>())?._id;
  if (!courseId) return null;
  return EnrollmentModel.findOne({ user: userId, course: courseId }).lean<IEnrollment>();
}

/** Saves which lessons are done ("moduleIndex-lessonIndex" keys) and derives %. */
export async function updateProgress(
  userId: string,
  courseId: string,
  completed: unknown,
): Promise<IEnrollment> {
  const enrollment = await EnrollmentModel.findOne({ user: userId, course: courseId });
  if (!enrollment) throw new ApiError(403, "Enroll in this course to track progress");

  const course = await CourseModel.findById(courseId).select("modules total_lessons").lean<ICourse>();
  if (!course) throw new ApiError(404, "Course not found");

  const valid = new Set(course.modules.flatMap((m, mi) => m.lessons.map((_, li) => `${mi}-${li}`)));
  const keys = [...new Set(strList(completed))].filter((k) => valid.has(k));
  const progress = valid.size ? Math.round((keys.length / valid.size) * 100) : 0;

  enrollment.completed_lessons = keys;
  enrollment.progress = progress;
  await enrollment.save();
  return enrollment.toObject() as unknown as IEnrollment;
}

export async function listEnrollments(args: {
  q?: string | null;
  course?: string | null;
  page: number;
  limit: number;
}): Promise<{ data: IEnrollment[]; meta: ResponseMeta }> {
  const filter: Record<string, unknown> = {};
  const q = str(args.q);
  if (q) {
    const rx = { $regex: escapeRegex(q), $options: "i" };
    filter.$or = [{ "student.name": rx }, { "student.email": rx }];
  }
  if (args.course && Types.ObjectId.isValid(args.course)) filter.course = args.course;

  const [data, total] = await Promise.all([
    EnrollmentModel.find(filter)
      .populate({ path: "course", select: "title slug thumbnail" })
      .sort({ createdAt: -1, _id: -1 })
      .skip((args.page - 1) * args.limit)
      .limit(args.limit)
      .lean<IEnrollment[]>(),
    EnrollmentModel.countDocuments(filter),
  ]);
  return { data, meta: buildMeta(total, args.page, args.limit) };
}
