import { isValidObjectId, type SortOrder, Types } from "mongoose";
import { CourseModel } from "../models/course.model";
import { CourseCategoryModel } from "../models/courseCategory.model";
import { CourseReviewModel } from "../models/courseReview.model";
import { EnrollmentModel } from "../models/enrollment.model";
import { OrderModel } from "../models/order.model";
import { UserModel } from "../models/user.model";
import {
  COURSE_LEVELS,
  COURSE_SORTS,
  COURSE_STATUSES,
  DEFAULT_COURSE_INCLUDES,
  type CourseLevel,
  type CourseSort,
  type CourseStatus,
  type DashboardStats,
  type ICourse,
  type ICourseCreator,
  type ICourseModule,
} from "../types";
import { ApiError } from "../lib/apiError";
import { buildMeta, type ResponseMeta } from "../lib/sendResponse";
import {
  FieldCheck,
  URL_REGEX,
  bool,
  escapeRegex,
  num,
  oneOf,
  slugify,
  str,
  strList,
} from "../lib/validate";
import { findCategory } from "./courseCategory.service";
import { creatorNameForSlug } from "./creator.service";
import { courseCreatorFromId } from "./verifiedCreator.service";

type CourseRow = ICourse & { _id: string };

/** Fields the listing cards never render — kept out of list payloads. */
const LIST_EXCLUDE =
  "-description -modules -sneak_peek -key_points -includes -modules_intro -lesson_content_info -progress_info";

const CATEGORY_POPULATE = { path: "category", select: "name slug" } as const;

const SORTS: Record<CourseSort, Record<string, SortOrder>> = {
  relevant: { is_featured: -1, rating_count: -1, createdAt: -1 },
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  rating: { rating_avg: -1, rating_count: -1 },
  popular: { students_count: -1, rating_count: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  title: { title: 1 },
};

// ── Helpers ───────────────────────────────────────────────────────────────
const uniqueSlug = async (base: string, excludeId?: string): Promise<string> => {
  const root = slugify(base) || "course";
  let candidate = root;
  for (let i = 2; i < 200; i++) {
    const clash = await CourseModel.exists({
      slug: candidate,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    });
    if (!clash) return candidate;
    candidate = `${root}-${i}`;
  }
  return `${root}-${Date.now().toString(36)}`;
};

const asArray = (val: unknown): unknown[] => {
  if (Array.isArray(val)) return val;
  if (typeof val === "string" && val.trim().startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const asRecord = (val: unknown): Record<string, unknown> =>
  val && typeof val === "object" && !Array.isArray(val)
    ? (val as Record<string, unknown>)
    : {};

/** Validates the curriculum and reports errors per row, e.g. `modules.2.lessons.0.title`. */
const parseModules = (raw: unknown, check: FieldCheck): ICourseModule[] =>
  asArray(raw).map((m, i) => {
    const mod = asRecord(m);
    const title = str(mod.title);
    check.custom(`modules.${i}.title`, Boolean(title), "Module title is required");

    const lessons = asArray(mod.lessons).map((l, j) => {
      const lesson = asRecord(l);
      const lessonTitle = str(lesson.title);
      const duration = num(lesson.duration) ?? 0;
      check
        .custom(
          `modules.${i}.lessons.${j}.title`,
          Boolean(lessonTitle),
          "Lesson title is required",
        )
        .custom(
          `modules.${i}.lessons.${j}.duration`,
          duration >= 0 && duration <= 600,
          "Duration must be 0–600 minutes",
        );
      return {
        title: lessonTitle ?? "",
        duration: Math.round(duration),
        is_preview: bool(lesson.is_preview),
      };
    });

    return { title: title ?? "", description: str(mod.description) ?? "", lessons };
  });

const totalsOf = (modules: ICourseModule[]) => {
  const lessons = modules.flatMap((m) => m.lessons);
  return {
    total_lessons: lessons.length,
    total_duration: lessons.reduce((sum, l) => sum + (l.duration || 0), 0),
  };
};

/**
 * Normalises and validates a create/update body. On update only the keys
 * that are present are touched, so quick toggles (status, featured) work
 * with a one-field PATCH.
 */
const buildPayload = async (
  body: Record<string, unknown>,
  existing?: CourseRow,
): Promise<Record<string, unknown>> => {
  const isCreate = !existing;
  const has = (key: string) => isCreate || body[key] !== undefined;
  const check = new FieldCheck();
  const out: Record<string, unknown> = {};

  if (has("title")) {
    const title = str(body.title);
    check.require("title", title, "Title").minLength("title", title, 5, "Title");
    check.custom("title", (title?.length ?? 0) <= 140, "Title must be 140 characters or less");
    out.title = title;
  }

  if (has("subtitle")) out.subtitle = str(body.subtitle) ?? "";

  if (has("category")) {
    const categoryId = str(body.category);
    if (!categoryId) {
      check.custom("category", false, "Choose a category");
    } else {
      const category = await findCategory(categoryId);
      check.custom("category", Boolean(category), "That category no longer exists");
      if (category) out.category = category._id;
    }
  }

  if (has("level")) {
    const level = str(body.level);
    check.custom(
      "level",
      !level || COURSE_LEVELS.includes(level as CourseLevel),
      "Choose a valid level",
    );
    out.level = oneOf(level, COURSE_LEVELS, "Beginner");
  }

  if (has("price")) {
    const price = num(body.price) ?? 0;
    check.custom("price", price >= 0 && price <= 100000, "Price must be between 0 and 100000");
    out.price = Math.round(price * 100) / 100;
  }

  if (has("price_label")) out.price_label = str(body.price_label) ?? "lifetime";

  if (has("thumbnail")) {
    const thumbnail = str(body.thumbnail);
    check.require("thumbnail", thumbnail, "Thumbnail").url("thumbnail", thumbnail);
    out.thumbnail = thumbnail;
  }

  if (has("preview_video")) {
    const video = str(body.preview_video);
    check.url("preview_video", video);
    out.preview_video = video ?? "";
  }

  if (has("description")) {
    const description = str(body.description);
    check
      .require("description", description, "Description")
      .minLength("description", description, 50, "Description");
    out.description = description;
  }

  if (has("sneak_peek")) {
    const images = strList(body.sneak_peek);
    check
      .custom(
        "sneak_peek",
        images.every((u) => URL_REGEX.test(u)),
        "Every sneak-peek image must be a valid URL",
      )
      .custom("sneak_peek", images.length <= 8, "Up to 8 sneak-peek images");
    out.sneak_peek = images;
  }

  if (has("key_points")) {
    const points = strList(body.key_points);
    check.custom("key_points", points.length <= 20, "Up to 20 key points");
    out.key_points = points;
  }

  if (has("includes")) {
    const includes = strList(body.includes);
    out.includes = includes.length ? includes : [...DEFAULT_COURSE_INCLUDES];
  }

  for (const key of ["modules_intro", "lesson_content_info", "progress_info"] as const) {
    if (has(key)) out[key] = str(body[key]) ?? "";
  }

  if (has("modules")) {
    const modules = parseModules(body.modules, check);
    check.custom("modules", modules.length <= 50, "Up to 50 modules");
    out.modules = modules;
    Object.assign(out, totalsOf(modules));
  }

  if (has("creator")) {
    const raw = asRecord(body.creator);
    const creatorId = str(raw.creator_id);

    if (creatorId) {
      // Linked to a verified creator: the record is the source of truth,
      // whatever name/avatar the client sent is ignored.
      const linked = await courseCreatorFromId(creatorId);
      check.custom("creator.creator_id", Boolean(linked), "That creator is no longer verified — pick another");
      if (linked) out.creator = linked;
    } else {
      const creator: ICourseCreator = {
        creator_id: null,
        name: str(raw.name) ?? "",
        title: str(raw.title) ?? "",
        avatar: str(raw.avatar) ?? "",
        bio: str(raw.bio) ?? "",
      };
      check.require("creator.name", creator.name, "Creator name");
      check.url("creator.avatar", creator.avatar);
      out.creator = creator;
    }
  }

  if (has("students_count")) {
    const students = num(body.students_count) ?? 0;
    check.custom("students_count", students >= 0, "Cannot be negative");
    out.students_count = Math.round(students);
  }

  if (has("tags")) out.tags = strList(body.tags).slice(0, 15);
  if (has("is_featured")) out.is_featured = bool(body.is_featured);

  if (has("status")) {
    const status = str(body.status);
    check.custom(
      "status",
      !status || COURSE_STATUSES.includes(status as CourseStatus),
      "Choose a valid status",
    );
    out.status = oneOf(status, COURSE_STATUSES, "draft");
  }

  // A published course must have something to watch.
  const finalStatus = (out.status ?? existing?.status) as CourseStatus | undefined;
  const finalModules = (out.modules ?? existing?.modules ?? []) as ICourseModule[];
  if (finalStatus === "published" && totalsOf(finalModules).total_lessons === 0) {
    check.custom("modules", false, "Add at least one lesson before publishing");
  }

  check.throwIfFailed();

  // Slugs are URLs — only regenerate on create, an explicit new slug, or a renamed title.
  const explicitSlug = str(body.slug);
  const titleChanged = out.title !== undefined && out.title !== existing?.title;
  if (isCreate || titleChanged || (explicitSlug && slugify(explicitSlug) !== existing?.slug)) {
    out.slug = await uniqueSlug(explicitSlug ?? (out.title as string), existing?._id);
  }

  return out;
};

// ── READ ──────────────────────────────────────────────────────────────────
export type CourseListArgs = {
  q?: string | null;
  category?: string | null;
  level?: string | null;
  price?: string | null;
  rating?: string | number | null;
  featured?: string | boolean | null;
  status?: string | null;
  sort?: string | null;
  page?: number;
  limit?: number;
  /** Comma-separated course ids (cart re-validation). */
  ids?: string | null;
  /** Creator slug — only that creator's courses. */
  creator?: string | null;
  /** Admin callers see drafts and may filter by status. */
  admin?: boolean;
};

export const listCourses = async (
  args: CourseListArgs,
): Promise<{ data: ICourse[]; meta: ResponseMeta }> => {
  const page = Math.max(1, args.page ?? 1);
  const limit = Math.min(100, Math.max(1, args.limit ?? 12));
  const filter: Record<string, unknown> = {};

  if (!args.admin) {
    filter.status = "published";
  } else if (args.status && COURSE_STATUSES.includes(args.status as CourseStatus)) {
    filter.status = args.status;
  }

  const creatorKey = str(args.creator);
  if (creatorKey) {
    const name = await creatorNameForSlug(creatorKey);
    if (!name) return { data: [], meta: buildMeta(0, page, limit) };
    filter["creator.name"] = name;
  }

  const ids = strList(args.ids).filter((id) => isValidObjectId(id)).slice(0, 50);
  if (ids.length) filter._id = { $in: ids };

  const q = str(args.q);
  if (q) {
    const rx = { $regex: escapeRegex(q), $options: "i" };
    filter.$or = [{ title: rx }, { subtitle: rx }, { tags: rx }, { "creator.name": rx }];
  }

  const categoryKey = str(args.category);
  if (categoryKey) {
    const category = await findCategory(categoryKey);
    if (!category) return { data: [], meta: buildMeta(0, page, limit) };
    filter.category = category._id;
  }

  const levels = strList(args.level).filter((l) =>
    COURSE_LEVELS.includes(l as CourseLevel),
  );
  if (levels.length) filter.level = { $in: levels };

  if (args.price === "free") filter.price = 0;
  if (args.price === "paid") filter.price = { $gt: 0 };

  const minRating = num(args.rating);
  if (minRating) filter.rating_avg = { $gte: minRating };

  if (args.featured !== undefined && args.featured !== null && args.featured !== "") {
    filter.is_featured = bool(args.featured);
  }

  const sortKey = oneOf(args.sort, COURSE_SORTS, "relevant");
  const sort = { ...SORTS[sortKey], _id: -1 as SortOrder };

  const [data, total] = await Promise.all([
    CourseModel.find(filter)
      .select(LIST_EXCLUDE)
      .populate(CATEGORY_POPULATE)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<ICourse[]>(),
    CourseModel.countDocuments(filter),
  ]);

  return { data, meta: buildMeta(total, page, limit) };
};

export const getCourse = async (
  idOrSlug: string,
  opts: { admin?: boolean } = {},
): Promise<ICourse> => {
  const filter = isValidObjectId(idOrSlug)
    ? { _id: idOrSlug }
    : { slug: idOrSlug.toLowerCase() };

  const course = await CourseModel.findOne(filter)
    .populate(CATEGORY_POPULATE)
    .lean<CourseRow>();

  if (!course || (!opts.admin && course.status !== "published")) {
    throw new ApiError(404, "Course not found");
  }
  return course;
};

// ── WRITE ─────────────────────────────────────────────────────────────────
export const createCourse = async (body: Record<string, unknown>): Promise<ICourse> => {
  const payload = await buildPayload(body);
  const created = await CourseModel.create(payload);
  return getCourse(String(created._id), { admin: true });
};

export const updateCourse = async (
  id: string,
  body: Record<string, unknown>,
): Promise<ICourse> => {
  const existing = await CourseModel.findById(id).lean<CourseRow>();
  if (!existing) throw new ApiError(404, "Course not found");

  const payload = await buildPayload(body, { ...existing, _id: String(existing._id) });
  if (!Object.keys(payload).length) {
    throw new ApiError(400, "No valid fields supplied to update");
  }

  await CourseModel.updateOne({ _id: id }, { $set: payload }, { runValidators: true });
  return getCourse(id, { admin: true });
};

export const deleteCourse = async (id: string): Promise<ICourse> => {
  const course = await CourseModel.findById(id).lean<CourseRow>();
  if (!course) throw new ApiError(404, "Course not found");

  await Promise.all([
    CourseModel.deleteOne({ _id: id }),
    CourseReviewModel.deleteMany({ course: id }),
    EnrollmentModel.deleteMany({ course: id }),
  ]);
  return course;
};

/** Re-derives `rating_avg` / `rating_count` from approved reviews. */
export const recomputeCourseRating = async (courseId: string | Types.ObjectId) => {
  const [row] = await CourseReviewModel.aggregate<{ avg: number; count: number }>([
    { $match: { course: new Types.ObjectId(String(courseId)), status: "approved" } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  await CourseModel.updateOne(
    { _id: String(courseId) },
    {
      $set: {
        rating_avg: row ? Math.round(row.avg * 10) / 10 : 0,
        rating_count: row?.count ?? 0,
      },
    },
  );
};

// ── DASHBOARD ─────────────────────────────────────────────────────────────
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const [
    total,
    published,
    featured,
    categoriesTotal,
    categoriesActive,
    reviewAgg,
    pendingReviews,
    studentsAgg,
    byCategory,
    recentCourses,
    topRated,
    recentReviews,
    usersTotal,
    newUsers,
    enrollmentsTotal,
    salesAgg,
    recentOrders,
  ] = await Promise.all([
    CourseModel.countDocuments(),
    CourseModel.countDocuments({ status: "published" }),
    CourseModel.countDocuments({ is_featured: true }),
    CourseCategoryModel.countDocuments(),
    CourseCategoryModel.countDocuments({ is_active: { $ne: false } }),
    CourseReviewModel.aggregate<{ total: number; avg: number }>([
      { $group: { _id: null, total: { $sum: 1 }, avg: { $avg: "$rating" } } },
    ]),
    CourseReviewModel.countDocuments({ status: "pending" }),
    CourseModel.aggregate<{ total: number }>([
      { $group: { _id: null, total: { $sum: "$students_count" } } },
    ]),
    CourseModel.aggregate<{ _id: string; name: string; count: number }>([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      {
        $lookup: {
          from: "course_categories",
          localField: "_id",
          foreignField: "_id",
          as: "cat",
        },
      },
      { $project: { count: 1, name: { $ifNull: [{ $first: "$cat.name" }, "Uncategorised"] } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
    CourseModel.find()
      .select("title slug thumbnail status price createdAt rating_avg")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    CourseModel.find({ rating_count: { $gt: 0 } })
      .select("title slug thumbnail rating_avg rating_count students_count")
      .sort({ rating_avg: -1, rating_count: -1 })
      .limit(5)
      .lean(),
    CourseReviewModel.find()
      .populate({ path: "course", select: "title slug" })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    UserModel.countDocuments(),
    UserModel.countDocuments({ createdAt: { $gte: new Date(Date.now() - 30 * 864e5) } }),
    EnrollmentModel.countDocuments(),
    OrderModel.aggregate<{ orders: number; revenue: number }>([
      { $match: { status: "paid" } },
      { $group: { _id: null, orders: { $sum: 1 }, revenue: { $sum: "$total" } } },
    ]),
    OrderModel.find().sort({ createdAt: -1 }).limit(5).lean(),
  ]);

  return JSON.parse(
    JSON.stringify({
      courses: { total, published, draft: total - published, featured },
      categories: { total: categoriesTotal, active: categoriesActive },
      reviews: {
        total: reviewAgg[0]?.total ?? 0,
        pending: pendingReviews,
        average: Math.round((reviewAgg[0]?.avg ?? 0) * 10) / 10,
      },
      students: studentsAgg[0]?.total ?? 0,
      byCategory,
      recentCourses,
      topRated,
      recentReviews,
      learners: {
        users: usersTotal,
        newUsers,
        enrollments: enrollmentsTotal,
        orders: salesAgg[0]?.orders ?? 0,
        revenue: Math.round((salesAgg[0]?.revenue ?? 0) * 100) / 100,
      },
      recentOrders,
    }),
  ) as DashboardStats;
};
