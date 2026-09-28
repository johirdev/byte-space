import { isValidObjectId } from "mongoose";
import { CourseCategoryModel } from "../models/courseCategory.model";
import { CourseModel } from "../models/course.model";
import type { ICourseCategory } from "../types";
import { ApiError } from "../lib/apiError";
import { FieldCheck, bool, escapeRegex, num, slugify, str } from "../lib/validate";

type CategoryDoc = ICourseCategory & { _id: string };

/** Course count per category id. Public counts only published courses. */
const countsByCategory = async (publishedOnly: boolean) => {
  const rows = await CourseModel.aggregate<{ _id: string; count: number }>([
    { $match: publishedOnly ? { status: "published" } : {} },
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), r.count]));
};

// ── READ ──────────────────────────────────────────────────────────────────
export const listCategories = async (
  opts: { admin?: boolean; q?: string } = {},
): Promise<ICourseCategory[]> => {
  const filter: Record<string, unknown> = {};
  if (!opts.admin) filter.is_active = { $ne: false };
  const q = str(opts.q);
  if (q) filter.name = { $regex: escapeRegex(q), $options: "i" };

  const [rows, counts] = await Promise.all([
    CourseCategoryModel.find(filter).sort({ order: 1, name: 1 }).lean<CategoryDoc[]>(),
    countsByCategory(!opts.admin),
  ]);

  return rows.map((row) => ({ ...row, course_count: counts.get(String(row._id)) ?? 0 }));
};

/** Resolves an id or slug. Returns null when nothing matches. */
export const findCategory = async (idOrSlug: string) => {
  const filter = isValidObjectId(idOrSlug)
    ? { _id: idOrSlug }
    : { slug: idOrSlug.toLowerCase() };
  return CourseCategoryModel.findOne(filter).lean<CategoryDoc>();
};

export const getCategory = async (idOrSlug: string): Promise<ICourseCategory> => {
  const category = await findCategory(idOrSlug);
  if (!category) throw new ApiError(404, "Category not found");
  return category;
};

// ── WRITE ─────────────────────────────────────────────────────────────────
const buildPayload = async (
  body: Record<string, unknown>,
  existingId?: string,
): Promise<Partial<ICourseCategory>> => {
  const isCreate = !existingId;
  const name = str(body.name);
  const slug = slugify(str(body.slug) ?? name ?? "");

  const check = new FieldCheck();
  if (isCreate || body.name !== undefined) {
    check.require("name", name, "Name").minLength("name", name, 2, "Name");
  }
  if ((isCreate || body.name !== undefined || body.slug !== undefined) && !slug) {
    check.custom("slug", false, "Slug could not be generated from the name");
  }

  if (slug) {
    const clash = await CourseCategoryModel.exists({
      slug,
      ...(existingId ? { _id: { $ne: existingId } } : {}),
    });
    check.custom(
      str(body.slug) ? "slug" : "name",
      !clash,
      "A category with this name/slug already exists",
    );
  }
  check.throwIfFailed();

  const payload: Partial<ICourseCategory> = {};
  if (name !== undefined) payload.name = name;
  if (slug) payload.slug = slug;
  if (body.description !== undefined) payload.description = str(body.description) ?? "";
  if (body.icon !== undefined) payload.icon = str(body.icon) ?? "";
  if (body.order !== undefined) payload.order = num(body.order) ?? 0;
  if (body.is_active !== undefined) payload.is_active = bool(body.is_active);
  return payload;
};

export const createCategory = async (
  body: Record<string, unknown>,
): Promise<ICourseCategory> => {
  const payload = await buildPayload(body);
  if (payload.order === undefined) {
    payload.order = await CourseCategoryModel.estimatedDocumentCount();
  }
  const created = await CourseCategoryModel.create(payload);
  return created.toObject();
};

export const updateCategory = async (
  id: string,
  body: Record<string, unknown>,
): Promise<ICourseCategory> => {
  if (!(await CourseCategoryModel.exists({ _id: id }))) {
    throw new ApiError(404, "Category not found");
  }
  const payload = await buildPayload(body, id);
  if (!Object.keys(payload).length) {
    throw new ApiError(400, "No valid fields supplied to update");
  }

  const updated = await CourseCategoryModel.findByIdAndUpdate(
    id,
    { $set: payload },
    { new: true, runValidators: true },
  ).lean<CategoryDoc>();
  if (!updated) throw new ApiError(404, "Category not found");
  return updated;
};

export const deleteCategory = async (id: string): Promise<ICourseCategory> => {
  const category = await CourseCategoryModel.findById(id).lean<CategoryDoc>();
  if (!category) throw new ApiError(404, "Category not found");

  // Deleting a category that still has courses would orphan them.
  const inUse = await CourseModel.countDocuments({ category: id });
  if (inUse > 0) {
    throw new ApiError(
      409,
      `This category still has ${inUse} course(s). Move or delete them first.`,
    );
  }

  await CourseCategoryModel.deleteOne({ _id: id });
  return category;
};
