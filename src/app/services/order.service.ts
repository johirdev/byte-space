import { randomBytes } from "node:crypto";
import { Types } from "mongoose";
import { OrderModel } from "../models/order.model";
import { EnrollmentModel } from "../models/enrollment.model";
import { CourseModel } from "../models/course.model";
import {
  PAYMENT_METHODS,
  type CheckoutPayload,
  type IOrder,
  type PaymentMethod,
} from "../types";
import { ApiError } from "../lib/apiError";
import { buildMeta, type ResponseMeta } from "../lib/sendResponse";
import { BD_PHONE_REGEX, EMAIL_REGEX, FieldCheck, escapeRegex, str } from "../lib/validate";
import { getActiveUser } from "./user.service";

const MAX_ITEMS = 20;

/** Demo card that always declines — handy for testing the error path. */
export const DEMO_DECLINED_CARD = "4000000000000002";

type CourseLite = {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  thumbnail: string;
  price: number;
};

const luhn = (digits: string): boolean => {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
};

const code = (bytes: number) => randomBytes(bytes).toString("hex").toUpperCase();

const orderNumber = () => {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `BS-${ymd}-${code(3)}`;
};

/**
 * Demo payment gateway: validates the details like a real checkout would,
 * then "charges" instantly. Only a masked account string is kept.
 */
function processDemoPayment(payload: CheckoutPayload, total: number): { method: PaymentMethod; account: string } {
  const method = payload.payment_method;
  const check = new FieldCheck();

  if (!PAYMENT_METHODS.includes(method)) {
    throw new ApiError(400, "Choose a payment method", { payment_method: "Choose a payment method" });
  }

  // Free carts don't need payment details.
  if (total === 0) return { method, account: "Free enrollment" };

  if (method === "card") {
    const number = (payload.card?.number ?? "").replace(/\D/g, "");
    const expiry = (payload.card?.expiry ?? "").trim();
    const cvc = (payload.card?.cvc ?? "").trim();
    const [mm, yy] = expiry.split("/").map((p) => Number(p));
    const expEnd = mm && yy ? new Date(2000 + yy, mm, 1) : null; // first day of the following month

    check
      .require("card.name", payload.card?.name, "Name on card")
      .custom("card.number", number.length >= 13 && number.length <= 19 && luhn(number), "Enter a valid card number")
      .custom(
        "card.expiry",
        /^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry) && Boolean(expEnd && expEnd.getTime() > Date.now()),
        "Enter a future expiry date (MM/YY)",
      )
      .custom("card.cvc", /^\d{3,4}$/.test(cvc), "3 or 4 digits")
      .throwIfFailed();

    if (number === DEMO_DECLINED_CARD) {
      throw new ApiError(402, "Your card was declined (demo). Try 4242 4242 4242 4242.", {
        "card.number": "Card declined",
      });
    }
    return { method, account: `•••• ${number.slice(-4)}` };
  }

  if (method === "paypal") {
    const email = str(payload.paypal?.email)?.toLowerCase();
    check.custom("paypal.email", Boolean(email && EMAIL_REGEX.test(email)), "Enter your PayPal email").throwIfFailed();
    const [local, domain] = email!.split("@");
    return { method, account: `${local.slice(0, 2)}•••@${domain}` };
  }

  // Mobile wallets: bKash / Nagad / Rocket
  const number = (payload.wallet?.number ?? "").replace(/\D/g, "");
  check
    .custom("wallet.number", BD_PHONE_REGEX.test(number), "Use a number like 01XXXXXXXXX")
    .custom("wallet.pin", /^\d{4,6}$/.test(payload.wallet?.pin ?? ""), "PIN is 4–6 digits")
    .throwIfFailed();
  return { method, account: `${number.slice(0, 3)}•••••${number.slice(-3)}` };
}

// ── CHECKOUT ──────────────────────────────────────────────────────────────
export async function checkout(userId: string, payload: CheckoutPayload): Promise<IOrder> {
  const user = await getActiveUser(userId);

  const ids = [...new Set((Array.isArray(payload.courses) ? payload.courses : []).map(String))];
  if (!ids.length) throw new ApiError(400, "Your cart is empty");
  if (ids.length > MAX_ITEMS) throw new ApiError(400, `You can check out up to ${MAX_ITEMS} courses at once`);
  if (ids.some((id) => !Types.ObjectId.isValid(id))) throw new ApiError(400, "Your cart contains an invalid course");

  // Prices always come from the database — never from the client.
  const courses = await CourseModel.find({ _id: { $in: ids }, status: "published" })
    .select("title slug thumbnail price")
    .lean<CourseLite[]>();

  if (courses.length !== ids.length) {
    const found = new Set(courses.map((c) => String(c._id)));
    throw new ApiError(409, "Some courses in your cart are no longer available. Remove them and try again.", {
      courses: ids.filter((id) => !found.has(id)).join(","),
    });
  }

  const owned = await EnrollmentModel.find({ user: userId, course: { $in: ids } })
    .select("course")
    .lean<{ course: Types.ObjectId }[]>();
  if (owned.length) {
    const titles = courses.filter((c) => owned.some((o) => String(o.course) === String(c._id))).map((c) => c.title);
    throw new ApiError(409, `You're already enrolled in: ${titles.join(", ")}. Remove it from your cart.`, {
      courses: owned.map((o) => String(o.course)).join(","),
    });
  }

  const subtotal = Math.round(courses.reduce((sum, c) => sum + (c.price || 0), 0) * 100) / 100;
  const total = subtotal;
  const payment = processDemoPayment(payload, total);

  const customer = { user_id: userId, name: user.name, email: user.email, avatar: user.avatar ?? "" };

  const order = await OrderModel.create({
    order_no: orderNumber(),
    user: userId,
    customer,
    items: courses.map((c) => ({ course: c._id, title: c.title, slug: c.slug, thumbnail: c.thumbnail, price: c.price })),
    subtotal,
    total,
    currency: "USD",
    payment: { ...payment, transaction_id: `TXN${code(6)}`, paid_at: new Date() },
    status: "paid",
  });

  // Unordered insert: a concurrent duplicate only skips that one course.
  let enrolledIds = courses.map((c) => c._id);
  try {
    await EnrollmentModel.insertMany(
      courses.map((c) => ({
        user: userId,
        course: c._id,
        order: order._id,
        student: customer,
        price_paid: c.price,
      })),
      { ordered: false },
    );
  } catch (err) {
    const inserted = (err as { insertedDocs?: { course: Types.ObjectId }[] }).insertedDocs;
    if (!inserted) throw err;
    enrolledIds = inserted.map((d) => d.course);
  }

  await CourseModel.updateMany({ _id: { $in: enrolledIds.map(String) } }, { $inc: { students_count: 1 } });
  return order.toObject() as unknown as IOrder;
}

// ── READ ──────────────────────────────────────────────────────────────────
export const listMyOrders = (userId: string) =>
  OrderModel.find({ user: userId }).sort({ createdAt: -1 }).limit(100).lean<IOrder[]>();

export async function getMyOrder(userId: string, idOrNo: string): Promise<IOrder> {
  const filter = Types.ObjectId.isValid(idOrNo) ? { _id: idOrNo } : { order_no: idOrNo.toUpperCase() };
  const order = await OrderModel.findOne({ ...filter, user: userId }).lean<IOrder>();
  if (!order) throw new ApiError(404, "Order not found");
  return order;
}

export async function listOrders(args: {
  q?: string | null;
  status?: string | null;
  method?: string | null;
  page: number;
  limit: number;
}): Promise<{ data: IOrder[]; meta: ResponseMeta; summary: { revenue: number; orders: number } }> {
  const filter: Record<string, unknown> = {};
  const q = str(args.q);
  if (q) {
    const rx = { $regex: escapeRegex(q), $options: "i" };
    filter.$or = [
      { order_no: rx },
      { "customer.name": rx },
      { "customer.email": rx },
      { "payment.transaction_id": rx },
      { "items.title": rx },
    ];
  }
  if (args.status) filter.status = args.status;
  if (args.method && PAYMENT_METHODS.includes(args.method as PaymentMethod)) filter["payment.method"] = args.method;

  const [data, total, agg] = await Promise.all([
    OrderModel.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((args.page - 1) * args.limit)
      .limit(args.limit)
      .lean<IOrder[]>(),
    OrderModel.countDocuments(filter),
    OrderModel.aggregate<{ revenue: number; orders: number }>([
      { $match: { ...filter, status: "paid" } },
      { $group: { _id: null, revenue: { $sum: "$total" }, orders: { $sum: 1 } } },
    ]),
  ]);

  return {
    data,
    meta: buildMeta(total, args.page, args.limit),
    summary: { revenue: Math.round((agg[0]?.revenue ?? 0) * 100) / 100, orders: agg[0]?.orders ?? 0 },
  };
}

export async function getOrder(id: string): Promise<IOrder> {
  const order = await OrderModel.findById(id).lean<IOrder>();
  if (!order) throw new ApiError(404, "Order not found");
  return order;
}

/** Refunding revokes the order's enrollments (the learner loses access). */
export async function refundOrder(id: string): Promise<IOrder> {
  const order = await OrderModel.findById(id).lean<IOrder & { _id: Types.ObjectId; user: Types.ObjectId }>();
  if (!order) throw new ApiError(404, "Order not found");
  if (order.status === "refunded") throw new ApiError(409, "This order is already refunded");

  const removed = await EnrollmentModel.find({ order: order._id }).select("course").lean<{ course: Types.ObjectId }[]>();
  await Promise.all([
    EnrollmentModel.deleteMany({ order: order._id }),
    removed.length
      ? CourseModel.updateMany(
          { _id: { $in: removed.map((r) => String(r.course)) }, students_count: { $gt: 0 } },
          { $inc: { students_count: -1 } },
        )
      : null,
    OrderModel.updateOne({ _id: order._id }, { $set: { status: "refunded" } }),
  ]);
  return { ...order, status: "refunded" };
}
