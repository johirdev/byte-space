"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { ApiClientError } from "@/app/lib/apiClient";
import { useAuthStore } from "@/store/authStore";
import AuthField from "./AuthField";

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="size-8" aria-hidden="true">
    <path
      fill="currentColor"
      d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07Z"
    />
  </svg>
);

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="size-8" aria-hidden="true">
    <path
      fill="currentColor"
      d="M21.35 10.04H12v3.92h5.35c-.5 2.5-2.62 3.92-5.35 3.92a5.88 5.88 0 1 1 3.9-10.28l2.93-2.93A9.8 9.8 0 1 0 12 21.8c4.9 0 9.35-3.56 9.35-9.8 0-.66-.1-1.3-.2-1.96H21.35Z"
    />
  </svg>
);

export default function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found: Record<string, string> = {};
    if (!EMAIL_RX.test(email.trim())) found.email = "Enter a valid email address";
    if (!password) found.password = "Enter your password";
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      const user = await login(email.trim(), password);
      toast.success(`Welcome back, ${user.name.split(" ")[0]}!`);
      router.replace(next);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setErrors(err.errors ?? {});
        setFormError(err.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
      setBusy(false);
    }
  };

  const social = (provider: string) => toast.info(`${provider} sign-in is coming soon — use your email for now.`);

  return (
    <form onSubmit={submit} noValidate>
      <p className="text-lg text-primary-600">Sign In</p>
      <h2 className="mt-1 font-heading text-[clamp(2rem,1.4rem+2vw,2.75rem)] leading-[1.15] font-semibold text-neutral-950">
        Welcome Back
      </h2>

      {formError && (
        <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {formError}
        </p>
      )}

      <div className="mt-8 space-y-5 md:mt-12">
        <AuthField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="designer@example.com"
          value={email}
          error={errors.email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <AuthField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="********"
          value={password}
          error={errors.password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-[46px] cursor-pointer items-center gap-2 rounded-full bg-secondary-400 px-6 text-lg font-medium text-neutral-950 transition-colors hover:bg-secondary-300 disabled:cursor-wait disabled:opacity-70"
        >
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {busy ? "Signing in…" : "Sign In"}
        </button>
      </div>

      <div className="mt-10 flex items-center gap-3 text-neutral-400">
        <span className="h-px flex-1 bg-neutral-200" />
        or
        <span className="h-px flex-1 bg-neutral-200" />
      </div>

      <div className="mt-8 flex justify-center gap-4">
        {[
          { name: "Facebook", icon: <FacebookIcon /> },
          { name: "Google", icon: <GoogleIcon /> },
        ].map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => social(p.name)}
            aria-label={`Continue with ${p.name}`}
            className="grid size-[72px] cursor-pointer place-items-center rounded-2xl border border-neutral-200 text-neutral-950 transition-colors hover:border-neutral-950"
          >
            {p.icon}
          </button>
        ))}
      </div>

      <p className="mt-12 text-center text-neutral-500">
        New user?{" "}
        <Link href={`/register${next !== "/profile" ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-primary-600 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
