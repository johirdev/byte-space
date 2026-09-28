import type { Metadata } from "next";
import Cart from "@/Components/Frontend/Pages/Cart/Cart";

export const metadata: Metadata = { title: "Your cart | ByteSpace" };

export default function CartPage() {
  return <Cart />;
}
