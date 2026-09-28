import OrderList from "@/Components/Dashboard/Orders/OrderList";

export default async function OrdersPage({ searchParams }: PageProps<"/dashboard/orders">) {
  const { q } = await searchParams;
  return <OrderList initialQuery={typeof q === "string" ? q : ""} />;
}
