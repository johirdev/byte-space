import jwt, { SignOptions, JwtPayload } from "jsonwebtoken";

export type AdminRole = "superadmin" | "admin" | "editor" | "viewOnly";

export type AccessTokenPayload = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
};

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Environment variable ${name} is not set`);
  return value;
};

export const JWT_SECRET = () => required("JWT_SECRET");
/** Falls back to JWT_SECRET so existing deployments keep working. */
export const JWT_REFRESH_SECRET = () =>
  process.env.JWT_REFRESH_SECRET || required("JWT_SECRET");

export const ACCESS_TOKEN_TTL = process.env.JWT_EXPIRES_IN_ADMIN || "1d";
export const REFRESH_TOKEN_TTL = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

const createToken = (
  payload: object,
  secret: string,
  expiresIn: string,
): string => jwt.sign(payload, secret, { expiresIn } as SignOptions);

const verifyToken = <T = JwtPayload>(token: string, secret: string): T =>
  jwt.verify(token, secret) as T;

export const createAccessToken = (payload: AccessTokenPayload) =>
  createToken(payload, JWT_SECRET(), ACCESS_TOKEN_TTL);

export const createRefreshToken = (payload: { id: string }) =>
  createToken(payload, JWT_REFRESH_SECRET(), REFRESH_TOKEN_TTL);

export const verifyAccessToken = (token: string) =>
  verifyToken<AccessTokenPayload & JwtPayload>(token, JWT_SECRET());

export const verifyRefreshToken = (token: string) =>
  verifyToken<{ id: string } & JwtPayload>(token, JWT_REFRESH_SECRET());

export const jwtHelpers = {
  createToken,
  verifyToken,
  createAccessToken,
  createRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
