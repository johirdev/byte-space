"use client";

import { useContext } from "react";
import ResourceManager from "../kit/ResourceManager";
import { Avatar, BoolPill, DateCell } from "../kit/cells";
import { AuthContext } from "@/app/dashboard/AuthProvider";
import { ADMIN_ROLES, type AdminRole, type SafeAdmin } from "@/app/types";
import type { Column, FieldDef } from "../kit/types";

const ROLE_STYLE: Record<AdminRole, string> = {
  superadmin: "a-badge--brand",
  admin: "a-badge--sky",
  editor: "a-badge--signal",
  viewOnly: "a-badge--muted",
};

const ROLE_HINT =
  "superadmin manages the team · admin and editor manage content · viewOnly is read-only.";

const FIELDS: FieldDef[] = [
  { name: "admin_name", label: "Full name", type: "text", required: true },
  {
    name: "admin_role",
    label: "Role",
    type: "select",
    required: true,
    options: ADMIN_ROLES.map((value) => ({ label: value, value })),
    hint: ROLE_HINT,
  },
  { name: "admin_email", label: "Email", type: "email", required: true },
  {
    name: "admin_phone",
    label: "Phone",
    type: "text",
    required: true,
    placeholder: "01712345678",
    hint: "Bangladesh format: 01 followed by 9 digits.",
  },
  {
    name: "admin_password",
    label: "Password",
    type: "text",
    span: 2,
    placeholder: "At least 8 characters",
    hint: "Leave blank when editing to keep the current password. Setting one also clears any lockout.",
  },
  { name: "admin_avatar", label: "Avatar URL", type: "image", span: 2 },
  {
    name: "is_active",
    label: "Account active",
    type: "switch",
    span: 2,
    hint: "Deactivated accounts cannot sign in but keep their history.",
  },
];

const COLUMNS: Column<SafeAdmin>[] = [
  {
    key: "admin_name",
    header: "Member",
    render: (row) => <Avatar src={row.admin_avatar} name={row.admin_name} />,
  },
  { key: "admin_email", header: "Email" },
  { key: "admin_phone", header: "Phone" },
  {
    key: "admin_role",
    header: "Role",
    render: (row) => (
      <span className={`a-badge ${ROLE_STYLE[row.admin_role] ?? "a-badge--muted"}`}>
        {row.admin_role}
      </span>
    ),
  },
  {
    key: "last_login",
    header: "Last sign-in",
    render: (row) => <DateCell value={row.last_login} />,
  },
  {
    key: "is_active",
    header: "Status",
    render: (row) => <BoolPill value={row.is_active} on="Active" off="Disabled" />,
  },
];

export function AllAdmin() {
  const { can } = useContext(AuthContext);

  if (!can("superadmin")) {
    return (
      <div className="a-card a-card--pad py-14 text-center">
        <p className="text-[0.92rem] font-semibold text-white">Superadmin only</p>
        <p className="a-page-head__sub mx-auto !mt-2">
          Only a superadmin can view or manage other admin accounts.
        </p>
      </div>
    );
  }

  return (
    <ResourceManager<SafeAdmin>
      path="/admins"
      title="Team"
      description="Who can sign in to this panel and what they are allowed to change."
      label="Admin"
      fields={FIELDS}
      columns={COLUMNS}
      searchKeys={["admin_name", "admin_email", "admin_phone"]}
      nameOf={(row) => row.admin_name}
      emptyValues={{ admin_role: "editor", is_active: true }}
      toForm={(row) => ({ ...row, admin_password: "" })}
      toPayload={(values) => {
        const payload = { ...values };
        // Never send a blank password — that would be a validation error.
        if (!String(payload.admin_password ?? "").trim()) delete payload.admin_password;
        return payload;
      }}
    />
  );
}

export default AllAdmin;
