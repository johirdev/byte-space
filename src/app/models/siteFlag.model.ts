import { Schema, model, models, Model } from "mongoose";

/** One-off markers, e.g. "faqs_seeded" so default content is only added once. */
type SiteFlag = { key: string; value: unknown };

const SiteFlagSchema = new Schema<SiteFlag>(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: Schema.Types.Mixed, default: true },
  },
  { timestamps: true },
);

export const SiteFlagModel: Model<SiteFlag> =
  (models.site_flags as Model<SiteFlag>) || model<SiteFlag>("site_flags", SiteFlagSchema);
