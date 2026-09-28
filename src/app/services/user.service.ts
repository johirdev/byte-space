import bcrypt from "bcrypt";
import { Types } from "mongoose";
import { UserModel } from "../models/user.model";
import { EnrollmentModel } from "../models/enrollment.model";
import { OrderModel } from "../models/order.model";
import { CourseReviewModel } from "../models/courseReview.model";
import { CourseModel } from "../models/course.model";
import { VerifiedCreatorModel } from "../models/verifiedCreator.model";
import type { IEnrollment, IOrder, IUser, SafeUser, SessionUser } from "../types";
import { ApiError } from "../lib/apiError";
import { buildMeta, type ResponseMeta } from "../lib/sendResponse";
import { FieldCheck, INTL_PHONE_REGEX, URL_REGEX, escapeRegex, str } from "../lib/validate";
import { recomputeCourseRating } from "./course.service";

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUND) || 12;
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;
const MIN_PASSWORD = 8;

type UserRow = IUser & { _id: Types.ObjectId };

export const toSafeUser = (user: UserRow | (IUser & { _id?: unknown })): SafeUser => {
  const { password: _pw, login_attempts: _a, lock_until: _l, ...safe } = user as IUser;
  void _pw;
  void _a;
  void _l;
  return { ...safe, _id: String((user as { _id?: unknown })._id) } as SafeUser;
};

const passwordProblem = (password: unknown): string | null => {
  if (typeof password !== "string" || password.length < MIN_PASSWORD) {
    return `Password must be at least ${MIN_PASSWORD} characters`;
  }
  if (password.length > 128) return "Password is too long";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "Use at least one letter and one number";
  }
  return null;
};

// ── REGISTER ──────────────────────────────────────────────────────────────
/** Only name, email and password are needed — the rest is filled in later from the profile. */
export async function registerUser(body: Record<string, unknown>): Promise<SafeUser> {
  const name = str(body.name);
  const email = str(body.email)?.toLowerCase();
  const password = body.password;

  const check = new FieldCheck()
    .require("name", name, "Full name")
    .minLength("name", name, 2, "Full name")
    .email("email", email)
    .custom("password", !passwordProblem(password), passwordProblem(password) ?? "");
  check.custom("name", (name?.length ?? 0) <= 80, "Name must be 80 characters or less");
  check.throwIfFailed();

  if (await UserModel.exists({ email })) {
    throw new ApiError(409, "An account with this email already exists", {
      email: "Already registered — try signing in",
    });
  }

  const created = await UserModel.create({
    name,
    email,
    password: await bcrypt.hash(password as string, SALT_ROUNDS),
    last_login: new Date(),
  });
  return toSafeUser(created.toObject() as unknown as UserRow);
}

// ── LOGIN ─────────────────────────────────────────────────────────────────
export async function loginUser(body: Record<string, unknown>): Promise<SafeUser> {
  const email = str(body.email)?.toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";

  new FieldCheck()
    .email("email", email)
    .require("password", password, "Password")
    .throwIfFailed();

  const user = await UserModel.findOne({ email })
    .select("+password +login_attempts +lock_until")
    .lean<UserRow>();

  // Same message for unknown email and wrong password — no account enumeration.
  const invalid = new ApiError(401, "Email or password is incorrect");
  if (!user) throw invalid;

  if (user.is_active === false) throw new ApiError(403, "This account has been suspended. Contact support.");

  const now = Date.now();
  if (user.lock_until && new Date(user.lock_until).getTime() > now) {
    const minutes = Math.ceil((new Date(user.lock_until).getTime() - now) / 60_000);
    throw new ApiError(423, `Too many failed attempts. Try again in ${minutes} minute(s).`);
  }

  if (!(await bcrypt.compare(password, user.password))) {
    const attempts = (user.login_attempts ?? 0) + 1;
    const locked = attempts >= MAX_ATTEMPTS;
    await UserModel.updateOne(
      { _id: user._id },
      {
        $set: {
          login_attempts: locked ? 0 : attempts,
          lock_until: locked ? new Date(now + LOCK_MS) : null,
        },
      },
    );
    if (locked) throw new ApiError(423, "Too many failed attempts. Your account is locked for 15 minutes.");
    throw new ApiError(
      401,
      `Email or password is incorrect. ${MAX_ATTEMPTS - attempts} attempt(s) left.`,
    );
  }

  await UserModel.updateOne(
    { _id: user._id },
    { $set: { login_attempts: 0, lock_until: null, last_login: new Date() } },
  );
  return toSafeUser(user);
}

// ── SESSION / PROFILE ─────────────────────────────────────────────────────
export async function getActiveUser(id: string): Promise<SafeUser> {
  if (!Types.ObjectId.isValid(id)) throw new ApiError(401, "Session is no longer valid");
  const user = await UserModel.findById(id).lean<UserRow>();
  if (!user) throw new ApiError(401, "Account no longer exists");
  if (user.is_active === false) throw new ApiError(403, "This account has been suspended");
  return toSafeUser(user);
}

export async function getSessionUser(id: string): Promise<SessionUser> {
  const user = await getActiveUser(id);
  const userId = new Types.ObjectId(id);

  const [enrollments, reviews, orderAgg, creator] = await Promise.all([
    EnrollmentModel.find({ user: userId }).select("course").lean<{ course: Types.ObjectId }[]>(),
    CourseReviewModel.countDocuments({ user: userId }),
    OrderModel.aggregate<{ count: number; spent: number }>([
      { $match: { user: userId, status: "paid" } },
      { $group: { _id: null, count: { $sum: 1 }, spent: { $sum: "$total" } } },
    ]),
    VerifiedCreatorModel.findOne({ user: userId, is_active: true }).select("slug code").lean<{ slug: string; code: string }>(),
  ]);

  return {
    ...user,
    creator: creator ? { slug: creator.slug, code: creator.code } : null,
    enrolled_course_ids: enrollments.map((e) => String(e.course)),
    stats: {
      courses: enrollments.length,
      reviews,
      orders: orderAgg[0]?.count ?? 0,
      spent: Math.round((orderAgg[0]?.spent ?? 0) * 100) / 100,
    },
  };
}

export async function updateProfile(id: string, body: Record<string, unknown>): Promise<SafeUser> {
  const check = new FieldCheck();
  const update: Partial<IUser> = {};

  if (body.name !== undefined) {
    const name = str(body.name);
    check.require("name", name, "Name").minLength("name", name, 2, "Name");
    check.custom("name", (name?.length ?? 0) <= 80, "Name must be 80 characters or less");
    if (name) update.name = name;
  }
  if (body.headline !== undefined) {
    const headline = str(body.headline) ?? "";
    check.custom("headline", headline.length <= 120, "Keep it under 120 characters");
    update.headline = headline;
  }
  if (body.bio !== undefined) {
    const bio = str(body.bio) ?? "";
    check.custom("bio", bio.length <= 1000, "Keep it under 1000 characters");
    update.bio = bio;
  }
  if (body.phone !== undefined) {
    const phone = str(body.phone) ?? "";
    check.custom("phone", !phone || INTL_PHONE_REGEX.test(phone), "Enter a valid phone number");
    update.phone = phone;
  }
  if (body.avatar !== undefined) {
    const avatar = str(body.avatar) ?? "";
    check.custom("avatar", !avatar || URL_REGEX.test(avatar), "Avatar must be an image URL");
    update.avatar = avatar;
  }
  check.throwIfFailed();

  if (!Object.keys(update).length) throw new ApiError(400, "Nothing to update");

  const updated = await UserModel.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true }).lean<UserRow>();
  if (!updated) throw new ApiError(404, "Account not found");

  // Reviews carry a copy of the author's name/avatar/headline — keep them in sync.
  if (update.name !== undefined || update.avatar !== undefined || update.headline !== undefined) {
    await CourseReviewModel.updateMany(
      { user: updated._id },
      { $set: { name: updated.name, avatar: updated.avatar ?? "", designation: updated.headline ?? "" } },
    );
    await EnrollmentModel.updateMany(
      { user: updated._id },
      { $set: { "student.name": updated.name, "student.avatar": updated.avatar ?? "" } },
    );
  }
  return toSafeUser(updated);
}

export async function changePassword(id: string, body: Record<string, unknown>): Promise<void> {
  const current = typeof body.current_password === "string" ? body.current_password : "";
  const next = body.new_password;

  new FieldCheck()
    .require("current_password", current, "Current password")
    .custom("new_password", !passwordProblem(next), passwordProblem(next) ?? "")
    .custom("new_password", next !== current, "Choose a password you haven't used here")
    .throwIfFailed();

  const user = await UserModel.findById(id).select("+password").lean<UserRow>();
  if (!user) throw new ApiError(404, "Account not found");
  if (!(await bcrypt.compare(current, user.password))) {
    throw new ApiError(400, "Current password is incorrect", { current_password: "Incorrect password" });
  }

  await UserModel.updateOne(
    { _id: id },
    { $set: { password: await bcrypt.hash(next as string, SALT_ROUNDS), login_attempts: 0, lock_until: null } },
  );
}

// ── ADMIN ─────────────────────────────────────────────────────────────────
export async function listUsers(args: {
  q?: string | null;
  status?: string | null;
  sort?: string | null;
  page: number;
  limit: number;
}): Promise<{ data: (SafeUser & { courses: number; spent: number })[]; meta: ResponseMeta }> {
  const filter: Record<string, unknown> = {};
  const q = str(args.q);
  if (q) {
    const rx = { $regex: escapeRegex(q), $options: "i" };
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  if (args.status === "active") filter.is_active = { $ne: false };
  if (args.status === "suspended") filter.is_active = false;

  const sort: Record<string, 1 | -1> =
    args.sort === "oldest" ? { createdAt: 1 } : args.sort === "name" ? { name: 1 } : { createdAt: -1 };

  const [rows, total] = await Promise.all([
    UserModel.find(filter)
      .sort({ ...sort, _id: -1 })
      .skip((args.page - 1) * args.limit)
      .limit(args.limit)
      .lean<UserRow[]>(),
    UserModel.countDocuments(filter),
  ]);

  const ids = rows.map((r) => r._id);
  const [enrollCounts, spend] = await Promise.all([
    EnrollmentModel.aggregate<{ _id: Types.ObjectId; n: number }>([
      { $match: { user: { $in: ids } } },
      { $group: { _id: "$user", n: { $sum: 1 } } },
    ]),
    OrderModel.aggregate<{ _id: Types.ObjectId; spent: number }>([
      { $match: { user: { $in: ids }, status: "paid" } },
      { $group: { _id: "$user", spent: { $sum: "$total" } } },
    ]),
  ]);
  const courses = new Map(enrollCounts.map((r) => [String(r._id), r.n]));
  const spent = new Map(spend.map((r) => [String(r._id), r.spent]));

  return {
    data: rows.map((row) => ({
      ...toSafeUser(row),
      courses: courses.get(String(row._id)) ?? 0,
      spent: Math.round((spent.get(String(row._id)) ?? 0) * 100) / 100,
    })),
    meta: buildMeta(total, args.page, args.limit),
  };
}

export async function getUserDetail(id: string) {
  const user = await UserModel.findById(id).lean<UserRow>();
  if (!user) throw new ApiError(404, "User not found");

  const [enrollments, orders, reviews] = await Promise.all([
    EnrollmentModel.find({ user: id })
      .populate({ path: "course", select: "title slug thumbnail price" })
      .sort({ createdAt: -1 })
      .lean<IEnrollment[]>(),
    OrderModel.find({ user: id }).sort({ createdAt: -1 }).lean<IOrder[]>(),
    CourseReviewModel.find({ user: id })
      .populate({ path: "course", select: "title slug" })
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  return { user: toSafeUser(user), enrollments, orders, reviews };
}

export async function setUserActive(id: string, active: boolean): Promise<SafeUser> {
  const user = await UserModel.findByIdAndUpdate(
    id,
    { $set: { is_active: active, ...(active ? { login_attempts: 0, lock_until: null } : {}) } },
    { new: true },
  ).lean<UserRow>();
  if (!user) throw new ApiError(404, "User not found");
  return toSafeUser(user);
}

/**
 * Removes the account, its enrollments and reviews. Orders are kept (they
 * carry a customer snapshot) so sales history stays intact.
 */
export async function deleteUser(id: string): Promise<SafeUser> {
  const user = await UserModel.findById(id).lean<UserRow>();
  if (!user) throw new ApiError(404, "User not found");

  const [enrollments, reviews] = await Promise.all([
    EnrollmentModel.find({ user: id }).select("course").lean<{ course: Types.ObjectId }[]>(),
    CourseReviewModel.find({ user: id }).select("course").lean<{ course: Types.ObjectId }[]>(),
  ]);

  await Promise.all([
    UserModel.deleteOne({ _id: id }),
    EnrollmentModel.deleteMany({ user: id }),
    CourseReviewModel.deleteMany({ user: id }),
    enrollments.length
      ? CourseModel.updateMany(
          { _id: { $in: enrollments.map((e) => String(e.course)) }, students_count: { $gt: 0 } },
          { $inc: { students_count: -1 } },
        )
      : null,
  ]);
  await Promise.all(
    [...new Set(reviews.map((r) => String(r.course)))].map((courseId) => recomputeCourseRating(courseId)),
  );
  return toSafeUser(user);
}
