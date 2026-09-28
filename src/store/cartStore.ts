"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ICourse } from "@/app/types";

/**
 * Cart snapshot of a course — enough to render the cart and checkout without
 * refetching. Prices here are for display only: the server re-prices every
 * course at checkout.
 */
export type CartItem = Pick<
  ICourse,
  "slug" | "title" | "thumbnail" | "price" | "price_label" | "level" | "total_lessons" | "total_duration" | "rating_avg"
> & {
  _id: string;
  creator: string;
  added_at: number;
};

export const MAX_CART_ITEMS = 20;

type CartState = {
  items: CartItem[];
  /** False until localStorage has been read — render counts only after this. */
  hydrated: boolean;
  add: (course: Omit<CartItem, "added_at">) => "added" | "exists" | "full";
  remove: (id: string) => void;
  removeMany: (ids: string[]) => void;
  clear: () => void;
  has: (id: string) => boolean;
  setHydrated: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      hydrated: false,

      add: (course) => {
        const { items } = get();
        if (items.some((i) => i._id === course._id)) return "exists";
        if (items.length >= MAX_CART_ITEMS) return "full";
        set({ items: [...items, { ...course, added_at: Date.now() }] });
        return "added";
      },
      remove: (id) => set({ items: get().items.filter((i) => i._id !== id) }),
      removeMany: (ids) => {
        if (!ids.length) return;
        const drop = new Set(ids);
        const next = get().items.filter((i) => !drop.has(i._id));
        if (next.length !== get().items.length) set({ items: next });
      },
      clear: () => set({ items: [] }),
      has: (id) => get().items.some((i) => i._id === id),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "bytespace-cart",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
      // Rehydrated manually from SiteProviders so SSR and first paint match.
      skipHydration: true,
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);

/** Card/course → cart item. */
export const toCartItem = (
  course: Pick<ICourse, "_id" | "slug" | "title" | "thumbnail" | "price" | "price_label" | "level" | "total_lessons" | "total_duration" | "rating_avg" | "creator">,
): Omit<CartItem, "added_at"> => ({
  _id: String(course._id),
  slug: course.slug,
  title: course.title,
  thumbnail: course.thumbnail,
  price: course.price,
  price_label: course.price_label,
  level: course.level,
  total_lessons: course.total_lessons,
  total_duration: course.total_duration,
  rating_avg: course.rating_avg,
  creator: course.creator?.name ?? "",
});

export const cartTotal = (items: CartItem[]) =>
  Math.round(items.reduce((sum, i) => sum + (i.price || 0), 0) * 100) / 100;
