"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { ApiClientError } from "@/app/lib/apiClient";
import { useAuthStore } from "@/store/authStore";
import AuthField, { StrengthMeter } from "./AuthField";

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Mirrors the server rules in user.service.ts. */
const validate = (v: { name: string; email: string; password: string }) => {
  const e: Record<string, string> = {};
  if (v.name.trim().length < 2) e.name = "Enter your full name";
  if (!EMAIL_RX.test(v.email.trim())) e.email = "Enter a valid email address";
  if (v.password.length < 8) e.password = "At least 8 characters";
  else if (!/[A-Za-z]/.test(v.password) || !/\d/.test(v.password)) e.password = "Use at least one letter and one number";
  return e;
};

export default function RegisterForm({ next }: { next: string }) {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const [values, setValues] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      const user = await register(values.name.trim(), values.email.trim(), values.password);
      toast.success(`Welcome to ByteSpace, ${user.name.split(" ")[0]}! 🎉`);
      router.replace(next);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setErrors(err.errors ?? {});
        setFormError(err.errors && Object.keys(err.errors).length ? null : err.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      <p className="text-lg text-primary-600">Create an Account</p>
      <h2 className="mt-1 font-heading text-[clamp(2rem,1.4rem+2vw,2.75rem)] leading-[1.15] font-semibold text-neutral-950">
        Welcome to ByteSpace
      </h2>

      {formError && (
        <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {formError}
        </p>
      )}

      <div className="mt-8 space-y-5 md:mt-12">
        <AuthField id="name" label="Full Name" autoComplete="name" placeholder="Jamie Davis" value={values.name} error={errors.name} onChange={set("name")} />
        <AuthField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="designer@example.com"
          value={values.email}
          error={errors.email}
          onChange={set("email")}
        />
        <AuthField
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="********"
          value={values.password}
          error={errors.password}
          hint={<StrengthMeter password={values.password} />}
          onChange={set("password")}
        />
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-[46px] cursor-pointer items-center gap-2 rounded-full bg-secondary-400 px-6 text-lg font-medium text-neutral-950 transition-colors hover:bg-secondary-300 disabled:cursor-wait disabled:opacity-70"
        >
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {busy ? "Creating account…" : "Continue"}
        </button>
      </div>

      <p className="mt-6 text-xs leading-relaxed text-neutral-500">
        By continuing you agree to our Terms of Service and Privacy Policy. You can add a photo, headline and bio from
        your profile later.
      </p>

      <p className="mt-10 text-center text-neutral-500">
        Already have an account?{" "}
        <Link href={`/login${next !== "/profile" ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-primary-600 hover:underline">
          Login
        </Link>
      </p>
    </form>
  );
}
