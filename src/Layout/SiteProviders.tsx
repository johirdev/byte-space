"use client";

import { useEffect } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";

/**
 * Boots client state for the public site:
 *  - rehydrates the persisted cart (skipped during SSR to avoid mismatches),
 *  - keeps the cart in sync across tabs,
 *  - loads the learner session once,
 *  - drops courses the learner already owns from the cart.
 */
export default function SiteProviders({ children }: { children: React.ReactNode }) {
  const enrolled = useAuthStore((s) => s.user?.enrolled_course_ids);

  useEffect(() => {
    void useCartStore.persist.rehydrate();
    if (useAuthStore.getState().status === "idle") void useAuthStore.getState().load();

    const onStorage = (e: StorageEvent) => {
      if (e.key === useCartStore.persist.getOptions().name) void useCartStore.persist.rehydrate();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (enrolled?.length) useCartStore.getState().removeMany(enrolled);
  }, [enrolled]);

  return (
    <>
      {children}
      <ToastContainer
        position="bottom-right"
        autoClose={3200}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="light"
        toastStyle={{ borderRadius: "14px", fontSize: "0.9rem", fontFamily: "var(--font-body)" }}
      />
    </>
  );
}
