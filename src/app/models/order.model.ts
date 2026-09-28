import { Schema, model, models, Model, Types } from "mongoose";
import { ORDER_STATUSES, PAYMENT_METHODS, type IOrder } from "../types";

type OrderDoc = Omit<IOrder, "user" | "items"> & {
  user: Types.ObjectId;
  items: (Omit<IOrder["items"][number], "course"> & { course: Types.ObjectId })[];
};

const SnapshotSchema = new Schema(
  {
    user_id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    avatar: { type: String, default: "" },
  },
  { _id: false },
);

const ItemSchema = new Schema(
  {
    course: { type: Schema.Types.ObjectId, ref: "courses", required: true },
    title: { type: String, required: true },
    slug: { type: String, required: true },
    thumbnail: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const OrderSchema = new Schema<OrderDoc>(
  {
    order_no: { type: String, required: true, unique: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "users", required: true, index: true },
    customer: { type: SnapshotSchema, required: true },
    items: { type: [ItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "USD" },
    payment: {
      method: { type: String, enum: PAYMENT_METHODS, required: true },
      account: { type: String, default: "" },
      transaction_id: { type: String, required: true },
      paid_at: { type: Date, default: Date.now },
    },
    status: { type: String, enum: ORDER_STATUSES, default: "paid", index: true },
  },
  { timestamps: true },
);

OrderSchema.index({ createdAt: -1 });

export const OrderModel: Model<OrderDoc> =
  (models.orders as Model<OrderDoc>) || model<OrderDoc>("orders", OrderSchema);
