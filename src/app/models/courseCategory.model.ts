import { Schema, model, models, Model } from "mongoose";
import type { ICourseCategory } from "../types";

const CourseCategorySchema = new Schema<ICourseCategory>(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: { type: String, trim: true, default: "", maxlength: 300 },
    icon: { type: String, trim: true, default: "" },
    order: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

CourseCategorySchema.index({ order: 1, name: 1 });

export const CourseCategoryModel: Model<ICourseCategory> =
  (models.course_categories as Model<ICourseCategory>) ||
  model<ICourseCategory>("course_categories", CourseCategorySchema);
