// Shared layout for public site pages (add Header / Footer here later).
// <html>, <body>, fonts and globals.css live in the root layout: src/app/layout.tsx
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
