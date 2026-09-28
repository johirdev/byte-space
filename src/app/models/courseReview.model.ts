import { Schema, model, models, Model, Types } from "mongoose";
import { REVIEW_STATUSES, type ICourseReview } from "../types";

type ReviewDoc = Omit<ICourseReview, "course" | "user"> & {
  course: Types.ObjectId;
  user?: Types.ObjectId | null;
};

const CourseReviewSchema = new Schema<ReviewDoc>(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: "courses",
      required: true,
      index: true,
    },
    // Learner who wrote it (null for admin-authored demo reviews).
    user: { type: Schema.Types.ObjectId, ref: "users", default: null, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    designation: { type: String, trim: true, default: "", maxlength: 80 },
    avatar: { type: String, trim: true, default: "" },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 2000 },
    status: { type: String, enum: REVIEW_STATUSES, default: "approved", index: true },
  },
  { timestamps: true },
);

CourseReviewSchema.index({ course: 1, status: 1, createdAt: -1 });
// One review per learner per course; demo reviews (user: null) are exempt.
CourseReviewSchema.index(
  { course: 1, user: 1 },
  { unique: true, partialFilterExpression: { user: { $type: "objectId" } } },
);

export const CourseReviewModel: Model<ReviewDoc> =
  (models.course_reviews as Model<ReviewDoc>) ||
  model<ReviewDoc>("course_reviews", CourseReviewSchema);
