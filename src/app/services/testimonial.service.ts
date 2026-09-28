import { isValidObjectId } from "mongoose";
import { TestimonialModel } from "../models/testimonial.model";
import type { ITestimonial } from "../types";
import { ApiError } from "../lib/apiError";
import { FieldCheck, URL_REGEX, bool, num, str } from "../lib/validate";

const SORT = { order: 1, createdAt: -1 } as const;

// ── READ ──────────────────────────────────────────────────────────────────
/** Public: only visible testimonials. Admin: everything. */
export const listTestimonials = (opts: { admin?: boolean } = {}) =>
  TestimonialModel.find(opts.admin ? {} : { is_active: true })
    .sort(SORT)
    .lean<ITestimonial[]>();

// ── WRITE ─────────────────────────────────────────────────────────────────
function buildPayload(body: Record<string, unknown>, isCreate: boolean): Partial<ITestimonial> {
  const has = (k: string) => isCreate || body[k] !== undefined;
  const check = new FieldCheck();
  const out: Partial<ITestimonial> = {};

  if (has("name")) {
    const name = str(body.name);
    check.require("name", name, "Name").minLength("name", name, 2, "Name");
    check.custom("name", (name?.length ?? 0) <= 80, "Keep it under 80 characters");
    out.name = name;
  }
  if (has("role")) {
    const role = str(body.role) ?? "";
    check.custom("role", role.length <= 80, "Keep it under 80 characters");
    out.role = role;
  }
  if (has("avatar")) {
    const avatar = str(body.avatar) ?? "";
    check.custom("avatar", !avatar || URL_REGEX.test(avatar), "Upload a photo or paste an image URL");
    out.avatar = avatar;
  }
  if (has("quote")) {
    const quote = str(body.quote);
    check.require("quote", quote, "Quote").minLength("quote", quote, 20, "Quote");
    check.custom("quote", (quote?.length ?? 0) <= 700, "Keep it under 700 characters");
    // Quotes are wrapped in “ ” by the design — strip any the admin typed.
    out.quote = quote?.replace(/^["“”']+|["“”']+$/g, "").trim();
  }
  if (has("rating")) {
    const rating = num(body.rating) ?? 5;
    check.custom("rating", rating >= 1 && rating <= 5, "Rating must be 1–5");
    out.rating = Math.round(rating);
  }
  if (body.order !== undefined) out.order = Math.round(num(body.order) ?? 0);
  if (has("is_active")) out.is_active = body.is_active === undefined ? true : bool(body.is_active);

  check.throwIfFailed();
  return out;
}

export async function createTestimonial(body: Record<string, unknown>): Promise<ITestimonial> {
  const payload = buildPayload(body, true);
  // New testimonials go to the end unless an order was given.
  if (payload.order === undefined) {
    const last = await TestimonialModel.findOne().sort({ order: -1 }).select("order").lean<{ order: number }>();
    payload.order = (last?.order ?? -1) + 1;
  }
  return (await TestimonialModel.create(payload)).toObject();
}

export async function updateTestimonial(id: string, body: Record<string, unknown>): Promise<ITestimonial> {
  if (!isValidObjectId(id)) throw new ApiError(404, "Testimonial not found");
  const payload = buildPayload(body, false);
  if (!Object.keys(payload).length) throw new ApiError(400, "Nothing to update");
  const updated = await TestimonialModel.findByIdAndUpdate(id, { $set: payload }, { new: true, runValidators: true }).lean<ITestimonial>();
  if (!updated) throw new ApiError(404, "Testimonial not found");
  return updated;
}

export async function deleteTestimonial(id: string): Promise<ITestimonial> {
  if (!isValidObjectId(id)) throw new ApiError(404, "Testimonial not found");
  const deleted = await TestimonialModel.findByIdAndDelete(id).lean<ITestimonial>();
  if (!deleted) throw new ApiError(404, "Testimonial not found");
  return deleted;
}

/** Saves a new display order: ids in the order they should appear. */
export async function reorderTestimonials(ids: unknown): Promise<number> {
  const list = (Array.isArray(ids) ? ids : []).map(String).filter((id) => isValidObjectId(id));
  if (!list.length) throw new ApiError(400, "Send the testimonial ids in their new order");
  const res = await TestimonialModel.bulkWrite(
    list.map((id, index) => ({ updateOne: { filter: { _id: id }, update: { $set: { order: index } } } })),
  );
  return res.modifiedCount;
}

/** The three testimonials from the Figma design — only into an empty collection. */
export async function seedTestimonials(): Promise<number> {
  if ((await TestimonialModel.estimatedDocumentCount()) > 0) {
    throw new ApiError(409, "Testimonials already exist — samples only load into an empty list.");
  }
  const docs = await TestimonialModel.insertMany([
    {
      name: "Sarah M.",
      role: "Enthusiastic Learner",
      avatar: "https://i.pravatar.cc/200?img=47",
      quote:
        "ByteSpace has transformed my approach to learning. The diverse range of courses and the quality of content provided by creators have exceeded my expectations. The platform truly fosters a sense of community and lifelong learning.",
      order: 0,
    },
    {
      name: "James L.",
      role: "Lifelong Learner",
      avatar: "https://i.pravatar.cc/200?img=12",
      quote:
        "I've tried several online learning platforms, and ByteSpace stands out for its vibrant community and the variety of courses available. The easy navigation and engaging content make it a go-to platform for continuous skill development.",
      order: 1,
    },
    {
      name: "Alex B.",
      role: "Inspired Creator",
      avatar: "https://i.pravatar.cc/200?img=68",
      quote:
        "As a creator, ByteSpace has been a game-changer for me. The Course Editor is user-friendly, and the support from the community is incredible. It's fulfilling to see my courses making a positive impact on learners globally.",
      order: 2,
    },
  ]);
  return docs.length;
}
