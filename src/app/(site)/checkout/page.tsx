import type { Metadata } from "next";
import { pageMetadata } from "@/config/seo";
import { redirect } from "next/navigation";
import Checkout from "@/Components/Frontend/Pages/Checkout/Checkout";
import { isSignedIn } from "@/app/lib/session";

export const metadata: Metadata = pageMetadata({
  title: "Checkout",
  path: "/checkout",
  noindex: true,
});

export default async function CheckoutPage() {
  if (!(await isSignedIn())) redirect("/login?next=/checkout");
  return <Checkout />;
}
