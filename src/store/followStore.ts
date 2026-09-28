"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Demo follow system: which creators this visitor follows, kept in
 * localStorage. Swap `toggle` for an API call when a real follow model lands.
 */
type FollowState = {
  following: string[];
  hydrated: boolean;
  isFollowing: (slug: string) => boolean;
  toggle: (slug: string) => boolean;
  setHydrated: () => void;
};

export const useFollowStore = create<FollowState>()(
  persist(
    (set, get) => ({
      following: [],
      hydrated: false,
      isFollowing: (slug) => get().following.includes(slug),
      toggle: (slug) => {
        const now = !get().following.includes(slug);
        set({ following: now ? [...get().following, slug] : get().following.filter((s) => s !== slug) });
        return now;
      },
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "bytespace-following",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ following: s.following }),
      skipHydration: true,
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);
