"use client";

import { create } from "zustand";
import { apiRequest, ApiClientError } from "@/app/lib/apiClient";
import type { SafeUser, SessionUser } from "@/app/types";

type Status = "idle" | "loading" | "authenticated" | "guest";

type AuthState = {
  user: SessionUser | null;
  status: Status;
  /** Loads (or reloads) the session from GET /users/me. */
  load: () => Promise<SessionUser | null>;
  login: (email: string, password: string) => Promise<SafeUser>;
  register: (name: string, email: string, password: string) => Promise<SafeUser>;
  logout: () => Promise<void>;
  setUser: (user: SessionUser) => void;
  isEnrolled: (courseId?: string) => boolean;
};

let inflight: Promise<SessionUser | null> | null = null;

/**
 * Session state for learners. The JWTs live in httpOnly cookies, so this
 * store only mirrors "who is signed in" — the server stays the source of truth.
 */
export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  status: "idle",

  load: () => {
    inflight ??= (async () => {
      if (get().status !== "authenticated") set({ status: "loading" });
      try {
        const { data } = await apiRequest<SessionUser>("/users/me", { auth: "user" });
        set({ user: data, status: "authenticated" });
        return data;
      } catch (err) {
        // Only a real auth failure signs the UI out; a network blip keeps state.
        if (!(err instanceof ApiClientError) || err.status === 401 || err.status === 403) {
          set({ user: null, status: "guest" });
        } else if (get().status === "loading") {
          set({ status: "guest" });
        }
        return null;
      } finally {
        inflight = null;
      }
    })();
    return inflight;
  },

  login: async (email, password) => {
    const { data } = await apiRequest<SafeUser>("/users/login", {
      method: "POST",
      body: { email, password },
    });
    await get().load();
    return data;
  },

  register: async (name, email, password) => {
    const { data } = await apiRequest<SafeUser>("/users/register", {
      method: "POST",
      body: { name, email, password },
    });
    await get().load();
    return data;
  },

  logout: async () => {
    try {
      await apiRequest("/users/logout", { method: "POST" });
    } finally {
      set({ user: null, status: "guest" });
    }
  },

  setUser: (user) => set({ user, status: "authenticated" }),

  isEnrolled: (courseId) =>
    Boolean(courseId && get().user?.enrolled_course_ids.includes(String(courseId))),
}));
