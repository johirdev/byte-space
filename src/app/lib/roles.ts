import type { AdminRole } from "../types";

/**
 * Role groups safe to import from client components (tokenRoleAccess.ts pulls
 * in jsonwebtoken, which must stay server-only).
 */
export const CONTENT_EDITORS: AdminRole[] = ["superadmin", "admin", "editor"];
export const PANEL_VIEWERS: AdminRole[] = ["superadmin", "admin", "editor", "viewOnly"];
export const ADMIN_MANAGERS: AdminRole[] = ["superadmin"];
