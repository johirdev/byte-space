"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CreditCard, Info, Loader2, Lock, ShieldCheck, ShoppingBag, Smartphone, Wallet } from "lucide-react";
import { toast } from "react-toastify";
import { apiRequest, ApiClientError } from "@/app/lib/apiClient";
import { PAYMENT_METHOD_LABELS, type IOrder, type PaymentMethod } from "@/app/types";
import { useCartStore, cartTotal } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { useCartSync } from "@/hooks/useCartSync";
import PageHero from "../../Shared/PageHero";
import UserAvatar from "../../Shared/UserAvatar";
import { formatPrice, imageProps } from "../../utils/course";

type Errors = Record<string, string>;

const METHODS: { id: PaymentMethod; icon: typeof CreditCard; tint: string; note: string }[] = [
  { id: "card", icon: CreditCard, tint: "bg-primary-50 text-primary-600", note: "Visa, Mastercard, Amex" },
  { id: "bkash", icon: Smartphone, tint: "bg-pink-50 text-pink-600", note: "Mobile wallet" },
  { id: "nagad", icon: Smartphone, tint: "bg-orange-50 text-orange-600", note: "Mobile wallet" },
  { id: "rocket", icon: Smartphone, tint: "bg-purple-50 text-purple-600", note: "Mobile wallet" },
  { id: "paypal", icon: Wallet, tint: "bg-sky-50 text-sky-600", note: "Pay with your PayPal" },
];

const digits = (v: string) => v.replace(/\D/g, "");
const formatCard = (v: string) => digits(v).slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");
const formatExpiry = (v: string) => {
  const d = digits(v).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};
const luhn = (num: string) => {
  let sum = 0;
  let dbl = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let d = Number(num[i]);
    if (dbl && (d *= 2) > 9) d -= 9;
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
};

/** Same rules as processDemoPayment() on the server. */
function validate(method: PaymentMethod, f: Record<string, string>, free: boolean): Errors {
  if (free) return {};
  const e: Errors = {};
  if (method === "card") {
    const n = digits(f.cardNumber);
    if (!f.cardName.trim()) e["card.name"] = "Name on card is required";
    if (n.length < 13 || !luhn(n)) e["card.number"] = "Enter a valid card number";
    const m = f.expiry.match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
    if (!m || new Date(2000 + Number(m[2]), Number(m[1]), 1) <= new Date()) e["card.expiry"] = "Enter a future date (MM/YY)";
    if (!/^\d{3,4}$/.test(f.cvc)) e["card.cvc"] = "3 or 4 digits";
  } else if (method === "paypal") {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.paypal.trim())) e["paypal.email"] = "Enter your PayPal email";
  } else {
    if (!/^01[3-9]\d{8}$/.test(digits(f.wallet))) e["wallet.number"] = "Use a number like 01XXXXXXXXX";
    if (!/^\d{4,6}$/.test(f.pin)) e["wallet.pin"] = "PIN is 4–6 digits";
  }
  return e;
}

export default function Checkout() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const removeMany = useCartStore((s) => s.removeMany);
  const user = useAuthStore((s) => s.user);
  const { ready } = useCartSync();

  const [method, setMethod] = useState<PaymentMethod>("card");
  const [form, setForm] = useState({ cardNumber: "", cardName: "", expiry: "", cvc: "", wallet: "", pin: "", paypal: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [paying, setPaying] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const total = cartTotal(items);
  const free = total === 0;

  const set = (key: keyof typeof form, value: string, errorKey: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[errorKey]) setErrors((e) => ({ ...e, [errorKey]: "" }));
  };

  const pay = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const found = validate(method, form, free);
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;

    setPaying(true);
    try {
      const { data, message } = await apiRequest<IOrder>("/checkout", {
        method: "POST",
        auth: "user",
        body: {
          courses: items.map((i) => i._id),
          payment_method: method,
          card: method === "card" ? { number: digits(form.cardNumber), name: form.cardName.trim(), expiry: form.expiry, cvc: form.cvc } : undefined,
          wallet: ["bkash", "nagad", "rocket"].includes(method) ? { number: digits(form.wallet), pin: form.pin } : undefined,
          paypal: method === "paypal" ? { email: form.paypal.trim() } : undefined,
        },
      });

      removeMany(data.items.map((i) => String(typeof i.course === "object" ? i.course._id : i.course)));
      await useAuthStore.getState().load();
      toast.success(message);
      router.push(`/profile?tab=courses&order=${encodeURIComponent(data.order_no)}`);
    } catch (err) {
      setPaying(false);
      if (!(err instanceof ApiClientError)) {
        setFormError("Payment could not be completed. Please try again.");
        return;
      }
      // Stale cart: owned or unpublished courses — drop them so the learner can retry.
      if (err.status === 409 && err.errors?.courses) {
        removeMany(err.errors.courses.split(","));
        toast.info("We removed courses you can't buy right now. Review your order and pay again.");
      }
      setErrors(err.errors ?? {});
      setFormError(err.message);
      if (err.status === 401) router.push("/login?next=/checkout");
    }
  };

  if (ready && items.length === 0 && !paying) {
    return (
      <main>
        <PageHero title="Checkout" crumbs={[{ label: "Home", href: "/" }, { label: "Cart", href: "/cart" }, { label: "Checkout" }]} />
        <div className="container-site flex flex-col items-center py-20 text-center">
          <ShoppingBag className="size-10 text-neutral-300" />
          <h2 className="mt-4 font-heading text-2xl font-semibold">Nothing to check out</h2>
          <p className="mt-2 text-neutral-500">Your cart is empty.</p>
          <Link href="/courses" className="mt-6 inline-flex h-12 items-center rounded-full bg-secondary-400 px-7 font-medium hover:bg-secondary-300">
            Browse courses
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main>
      <PageHero
        title="Checkout"
        subtitle="One payment, lifetime access to every course in your cart."
        crumbs={[{ label: "Home", href: "/" }, { label: "Cart", href: "/cart" }, { label: "Checkout" }]}
      />

      <form onSubmit={pay} noValidate className="container-site grid items-start gap-8 py-10 md:py-16 lg:grid-cols-12 lg:gap-10">
        <div className="space-y-6 lg:col-span-7">
          {/* Account */}
          <section className="rounded-2xl border border-neutral-100 p-5 md:p-6">
            <h2 className="font-heading text-lg font-semibold">1. Your account</h2>
            {user ? (
              <div className="mt-4 flex items-center gap-3 rounded-xl bg-neutral-50 p-3">
                <UserAvatar name={user.name} src={user.avatar} size={44} />
                <div className="min-w-0">
                  <p className="truncate font-medium">{user.name}</p>
                  <p className="truncate text-sm text-neutral-500">{user.email}</p>
                </div>
                <span className="ml-auto hidden text-xs text-neutral-500 sm:block">Courses will be added to this account</span>
              </div>
            ) : (
              <div className="mt-4 h-[68px] animate-pulse rounded-xl bg-neutral-50" />
            )}
          </section>

          {/* Payment */}
          <section className="rounded-2xl border border-neutral-100 p-5 md:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-heading text-lg font-semibold">2. Payment method</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary-100 px-2.5 py-1 text-xs font-medium text-neutral-950">
                Demo mode
              </span>
            </div>

            {free ? (
              <p className="mt-4 rounded-xl bg-primary-50 p-4 text-sm text-primary-700">
                Everything in your cart is free — no payment details needed.
              </p>
            ) : (
              <>
                <div role="radiogroup" aria-label="Payment method" className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {METHODS.map((m) => {
                    const active = method === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => {
                          setMethod(m.id);
                          setErrors({});
                        }}
                        className={`flex cursor-pointer flex-col items-start gap-2 rounded-xl border p-3 text-left transition-all ${
                          active ? "border-primary-600 ring-4 ring-primary-600/10" : "border-neutral-200 hover:border-neutral-400"
                        }`}
                      >
                        <span className={`grid size-9 place-items-center rounded-lg ${m.tint}`}>
                          <m.icon className="size-[18px]" />
                        </span>
                        <span className="text-sm font-medium text-neutral-950">{PAYMENT_METHOD_LABELS[m.id]}</span>
                        <span className="text-[11px] text-neutral-500">{m.note}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {method === "card" && (
                    <>
                      <Input
                        id="cardNumber"
                        label="Card number"
                        span
                        inputMode="numeric"
                        autoComplete="cc-number"
                        placeholder="4242 4242 4242 4242"
                        value={form.cardNumber}
                        error={errors["card.number"]}
                        onChange={(v) => set("cardNumber", formatCard(v), "card.number")}
                      />
                      <Input
                        id="cardName"
                        label="Name on card"
                        span
                        autoComplete="cc-name"
                        placeholder={user?.name ?? "Jamie Davis"}
                        value={form.cardName}
                        error={errors["card.name"]}
                        onChange={(v) => set("cardName", v, "card.name")}
                      />
                      <Input
                        id="expiry"
                        label="Expiry"
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        placeholder="MM/YY"
                        value={form.expiry}
                        error={errors["card.expiry"]}
                        onChange={(v) => set("expiry", formatExpiry(v), "card.expiry")}
                      />
                      <Input
                        id="cvc"
                        label="CVC"
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        placeholder="123"
                        value={form.cvc}
                        error={errors["card.cvc"]}
                        onChange={(v) => set("cvc", digits(v).slice(0, 4), "card.cvc")}
                      />
                      <p className="flex items-start gap-2 rounded-xl bg-neutral-50 p-3 text-xs text-neutral-500 sm:col-span-2">
                        <Info className="size-4 shrink-0 text-primary-600" />
                        <span>
                          Test card <strong className="text-neutral-950">4242 4242 4242 4242</strong>, any future date and CVC.{" "}
                          <strong className="text-neutral-950">4000 0000 0000 0002</strong> is always declined.
                        </span>
                      </p>
                    </>
                  )}

                  {["bkash", "nagad", "rocket"].includes(method) && (
                    <>
                      <Input
                        id="wallet"
                        label={`${PAYMENT_METHOD_LABELS[method]} number`}
                        inputMode="tel"
                        placeholder="01XXXXXXXXX"
                        value={form.wallet}
                        error={errors["wallet.number"]}
                        onChange={(v) => set("wallet", digits(v).slice(0, 11), "wallet.number")}
                      />
                      <Input
                        id="pin"
                        label="PIN"
                        type="password"
                        inputMode="numeric"
                        placeholder="••••"
                        value={form.pin}
                        error={errors["wallet.pin"]}
                        onChange={(v) => set("pin", digits(v).slice(0, 6), "wallet.pin")}
                      />
                      <p className="flex items-start gap-2 rounded-xl bg-neutral-50 p-3 text-xs text-neutral-500 sm:col-span-2">
                        <Info className="size-4 shrink-0 text-primary-600" />
                        Demo: any valid Bangladeshi number and a 4–6 digit PIN. The PIN is never stored.
                      </p>
                    </>
                  )}

                  {method === "paypal" && (
                    <Input
                      id="paypal"
                      label="PayPal email"
                      type="email"
                      span
                      autoComplete="email"
                      placeholder={user?.email ?? "you@example.com"}
                      value={form.paypal}
                      error={errors["paypal.email"]}
                      onChange={(v) => set("paypal", v, "paypal.email")}
                    />
                  )}
                </div>
              </>
            )}
          </section>
        </div>

        {/* Summary */}
        <aside className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-card lg:sticky lg:top-6 lg:col-span-5">
          <h2 className="font-heading text-lg font-semibold">Order summary</h2>

          {!ready ? (
            <div className="mt-4 space-y-3">
              {[0, 1].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-neutral-50" />
              ))}
            </div>
          ) : (
            <ul className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-1">
              {items.map((item) => (
                <li key={item._id} className="flex items-center gap-3">
                  <span className="relative aspect-video w-20 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                    {item.thumbnail && <Image src={item.thumbnail} alt="" fill sizes="80px" className="object-cover" {...imageProps(item.thumbnail)} />}
                  </span>
                  <span className="line-clamp-2 flex-1 text-sm font-medium">{item.title}</span>
                  <span className="shrink-0 text-sm font-semibold">{formatPrice(item.price)}</span>
                </li>
              ))}
            </ul>
          )}

          <dl className="mt-5 space-y-2 border-t border-neutral-100 pt-5 text-sm">
            <div className="flex justify-between text-neutral-500">
              <dt>Subtotal</dt>
              <dd className="text-neutral-950">{formatPrice(total)}</dd>
            </div>
            <div className="flex items-baseline justify-between pt-2">
              <dt className="font-medium">Total</dt>
              <dd className="font-heading text-2xl font-bold text-primary-600">{formatPrice(total)}</dd>
            </div>
          </dl>

          {formError && (
            <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={!ready || paying || items.length === 0}
            className="mt-6 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-secondary-400 font-medium text-neutral-950 transition-colors hover:bg-secondary-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {paying ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
            {paying ? "Processing payment…" : free ? "Enroll for free" : `Pay ${formatPrice(total)}`}
            {!paying && <ArrowRight className="size-4" />}
          </button>

          <p className="mt-4 flex items-start gap-2 text-xs text-neutral-500">
            <ShieldCheck className="size-4 shrink-0 text-primary-600" />
            Demo payment — nothing is charged. Card numbers are validated and only the last 4 digits are kept.
          </p>
        </aside>
      </form>
    </main>
  );
}

function Input({
  id,
  label,
  value,
  onChange,
  error,
  span,
  ...rest
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  span?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return (
    <div className={span ? "sm:col-span-2" : ""}>
      <label htmlFor={id} className="mb-1.5 block text-sm text-neutral-950">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        className={`h-12 w-full rounded-xl border px-4 text-base outline-none focus:border-primary-600 focus:ring-4 focus:ring-primary-600/10 ${
          error ? "border-red-400" : "border-neutral-200"
        }`}
        {...rest}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
