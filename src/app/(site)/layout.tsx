import Navbar from "@/Layout/Navbar/Navbar";
import Footer from "@/Layout/Footer/Footer";

// Shared layout for public site pages.
// <html>, <body>, fonts and globals.css live in the root layout: src/app/layout.tsx
// Navbar is absolutely positioned so it sits transparently on top of the hero.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}
