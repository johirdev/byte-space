import type { Metadata } from "next";
import NotFound from "@/Components/Frontend/Pages/NotFound/NotFound";

export const metadata: Metadata = {
  title: "Page not found | ByteSpace",
  robots: { index: false },
};

// Root not-found: catches every unmatched URL (site and dashboard) and any notFound() call.
export default function NotFoundPage() {
  return <NotFound />;
}
