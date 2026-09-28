import { Schema, model, models, Model } from "mongoose";
import type { ITestimonial } from "../types";

const TestimonialSchema = new Schema<ITestimonial>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    role: { type: String, trim: true, default: "", maxlength: 80 },
    avatar: { type: String, trim: true, default: "" },
    quote: { type: String, required: true, trim: true, maxlength: 700 },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    order: { type: Number, default: 0, index: true },
    is_active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

export const TestimonialModel: Model<ITestimonial> =
  (models.testimonials as Model<ITestimonial>) || model<ITestimonial>("testimonials", TestimonialSchema);
