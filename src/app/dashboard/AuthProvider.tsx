"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { apiRequest } from "@/app/lib/apiClient";
import type { AdminRole } from "@/app/types";

const TOKEN_COOKIE = "access_token";

export type AdminData = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  exp?: number;
  iat?: number;
};

export type AuthContextType = {
  token: string | null;
  adminData: AdminData | null;
  loading: boolean;
  loginAdmin: (token: string) => void;
  logOut: () => void;
  /** True when the signed-in admin holds any of the given roles. */
  can: (...roles: AdminRole[]) => boolean;
  isReadOnly: boolean;
};

export const AuthContext = createContext<AuthContextType>({
  token: null,
  adminData: null,
  loading: true,
  loginAdmin: () => {},
  logOut: () => {},
  can: () => false,
  isReadOnly: true,
});

const decode = (token: string): AdminData | null => {
  try {
    const claims = jwtDecode<AdminData>(token);
    // Treat an expired token as no session at all.
    if (claims.exp && claims.exp * 1000 <= Date.now()) return null;
    return claims;
  } catch {
    return null;
  }
};

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);

  const applyToken = useCallback((next: string) => {
    const claims = decode(next);
    if (!claims) return false;

    Cookies.set(TOKEN_COOKIE, next, {
      expires: 1,
      path: "/",
      sameSite: "lax",
      secure: window.location.protocol === "https:",
    });
    setToken(next);
    setAdminData(claims);
    return true;
  }, []);

  const clearSession = useCallback(() => {
    Cookies.remove(TOKEN_COOKIE, { path: "/" });
    setToken(null);
    setAdminData(null);
  }, []);

  // On mount: use the stored access token, and if it is missing or expired,
  // try the httpOnly refresh cookie before showing the sign-in screen.
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const stored = Cookies.get(TOKEN_COOKIE);
      const claims = stored ? decode(stored) : null;

      if (stored && claims) {
        if (!cancelled) {
          setToken(stored);
          setAdminData(claims);
          setLoading(false);
        }
        return;
      }

      try {
        const { data } = await apiRequest<{ access_token: string }>(
          "/admins/refresh",
          { method: "POST" },
        );
        if (!cancelled && data?.access_token) applyToken(data.access_token);
      } catch {
        if (!cancelled) clearSession();
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void init();
    return () => {
      cancelled = true;
    };
  }, [applyToken, clearSession]);

  // Sign out automatically the moment the token expires. `decode` already
  // rejects tokens that are expired on arrival, so this only ever schedules a
  // future timeout — never an immediate state change.
  useEffect(() => {
    if (!adminData?.exp) return;
    const msLeft = Math.max(0, adminData.exp * 1000 - Date.now());
    const timer = setTimeout(clearSession, msLeft);
    return () => clearTimeout(timer);
  }, [adminData, clearSession]);

  const logOut = useCallback(() => {
    void apiRequest("/admins/logout", { method: "POST" }).catch(() => {});
    clearSession();
  }, [clearSession]);

  const value = useMemo<AuthContextType>(() => {
    const role = adminData?.role;
    return {
      token,
      adminData,
      loading,
      loginAdmin: (next: string) => {
        applyToken(next);
      },
      logOut,
      can: (...roles: AdminRole[]) => Boolean(role && roles.includes(role)),
      isReadOnly: role === "viewOnly",
    };
  }, [token, adminData, loading, applyToken, logOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
