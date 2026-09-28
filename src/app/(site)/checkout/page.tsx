import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Checkout from "@/Components/Frontend/Pages/Checkout/Checkout";
import { isSignedIn } from "@/app/lib/session";

export const metadata: Metadata = { title: "Checkout | ByteSpace" };

export default async function CheckoutPage() {
  if (!(await isSignedIn())) redirect("/login?next=/checkout");
  return <Checkout />;
}
