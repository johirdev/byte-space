"use client";

import { useState } from "react";
import { Check, Copy, MailCheck, Send } from "lucide-react";
import { toast } from "react-toastify";
import { SITE_CONTACT } from "@/config/site";
import AuthField from "../Auth/AuthField";

const TOPICS = [
  "General question",
  "Courses & enrollment",
  "Payments & refunds",
  "Becoming a creator",
  "Partnerships",
  "Something else",
];

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Form = { name: string; email: string; topic: string; message: string };
const EMPTY: Form = { name: "", email: "", topic: TOPICS[0], message: "" };

/**
 * Static contact form — there's no backend for it. On submit it opens the
 * visitor's email app with everything pre-filled (mailto:), and offers a
 * one-click copy as a fallback when no mail app is set up.
 */
export default function ContactForm() {
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  };

  const subject = `[ByteSpace] ${form.topic} — ${form.name.trim()}`;
  const body = `${form.message.trim()}\n\n—\n${form.name.trim()}\n${form.email.trim()}`;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const found: typeof errors = {};
    if (form.name.trim().length < 2) found.name = "Please enter your name";
    if (!EMAIL_RX.test(form.email.trim())) found.email = "Enter a valid email so we can reply";
    if (form.message.trim().length < 20) found.message = `Tell us a little more (${form.message.trim().length}/20 characters)`;
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;

    window.location.href = `mailto:${SITE_CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`To: ${SITE_CONTACT.email}\nSubject: ${subject}\n\n${body}`);
      setCopied(true);
      toast.success("Message copied — paste it into any email app");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Couldn't copy — please email us directly");
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center py-10 text-center" role="status">
        <span className="grid size-16 place-items-center rounded-full bg-secondary-400">
          <MailCheck className="size-8 text-neutral-950" aria-hidden="true" />
        </span>
        <h3 className="mt-5 font-heading text-2xl font-semibold text-neutral-950">Almost there!</h3>
        <p className="mt-2 max-w-md text-neutral-600">
          Your email app should have opened with your message ready — just press send. Nothing opened? Copy it and email{" "}
          <a href={`mailto:${SITE_CONTACT.email}`} className="text-primary-600 hover:underline">
            {SITE_CONTACT.email}
          </a>
          .
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={copy}
            className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-neutral-200 px-5 font-medium hover:border-neutral-950"
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? "Copied" : "Copy message"}
          </button>
          <button
            type="button"
            onClick={() => {
              setForm(EMPTY);
              setSent(false);
            }}
            className="inline-flex h-11 cursor-pointer items-center rounded-full bg-secondary-400 px-5 font-medium text-neutral-950 hover:bg-secondary-300"
          >
            Write another message
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-5 sm:grid-cols-2">
      <AuthField id="c-name" label="Your name" autoComplete="name" placeholder="Jamie Davis" value={form.name} error={errors.name} onChange={(e) => set("name", e.target.value)} />
      <AuthField
        id="c-email"
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={form.email}
        error={errors.email}
        onChange={(e) => set("email", e.target.value)}
      />

      <fieldset className="sm:col-span-2">
        <legend className="mb-2 block text-sm text-neutral-950">What can we help with?</legend>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={form.topic === t}
              onClick={() => set("topic", t)}
              className={`h-10 cursor-pointer rounded-full px-4 text-sm transition-colors ${
                form.topic === t ? "bg-primary-600 text-white" : "bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="sm:col-span-2">
        <label htmlFor="c-message" className="mb-2 block text-sm text-neutral-950">
          Message
        </label>
        <textarea
          id="c-message"
          rows={6}
          maxLength={2000}
          value={form.message}
          onChange={(e) => set("message", e.target.value)}
          aria-invalid={Boolean(errors.message)}
          placeholder="Tell us what's on your mind — include an order number or course name if it's about one."
          className={`w-full resize-y rounded-xl border px-6 py-4 text-base leading-relaxed outline-none placeholder:text-neutral-400 focus:border-primary-600 focus:ring-4 focus:ring-primary-600/10 ${
            errors.message ? "border-red-400" : "border-neutral-200"
          }`}
        />
        <div className="mt-1 flex justify-between text-xs">
          <span className="text-sm text-red-600">{errors.message}</span>
          <span className="text-neutral-400 tabular-nums">{form.message.length}/2000</span>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-neutral-500">Opens your email app with the message ready to send.</p>
        <button
          type="submit"
          className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-secondary-400 px-7 text-lg font-medium text-neutral-950 transition-colors hover:bg-secondary-300"
        >
          <Send className="size-5" aria-hidden="true" /> Send message
        </button>
      </div>
    </form>
  );
}
