import { Schema, model, models, Model, Types } from "mongoose";
import { APPLICATION_STATUSES, type ICreatorApplication } from "../types";

type ApplicationDoc = Omit<ICreatorApplication, "user" | "creator"> & {
  user: Types.ObjectId;
  creator?: Types.ObjectId | null;
};

const CreatorApplicationSchema = new Schema<ApplicationDoc>(
  {
    user: { type: Schema.Types.ObjectId, ref: "users", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    avatar: { type: String, required: true, trim: true },
    designation: { type: String, required: true, trim: true, maxlength: 100 },
    bio: { type: String, required: true, trim: true, maxlength: 1500 },
    experience_years: { type: Number, required: true, min: 0, max: 60 },
    expertise: { type: [String], default: [] },
    linkedin: { type: String, required: true, trim: true },
    website: { type: String, trim: true, default: "" },
    followers: { type: Number, default: 0, min: 0 },
    teaching_plan: { type: String, required: true, trim: true, maxlength: 1500 },
    status: { type: String, enum: APPLICATION_STATUSES, default: "pending", index: true },
    admin_note: { type: String, trim: true, default: "", maxlength: 1000 },
    reviewed_by: {
      type: new Schema({ id: String, name: String }, { _id: false }),
      default: null,
    },
    reviewed_at: { type: Date, default: null },
    creator: { type: Schema.Types.ObjectId, ref: "verified_creators", default: null },
  },
  { timestamps: true },
);

CreatorApplicationSchema.index({ user: 1, createdAt: -1 });
CreatorApplicationSchema.index({ status: 1, createdAt: -1 });

export const CreatorApplicationModel: Model<ApplicationDoc> =
  (models.creator_applications as Model<ApplicationDoc>) ||
  model<ApplicationDoc>("creator_applications", CreatorApplicationSchema);
