import { Types } from "mongoose";
import { CreatorApplicationModel } from "../models/creatorApplication.model";
import { VerifiedCreatorModel } from "../models/verifiedCreator.model";
import { UserModel } from "../models/user.model";
import {
  APPLICATION_COOLDOWN_MINUTES,
  APPLICATION_STATUSES,
  type ApplicationStatus,
  type CreatorApplicationInput,
  type ICreatorApplication,
  type IVerifiedCreator,
  type MyCreatorStatus,
} from "../types";
import { ApiError } from "../lib/apiError";
import { buildMeta, type ResponseMeta } from "../lib/sendResponse";
import { EMAIL_REGEX, FieldCheck, INTL_PHONE_REGEX, URL_REGEX, escapeRegex, num, str, strList } from "../lib/validate";
import { getActiveUser } from "./user.service";
import { upsertCreatorFromApplication } from "./verifiedCreator.service";

const COOLDOWN_MS = APPLICATION_COOLDOWN_MINUTES * 60 * 1000;
const LINKEDIN_RX = /^https?:\/\/([a-z]{2,3}\.)?linkedin\.com\/.+/i;

type Row = ICreatorApplication & { _id: Types.ObjectId };

// ── Validation ────────────────────────────────────────────────────────────
export function validateApplication(body: Record<string, unknown>): CreatorApplicationInput {
  const name = str(body.name);
  const email = str(body.email)?.toLowerCase();
  const phone = str(body.phone);
  const avatar = str(body.avatar);
  const designation = str(body.designation);
  const bio = str(body.bio);
  const experience = num(body.experience_years);
  const expertise = [...new Set(strList(body.expertise))];
  const linkedin = str(body.linkedin);
  const website = str(body.website);
  const followers = num(body.followers);
  const plan = str(body.teaching_plan);

  new FieldCheck()
    .require("name", name, "Full name")
    .minLength("name", name, 2, "Full name")
    .custom("email", Boolean(email && EMAIL_REGEX.test(email)), "Enter a valid email address")
    .custom("phone", Boolean(phone && INTL_PHONE_REGEX.test(phone)), "Enter a valid phone number")
    .custom("avatar", Boolean(avatar && URL_REGEX.test(avatar)), "Upload a profile photo")
    .require("designation", designation, "Designation")
    .minLength("designation", designation, 2, "Designation")
    .custom("designation", (designation?.length ?? 0) <= 100, "Keep it under 100 characters")
    .require("bio", bio, "Bio")
    .minLength("bio", bio, 50, "Bio")
    .custom("bio", (bio?.length ?? 0) <= 1500, "Keep it under 1500 characters")
    .custom(
      "experience_years",
      experience !== undefined && experience >= 0 && experience <= 60,
      "Years of experience must be 0–60",
    )
    .custom("expertise", expertise.length >= 1, "Add at least one topic you teach")
    .custom("expertise", expertise.length <= 10, "Up to 10 topics")
    .custom("expertise", expertise.every((t) => t.length <= 40), "Each topic must be under 40 characters")
    .custom("linkedin", Boolean(linkedin && LINKEDIN_RX.test(linkedin)), "Enter your LinkedIn profile URL")
    .custom("website", !website || URL_REGEX.test(website), "Must start with http:// or https://")
    .custom(
      "followers",
      followers === undefined || (followers >= 0 && followers <= 1_000_000_000),
      "Enter a valid follower count",
    )
    .require("teaching_plan", plan, "Teaching plan")
    .minLength("teaching_plan", plan, 30, "Teaching plan")
    .custom("teaching_plan", (plan?.length ?? 0) <= 1500, "Keep it under 1500 characters")
    .throwIfFailed();

  return {
    name: name!,
    email: email!,
    phone: phone!,
    avatar: avatar!,
    designation: designation!,
    bio: bio!,
    experience_years: Math.round(experience!),
    expertise,
    linkedin: linkedin!,
    website: website ?? "",
    followers: Math.round(followers ?? 0),
    teaching_plan: plan!,
  };
}

const nextAllowedAt = (latest?: { createdAt?: Date | string } | null): Date | null => {
  if (!latest?.createdAt) return null;
  const at = new Date(new Date(latest.createdAt).getTime() + COOLDOWN_MS);
  return at.getTime() > Date.now() ? at : null;
};

// ── Applicant ─────────────────────────────────────────────────────────────
export async function getMyCreatorStatus(userId: string): Promise<MyCreatorStatus> {
  const [creator, history] = await Promise.all([
    VerifiedCreatorModel.findOne({ user: userId, is_active: true }).lean<IVerifiedCreator>(),
    CreatorApplicationModel.find({ user: userId }).sort({ createdAt: -1 }).limit(10).lean<Row[]>(),
  ]);
  const latest = history[0] ?? null;
  return {
    creator: creator ?? null,
    latest,
    history,
    next_allowed_at: nextAllowedAt(latest)?.toISOString() ?? null,
  };
}

export async function submitApplication(
  userId: string,
  body: Record<string, unknown>,
): Promise<ICreatorApplication> {
  await getActiveUser(userId);

  if (await VerifiedCreatorModel.exists({ user: userId, is_active: true })) {
    throw new ApiError(409, "You're already a verified creator.");
  }

  // Cooldown: one application per user every 5 minutes.
  const latest = await CreatorApplicationModel.findOne({ user: userId })
    .sort({ createdAt: -1 })
    .select("createdAt")
    .lean<{ createdAt: Date }>();
  const allowedAt = nextAllowedAt(latest);
  if (allowedAt) {
    const seconds = Math.ceil((allowedAt.getTime() - Date.now()) / 1000);
    const m = Math.floor(seconds / 60);
    const s = String(seconds % 60).padStart(2, "0");
    throw new ApiError(429, `You can send another application in ${m}:${s}.`, {
      retry_after: String(seconds),
    });
  }

  const input = validateApplication(body);
  const created = await CreatorApplicationModel.create({ ...input, user: userId, status: "pending" });
  return created.toObject() as unknown as ICreatorApplication;
}

// ── Admin ─────────────────────────────────────────────────────────────────
export async function listApplications(args: {
  q?: string | null;
  status?: string | null;
  page: number;
  limit: number;
}): Promise<{
  data: ICreatorApplication[];
  meta: ResponseMeta;
  counts: Record<ApplicationStatus | "all", number>;
}> {
  const filter: Record<string, unknown> = {};
  if (args.status && APPLICATION_STATUSES.includes(args.status as ApplicationStatus)) filter.status = args.status;
  const q = str(args.q);
  if (q) {
    const rx = { $regex: escapeRegex(q), $options: "i" };
    filter.$or = [{ name: rx }, { email: rx }, { designation: rx }, { expertise: rx }, { phone: rx }];
  }

  const [data, total, grouped] = await Promise.all([
    CreatorApplicationModel.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((args.page - 1) * args.limit)
      .limit(args.limit)
      .lean<ICreatorApplication[]>(),
    CreatorApplicationModel.countDocuments(filter),
    CreatorApplicationModel.aggregate<{ _id: ApplicationStatus; n: number }>([
      { $group: { _id: "$status", n: { $sum: 1 } } },
    ]),
  ]);

  const counts = { all: 0, pending: 0, approved: 0, rejected: 0 };
  for (const g of grouped) {
    counts[g._id] = g.n;
    counts.all += g.n;
  }
  return { data, meta: buildMeta(total, args.page, args.limit), counts };
}

export async function getApplication(id: string): Promise<ICreatorApplication> {
  const app = await CreatorApplicationModel.findById(id).lean<ICreatorApplication>();
  if (!app) throw new ApiError(404, "Application not found");
  return app;
}

/**
 * Approve → creates (or refreshes) the verified creator and promotes the
 * user's role. Reject → requires a note so the applicant knows why.
 */
export async function reviewApplication(
  id: string,
  body: { action?: string; note?: string },
  admin: { id: string; name: string },
): Promise<{ application: ICreatorApplication; creator: IVerifiedCreator | null }> {
  const app = await CreatorApplicationModel.findById(id).lean<Row>();
  if (!app) throw new ApiError(404, "Application not found");
  if (app.status !== "pending") throw new ApiError(409, `This application was already ${app.status}.`);

  const note = str(body.note) ?? "";
  const reviewed = { reviewed_by: admin, reviewed_at: new Date(), admin_note: note };

  if (body.action === "reject") {
    if (note.length < 5) {
      throw new ApiError(400, "Add a short reason for the applicant", { note: "At least 5 characters" });
    }
    const updated = await CreatorApplicationModel.findOneAndUpdate(
      { _id: id, status: "pending" },
      { $set: { status: "rejected", ...reviewed } },
      { new: true },
    ).lean<ICreatorApplication>();
    if (!updated) throw new ApiError(409, "This application was just reviewed by someone else.");
    return { application: updated, creator: null };
  }

  if (body.action !== "approve") throw new ApiError(400, "Action must be approve or reject");

  // Claim the application first so two admins can't approve it twice.
  const claimed = await CreatorApplicationModel.findOneAndUpdate(
    { _id: id, status: "pending" },
    { $set: { status: "approved", ...reviewed } },
    { new: true },
  ).lean<Row>();
  if (!claimed) throw new ApiError(409, "This application was just reviewed by someone else.");

  const creator = await upsertCreatorFromApplication(claimed);
  await Promise.all([
    CreatorApplicationModel.updateOne({ _id: id }, { $set: { creator: creator._id } }),
    UserModel.updateOne({ _id: claimed.user }, { $set: { role: "creator" } }),
  ]);
  return { application: { ...claimed, creator: String(creator._id) }, creator };
}

export async function deleteApplication(id: string): Promise<void> {
  const res = await CreatorApplicationModel.deleteOne({ _id: id });
  if (!res.deletedCount) throw new ApiError(404, "Application not found");
}
