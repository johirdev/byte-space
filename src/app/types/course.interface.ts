/**
 * Course domain types — shared by the API, the public site and the admin panel.
 */
import type { IOrder } from "./user.interface";

type WithTimestamps = {
  _id?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

/* ── Constants ───────────────────────────────────────────────────────── */
export const COURSE_LEVELS = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "All Levels",
] as const;
export type CourseLevel = (typeof COURSE_LEVELS)[number];

export const COURSE_STATUSES = ["draft", "published"] as const;
export type CourseStatus = (typeof COURSE_STATUSES)[number];

export const REVIEW_STATUSES = ["approved", "pending"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const COURSE_SORTS = [
  "relevant",
  "newest",
  "oldest",
  "rating",
  "popular",
  "price_asc",
  "price_desc",
  "title",
] as const;
export type CourseSort = (typeof COURSE_SORTS)[number];

export const COURSE_SORT_LABELS: Record<CourseSort, string> = {
  relevant: "Most relevant",
  newest: "Newest",
  oldest: "Oldest",
  rating: "Highest rated",
  popular: "Most popular",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
  title: "Title (A–Z)",
};

export const DEFAULT_COURSE_INCLUDES = [
  "Learning Resources",
  "Quality Lesson Videos",
  "Certificate of Completion",
  "Private Consultation",
];

/* ── Category ────────────────────────────────────────────────────────── */
export type ICourseCategory = WithTimestamps & {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  order?: number;
  is_active?: boolean;
  /** Computed on read — number of courses in the category. */
  course_count?: number;
};

/* ── Course ──────────────────────────────────────────────────────────── */
export type ICourseLesson = {
  title: string;
  /** Minutes. */
  duration: number;
  is_preview?: boolean;
};

export type ICourseModule = {
  title: string;
  description?: string;
  lessons: ICourseLesson[];
};

export type ICourseCreator = {
  /** Verified creator this course belongs to (see creator-application flow). */
  creator_id?: string | null;
  name: string;
  title?: string;
  avatar?: string;
  bio?: string;
};

export type CourseCategoryRef = Pick<ICourseCategory, "_id" | "name" | "slug">;

export type ICourse = WithTimestamps & {
  title: string;
  slug: string;
  subtitle?: string;
  /** ObjectId on write, populated `{ _id, name, slug }` on read. */
  category: string | CourseCategoryRef;
  level: CourseLevel;
  price: number;
  price_label?: string;
  thumbnail: string;
  preview_video?: string;
  description: string;
  sneak_peek: string[];
  key_points: string[];
  includes: string[];
  modules_intro?: string;
  lesson_content_info?: string;
  progress_info?: string;
  modules: ICourseModule[];
  creator: ICourseCreator;
  students_count: number;
  tags: string[];
  is_featured: boolean;
  status: CourseStatus;
  /** Denormalised from approved reviews. */
  rating_avg: number;
  rating_count: number;
  /** Denormalised from `modules`. */
  total_lessons: number;
  /** Minutes, denormalised from `modules`. */
  total_duration: number;
};

/** Everything the course form edits — the server computes the rest. */
export type CourseFormValues = Omit<
  ICourse,
  | "_id"
  | "slug"
  | "category"
  | "rating_avg"
  | "rating_count"
  | "total_lessons"
  | "total_duration"
  | "createdAt"
  | "updatedAt"
> & { category: string; slug?: string };

/* ── Review ──────────────────────────────────────────────────────────── */
export type CourseRef = Pick<ICourse, "_id" | "title" | "slug" | "thumbnail">;

export type ICourseReview = WithTimestamps & {
  course: string | CourseRef;
  /** Set when a signed-in learner wrote it; absent for admin-authored (demo) reviews. */
  user?: string | null;
  name: string;
  designation?: string;
  avatar?: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
};

export type ReviewSummary = {
  average: number;
  total: number;
  /** Count per star, keyed "5" → "1". */
  breakdown: Record<"1" | "2" | "3" | "4" | "5", number>;
};

/* ── Dashboard ───────────────────────────────────────────────────────── */
export type DashboardStats = {
  courses: { total: number; published: number; draft: number; featured: number };
  categories: { total: number; active: number };
  reviews: { total: number; pending: number; average: number };
  students: number;
  byCategory: { _id: string; name: string; count: number }[];
  recentCourses: Pick<
    ICourse,
    "_id" | "title" | "slug" | "thumbnail" | "status" | "price" | "createdAt" | "rating_avg"
  >[];
  topRated: Pick<
    ICourse,
    "_id" | "title" | "slug" | "thumbnail" | "rating_avg" | "rating_count" | "students_count"
  >[];
  recentReviews: ICourseReview[];
  learners: { users: number; newUsers: number; enrollments: number; orders: number; revenue: number };
  recentOrders: IOrder[];
};

/* ── Creator (derived from courses' `creator` block) ─────────────────── */
export type CreatorSummary = {
  slug: string;
  name: string;
  title: string;
  avatar: string;
  bio: string;
  stats: { courses: number; students: number; reviews: number; rating: number };
  /** Set when the creator passed the application review. */
  verified?: boolean;
  linkedin?: string;
  website?: string;
  expertise?: string[];
  /** Demo count (no follow system yet) — stable per creator. */
  followers: number;
};

export type CreatorProfile = CreatorSummary & {
  categories: { name: string; slug: string; count: number }[];
};

/* ── Creator applications & verified creators ────────────────────────── */
export const APPLICATION_STATUSES = ["pending", "approved", "rejected"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

/** Minutes a user must wait between two applications. */
export const APPLICATION_COOLDOWN_MINUTES = 5;

/** Fields an applicant fills in — shared by the form and the API. */
export type CreatorApplicationInput = {
  name: string;
  email: string;
  phone: string;
  avatar: string;
  designation: string;
  bio: string;
  experience_years: number;
  expertise: string[];
  linkedin: string;
  website?: string;
  followers?: number;
  teaching_plan: string;
};

export type ICreatorApplication = CreatorApplicationInput & {
  _id?: string;
  user: string;
  status: ApplicationStatus;
  admin_note?: string;
  reviewed_by?: { id: string; name: string } | null;
  reviewed_at?: string | Date | null;
  creator?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

export type IVerifiedCreator = {
  _id?: string;
  /** Human-friendly id admins search by, e.g. "CR-7F3A2". */
  code: string;
  slug: string;
  user?: string | null;
  application?: string | null;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  title?: string;
  bio?: string;
  linkedin?: string;
  website?: string;
  experience_years?: number;
  expertise?: string[];
  followers?: number;
  is_active: boolean;
  verified_at?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  /** Computed on list reads. */
  course_count?: number;
};

/** GET /creator-applications/me */
export type MyCreatorStatus = {
  creator: IVerifiedCreator | null;
  latest: ICreatorApplication | null;
  history: ICreatorApplication[];
  /** ISO time the next application is allowed, or null when allowed now. */
  next_allowed_at: string | null;
};

/* ── Testimonials (home page) ────────────────────────────────────────── */
export type ITestimonial = {
  _id?: string;
  name: string;
  /** Shown in blue under the name, e.g. "Enthusiastic Learner". */
  role: string;
  avatar: string;
  quote: string;
  /** Optional 1–5; not shown in the current design. */
  rating?: number;
  order: number;
  is_active: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

/* ── FAQs ────────────────────────────────────────────────────────────── */
export const FAQ_CATEGORIES = ["General", "Courses", "Payments", "Creators", "Account"] as const;
export type FaqCategory = (typeof FAQ_CATEGORIES)[number];

export type IFaq = {
  _id?: string;
  question: string;
  answer: string;
  category: FaqCategory;
  order: number;
  is_active: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};
