import type { Metadata } from "next";
import { redirect } from "next/navigation";
import BecomeCreator from "@/Components/Frontend/Pages/BecomeCreator/BecomeCreator";
import { isSignedIn } from "@/app/lib/session";

export const metadata: Metadata = {
  title: "Become a Creator | ByteSpace",
  description: "Apply to teach on ByteSpace. Every creator is reviewed and verified by our team.",
};

export default async function BecomeCreatorPage() {
  if (!(await isSignedIn())) redirect("/login?next=/become-creator");
  return <BecomeCreator />;
}
