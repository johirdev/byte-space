"use client";

import { useContext, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  TriangleAlert,
  UserPlus,
} from "lucide-react";
import { AuthContext } from "@/app/dashboard/AuthProvider";
import { apiRequest, ApiClientError } from "@/app/lib/apiClient";

type Mode = "signin" | "bootstrap";

export default function LoginAdmin() {
  const { loginAdmin } = useContext(AuthContext);

  const [mode, setMode] = useState<Mode>("signin");
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    admin_name: "",
    admin_email: "",
    admin_phone: "",
    admin_password: "",
  });

  const set = (key: keyof typeof form) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // A database with no admins yet gets the owner-account form instead.
  useEffect(() => {
    let cancelled = false;

    apiRequest<{ needsBootstrap: boolean }>("/admins/login")
      .then(({ data }) => {
        if (!cancelled && data?.needsBootstrap) setMode("bootstrap");
      })
      .catch(() => {
        /* fall back to the normal sign-in form */
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setMessage(null);
    setErrors({});

    try {
      if (mode === "bootstrap") {
        await apiRequest("/admins", { method: "POST", body: form });
        setMode("signin");
        setMessage("Owner account created — sign in with those details.");
        setForm((prev) => ({ ...prev, admin_password: "" }));
        return;
      }

      const { data } = await apiRequest<{ access_token: string }>("/admins/login", {
        method: "POST",
        body: {
          admin_email: form.admin_email,
          admin_password: form.admin_password,
        },
      });

      if (data?.access_token) loginAdmin(data.access_token);
      else setMessage("Sign-in succeeded but no session was returned.");
    } catch (err) {
      if (err instanceof ApiClientError) {
        setErrors(err.errors ?? {});
        setMessage(err.message);
      } else {
        setMessage("Something went wrong. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  const isBootstrap = mode === "bootstrap";

  return (
    <div
      className="admin-root grid min-h-screen place-items-center px-5 py-10"
      style={{ background: "var(--a-bg)" }}
    >
      {/* Backdrop */}
      <div
        className="pointer-events-none fixed inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(60% 45% at 20% 10%, rgba(124,92,255,.22), transparent 70%), radial-gradient(50% 40% at 85% 85%, rgba(31,224,160,.14), transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-[430px]">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-[0.82rem] font-medium transition-opacity hover:opacity-75"
          style={{ color: "var(--a-text-3)" }}
        >
          <ArrowLeft size={15} />
          Back to site
        </Link>

        <div className="a-card a-card--pad !p-7 md:!p-9">
          <header className="mb-7 flex flex-col items-start gap-4">
            <span
              className="grid h-12 w-12 place-items-center rounded-[14px] text-white"
              style={{ background: "linear-gradient(135deg,#8f6dff,#6234e8)" }}
            >
              {isBootstrap ? <UserPlus size={22} /> : <ShieldCheck size={22} />}
            </span>

            <div>
              <h1 className="a-page-head__title !text-[1.35rem]">
                {isBootstrap ? "Create the owner account" : "Admin sign in"}
              </h1>
              <p className="a-page-head__sub">
                {isBootstrap
                  ? "No admins exist yet. This first account becomes the superadmin — nobody else can be created until it exists."
                  : "Manage services, case studies, pricing, leads and everything else the site shows."}
              </p>
            </div>
          </header>

          {message && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2.5 rounded-[10px] border p-3"
              style={{
                borderColor: "rgba(245,72,76,.3)",
                background: "var(--a-coral-tint)",
              }}
            >
              <TriangleAlert
                size={16}
                className="mt-0.5 shrink-0"
                style={{ color: "#ff8a8d" }}
              />
              <p className="text-[0.82rem]" style={{ color: "#ff8a8d" }}>
                {message}
              </p>
            </div>
          )}

          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
            {isBootstrap && (
              <>
                <TextField
                  id="admin_name"
                  label="Full name"
                  required
                  value={form.admin_name}
                  onChange={set("admin_name")}
                  error={errors.admin_name}
                  placeholder="Anamul Hasan Nafi"
                  autoComplete="name"
                />
                <TextField
                  id="admin_phone"
                  label="Phone (Bangladesh)"
                  required
                  value={form.admin_phone}
                  onChange={set("admin_phone")}
                  error={errors.admin_phone}
                  placeholder="01712345678"
                  autoComplete="tel"
                />
              </>
            )}

            <TextField
              id="admin_email"
              label="Email"
              type="email"
              required
              icon={Mail}
              value={form.admin_email}
              onChange={set("admin_email")}
              error={errors.admin_email}
              placeholder="you@example.com"
              autoComplete="email"
            />

            <div className="a-field">
              <label className="a-label" htmlFor="admin_password">
                Password<span className="req">*</span>
              </label>

              <div className="relative">
                <Lock
                  size={15}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--a-text-3)" }}
                  aria-hidden="true"
                />
                <input
                  id="admin_password"
                  type={showPassword ? "text" : "password"}
                  className="a-input !pl-10 !pr-10"
                  value={form.admin_password}
                  onChange={(e) => set("admin_password")(e.target.value)}
                  aria-invalid={Boolean(errors.admin_password)}
                  autoComplete={isBootstrap ? "new-password" : "current-password"}
                  placeholder={isBootstrap ? "At least 8 characters" : "••••••••"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--a-text-3)" }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {errors.admin_password && (
                <p className="a-error">{errors.admin_password}</p>
              )}
            </div>

            <button
              type="submit"
              className="a-btn a-btn--primary a-btn--block !py-3 !text-[0.88rem]"
              disabled={busy || checking}
            >
              {busy ? (
                <>
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                    aria-hidden="true"
                  />
                  {isBootstrap ? "Creating…" : "Signing in…"}
                </>
              ) : (
                <>
                  {isBootstrap ? "Create owner account" : "Sign in"}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {!isBootstrap && (
            <p
              className="mt-6 text-center text-[0.76rem] leading-relaxed"
              style={{ color: "var(--a-text-3)" }}
            >
              Five failed attempts locks the account for an hour and blocks the IP for
              six. Ask a superadmin to reset your password if that happens.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  error,
  required,
  type = "text",
  placeholder,
  autoComplete,
  icon: Icon,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  icon?: typeof Mail;
}) {
  return (
    <div className="a-field">
      <label className="a-label" htmlFor={id}>
        {label}
        {required && <span className="req">*</span>}
      </label>

      <div className="relative">
        {Icon && (
          <Icon
            size={15}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
            style={{ color: "var(--a-text-3)" }}
            aria-hidden="true"
          />
        )}
        <input
          id={id}
          type={type}
          className={`a-input ${Icon ? "!pl-10" : ""}`}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>

      {error && <p className="a-error">{error}</p>}
    </div>
  );
}
