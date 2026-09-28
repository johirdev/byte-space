import { create } from "zustand";

export type Theme = "light" | "dark";

export const DEFAULT_THEME: Theme = "dark";
export const THEME_STORAGE_KEY = "nafi-theme";

/**
 * Paints the theme onto <html>. We stamp BOTH a `data-theme` attribute
 * (used by the CSS custom-property blocks in globals.css) and the matching
 * class (used by Tailwind's `dark:` variant), so the two systems never
 * disagree.
 */
export const applyTheme = (theme: Theme) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.classList.remove("light", "dark");
  root.classList.add(theme);
  root.style.colorScheme = theme;
};

export const readStoredTheme = (): Theme => {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  } catch {
    return DEFAULT_THEME;
  }
};

interface ThemeState {
  theme: Theme;
  /** false until the client has reconciled with localStorage */
  hydrated: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  hydrate: () => void;
}

/**
 * Starts at DEFAULT_THEME on both server and client so the first paint
 * matches the server HTML; `hydrate()` (called from ThemeProvider) then
 * reconciles with the visitor's stored preference.
 */
export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: DEFAULT_THEME,
  hydrated: false,

  hydrate: () => {
    const theme = readStoredTheme();
    applyTheme(theme);
    set({ theme, hydrated: true });
  },

  toggleTheme: () => get().setTheme(get().theme === "light" ? "dark" : "light"),

  setTheme: (theme) => {
    applyTheme(theme);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* storage blocked — theme still applies for this session */
    }
    set({ theme });
  },
}));
