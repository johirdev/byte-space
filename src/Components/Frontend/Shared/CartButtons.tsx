"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, CircleCheck, ShoppingBag } from "lucide-react";
import { toast } from "react-toastify";
import { useCartStore, toCartItem, MAX_CART_ITEMS } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import type { ICourse } from "@/app/types";

type CartCourse = Parameters<typeof toCartItem>[0];

/** Adds to the cart with feedback; returns false when it couldn't. */
export function useAddToCart() {
  const add = useCartStore((s) => s.add);
  const router = useRouter();

  return (course: CartCourse, opts: { silent?: boolean } = {}) => {
    const result = add(toCartItem(course));
    if (result === "full") {
      toast.error(`Your cart can hold up to ${MAX_CART_ITEMS} courses`);
      return false;
    }
    if (result === "added" && !opts.silent) {
      toast.success(
        <span>
          <strong>{course.title}</strong> added to cart ·{" "}
          <button type="button" className="font-semibold text-primary-600 underline" onClick={() => router.push("/cart")}>
            View cart
          </button>
        </span>,
      );
    }
    return true;
  };
}

/** Round icon button for course cards (sits above the card's stretched link). */
export function CardCartButton({ course }: { course: CartCourse }) {
  const inCart = useCartStore((s) => s.items.some((i) => i._id === String(course._id)));
  const hydrated = useCartStore((s) => s.hydrated);
  const enrolled = useAuthStore((s) => s.isEnrolled(String(course._id)));
  const addToCart = useAddToCart();
  const router = useRouter();

  if (enrolled) {
    return (
      <span
        className="relative z-10 inline-flex h-8 items-center gap-1 rounded-full bg-primary-50 px-3 text-xs font-medium text-primary-600"
        title="You own this course"
      >
        <CircleCheck className="size-3.5" aria-hidden="true" /> Enrolled
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => (inCart ? router.push("/cart") : addToCart(course))}
      aria-label={inCart ? `${course.title} is in your cart — view cart` : `Add ${course.title} to cart`}
      title={inCart ? "In cart — view cart" : "Add to cart"}
      className={`relative z-10 grid size-9 cursor-pointer place-items-center rounded-full border transition-colors ${
        hydrated && inCart
          ? "border-secondary-400 bg-secondary-400 text-neutral-950"
          : "border-neutral-200 bg-white text-neutral-950 hover:border-neutral-950"
      }`}
    >
      {hydrated && inCart ? <Check className="size-4" aria-hidden="true" /> : <ShoppingBag className="size-4" aria-hidden="true" />}
    </button>
  );
}

/** Primary + secondary CTAs on the course details side card. */
export function EnrollActions({ course }: { course: ICourse }) {
  const router = useRouter();
  const id = String(course._id);
  const inCart = useCartStore((s) => s.items.some((i) => i._id === id));
  const enrolled = useAuthStore((s) => s.isEnrolled(id));
  const addToCart = useAddToCart();

  if (enrolled) {
    return (
      <div className="mt-5 space-y-3">
        <p className="flex items-center gap-2 rounded-xl bg-primary-50 px-4 py-3 text-sm text-primary-700">
          <CircleCheck className="size-4 shrink-0" aria-hidden="true" /> You&apos;re enrolled in this course
        </p>
        <Link
          href="/profile?tab=courses"
          className="flex h-[46px] w-full items-center justify-center rounded-full bg-secondary-400 font-medium text-neutral-950 transition-colors hover:bg-secondary-300"
        >
          Go to my courses
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-3">
      <button
        type="button"
        onClick={() => {
          if (addToCart(course, { silent: true })) router.push("/checkout");
        }}
        className="h-[46px] w-full cursor-pointer rounded-full bg-secondary-400 font-medium text-neutral-950 transition-colors hover:bg-secondary-300"
      >
        {course.price === 0 ? "Enroll for Free" : "Enroll Now"}
      </button>
      <button
        type="button"
        onClick={() => (inCart ? router.push("/cart") : addToCart(course))}
        className="flex h-[46px] w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-neutral-200 font-medium text-neutral-950 transition-colors hover:border-neutral-950"
      >
        {inCart ? <Check className="size-4" aria-hidden="true" /> : <ShoppingBag className="size-4" aria-hidden="true" />}
        {inCart ? "In cart — view cart" : "Add to Cart"}
      </button>
    </div>
  );
}
