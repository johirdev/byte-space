"use client";

import { useCallback, useContext, useEffect, useState } from "react";
import Image from "next/image";
import { DollarSign, Eye, Receipt, RefreshCw, Search, ShoppingCart, TriangleAlert, Undo2 } from "lucide-react";
import { toast } from "react-toastify";
import { AuthContext } from "@/app/dashboard/AuthProvider";
import { apiRequest, ApiClientError } from "@/app/lib/apiClient";
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS, type ApiMeta, type IOrder } from "@/app/types";
import PageHeader, { StatTile } from "../kit/PageHeader";
import AdminPagination from "../kit/AdminPagination";
import Drawer from "../kit/Drawer";
import { Avatar, DateCell, Money } from "../kit/cells";
import DeleteModal from "@/Layout/DeleteModal/DeleteModal";

type Payload = { orders: IOrder[]; summary: { revenue: number; orders: number } };

export default function OrderList({ initialQuery = "" }: { initialQuery?: string }) {
  const { token, can } = useContext(AuthContext);
  const [filters, setFilters] = useState({ q: initialQuery, status: "", method: "", page: 1, limit: 20 });
  const [search, setSearch] = useState(initialQuery);
  const [data, setData] = useState<Payload | null>(null);
  const [meta, setMeta] = useState<ApiMeta>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<IOrder | null>(null);
  const [refunding, setRefunding] = useState<IOrder | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<Payload>("/orders", { token, query: filters });
      setData(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not load orders");
    } finally {
      setLoading(false);
    }
  }, [token, filters]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  useEffect(() => {
    if (search === filters.q) return;
    const t = setTimeout(() => setFilters((f) => ({ ...f, q: search, page: 1 })), 350);
    return () => clearTimeout(t);
  }, [search, filters.q]);

  const set = (patch: Partial<typeof filters>) => setFilters((f) => ({ ...f, page: 1, ...patch }));

  const refund = async () => {
    if (!refunding?._id) return;
    setBusy(true);
    try {
      await apiRequest(`/orders/${refunding._id}`, { method: "PATCH", token, body: { status: "refunded" } });
      toast.success(`Order ${refunding.order_no} refunded`);
      setRefunding(null);
      setViewing(null);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Refund failed");
    } finally {
      setBusy(false);
    }
  };

  const rows = data?.orders ?? [];
  const avg = data && data.summary.orders ? data.summary.revenue / data.summary.orders : 0;

  return (
    <>
      <PageHeader
        title="Orders"
        description="Every checkout (demo payments). Refunds revoke the learner's access."
        actions={
          <button type="button" onClick={load} className="a-btn a-btn--ghost" disabled={loading}>
            <RefreshCw size={15} className={loading ? "animate-spin" : undefined} /> Refresh
          </button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <StatTile label="Revenue" value={`$${(data?.summary.revenue ?? 0).toLocaleString()}`} hint="Paid orders matching filters" tone="signal" icon={<DollarSign size={18} />} />
        <StatTile label="Paid orders" value={data?.summary.orders ?? 0} tone="brand" icon={<ShoppingCart size={18} />} />
        <StatTile label="Avg. order" value={`$${avg.toFixed(2)}`} tone="sky" icon={<Receipt size={18} />} />
      </div>

      <div className="a-card a-card--pad mb-4 flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[220px] flex-1">
          <Search size={15} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2" style={{ color: "var(--a-text-3)" }} />
          <input
            className="a-input !pl-10"
            placeholder="Order no, customer, email, transaction or course…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search orders"
          />
        </div>
        <div className="a-seg" role="group" aria-label="Status">
          {[
            ["", "All"],
            ["paid", "Paid"],
            ["refunded", "Refunded"],
          ].map(([value, label]) => (
            <button key={label} type="button" aria-pressed={filters.status === value} onClick={() => set({ status: value })}>
              {label}
            </button>
          ))}
        </div>
        <select className="a-select !w-auto" value={filters.method} onChange={(e) => set({ method: e.target.value })} aria-label="Payment method">
          <option value="">All methods</option>
          {PAYMENT_METHODS.map((m) => (
            <option key={m} value={m}>
              {PAYMENT_METHOD_LABELS[m]}
            </option>
          ))}
        </select>
      </div>

      {loading && !data ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="a-skeleton h-14" />
          ))}
        </div>
      ) : error ? (
        <div className="a-card a-card--pad flex flex-col items-center gap-3 py-12 text-center">
          <TriangleAlert size={22} style={{ color: "#ff8a8d" }} />
          <p style={{ color: "var(--a-text-2)" }}>{error}</p>
          <button type="button" onClick={load} className="a-btn a-btn--ghost">
            Try again
          </button>
        </div>
      ) : !rows.length ? (
        <div className="a-card a-card--pad flex flex-col items-center gap-3 py-14 text-center">
          <Receipt size={24} style={{ color: "var(--a-brand)" }} />
          <p className="font-semibold text-white">No orders found</p>
          <p className="a-page-head__sub !mt-0">Orders appear here when learners check out.</p>
        </div>
      ) : (
        <div className={`a-table-wrap ${loading ? "opacity-60" : ""}`}>
          <table className="a-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Courses</th>
                <th style={{ textAlign: "right" }}>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.order_no}>
                  <td className="whitespace-nowrap">
                    <span className="a-strong">{o.order_no}</span>
                    <span className="block text-[0.72rem]" style={{ color: "var(--a-text-3)" }}>
                      <DateCell value={o.createdAt} />
                    </span>
                  </td>
                  <td style={{ minWidth: 200 }}>
                    <Avatar src={o.customer.avatar} name={o.customer.name} />
                    <span className="ml-[42px] block text-[0.72rem]" style={{ color: "var(--a-text-3)" }}>
                      {o.customer.email}
                    </span>
                  </td>
                  <td style={{ maxWidth: 260 }}>
                    <span className="a-clamp-2 text-[0.8rem]" title={o.items.map((i) => i.title).join(", ")}>
                      <span className="a-badge a-badge--muted mr-1.5">{o.items.length}</span>
                      {o.items.map((i) => i.title).join(", ")}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <Money amount={o.total} />
                  </td>
                  <td className="whitespace-nowrap text-[0.8rem]">
                    {PAYMENT_METHOD_LABELS[o.payment.method]}
                    <span className="block text-[0.72rem]" style={{ color: "var(--a-text-3)" }}>
                      {o.payment.account}
                    </span>
                  </td>
                  <td>
                    <span className={`a-badge ${o.status === "paid" ? "a-badge--signal" : "a-badge--ember"}`}>{o.status}</span>
                  </td>
                  <td>
                    <div className="flex justify-end gap-1.5">
                      <button type="button" className="a-btn a-btn--ghost a-btn--icon" onClick={() => setViewing(o)} aria-label="View order" title="View">
                        <Eye size={14} />
                      </button>
                      {can("superadmin") && o.status === "paid" && (
                        <button type="button" className="a-btn a-btn--danger a-btn--icon" onClick={() => setRefunding(o)} aria-label="Refund" title="Refund">
                          <Undo2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AdminPagination meta={meta} onPage={(page) => setFilters((f) => ({ ...f, page }))} onLimit={(limit) => set({ limit })} />

      <Drawer open={Boolean(viewing)} title={viewing ? `Order ${viewing.order_no}` : "Order"} description={viewing?.customer.email} onClose={() => setViewing(null)}>
        {viewing && (
          <div className="flex flex-col gap-5 text-[0.84rem]">
            <div className="flex items-center justify-between">
              <Avatar src={viewing.customer.avatar} name={viewing.customer.name} />
              <span className={`a-badge ${viewing.status === "paid" ? "a-badge--signal" : "a-badge--ember"}`}>{viewing.status}</span>
            </div>
            <ul className="flex flex-col gap-2">
              {viewing.items.map((item) => (
                <li key={item.slug} className="flex items-center gap-3 rounded-[10px] p-2.5" style={{ background: "var(--a-surface)", border: "1px solid var(--a-line)" }}>
                  <span className="relative h-10 w-16 shrink-0 overflow-hidden rounded-[8px]" style={{ background: "var(--a-panel-2)" }}>
                    {item.thumbnail && <Image src={item.thumbnail} alt="" fill sizes="64px" className="object-cover" unoptimized />}
                  </span>
                  <a href={`/courses/${item.slug}`} target="_blank" rel="noopener noreferrer" className="a-clamp-1 flex-1 text-white hover:underline">
                    {item.title}
                  </a>
                  <Money amount={item.price} />
                </li>
              ))}
            </ul>
            <dl className="grid grid-cols-2 gap-3">
              {[
                ["Total", `$${viewing.total.toFixed(2)}`],
                ["Method", PAYMENT_METHOD_LABELS[viewing.payment.method]],
                ["Account", viewing.payment.account || "—"],
                ["Transaction", viewing.payment.transaction_id],
                ["Paid at", new Date(viewing.payment.paid_at).toLocaleString()],
                ["Customer ID", viewing.customer.user_id],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt style={{ color: "var(--a-text-3)" }}>{k}</dt>
                  <dd className="break-all text-white">{v}</dd>
                </div>
              ))}
            </dl>
            {can("superadmin") && viewing.status === "paid" && (
              <button type="button" className="a-btn a-btn--danger self-start" onClick={() => setRefunding(viewing)}>
                <Undo2 size={15} /> Refund order
              </button>
            )}
          </div>
        )}
      </Drawer>

      <DeleteModal
        open={Boolean(refunding)}
        title="Refund this order?"
        message="The learner loses access to the order's courses. This is a demo — no money moves."
        confirmLabel="Refund"
        busy={busy}
        onCancel={() => setRefunding(null)}
        onConfirm={refund}
      />
    </>
  );
}
