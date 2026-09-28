"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  error?: string;
  hint?: React.ReactNode;
};

/** Labelled input matching the auth design; password fields get a show/hide toggle. */
export default function AuthField({ id, label, error, hint, type = "text", className = "", ...rest }: Props) {
  const [reveal, setReveal] = useState(false);
  const isPassword = type === "password";

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-sm text-neutral-950">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isPassword && reveal ? "text" : type}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`h-[52px] w-full rounded-xl border bg-white px-6 text-base text-neutral-950 transition-[border-color,box-shadow] outline-none placeholder:text-neutral-400 focus:border-primary-600 focus:ring-4 focus:ring-primary-600/10 ${
            error ? "border-red-400 focus:border-red-500 focus:ring-red-500/10" : "border-neutral-200"
          } ${isPassword ? "pr-14" : ""}`}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            aria-label={reveal ? "Hide password" : "Show password"}
            className="absolute top-1/2 right-4 grid size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-50 hover:text-neutral-950"
          >
            {reveal ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
          </button>
        )}
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      ) : (
        hint && <div className="mt-1.5">{hint}</div>
      )}
    </div>
  );
}

/** 0–4 score for the strength meter (length + variety). */
export const passwordScore = (pw: string) => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Za-z]/.test(pw) && /\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw) || (/[a-z]/.test(pw) && /[A-Z]/.test(pw))) score++;
  return score;
};

export function StrengthMeter({ password }: { password: string }) {
  if (!password) return null;
  const score = passwordScore(password);
  const labels = ["Too weak", "Weak", "Fair", "Good", "Strong"];
  const colors = ["bg-red-400", "bg-red-400", "bg-amber-400", "bg-secondary-500", "bg-secondary-600"];
  return (
    <div className="flex items-center gap-3" aria-live="polite">
      <div className="grid flex-1 grid-cols-4 gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`h-1 rounded-full ${i < score ? colors[score] : "bg-neutral-100"}`} />
        ))}
      </div>
      <span className="text-xs text-neutral-500">{labels[score]}</span>
    </div>
  );
}
