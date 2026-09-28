import SiteProviders from "@/Layout/SiteProviders";

// Sign-in / sign-up screens: full-bleed blue, no site navbar or footer.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <SiteProviders>{children}</SiteProviders>;
}
