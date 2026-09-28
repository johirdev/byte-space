"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock, ShieldCheck, ShoppingBag, Trash2, Undo2 } from "lucide-react";
import { toast } from "react-toastify";
import { useCartStore, cartTotal, type CartItem } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { useCartSync } from "@/hooks/useCartSync";
import PageHero from "../../Shared/PageHero";
import { LevelIcon } from "../../Card/CoursesCard";
import { formatDuration, formatPrice, imageProps } from "../../utils/course";

export default function Cart() {
  const items = useCartStore((s) => s.items);
  const remove = useCartStore((s) => s.remove);
  const clear = useCartStore((s) => s.clear);
  const add = useCartStore((s) => s.add);
  const status = useAuthStore((s) => s.status);
  const { ready } = useCartSync();

  const total = cartTotal(items);
  const count = items.length;

  const removeWithUndo = (item: CartItem) => {
    remove(item._id);
    toast(
      ({ closeToast }) => (
        <span className="flex items-center justify-between gap-3">
          <span>
            Removed <strong>{item.title}</strong>
          </span>
          <button
            type="button"
            className="inline-flex shrink-0 items-center gap-1 font-semibold text-primary-600"
            onClick={() => {
              const { added_at: _t, ...rest } = item;
              void _t;
              add(rest);
              closeToast();
            }}
          >
            <Undo2 className="size-4" /> Undo
          </button>
        </span>
      ),
      { autoClose: 5000 },
    );
  };

  return (
    <main>
      <PageHero
        title="Your Cart"
        subtitle={ready ? `${count} course${count === 1 ? "" : "s"} ready to enroll` : "Loading your cart…"}
        crumbs={[{ label: "Home", href: "/" }, { label: "Courses", href: "/courses" }, { label: "Cart" }]}
      />

      <section className="container-site py-10 md:py-16">
        {!ready ? (
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-8">
              {[0, 1].map((i) => (
                <div key={i} className="h-36 animate-pulse rounded-2xl bg-neutral-50" />
              ))}
            </div>
            <div className="h-64 animate-pulse rounded-2xl bg-neutral-50 lg:col-span-4" />
          </div>
        ) : count === 0 ? (
          <div className="mx-auto flex max-w-md flex-col items-center py-10 text-center">
            <span className="grid size-20 place-items-center rounded-full bg-secondary-100">
              <ShoppingBag className="size-9 text-neutral-950" aria-hidden="true" />
            </span>
            <h2 className="mt-6 font-heading text-2xl font-semibold">Your cart is empty</h2>
            <p className="mt-2 text-neutral-500">Add a few courses and enroll in all of them in one checkout.</p>
            <Link
              href="/courses"
              className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-secondary-400 px-7 font-medium text-neutral-950 hover:bg-secondary-300"
            >
              Browse courses <ArrowRight className="size-4" />
            </Link>
          </div>
        ) : (
          <div className="grid items-start gap-8 lg:grid-cols-12 lg:gap-10">
            {/* Items */}
            <div className="lg:col-span-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-heading text-lg font-semibold">
                  {count} course{count > 1 ? "s" : ""} in cart
                </h2>
                <button type="button" onClick={clear} className="cursor-pointer text-sm text-neutral-500 hover:text-red-600">
                  Clear cart
                </button>
              </div>

              <ul className="space-y-4">
                {items.map((item) => (
                  <li key={item._id} className="flex gap-4 rounded-2xl border border-neutral-100 bg-white p-3 transition-shadow hover:shadow-card sm:p-4">
                    <Link href={`/courses/${item.slug}`} className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-xl bg-neutral-100 sm:w-44">
                      {item.thumbnail && (
                        <Image src={item.thumbnail} alt="" fill sizes="176px" className="object-cover" {...imageProps(item.thumbnail)} />
                      )}
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link href={`/courses/${item.slug}`} className="line-clamp-2 font-heading font-semibold text-neutral-950 hover:text-primary-600">
                            {item.title}
                          </Link>
                          <p className="mt-0.5 text-xs text-neutral-500">
                            by <span className="text-primary-600">{item.creator || "ByteSpace"}</span>
                          </p>
                        </div>
                        <p className="shrink-0 font-heading text-lg font-bold text-primary-600">{formatPrice(item.price)}</p>
                      </div>
                      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500">
                          <span className="inline-flex items-center gap-1.5">
                            <LevelIcon level={item.level} className="text-neutral-950" /> {item.level}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <BookOpen className="size-3.5" /> {item.total_lessons} lessons
                          </span>
                          <span className="hidden items-center gap-1.5 sm:inline-flex">
                            <Clock className="size-3.5" /> {formatDuration(item.total_duration)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeWithUndo(item)}
                          className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-red-600"
                          aria-label={`Remove ${item.title}`}
                        >
                          <Trash2 className="size-4" /> Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <Link href="/courses" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:underline">
                ← Keep browsing
              </Link>
            </div>

            {/* Summary */}
            <aside className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-card lg:sticky lg:top-6 lg:col-span-4">
              <h2 className="font-heading text-lg font-semibold">Order summary</h2>
              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between text-neutral-500">
                  <dt>
                    Subtotal ({count} item{count > 1 ? "s" : ""})
                  </dt>
                  <dd className="text-neutral-950">{formatPrice(total)}</dd>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <dt>Access</dt>
                  <dd className="text-neutral-950">Lifetime</dd>
                </div>
                <div className="flex items-baseline justify-between border-t border-neutral-100 pt-4">
                  <dt className="font-medium text-neutral-950">Total</dt>
                  <dd className="font-heading text-2xl font-bold text-primary-600">{formatPrice(total)}</dd>
                </div>
              </dl>

              <Link
                href={status === "authenticated" ? "/checkout" : "/login?next=/checkout"}
                className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-secondary-400 font-medium text-neutral-950 transition-colors hover:bg-secondary-300"
              >
                {status === "authenticated" ? "Proceed to checkout" : "Sign in to checkout"} <ArrowRight className="size-4" />
              </Link>
              {status !== "authenticated" && (
                <p className="mt-3 text-center text-xs text-neutral-500">
                  New here?{" "}
                  <Link href="/register?next=/checkout" className="text-primary-600 hover:underline">
                    Create a free account
                  </Link>
                </p>
              )}

              <p className="mt-6 flex items-start gap-2 rounded-xl bg-neutral-50 p-3 text-xs text-neutral-500">
                <ShieldCheck className="size-4 shrink-0 text-primary-600" />
                Demo checkout — no real money is charged. Your cart is saved on this device.
              </p>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
