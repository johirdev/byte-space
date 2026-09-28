import { Schema, model, models, Model, Types } from "mongoose";
import {
  COURSE_LEVELS,
  COURSE_STATUSES,
  DEFAULT_COURSE_INCLUDES,
  type ICourse,
} from "../types";

type CourseDoc = Omit<ICourse, "category"> & { category: Types.ObjectId };

const LessonSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    duration: { type: Number, default: 0, min: 0 },
    is_preview: { type: Boolean, default: false },
  },
  { _id: false },
);

const ModuleSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, trim: true, default: "", maxlength: 600 },
    lessons: { type: [LessonSchema], default: [] },
  },
  { _id: false },
);

const CreatorSchema = new Schema(
  {
    name: { type: String, trim: true, default: "" },
    title: { type: String, trim: true, default: "" },
    avatar: { type: String, trim: true, default: "" },
    bio: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const CourseSchema = new Schema<CourseDoc>(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    subtitle: { type: String, trim: true, default: "", maxlength: 200 },
    category: {
      type: Schema.Types.ObjectId,
      ref: "course_categories",
      required: true,
      index: true,
    },
    level: { type: String, enum: COURSE_LEVELS, default: "Beginner", index: true },
    price: { type: Number, default: 0, min: 0 },
    price_label: { type: String, trim: true, default: "lifetime" },
    thumbnail: { type: String, trim: true, required: true },
    preview_video: { type: String, trim: true, default: "" },
    description: { type: String, required: true },
    sneak_peek: { type: [String], default: [] },
    key_points: { type: [String], default: [] },
    includes: { type: [String], default: () => [...DEFAULT_COURSE_INCLUDES] },
    modules_intro: { type: String, trim: true, default: "" },
    lesson_content_info: { type: String, trim: true, default: "" },
    progress_info: { type: String, trim: true, default: "" },
    modules: { type: [ModuleSchema], default: [] },
    creator: { type: CreatorSchema, default: () => ({}) },
    students_count: { type: Number, default: 0, min: 0 },
    tags: { type: [String], default: [] },
    is_featured: { type: Boolean, default: false, index: true },
    status: { type: String, enum: COURSE_STATUSES, default: "draft", index: true },
    rating_avg: { type: Number, default: 0 },
    rating_count: { type: Number, default: 0 },
    total_lessons: { type: Number, default: 0 },
    total_duration: { type: Number, default: 0 },
  },
  { timestamps: true },
);

CourseSchema.index({ status: 1, createdAt: -1 });
CourseSchema.index({ status: 1, rating_avg: -1 });

export const CourseModel: Model<CourseDoc> =
  (models.courses as Model<CourseDoc>) || model<CourseDoc>("courses", CourseSchema);
