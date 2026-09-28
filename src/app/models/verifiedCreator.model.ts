import { Schema, model, models, Model, Types } from "mongoose";
import type { IVerifiedCreator } from "../types";

type CreatorDoc = Omit<IVerifiedCreator, "user" | "application" | "course_count"> & {
  user?: Types.ObjectId | null;
  application?: Types.ObjectId | null;
};

/** A creator who passed review. Courses link to it via `creator.creator_id`. */
const VerifiedCreatorSchema = new Schema<CreatorDoc>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "users", default: null, index: true },
    application: { type: Schema.Types.ObjectId, ref: "creator_applications", default: null },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true, default: "" },
    avatar: { type: String, trim: true, default: "" },
    title: { type: String, trim: true, default: "", maxlength: 100 },
    bio: { type: String, trim: true, default: "", maxlength: 1500 },
    linkedin: { type: String, trim: true, default: "" },
    website: { type: String, trim: true, default: "" },
    experience_years: { type: Number, default: 0, min: 0 },
    expertise: { type: [String], default: [] },
    followers: { type: Number, default: 0, min: 0 },
    is_active: { type: Boolean, default: true, index: true },
    verified_at: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

VerifiedCreatorSchema.index({ name: "text", email: "text", code: "text" });

export const VerifiedCreatorModel: Model<CreatorDoc> =
  (models.verified_creators as Model<CreatorDoc>) ||
  model<CreatorDoc>("verified_creators", VerifiedCreatorSchema);
