import { isValidObjectId } from "mongoose";
import { FaqModel } from "../models/faq.model";
import { SiteFlagModel } from "../models/siteFlag.model";
import { FAQ_CATEGORIES, type FaqCategory, type IFaq } from "../types";
import { ApiError } from "../lib/apiError";
import { FieldCheck, bool, oneOf, str } from "../lib/validate";

const SEED_FLAG = "faqs_seeded";

/** Starter FAQs for a course marketplace — seeded once, then fully editable. */
export const DEFAULT_FAQS: Pick<IFaq, "question" | "answer" | "category">[] = [
  {
    category: "General",
    question: "What is ByteSpace?",
    answer:
      "ByteSpace is an online learning platform where verified creators publish practical, project-based courses — from design and development to marketing, business and more. You learn at your own pace, track your progress and keep lifetime access to every course you enroll in.",
  },
  {
    category: "General",
    question: "Do I need any prior experience to start?",
    answer:
      "No. Every course shows its level (Beginner, Intermediate, Advanced or All Levels) on the course card and page, so you can pick one that matches where you are today. Beginner courses start from the fundamentals.",
  },
  {
    category: "Courses",
    question: "How do I enroll in a course?",
    answer:
      "Open any course and click “Enroll Now”, or add several courses to your cart and check out once. After a successful payment the courses appear instantly under “My Courses” in your profile.",
  },
  {
    category: "Courses",
    question: "Do I get lifetime access?",
    answer:
      "Yes. Once you enroll, the course is yours for life — including any lessons the creator adds or updates later. You can revisit it any time from your profile.",
  },
  {
    category: "Courses",
    question: "Can I learn at my own pace and track my progress?",
    answer:
      "Absolutely. There are no deadlines. In the Lessons tab you can tick lessons as you finish them; your progress is saved to your account and shown on each course in your profile.",
  },
  {
    category: "Courses",
    question: "Will I get a certificate?",
    answer:
      "Courses that include a Certificate of Completion list it under “This course include” on the course page. Complete all lessons to earn it.",
  },
  {
    category: "Payments",
    question: "Which payment methods do you accept?",
    answer:
      "You can pay by credit or debit card (Visa, Mastercard, Amex), bKash, Nagad, Rocket or PayPal. Prices are shown in USD and you only pay once per course.",
  },
  {
    category: "Payments",
    question: "Can I buy several courses at once?",
    answer:
      "Yes — add as many courses as you like to your cart and pay for all of them in a single checkout. Courses you already own are removed from the cart automatically.",
  },
  {
    category: "Payments",
    question: "What is your refund policy?",
    answer:
      "If a course isn't right for you, contact our support team with your order number. Approved refunds are returned to your original payment method and access to the refunded course is removed.",
  },
  {
    category: "Creators",
    question: "How do I become a creator?",
    answer:
      "Sign in and open “Become a Creator”. Tell us about your experience, the topics you teach and your first course idea. Our team reviews every application; once approved you receive a Creator ID and a verified creator profile.",
  },
  {
    category: "Creators",
    question: "How long does creator review take?",
    answer:
      "Most applications are reviewed within 1–2 days. You'll see the status — under review, approved or not approved (with a note from the reviewer) — on the Become a Creator page. You can update and resend an application after a short cooldown.",
  },
  {
    category: "Account",
    question: "How do I change my profile photo or password?",
    answer:
      "Go to your profile and open Settings. You can upload a new photo, update your name, headline and bio, and change your password there.",
  },
  {
    category: "Account",
    question: "I can't sign in — what should I do?",
    answer:
      "Double-check your email and password. After several failed attempts your account is locked for 15 minutes for security. If you still can't sign in, contact our support team and we'll help you get back in.",
  },
];

/**
 * Seeds the defaults the first time FAQs are read. A flag makes it one-off,
 * so an admin who deletes every FAQ doesn't see them come back by themselves.
 */
export async function ensureDefaultFaqs(): Promise<void> {
  if (await SiteFlagModel.exists({ key: SEED_FLAG })) return;
  if ((await FaqModel.estimatedDocumentCount()) === 0) {
    await FaqModel.insertMany(DEFAULT_FAQS.map((f, order) => ({ ...f, order, is_active: true })));
  }
  await SiteFlagModel.updateOne({ key: SEED_FLAG }, { $set: { value: true } }, { upsert: true });
}

export async function listFaqs(opts: { admin?: boolean } = {}): Promise<IFaq[]> {
  await ensureDefaultFaqs();
  return FaqModel.find(opts.admin ? {} : { is_active: true })
    .sort({ order: 1, createdAt: 1 })
    .lean<IFaq[]>();
}

function buildPayload(body: Record<string, unknown>, isCreate: boolean): Partial<IFaq> {
  const has = (k: string) => isCreate || body[k] !== undefined;
  const check = new FieldCheck();
  const out: Partial<IFaq> = {};

  if (has("question")) {
    const q = str(body.question);
    check.require("question", q, "Question").minLength("question", q, 8, "Question");
    check.custom("question", (q?.length ?? 0) <= 200, "Keep it under 200 characters");
    out.question = q;
  }
  if (has("answer")) {
    const a = str(body.answer);
    check.require("answer", a, "Answer").minLength("answer", a, 15, "Answer");
    check.custom("answer", (a?.length ?? 0) <= 2000, "Keep it under 2000 characters");
    out.answer = a;
  }
  if (has("category")) {
    const c = str(body.category);
    check.custom("category", !c || FAQ_CATEGORIES.includes(c as FaqCategory), "Choose a category");
    out.category = oneOf(c, FAQ_CATEGORIES, "General");
  }
  if (has("is_active")) out.is_active = body.is_active === undefined ? true : bool(body.is_active);

  check.throwIfFailed();
  return out;
}

export async function createFaq(body: Record<string, unknown>): Promise<IFaq> {
  const payload = buildPayload(body, true);
  const last = await FaqModel.findOne().sort({ order: -1 }).select("order").lean<{ order: number }>();
  return (await FaqModel.create({ ...payload, order: (last?.order ?? -1) + 1 })).toObject();
}

export async function updateFaq(id: string, body: Record<string, unknown>): Promise<IFaq> {
  if (!isValidObjectId(id)) throw new ApiError(404, "FAQ not found");
  const payload = buildPayload(body, false);
  if (!Object.keys(payload).length) throw new ApiError(400, "Nothing to update");
  const updated = await FaqModel.findByIdAndUpdate(id, { $set: payload }, { new: true, runValidators: true }).lean<IFaq>();
  if (!updated) throw new ApiError(404, "FAQ not found");
  return updated;
}

export async function deleteFaq(id: string): Promise<IFaq> {
  if (!isValidObjectId(id)) throw new ApiError(404, "FAQ not found");
  const deleted = await FaqModel.findByIdAndDelete(id).lean<IFaq>();
  if (!deleted) throw new ApiError(404, "FAQ not found");
  return deleted;
}

export async function reorderFaqs(ids: unknown): Promise<number> {
  const list = (Array.isArray(ids) ? ids : []).map(String).filter((id) => isValidObjectId(id));
  if (!list.length) throw new ApiError(400, "Send the FAQ ids in their new order");
  const res = await FaqModel.bulkWrite(
    list.map((id, index) => ({ updateOne: { filter: { _id: id }, update: { $set: { order: index } } } })),
  );
  return res.modifiedCount;
}

/** Adds back any default question that isn't present (matched by question text). */
export async function restoreDefaultFaqs(): Promise<number> {
  const existing = new Set((await FaqModel.find().select("question").lean<{ question: string }[]>()).map((f) => f.question.trim().toLowerCase()));
  const missing = DEFAULT_FAQS.filter((f) => !existing.has(f.question.toLowerCase()));
  if (!missing.length) return 0;
  const last = await FaqModel.findOne().sort({ order: -1 }).select("order").lean<{ order: number }>();
  const start = (last?.order ?? -1) + 1;
  await FaqModel.insertMany(missing.map((f, i) => ({ ...f, order: start + i, is_active: true })));
  return missing.length;
}
