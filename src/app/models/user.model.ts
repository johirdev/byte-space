import { Schema, model, models, Model } from "mongoose";
import { USER_ROLES, type IUser } from "../types";

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, select: false },
    avatar: { type: String, trim: true, default: "" },
    headline: { type: String, trim: true, default: "", maxlength: 120 },
    bio: { type: String, trim: true, default: "", maxlength: 1000 },
    phone: { type: String, trim: true, default: "" },
    role: { type: String, enum: USER_ROLES, default: "student" },
    is_active: { type: Boolean, default: true },
    last_login: { type: Date, default: null },
    login_attempts: { type: Number, default: 0, select: false },
    lock_until: { type: Date, default: null, select: false },
  },
  { timestamps: true },
);

UserSchema.index({ createdAt: -1 });

export const UserModel: Model<IUser> =
  (models.users as Model<IUser>) || model<IUser>("users", UserSchema);
