import { Schema, model, models, Model } from "mongoose";
import { ADMIN_ROLES, type IAdmin } from "../types";

const BlockedIPSchema = new Schema(
  {
    ip: { type: String, required: true },
    expires: { type: Number, required: true },
  },
  { _id: false },
);

const AdminSchema = new Schema<IAdmin>(
  {
    admin_role: {
      type: String,
      required: true,
      enum: ADMIN_ROLES,
      default: "admin",
    },
    admin_name: { type: String, required: true, trim: true, maxlength: 80 },
    admin_email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    admin_phone: { type: String, required: true, unique: true, trim: true },
    admin_password: { type: String, required: true, select: false },
    admin_avatar: { type: String, trim: true, default: "" },
    admin_ip_address: { type: String, default: "0.0.0.0" },
    is_active: { type: Boolean, default: true },
    last_login: { type: Date, default: null },
    login_attempts: { type: Number, default: 0 },
    last_attempt: { type: Date, default: null },
    blockTime: { type: Date, default: null },
    blockedIPs: { type: [BlockedIPSchema], default: [], select: false },
  },
  { timestamps: true },
);

export const AdminModel: Model<IAdmin> =
  (models.admins as Model<IAdmin>) || model<IAdmin>("admins", AdminSchema);
