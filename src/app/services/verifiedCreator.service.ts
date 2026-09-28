import { randomBytes } from "node:crypto";
import { isValidObjectId, Types } from "mongoose";
import { VerifiedCreatorModel } from "../models/verifiedCreator.model";
import { CourseModel } from "../models/course.model";
import { UserModel } from "../models/user.model";
import type { ICourseCreator, ICreatorApplication, IVerifiedCreator } from "../types";
import { ApiError } from "../lib/apiError";
import { buildMeta, type ResponseMeta } from "../lib/sendResponse";
import { FieldCheck, INTL_PHONE_REGEX, URL_REGEX, bool, escapeRegex, num, slugify, str, strList } from "../lib/validate";

type Row = IVerifiedCreator & { _id: Types.ObjectId };

const newCode = async (): Promise<string> => {
  for (let i = 0; i < 10; i++) {
    const code = `CR-${randomBytes(3).toString("hex").toUpperCase().slice(0, 5)}`;
    if (!(await VerifiedCreatorModel.exists({ code }))) return code;
  }
  return `CR-${Date.now().toString(36).toUpperCase()}`;
};

const uniqueSlug = async (name: string, excludeId?: unknown): Promise<string> => {
  const root = slugify(name) || "creator";
  let candidate = root;
  for (let i = 2; i < 200; i++) {
    const clash = await VerifiedCreatorModel.exists({
      slug: candidate,
      ...(excludeId ? { _id: { $ne: String(excludeId) } } : {}),
    });
    if (!clash) return candidate;
    candidate = `${root}-${i}`;
  }
  return `${root}-${Date.now().toString(36)}`;
};

/** Course snapshot of a creator record. */
export const toCourseCreator = (c: Pick<IVerifiedCreator, "_id" | "name" | "title" | "avatar" | "bio">): ICourseCreator => ({
  creator_id: String(c._id),
  name: c.name,
  title: c.title ?? "",
  avatar: c.avatar ?? "",
  bio: c.bio ?? "",
});

/** Pushes the creator's current details into every course that links to it. */
async function syncCourseSnapshots(creator: Row) {
  await CourseModel.updateMany(
    { "creator.creator_id": creator._id },
    {
      $set: {
        "creator.name": creator.name,
        "creator.title": creator.title ?? "",
        "creator.avatar": creator.avatar ?? "",
        "creator.bio": creator.bio ?? "",
      },
    },
  );
}

// ── Approval hook ─────────────────────────────────────────────────────────
export async function upsertCreatorFromApplication(app: ICreatorApplication & { _id: Types.ObjectId }): Promise<Row> {
  const fields = {
    application: app._id,
    name: app.name,
    email: app.email,
    phone: app.phone,
    avatar: app.avatar,
    title: app.designation,
    bio: app.bio,
    linkedin: app.linkedin,
    website: app.website ?? "",
    experience_years: app.experience_years,
    expertise: app.expertise,
    followers: app.followers ?? 0,
    is_active: true,
    verified_at: new Date(),
  };

  const existing = await VerifiedCreatorModel.findOne({ user: app.user }).lean<Row>();
  if (existing) {
    const slug = existing.name === app.name ? existing.slug : await uniqueSlug(app.name, existing._id);
    const updated = await VerifiedCreatorModel.findByIdAndUpdate(existing._id, { $set: { ...fields, slug } }, { new: true }).lean<Row>();
    await syncCourseSnapshots(updated!);
    return updated!;
  }

  const created = await VerifiedCreatorModel.create({
    ...fields,
    user: app.user,
    code: await newCode(),
    slug: await uniqueSlug(app.name),
  });
  return created.toObject() as unknown as Row;
}

// ── Reads ─────────────────────────────────────────────────────────────────
const searchFilter = (q?: string | null) => {
  const term = str(q);
  if (!term) return {};
  const rx = { $regex: escapeRegex(term), $options: "i" };
  const or: Record<string, unknown>[] = [{ name: rx }, { email: rx }, { code: rx }, { title: rx }];
  if (isValidObjectId(term)) or.push({ _id: term });
  return { $or: or };
};

export async function listVerifiedCreators(args: {
  q?: string | null;
  status?: string | null;
  page: number;
  limit: number;
}): Promise<{ data: IVerifiedCreator[]; meta: ResponseMeta }> {
  const filter: Record<string, unknown> = { ...searchFilter(args.q) };
  if (args.status === "active") filter.is_active = true;
  if (args.status === "inactive") filter.is_active = false;

  const [rows, total] = await Promise.all([
    VerifiedCreatorModel.find(filter)
      .sort({ verified_at: -1, _id: -1 })
      .skip((args.page - 1) * args.limit)
      .limit(args.limit)
      .lean<Row[]>(),
    VerifiedCreatorModel.countDocuments(filter),
  ]);

  const counts = await CourseModel.aggregate<{ _id: Types.ObjectId; n: number }>([
    { $match: { "creator.creator_id": { $in: rows.map((r) => r._id) } } },
    { $group: { _id: "$creator.creator_id", n: { $sum: 1 } } },
  ]);
  const byId = new Map(counts.map((c) => [String(c._id), c.n]));

  return {
    data: rows.map((r) => ({ ...r, course_count: byId.get(String(r._id)) ?? 0 })),
    meta: buildMeta(total, args.page, args.limit),
  };
}

/** Course-form picker: active creators matching name / code / email / id. */
export const searchCreators = (q?: string | null) =>
  VerifiedCreatorModel.find({ ...searchFilter(q), is_active: true })
    .select("code slug name email title avatar bio followers expertise")
    .sort({ name: 1 })
    .limit(10)
    .lean<IVerifiedCreator[]>();

export async function getVerifiedCreator(id: string): Promise<IVerifiedCreator> {
  if (!isValidObjectId(id)) throw new ApiError(404, "Creator not found");
  const creator = await VerifiedCreatorModel.findById(id).lean<IVerifiedCreator>();
  if (!creator) throw new ApiError(404, "Creator not found");
  return creator;
}

/** For course saves: the active creator to snapshot, or a field error. */
export async function courseCreatorFromId(id: string): Promise<ICourseCreator | null> {
  if (!isValidObjectId(id)) return null;
  const creator = await VerifiedCreatorModel.findOne({ _id: id, is_active: true }).lean<Row>();
  return creator ? toCourseCreator(creator) : null;
}

// ── Writes (admin) ────────────────────────────────────────────────────────
export async function updateVerifiedCreator(id: string, body: Record<string, unknown>): Promise<IVerifiedCreator> {
  const existing = await VerifiedCreatorModel.findById(id).lean<Row>();
  if (!existing) throw new ApiError(404, "Creator not found");

  const check = new FieldCheck();
  const set: Record<string, unknown> = {};
  const text = (key: string, max: number, required = false) => {
    if (body[key] === undefined) return;
    const v = str(body[key]) ?? "";
    if (required) check.require(key, v, key);
    check.custom(key, v.length <= max, `Keep it under ${max} characters`);
    set[key] = v;
  };
  text("name", 80, true);
  text("title", 100);
  text("bio", 1500);
  if (body.email !== undefined) {
    const email = str(body.email)?.toLowerCase() ?? "";
    check.email("email", email);
    set.email = email;
  }
  if (body.phone !== undefined) {
    const phone = str(body.phone) ?? "";
    check.custom("phone", !phone || INTL_PHONE_REGEX.test(phone), "Enter a valid phone number");
    set.phone = phone;
  }
  for (const key of ["avatar", "linkedin", "website"] as const) {
    if (body[key] === undefined) continue;
    const v = str(body[key]) ?? "";
    check.custom(key, !v || URL_REGEX.test(v), "Must start with http:// or https://");
    set[key] = v;
  }
  if (body.experience_years !== undefined) set.experience_years = Math.max(0, Math.round(num(body.experience_years) ?? 0));
  if (body.followers !== undefined) set.followers = Math.max(0, Math.round(num(body.followers) ?? 0));
  if (body.expertise !== undefined) set.expertise = strList(body.expertise).slice(0, 10);
  if (body.is_active !== undefined) set.is_active = bool(body.is_active);
  check.throwIfFailed();

  if (set.name && set.name !== existing.name) set.slug = await uniqueSlug(set.name as string, existing._id);

  const updated = await VerifiedCreatorModel.findByIdAndUpdate(id, { $set: set }, { new: true }).lean<Row>();
  await syncCourseSnapshots(updated!);
  if (updated!.user && set.is_active !== undefined) {
    await UserModel.updateOne({ _id: updated!.user }, { $set: { role: updated!.is_active ? "creator" : "student" } });
  }
  return updated!;
}

/** Courses keep their snapshot but are unlinked; the user goes back to "student". */
export async function deleteVerifiedCreator(id: string): Promise<IVerifiedCreator> {
  const creator = await VerifiedCreatorModel.findById(id).lean<Row>();
  if (!creator) throw new ApiError(404, "Creator not found");
  await Promise.all([
    VerifiedCreatorModel.deleteOne({ _id: id }),
    CourseModel.updateMany({ "creator.creator_id": creator._id }, { $set: { "creator.creator_id": null } }),
    creator.user ? UserModel.updateOne({ _id: creator.user }, { $set: { role: "student" } }) : null,
  ]);
  return creator;
}

/** Public profile lookup (creator-profile page). */
export const findVerifiedBySlug = (slug: string) =>
  VerifiedCreatorModel.findOne({ slug: slugify(slug), is_active: true }).lean<Row>();
