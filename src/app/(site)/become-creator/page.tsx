import type { Metadata } from "next";
import { pageMetadata } from "@/config/seo";
import { redirect } from "next/navigation";
import BecomeCreator from "@/Components/Frontend/Pages/BecomeCreator/BecomeCreator";
import { isSignedIn } from "@/app/lib/session";

export const metadata: Metadata = pageMetadata({
  title: "Become a Creator",
  description: "Apply to teach on ByteSpace. Every creator is reviewed and verified by our team.",
  path: "/become-creator",
  noindex: true,
});

export default async function BecomeCreatorPage() {
  if (!(await isSignedIn())) redirect("/login?next=/become-creator");
  return <BecomeCreator />;
}
