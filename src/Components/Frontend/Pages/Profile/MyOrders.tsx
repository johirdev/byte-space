"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Copy, Receipt } from "lucide-react";
import { toast } from "react-toastify";
import { apiRequest, ApiClientError } from "@/app/lib/apiClient";
import { PAYMENT_METHOD_LABELS, type IOrder } from "@/app/types";
import { formatPrice, imageProps } from "../../utils/course";

const STATUS_STYLE: Record<string, string> = {
  paid: "bg-secondary-100 text-secondary-800",
  refunded: "bg-amber-50 text-amber-700",
  failed: "bg-red-50 text-red-700",
};

export default function MyOrders({ highlight }: { highlight?: string }) {
  const [orders, setOrders] = useState<IOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<IOrder[]>("/users/me/orders", { auth: "user" })
      .then(({ data }) => setOrders(data))
      .catch((err) => setError(err instanceof ApiClientError ? err.message : "Could not load orders"));
  }, []);

  if (error) return <p className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</p>;
  if (!orders) {
    return (
      <div className="space-y-4">
        {[0, 1].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-2xl bg-neutral-50" />
        ))}
      </div>
    );
  }
  if (!orders.length) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-neutral-200 px-6 py-16 text-center">
        <Receipt className="size-8 text-neutral-300" />
        <h3 className="mt-4 font-heading text-lg font-semibold">No orders yet</h3>
        <p className="mt-1 text-sm text-neutral-500">Your receipts will appear here after checkout.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {orders.map((order) => {
        const isNew = highlight === order.order_no;
        return (
          <li
            key={order.order_no}
            className={`rounded-2xl border p-5 md:p-6 ${isNew ? "border-secondary-400 ring-4 ring-secondary-400/25" : "border-neutral-100"}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 font-heading font-semibold">
                  {order.order_no}
                  <button
                    type="button"
                    aria-label="Copy order number"
                    onClick={() => {
                      void navigator.clipboard?.writeText(order.order_no);
                      toast.success("Order number copied");
                    }}
                    className="cursor-pointer text-neutral-400 hover:text-neutral-950"
                  >
                    <Copy className="size-3.5" />
                  </button>
                  {isNew && <span className="rounded-full bg-secondary-400 px-2 py-0.5 text-[11px] font-medium">New</span>}
                </p>
                <p className="mt-0.5 text-sm text-neutral-500">
                  {new Date(order.createdAt ?? order.payment.paid_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
              <div className="text-right">
                <p className="font-heading text-xl font-bold text-primary-600">{formatPrice(order.total)}</p>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLE[order.status]}`}>
                  {order.status === "paid" && <CheckCircle2 className="size-3" />} {order.status}
                </span>
              </div>
            </div>

            <ul className="mt-4 divide-y divide-neutral-100 border-y border-neutral-100">
              {order.items.map((item) => (
                <li key={item.slug} className="flex items-center gap-3 py-3">
                  <span className="relative aspect-video w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                    {item.thumbnail && <Image src={item.thumbnail} alt="" fill sizes="64px" className="object-cover" {...imageProps(item.thumbnail)} />}
                  </span>
                  <Link href={`/courses/${item.slug}`} className="line-clamp-1 flex-1 text-sm font-medium hover:text-primary-600">
                    {item.title}
                  </Link>
                  <span className="text-sm">{formatPrice(item.price)}</span>
                </li>
              ))}
            </ul>

            <dl className="mt-4 grid gap-x-6 gap-y-1 text-xs text-neutral-500 sm:grid-cols-3">
              <div>
                <dt className="inline">Paid with: </dt>
                <dd className="inline text-neutral-950">
                  {PAYMENT_METHOD_LABELS[order.payment.method]} {order.payment.account && `(${order.payment.account})`}
                </dd>
              </div>
              <div>
                <dt className="inline">Transaction: </dt>
                <dd className="inline font-mono text-neutral-950">{order.payment.transaction_id}</dd>
              </div>
              <div>
                <dt className="inline">Billed to: </dt>
                <dd className="inline text-neutral-950">{order.customer.email}</dd>
              </div>
            </dl>
          </li>
        );
      })}
    </ul>
  );
}
