/**
 * Shared domain types for the portfolio.
 * Client components import from here; server code re-uses the same shapes.
 */

export type WithTimestamps = {
  _id?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

/* ── API envelope ────────────────────────────────────────────────────── */
export type ApiMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  meta?: ApiMeta;
  errors?: Record<string, string>;
};

export * from "./course.interface";
export * from "./user.interface";

/* ── Admin ───────────────────────────────────────────────────────────── */
export const ADMIN_ROLES = [
  "superadmin",
  "admin",
  "editor",
  "viewOnly",
] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export type IBlockedIP = { ip: string; expires: number };

export type IAdmin = WithTimestamps & {
  admin_name: string;
  admin_email: string;
  admin_phone: string;
  admin_role: AdminRole;
  admin_password: string;
  admin_avatar?: string;
  admin_ip_address?: string;
  is_active?: boolean;
  last_login?: Date | string | null;
  login_attempts?: number;
  last_attempt?: Date | string | null;
  blockTime?: Date | string | null;
  blockedIPs?: IBlockedIP[];
};

export type SafeAdmin = Omit<IAdmin, "admin_password" | "blockedIPs">;

export type ILoginPayload = { admin_email: string; admin_password: string };
export type IAdminLogin = {
  access_token: string;
  refresh_token: string;
  admin: SafeAdmin;
};
