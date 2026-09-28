import { Schema, model, models, Model, Types } from "mongoose";
import type { IEnrollment } from "../types";

type EnrollmentDoc = Omit<IEnrollment, "user" | "course" | "order"> & {
  user: Types.ObjectId;
  course: Types.ObjectId;
  order?: Types.ObjectId;
};

const EnrollmentSchema = new Schema<EnrollmentDoc>(
  {
    user: { type: Schema.Types.ObjectId, ref: "users", required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: "courses", required: true, index: true },
    order: { type: Schema.Types.ObjectId, ref: "orders" },
    // Who enrolled — id, name, email and image, frozen at enrollment time.
    student: {
      user_id: { type: String, required: true },
      name: { type: String, required: true },
      email: { type: String, required: true },
      avatar: { type: String, default: "" },
    },
    price_paid: { type: Number, default: 0 },
    completed_lessons: { type: [String], default: [] },
    progress: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true },
);

// A learner can own a course once.
EnrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

export const EnrollmentModel: Model<EnrollmentDoc> =
  (models.enrollments as Model<EnrollmentDoc>) ||
  model<EnrollmentDoc>("enrollments", EnrollmentSchema);
