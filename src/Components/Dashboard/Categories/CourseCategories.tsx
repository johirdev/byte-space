"use client";

import Link from "next/link";
import ResourceManager from "../kit/ResourceManager";
import { BoolPill, DateCell, Truncate } from "../kit/cells";
import type { ICourseCategory } from "@/app/types";
import type { Column, FieldDef } from "../kit/types";

const FIELDS: FieldDef[] = [
  { name: "name", label: "Name", type: "text", required: true, placeholder: "UI/UX Design" },
  {
    name: "slug",
    label: "Slug",
    type: "text",
    placeholder: "auto from name",
    hint: "Used in URLs: /courses?category=slug. Leave blank to generate.",
  },
  {
    name: "description",
    label: "Description",
    type: "textarea",
    span: 2,
    rows: 3,
    placeholder: "Short blurb (optional)",
  },
  {
    name: "order",
    label: "Order",
    type: "number",
    min: 0,
    hint: "Lower numbers show first in the chip row.",
  },
  { name: "icon", label: "Icon (optional)", type: "image" },
  {
    name: "is_active",
    label: "Visible on the site",
    type: "switch",
    span: 2,
    hint: "Hidden categories keep their courses but disappear from filters.",
  },
];

const COLUMNS: Column<ICourseCategory>[] = [
  {
    key: "name",
    header: "Category",
    render: (row) => (
      <span className="flex flex-col">
        <span className="a-strong">{row.name}</span>
        <span className="text-[0.72rem]" style={{ color: "var(--a-text-3)" }}>
          /{row.slug}
        </span>
      </span>
    ),
  },
  { key: "description", header: "Description", render: (row) => <Truncate text={row.description} /> },
  {
    key: "course_count",
    header: "Courses",
    align: "center",
    render: (row) => (
      <Link href={`/dashboard/courses?category=${row._id}`} className="a-badge a-badge--brand">
        {row.course_count ?? 0}
      </Link>
    ),
  },
  { key: "order", header: "Order", align: "center" },
  { key: "is_active", header: "Status", render: (row) => <BoolPill value={row.is_active} on="Visible" off="Hidden" /> },
  { key: "updatedAt", header: "Updated", render: (row) => <DateCell value={row.updatedAt} /> },
];

export default function CourseCategories() {
  return (
    <ResourceManager<ICourseCategory>
      path="/course-categories"
      query={{ scope: "admin" }}
      title="Course categories"
      description="Categories power the chips, filters and AI auto-fill. A category with courses can't be deleted."
      label="Category"
      fields={FIELDS}
      columns={COLUMNS}
      searchKeys={["name", "slug", "description"]}
      nameOf={(row) => row.name}
      emptyValues={{ is_active: true }}
      toForm={(row) => ({ ...row })}
      toPayload={(values) => {
        const { course_count: _count, _id, createdAt, updatedAt, ...payload } = values as Record<string, unknown>;
        void _count;
        void _id;
        void createdAt;
        void updatedAt;
        return payload;
      }}
    />
  );
}
