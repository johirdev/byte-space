import BrandLoader from "@/Components/Shared/BrandLoader";

// Dashboard route transitions (inside the admin shell, so not full-screen).
export default function Loading() {
  return <BrandLoader variant="admin" label="Loading dashboard" fullscreen={false} />;
}
