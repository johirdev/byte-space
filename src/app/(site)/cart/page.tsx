import type { Metadata } from "next";
import { pageMetadata } from "@/config/seo";
import Cart from "@/Components/Frontend/Pages/Cart/Cart";

export const metadata: Metadata = pageMetadata({
  title: "Your Cart",
  path: "/cart",
  noindex: true,
});

export default function CartPage() {
  return <Cart />;
}
