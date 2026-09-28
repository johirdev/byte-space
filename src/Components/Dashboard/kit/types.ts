import type { ReactNode } from "react";

export type FieldOption = { label: string; value: string | number };

type Base = {
  name: string;
  label: string;
  hint?: string;
  /** Column span inside the 2-column form grid. */
  span?: 1 | 2;
  required?: boolean;
};

export type SimpleField = Base & {
  type: "text" | "email" | "url" | "number" | "textarea" | "html";
  placeholder?: string;
  rows?: number;
  min?: number;
  max?: number;
  step?: number;
};

export type FieldDef =
  | SimpleField
  | (Base & { type: "select"; options: FieldOption[] })
  | (Base & { type: "switch" })
  | (Base & { type: "tags"; placeholder?: string })
  | (Base & { type: "image"; placeholder?: string })
  | (Base & {
      type: "group";
      fields: (SimpleField | (Base & { type: "select"; options: FieldOption[] }))[];
      addLabel?: string;
      max?: number;
    });

export type FormValues = Record<string, unknown>;

export type Column<T> = {
  key: string;
  header: string;
  /** Cell renderer. Falls back to `String(row[key])`. */
  render?: (row: T) => ReactNode;
  width?: string;
  align?: "left" | "right" | "center";
};
