"use client";

import { useEffect } from "react";
import { useThemeStore, THEME_STORAGE_KEY, applyTheme } from "./store";
import type { Theme } from "./store";

/**
 * Reconciles the store with the visitor's saved preference on mount, and
 * keeps multiple tabs in sync. The initial paint is handled by the blocking
 * `theme-init` script in the site layout, so there is no flash.
 */
export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const hydrate = useThemeStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();

    const onStorage = (e: StorageEvent) => {
      if (e.key !== THEME_STORAGE_KEY) return;
      if (e.newValue === "light" || e.newValue === "dark") {
        applyTheme(e.newValue as Theme);
        useThemeStore.setState({ theme: e.newValue as Theme });
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [hydrate]);

  return <>{children}</>;
}
