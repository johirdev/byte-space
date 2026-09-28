/**
 * Learner-side domain types: accounts, orders (checkout) and enrollments.
 */
import type { CourseRef, ICourse } from "./course.interface";

type WithTimestamps = {
  _id?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

/* ── User ────────────────────────────────────────────────────────────── */
export const USER_ROLES = ["student", "creator"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export type IUser = WithTimestamps & {
  name: string;
  email: string;
  password: string;
  avatar?: string;
  headline?: string;
  bio?: string;
  phone?: string;
  role: UserRole;
  is_active?: boolean;
  last_login?: string | Date | null;
  login_attempts?: number;
  lock_until?: string | Date | null;
};

/** What the API ever sends back — never the hash or lockout internals. */
export type SafeUser = Omit<IUser, "password" | "login_attempts" | "lock_until">;

/** The signed-in user as the site sees it (GET /users/me). */
export type SessionUser = SafeUser & {
  enrolled_course_ids: string[];
  stats: { courses: number; reviews: number; orders: number; spent: number };
};

/** Frozen copy of the buyer on orders and enrollments. */
export type UserSnapshot = {
  user_id: string;
  name: string;
  email: string;
  avatar?: string;
};

/* ── Orders / payment (demo) ─────────────────────────────────────────── */
export const PAYMENT_METHODS = ["card", "bkash", "nagad", "rocket", "paypal"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  card: "Credit / Debit card",
  bkash: "bKash",
  nagad: "Nagad",
  rocket: "Rocket",
  paypal: "PayPal",
};

export const ORDER_STATUSES = ["paid", "refunded", "failed"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type OrderItem = {
  course: string | CourseRef;
  title: string;
  slug: string;
  thumbnail: string;
  price: number;
};

export type IOrder = WithTimestamps & {
  order_no: string;
  user: string | SafeUser;
  customer: UserSnapshot;
  items: OrderItem[];
  subtotal: number;
  total: number;
  currency: "USD";
  payment: {
    method: PaymentMethod;
    /** Masked — e.g. "•••• 4242" or "01•••••5678". Never the full number. */
    account: string;
    transaction_id: string;
    paid_at: string | Date;
  };
  status: OrderStatus;
};

/* ── Enrollment ──────────────────────────────────────────────────────── */
export type IEnrollment = WithTimestamps & {
  user: string | SafeUser;
  course: string | ICourse;
  order?: string;
  /** user id, name, email and image at the time of enrolling. */
  student: UserSnapshot;
  price_paid: number;
  completed_lessons: string[];
  progress: number;
};

/** An enrolled course as the profile renders it. */
export type EnrolledCourse = IEnrollment & {
  course: ICourse;
  my_review?: { _id: string; rating: number; comment: string; status: string } | null;
};

export type CheckoutPayload = {
  courses: string[];
  payment_method: PaymentMethod;
  /** Demo payment details — validated, masked, never stored in full. */
  card?: { number: string; name: string; expiry: string; cvc: string };
  wallet?: { number: string; pin: string };
  paypal?: { email: string };
};

export type AdminUserStats = {
  users: { total: number; active: number; newThisMonth: number };
  orders: { total: number; revenue: number };
  enrollments: number;
};
