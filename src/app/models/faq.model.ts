import { Schema, model, models, Model } from "mongoose";
import { FAQ_CATEGORIES, type IFaq } from "../types";

const FaqSchema = new Schema<IFaq>(
  {
    question: { type: String, required: true, trim: true, maxlength: 200 },
    answer: { type: String, required: true, trim: true, maxlength: 2000 },
    category: { type: String, enum: FAQ_CATEGORIES, default: "General", index: true },
    order: { type: Number, default: 0, index: true },
    is_active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

export const FaqModel: Model<IFaq> = (models.faqs as Model<IFaq>) || model<IFaq>("faqs", FaqSchema);
