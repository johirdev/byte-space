import bcrypt from "bcrypt";
import { AdminModel } from "../models/admin.model";
import {
  ADMIN_ROLES,
  type AdminRole,
  type IAdmin,
  type IAdminLogin,
  type IBlockedIP,
  type ILoginPayload,
  type SafeAdmin,
} from "../types";
import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
} from "../lib/jwtHelpers";
import { ApiError } from "../lib/apiError";
import { FieldCheck, BD_PHONE_REGEX, EMAIL_REGEX, str } from "../lib/validate";

const MIN_PASS_LENGTH = 8;
const MAX_LOGIN_ATTEMPTS = 5;
const ACCOUNT_LOCK_MS = 60 * 60 * 1000; // 1 hour
const IP_BLOCK_MS = 6 * 60 * 60 * 1000; // 6 hours
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUND) || 12;

type AdminDoc = IAdmin & { _id: string };

const toSafe = (admin: AdminDoc): SafeAdmin => {
  const { admin_password: _pw, blockedIPs: _ips, ...safe } = admin;
  void _pw;
  void _ips;
  return safe as SafeAdmin;
};

/** True while the very first admin has not been created yet. */
export const needsBootstrap = async (): Promise<boolean> =>
  (await AdminModel.estimatedDocumentCount()) === 0;

// ── CREATE ────────────────────────────────────────────────────────────────
export const createAdminService = async (
  payload: Partial<IAdmin>,
  ip: string,
): Promise<SafeAdmin> => {
  const name = str(payload.admin_name);
  const email = str(payload.admin_email)?.toLowerCase();
  const phone = str(payload.admin_phone);
  const password = payload.admin_password;
  const role = str(payload.admin_role) as AdminRole | undefined;

  new FieldCheck()
    .require("admin_name", name, "Name")
    .custom(
      "admin_email",
      !!email && EMAIL_REGEX.test(email),
      "Enter a valid email address",
    )
    .custom(
      "admin_phone",
      !!phone && BD_PHONE_REGEX.test(phone),
      "Use a Bangladesh number in the format 01XXXXXXXXX",
    )
    .custom(
      "admin_password",
      !!password && password.length >= MIN_PASS_LENGTH,
      `Password must be at least ${MIN_PASS_LENGTH} characters`,
    )
    .custom(
      "admin_role",
      role === undefined || ADMIN_ROLES.includes(role),
      "Choose a valid role",
    )
    .throwIfFailed();

  const [emailExists, phoneExists] = await Promise.all([
    AdminModel.exists({ admin_email: email }),
    AdminModel.exists({ admin_phone: phone }),
  ]);
  if (emailExists) throw new ApiError(409, "That email is already registered", { admin_email: "Already in use" });
  if (phoneExists) throw new ApiError(409, "That phone number is already registered", { admin_phone: "Already in use" });

  // The first account is always a superadmin, so the panel is never locked out.
  const isFirst = await needsBootstrap();

  const created = await AdminModel.create({
    admin_name: name,
    admin_email: email,
    admin_phone: phone,
    admin_password: await bcrypt.hash(password!, SALT_ROUNDS),
    admin_role: isFirst ? "superadmin" : (role ?? "admin"),
    admin_ip_address: ip,
    admin_avatar: str(payload.admin_avatar) ?? "",
    is_active: true,
  });

  return toSafe(created.toObject() as AdminDoc);
};

// ── LOGIN ─────────────────────────────────────────────────────────────────
export const loginAdminService = async (
  payload: ILoginPayload & { sendingDeviceIp: string },
): Promise<IAdminLogin> => {
  const email = str(payload.admin_email)?.toLowerCase();
  const { admin_password, sendingDeviceIp: ip } = payload;

  new FieldCheck()
    .require("admin_email", email, "Email")
    .require("admin_password", admin_password, "Password")
    .throwIfFailed();

  const user = await AdminModel.findOne({ admin_email: email }).select(
    "+admin_password +blockedIPs",
  );

  // Same message for unknown email and wrong password — no account enumeration.
  const invalid = new ApiError(401, "Email or password is incorrect");
  if (!user) throw invalid;

  if (user.is_active === false) {
    throw new ApiError(403, "This account has been deactivated");
  }

  const now = Date.now();
  const activeIPs: IBlockedIP[] = (user.blockedIPs ?? []).filter(
    (item) => item.expires > now,
  );

  if (user.blockTime && new Date(user.blockTime).getTime() > now) {
    const minutes = Math.ceil(
      (new Date(user.blockTime).getTime() - now) / 60_000,
    );
    throw new ApiError(
      423,
      `Account locked after too many attempts. Try again in ${minutes} minute(s).`,
    );
  }

  if (activeIPs.some((item) => item.ip === ip)) {
    throw new ApiError(403, "This IP address is temporarily blocked");
  }

  const isMatch = await bcrypt.compare(admin_password, user.admin_password);

  if (!isMatch) {
    const attempts = (user.login_attempts ?? 0) + 1;
    const locked = attempts >= MAX_LOGIN_ATTEMPTS;

    const update: Record<string, unknown> = {
      login_attempts: attempts,
      last_attempt: new Date(),
    };

    if (locked) {
      update.blockTime = new Date(now + ACCOUNT_LOCK_MS);
      if (!activeIPs.some((item) => item.ip === ip)) {
        activeIPs.push({ ip, expires: now + IP_BLOCK_MS });
      }
      update.blockedIPs = activeIPs;
    }

    await AdminModel.updateOne({ _id: user._id }, { $set: update });

    throw new ApiError(
      locked ? 423 : 401,
      locked
        ? "Account locked for 1 hour after too many failed attempts"
        : `Email or password is incorrect. ${MAX_LOGIN_ATTEMPTS - attempts} attempt(s) left.`,
    );
  }

  await AdminModel.updateOne(
    { _id: user._id },
    {
      $set: {
        login_attempts: 0,
        blockTime: null,
        blockedIPs: activeIPs,
        admin_ip_address: ip,
        last_attempt: new Date(),
        last_login: new Date(),
      },
    },
  );

  const admin = toSafe(user.toObject() as AdminDoc);

  return {
    access_token: createAccessToken({
      id: String(user._id),
      email: user.admin_email,
      name: user.admin_name,
      role: user.admin_role,
    }),
    refresh_token: createRefreshToken({ id: String(user._id) }),
    admin,
  };
};

// ── REFRESH ───────────────────────────────────────────────────────────────
export const refreshAccessTokenService = async (
  refreshToken: string,
): Promise<{ access_token: string; admin: SafeAdmin }> => {
  let decoded: { id: string };
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(401, "Session expired. Please sign in again.");
  }

  const user = await AdminModel.findById(decoded.id).lean<AdminDoc>();
  if (!user) throw new ApiError(401, "Account no longer exists");
  if (user.is_active === false) {
    throw new ApiError(403, "This account has been deactivated");
  }

  return {
    access_token: createAccessToken({
      id: String(user._id),
      email: user.admin_email,
      name: user.admin_name,
      role: user.admin_role,
    }),
    admin: toSafe(user),
  };
};

// ── UPDATE ────────────────────────────────────────────────────────────────
export const updateAdminService = async (
  id: string,
  payload: Partial<IAdmin>,
  ip: string,
  actor?: { id: string; role: AdminRole },
): Promise<SafeAdmin> => {
  const admin = await AdminModel.findById(id).lean<AdminDoc>();
  if (!admin) throw new ApiError(404, "Admin not found");

  const updateData: Record<string, unknown> = {};
  const check = new FieldCheck();

  const name = str(payload.admin_name);
  if (name) updateData.admin_name = name;

  const avatar = str(payload.admin_avatar);
  if (avatar !== undefined) updateData.admin_avatar = avatar;

  const email = str(payload.admin_email)?.toLowerCase();
  if (email) {
    check.custom("admin_email", EMAIL_REGEX.test(email), "Enter a valid email address");
    if (await AdminModel.exists({ admin_email: email, _id: { $ne: id } })) {
      check.custom("admin_email", false, "Already in use");
    }
    updateData.admin_email = email;
  }

  const phone = str(payload.admin_phone);
  if (phone) {
    check.custom(
      "admin_phone",
      BD_PHONE_REGEX.test(phone),
      "Use a Bangladesh number in the format 01XXXXXXXXX",
    );
    if (await AdminModel.exists({ admin_phone: phone, _id: { $ne: id } })) {
      check.custom("admin_phone", false, "Already in use");
    }
    updateData.admin_phone = phone;
  }

  const role = str(payload.admin_role) as AdminRole | undefined;
  if (role) {
    check.custom("admin_role", ADMIN_ROLES.includes(role), "Choose a valid role");

    // Never let the last superadmin demote themselves out of the panel.
    if (admin.admin_role === "superadmin" && role !== "superadmin") {
      const others = await AdminModel.countDocuments({
        admin_role: "superadmin",
        _id: { $ne: id },
      });
      if (others === 0) {
        throw new ApiError(400, "At least one superadmin must remain");
      }
    }
    updateData.admin_role = role;
  }

  if (payload.admin_password) {
    check.custom(
      "admin_password",
      payload.admin_password.length >= MIN_PASS_LENGTH,
      `Password must be at least ${MIN_PASS_LENGTH} characters`,
    );
    updateData.admin_password = await bcrypt.hash(
      payload.admin_password,
      SALT_ROUNDS,
    );
    // A password change clears any standing lockout.
    updateData.login_attempts = 0;
    updateData.blockTime = null;
    updateData.blockedIPs = [];
  }

  if (payload.is_active !== undefined) {
    if (actor?.id === id && payload.is_active === false) {
      throw new ApiError(400, "You cannot deactivate your own account");
    }
    updateData.is_active = Boolean(payload.is_active);
  }

  check.throwIfFailed();

  if (!Object.keys(updateData).length) {
    throw new ApiError(400, "No valid fields supplied to update");
  }

  updateData.admin_ip_address = ip;

  const updated = await AdminModel.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true },
  ).lean<AdminDoc>();

  if (!updated) throw new ApiError(404, "Admin not found");
  return toSafe(updated);
};

// ── READ ──────────────────────────────────────────────────────────────────
export const getAdminsService = async (): Promise<SafeAdmin[]> =>
  AdminModel.find().sort({ createdAt: -1 }).lean<SafeAdmin[]>();

export const getSingleAdminService = async (id: string): Promise<SafeAdmin> => {
  const admin = await AdminModel.findById(id).lean<AdminDoc>();
  if (!admin) throw new ApiError(404, "Admin not found");
  return toSafe(admin);
};

// ── DELETE ────────────────────────────────────────────────────────────────
export const deleteAdminService = async (
  id: string,
  actorId?: string,
): Promise<SafeAdmin> => {
  if (actorId === id) {
    throw new ApiError(400, "You cannot delete your own account");
  }

  const admin = await AdminModel.findById(id).lean<AdminDoc>();
  if (!admin) throw new ApiError(404, "Admin not found");

  if (admin.admin_role === "superadmin") {
    const others = await AdminModel.countDocuments({
      admin_role: "superadmin",
      _id: { $ne: id },
    });
    if (others === 0) {
      throw new ApiError(400, "The last superadmin cannot be deleted");
    }
  }

  await AdminModel.deleteOne({ _id: id });
  return toSafe(admin);
};
