"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  Camera,
  CircleAlert,
  Clock,
  Globe,
  Hourglass,
  Loader2,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import { apiRequest, ApiClientError } from "@/app/lib/apiClient";
import { ACCEPTED_IMAGE_TYPES, checkImageFile, postImage, type UploadedImage } from "@/app/lib/uploadImage";
import { APPLICATION_COOLDOWN_MINUTES, type ICreatorApplication, type MyCreatorStatus } from "@/app/types";
import { useAuthStore } from "@/store/authStore";
import PageHero from "../../Shared/PageHero";
import AuthField from "../Auth/AuthField";
import { imageProps, timeAgo } from "../../utils/course";

type Form = {
  name: string;
  email: string;
  phone: string;
  avatar: string;
  designation: string;
  bio: string;
  experience_years: string;
  expertise: string[];
  linkedin: string;
  website: string;
  followers: string;
  teaching_plan: string;
};
type Errors = Record<string, string>;

/** lucide-react no longer ships brand icons. */
const Linkedin = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
  </svg>
);

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RX = /^\+?[0-9\s\-()]{7,20}$/;
const URL_RX = /^https?:\/\/\S+$/i;
const LINKEDIN_RX = /^https?:\/\/([a-z]{2,3}\.)?linkedin\.com\/.+/i;

/** Mirrors validateApplication() on the server. */
function validate(f: Form, agreed: boolean): Errors {
  const e: Errors = {};
  if (f.name.trim().length < 2) e.name = "Enter your full name";
  if (!EMAIL_RX.test(f.email.trim())) e.email = "Enter a valid email address";
  if (!PHONE_RX.test(f.phone.trim())) e.phone = "Enter a valid phone number";
  if (!f.avatar) e.avatar = "Upload a profile photo";
  if (f.designation.trim().length < 2) e.designation = "What's your role? e.g. Senior UI/UX Designer";
  if (f.bio.trim().length < 50) e.bio = `Tell us a bit more (${f.bio.trim().length}/50 characters)`;
  const years = Number(f.experience_years);
  if (f.experience_years === "" || !Number.isFinite(years) || years < 0 || years > 60) e.experience_years = "0–60 years";
  if (!f.expertise.length) e.expertise = "Add at least one topic you teach";
  if (!LINKEDIN_RX.test(f.linkedin.trim())) e.linkedin = "Paste your LinkedIn profile URL";
  if (f.website.trim() && !URL_RX.test(f.website.trim())) e.website = "Must start with http:// or https://";
  if (f.followers !== "" && (!Number.isFinite(Number(f.followers)) || Number(f.followers) < 0)) e.followers = "Enter a number";
  if (f.teaching_plan.trim().length < 30) e.teaching_plan = `A few more words please (${f.teaching_plan.trim().length}/30)`;
  if (!agreed) e.agree = "Please confirm the details are accurate";
  return e;
}

/** Re-renders every second until `until` passes; returns seconds left. */
function useCountdown(until: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!until) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [until]);
  if (!until) return 0;
  return Math.max(0, Math.ceil((new Date(until).getTime() - now) / 1000));
}

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export default function BecomeCreator() {
  const user = useAuthStore((s) => s.user);
  const [status, setStatus] = useState<MyCreatorStatus | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  const secondsLeft = useCountdown(status?.next_allowed_at ?? null);
  const coolingDown = secondsLeft > 0;

  const load = useCallback(async () => {
    try {
      const { data } = await apiRequest<MyCreatorStatus>("/creator-applications/me", { auth: "user" });
      setStatus(data);
      return data;
    } catch (err) {
      setLoadError(err instanceof ApiClientError ? err.message : "Could not load your creator status");
      return null;
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Prefill once: last application first (easy resubmits), then the account.
  useEffect(() => {
    if (form || !status || !user) return;
    const last = status.latest;
    setForm({
      name: last?.name ?? user.name,
      email: last?.email ?? user.email,
      phone: last?.phone ?? user.phone ?? "",
      avatar: last?.avatar ?? user.avatar ?? "",
      designation: last?.designation ?? user.headline ?? "",
      bio: last?.bio ?? user.bio ?? "",
      experience_years: last ? String(last.experience_years) : "",
      expertise: last?.expertise ?? [],
      linkedin: last?.linkedin ?? "",
      website: last?.website ?? "",
      followers: last?.followers ? String(last.followers) : "",
      teaching_plan: last?.teaching_plan ?? "",
    });
  }, [status, user, form]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => (f ? { ...f, [key]: value } : f));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  };

  const uploadPhoto = async (file?: File) => {
    if (!file) return;
    const problem = checkImageFile(file);
    if (problem) {
      setErrors((e) => ({ ...e, avatar: problem }));
      return;
    }
    setUploading(true);
    try {
      const { data } = await postImage<UploadedImage>("/creator-applications/upload", file, { auth: "user" });
      set("avatar", data.url);
    } catch (err) {
      setErrors((e) => ({ ...e, avatar: err instanceof ApiClientError ? err.message : "Upload failed" }));
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || coolingDown) return;
    const found = validate(form, agreed);
    setErrors(found);
    if (Object.values(found).some(Boolean)) {
      toast.error("Please fix the highlighted fields");
      document.getElementById(`bc-${Object.keys(found)[0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setBusy(true);
    try {
      const { message } = await apiRequest<ICreatorApplication>("/creator-applications", {
        method: "POST",
        auth: "user",
        body: {
          ...form,
          experience_years: Number(form.experience_years),
          followers: form.followers === "" ? 0 : Number(form.followers),
        },
      });
      toast.success(message);
      setAgreed(false);
      await load();
      topRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.status === 429 && err.errors?.retry_after) {
          const until = new Date(Date.now() + Number(err.errors.retry_after) * 1000).toISOString();
          setStatus((s) => (s ? { ...s, next_allowed_at: until } : s));
        } else {
          setErrors(err.errors ?? {});
        }
        toast.error(err.message);
      } else toast.error("Could not send your application");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main ref={topRef}>
      <PageHero
        title="Become a Creator"
        subtitle="Share what you know with thousands of learners. Apply once — our team reviews every creator by hand."
        crumbs={[{ label: "Home", href: "/" }, { label: "Become a Creator" }]}
      />

      <section className="container-site grid items-start gap-8 py-10 md:py-16 lg:grid-cols-12 lg:gap-10">
        {/* ── Sidebar: status + how it works ───────────────── */}
        <aside className="space-y-5 lg:sticky lg:top-6 lg:order-2 lg:col-span-4">
          {status ? <StatusCard status={status} secondsLeft={secondsLeft} /> : !loadError && <div className="h-32 animate-pulse rounded-2xl bg-neutral-50" />}

          <div className="rounded-2xl border border-neutral-100 p-6">
            <h2 className="font-heading text-lg font-semibold">How it works</h2>
            <ol className="mt-5 space-y-5">
              {[
                { icon: Send, title: "Apply", text: "Tell us about your experience and what you want to teach." },
                { icon: ShieldCheck, title: "We review", text: "An admin checks your profile — usually within 1–2 days." },
                { icon: Sparkles, title: "Get verified", text: "You get a creator ID and your courses carry your verified profile." },
              ].map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary-400">
                    <step.icon className="size-5" />
                  </span>
                  <span>
                    <span className="block font-medium">
                      {i + 1}. {step.title}
                    </span>
                    <span className="block text-sm text-neutral-500">{step.text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </aside>

        {/* ── Form ───────────────────────────────────────────── */}
        <div className="lg:order-1 lg:col-span-8">
          {loadError ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{loadError}</p>
          ) : status?.creator ? (
            <VerifiedPanel status={status} />
          ) : !form ? (
            <div className="space-y-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-48 animate-pulse rounded-2xl bg-neutral-50" />
              ))}
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="space-y-6">
              <Card title="Your profile" sub="How learners will see you.">
                <div id="bc-avatar" className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <label className="group relative size-28 shrink-0 cursor-pointer overflow-hidden rounded-2xl bg-neutral-50">
                    {form.avatar ? (
                      <Image src={form.avatar} alt="Your photo" fill sizes="112px" className="object-cover" {...imageProps(form.avatar)} />
                    ) : (
                      <span className="grid size-full place-items-center text-neutral-400">
                        <Camera className="size-7" />
                      </span>
                    )}
                    <span className="absolute inset-0 grid place-items-center bg-neutral-950/0 text-white opacity-0 transition-all group-hover:bg-neutral-950/45 group-hover:opacity-100">
                      {uploading ? <Loader2 className="size-6 animate-spin" /> : <Camera className="size-6" />}
                    </span>
                    {uploading && (
                      <span className="absolute inset-0 grid place-items-center bg-neutral-950/45 text-white">
                        <Loader2 className="size-6 animate-spin" />
                      </span>
                    )}
                    <input
                      type="file"
                      accept={ACCEPTED_IMAGE_TYPES.join(",")}
                      className="sr-only"
                      onChange={(e) => void uploadPhoto(e.target.files?.[0])}
                      disabled={uploading}
                    />
                    <span className="sr-only">Upload profile photo</span>
                  </label>
                  <div className="text-sm">
                    <p className="font-medium text-neutral-950">Profile photo *</p>
                    <p className="text-neutral-500">A clear, friendly headshot. JPG, PNG or WEBP up to 5 MB — stored on imgbb.</p>
                    {errors.avatar && <p className="mt-1 text-red-600">{errors.avatar}</p>}
                  </div>
                </div>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <AuthField id="bc-name" label="Full name *" value={form.name} error={errors.name} onChange={(e) => set("name", e.target.value)} />
                  <AuthField
                    id="bc-designation"
                    label="Designation *"
                    placeholder="Senior UI/UX Designer"
                    value={form.designation}
                    error={errors.designation}
                    onChange={(e) => set("designation", e.target.value)}
                  />
                </div>
                <TextArea
                  id="bc-bio"
                  label="Bio *"
                  hint="Shown on your creator profile. 50–1500 characters."
                  rows={5}
                  max={1500}
                  value={form.bio}
                  error={errors.bio}
                  onChange={(v) => set("bio", v)}
                  placeholder="Welcome to my creative world. I've spent the last 8 years designing products for…"
                />
              </Card>

              <Card title="Contact" sub="Only our team sees these — never shown publicly.">
                <div className="grid gap-5 sm:grid-cols-2">
                  <AuthField id="bc-email" label="Email *" type="email" value={form.email} error={errors.email} onChange={(e) => set("email", e.target.value)} />
                  <AuthField id="bc-phone" label="Phone *" type="tel" placeholder="01XXXXXXXXX" value={form.phone} error={errors.phone} onChange={(e) => set("phone", e.target.value)} />
                </div>
              </Card>

              <Card title="Experience & reach" sub="Helps us verify you and match you with learners.">
                <div className="grid gap-5 sm:grid-cols-2">
                  <AuthField
                    id="bc-experience_years"
                    label="Years of experience *"
                    type="number"
                    min={0}
                    max={60}
                    value={form.experience_years}
                    error={errors.experience_years}
                    onChange={(e) => set("experience_years", e.target.value)}
                  />
                  <AuthField
                    id="bc-followers"
                    label="Social followers (optional)"
                    type="number"
                    min={0}
                    placeholder="e.g. 12000"
                    value={form.followers}
                    error={errors.followers}
                    onChange={(e) => set("followers", e.target.value)}
                  />
                  <AuthField
                    id="bc-linkedin"
                    label="LinkedIn profile *"
                    type="url"
                    placeholder="https://www.linkedin.com/in/your-name"
                    value={form.linkedin}
                    error={errors.linkedin}
                    onChange={(e) => set("linkedin", e.target.value)}
                  />
                  <AuthField
                    id="bc-website"
                    label="Website / portfolio (optional)"
                    type="url"
                    placeholder="https://"
                    value={form.website}
                    error={errors.website}
                    onChange={(e) => set("website", e.target.value)}
                  />
                </div>
                <div id="bc-expertise" className="mt-5">
                  <TagInput values={form.expertise} onChange={(v) => set("expertise", v)} error={errors.expertise} />
                </div>
              </Card>

              <Card title="What will you teach?" sub="Your first course idea — who it's for and what they'll learn.">
                <TextArea
                  id="bc-teaching_plan"
                  label="Teaching plan *"
                  rows={5}
                  max={1500}
                  value={form.teaching_plan}
                  error={errors.teaching_plan}
                  onChange={(v) => set("teaching_plan", v)}
                  placeholder="A hands-on Figma course for beginners: from wireframes to an interactive prototype in 6 modules…"
                />
              </Card>

              <div className="rounded-2xl border border-neutral-100 p-5 md:p-6">
                <label id="bc-agree" className="flex cursor-pointer items-start gap-3 text-sm text-neutral-700">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => {
                      setAgreed(e.target.checked);
                      if (errors.agree) setErrors((er) => ({ ...er, agree: "" }));
                    }}
                    className="mt-0.5 size-4 accent-primary-600"
                  />
                  I confirm these details are accurate and agree to ByteSpace&apos;s creator guidelines.
                </label>
                {errors.agree && <p className="mt-1 ml-7 text-sm text-red-600">{errors.agree}</p>}

                <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="flex items-center gap-2 text-xs text-neutral-500">
                    <Clock className="size-3.5" /> You can send one application every {APPLICATION_COOLDOWN_MINUTES} minutes.
                  </p>
                  <button
                    type="submit"
                    disabled={busy || coolingDown || uploading}
                    className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-secondary-400 px-7 text-lg font-medium text-neutral-950 transition-colors hover:bg-secondary-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busy ? <Loader2 className="size-5 animate-spin" /> : coolingDown ? <Hourglass className="size-5" /> : <Send className="size-5" />}
                    {busy ? "Sending…" : coolingDown ? `Try again in ${mmss(secondsLeft)}` : "Submit application"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}

/* ── Pieces ─────────────────────────────────────────────────────────────── */

function Card({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-neutral-100 p-5 md:p-8">
      <h2 className="font-heading text-lg font-semibold">{title}</h2>
      <p className="text-sm text-neutral-500">{sub}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function TextArea({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  rows = 4,
  max,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  rows?: number;
  max?: number;
  placeholder?: string;
}) {
  return (
    <div className="mt-5">
      <label htmlFor={id} className="mb-2 block text-sm text-neutral-950">
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        maxLength={max}
        value={value}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full resize-y rounded-xl border px-5 py-4 text-base leading-relaxed outline-none placeholder:text-neutral-400 focus:border-primary-600 focus:ring-4 focus:ring-primary-600/10 ${
          error ? "border-red-400" : "border-neutral-200"
        }`}
      />
      <div className="mt-1 flex justify-between gap-3 text-xs">
        <span className={error ? "text-sm text-red-600" : "text-neutral-500"}>{error || hint}</span>
        {max && <span className="shrink-0 text-neutral-400 tabular-nums">{value.length}/{max}</span>}
      </div>
    </div>
  );
}

function TagInput({ values, onChange, error }: { values: string[]; onChange: (v: string[]) => void; error?: string }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const tag = draft.trim().replace(/,$/, "");
    if (tag && !values.includes(tag) && values.length < 10) onChange([...values, tag]);
    setDraft("");
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add();
    } else if (e.key === "Backspace" && !draft && values.length) onChange(values.slice(0, -1));
  };

  return (
    <div>
      <label htmlFor="bc-expertise-input" className="mb-2 block text-sm text-neutral-950">
        Topics you teach * <span className="text-neutral-400">(up to 10)</span>
      </label>
      <div
        className={`flex min-h-[52px] flex-wrap items-center gap-2 rounded-xl border px-3 py-2 focus-within:border-primary-600 focus-within:ring-4 focus-within:ring-primary-600/10 ${
          error ? "border-red-400" : "border-neutral-200"
        }`}
      >
        {values.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-secondary-100 py-1 pr-1.5 pl-3 text-sm">
            {tag}
            <button type="button" onClick={() => onChange(values.filter((t) => t !== tag))} aria-label={`Remove ${tag}`} className="cursor-pointer rounded-full p-0.5 hover:bg-secondary-300">
              <X className="size-3.5" />
            </button>
          </span>
        ))}
        <input
          id="bc-expertise-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          onBlur={add}
          placeholder={values.length ? "" : "UI/UX Design, Figma… press Enter"}
          className="min-w-[140px] flex-1 bg-transparent px-2 py-1.5 outline-none placeholder:text-neutral-400"
        />
        {draft.trim() && (
          <button type="button" onClick={add} className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-neutral-950 px-3 py-1 text-sm text-white">
            <Plus className="size-3.5" /> Add
          </button>
        )}
      </div>
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function StatusCard({ status, secondsLeft }: { status: MyCreatorStatus; secondsLeft: number }) {
  const { creator, latest } = status;

  if (creator) {
    return (
      <div className="rounded-2xl border border-secondary-300 bg-secondary-50 p-6">
        <p className="flex items-center gap-2 font-heading text-lg font-semibold">
          <BadgeCheck className="size-5 text-primary-600" /> Verified creator
        </p>
        <p className="mt-1 text-sm text-neutral-700">
          Creator ID <strong className="font-mono">{creator.code}</strong>
        </p>
      </div>
    );
  }

  if (!latest) {
    return (
      <div className="rounded-2xl bg-primary-600 p-6 text-white">
        <p className="font-heading text-lg font-semibold text-white">Ready to teach?</p>
        <p className="mt-1 text-sm text-white/85">Fill in the form — it takes about 5 minutes.</p>
      </div>
    );
  }

  const tone =
    latest.status === "pending"
      ? { box: "border-amber-200 bg-amber-50", icon: <Hourglass className="size-5 text-amber-600" />, title: "Application under review" }
      : latest.status === "rejected"
        ? { box: "border-red-200 bg-red-50", icon: <XCircle className="size-5 text-red-600" />, title: "Not approved this time" }
        : { box: "border-secondary-300 bg-secondary-50", icon: <BadgeCheck className="size-5 text-primary-600" />, title: "Approved" };

  return (
    <div className={`rounded-2xl border p-6 ${tone.box}`} aria-live="polite">
      <p className="flex items-center gap-2 font-heading text-lg font-semibold">
        {tone.icon} {tone.title}
      </p>
      <p className="mt-1 text-sm text-neutral-700">Submitted {timeAgo(latest.createdAt)}.</p>
      {latest.status === "pending" && (
        <p className="mt-2 text-sm text-neutral-700">We&apos;ll review it soon. You can update and resend it after the cooldown.</p>
      )}
      {latest.status === "rejected" && latest.admin_note && (
        <p className="mt-3 rounded-xl bg-white p-3 text-sm text-neutral-700">
          <span className="block text-xs font-medium tracking-wide text-neutral-500 uppercase">Reviewer note</span>
          {latest.admin_note}
        </p>
      )}
      {secondsLeft > 0 && (
        <p className="mt-3 flex items-center gap-2 text-sm font-medium text-neutral-950">
          <Clock className="size-4" /> Next application in <span className="font-mono tabular-nums">{mmss(secondsLeft)}</span>
        </p>
      )}
    </div>
  );
}

function VerifiedPanel({ status }: { status: MyCreatorStatus }) {
  const creator = status.creator!;
  return (
    <div className="rounded-2xl border border-neutral-100 p-6 md:p-10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <span className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-neutral-50">
          {creator.avatar && <Image src={creator.avatar} alt="" fill sizes="96px" className="object-cover" {...imageProps(creator.avatar)} />}
        </span>
        <div>
          <p className="inline-flex items-center gap-1.5 rounded-full bg-secondary-400 px-3 py-1 text-sm font-medium">
            <BadgeCheck className="size-4" /> Verified creator
          </p>
          <h2 className="mt-2 font-heading text-2xl font-semibold">{creator.name}</h2>
          <p className="text-neutral-500">{creator.title}</p>
        </div>
      </div>

      <dl className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { icon: ShieldCheck, label: "Creator ID", value: creator.code },
          { icon: Users, label: "Followers", value: (creator.followers ?? 0).toLocaleString() },
          { icon: CircleAlert, label: "Verified", value: creator.verified_at ? new Date(creator.verified_at).toLocaleDateString() : "—" },
        ].map((row) => (
          <div key={row.label} className="rounded-xl bg-neutral-50 p-4">
            <dt className="flex items-center gap-1.5 text-xs text-neutral-500">
              <row.icon className="size-3.5" /> {row.label}
            </dt>
            <dd className="mt-1 font-mono font-semibold">{row.value}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-8 text-neutral-700">
        Our team publishes courses under your verified profile — share your Creator ID <strong className="font-mono">{creator.code}</strong> with
        them when you have course material ready.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={`/creator-profile/${creator.slug}`} className="inline-flex h-11 items-center rounded-full bg-secondary-400 px-6 font-medium hover:bg-secondary-300">
          View my creator profile
        </Link>
        {creator.linkedin && (
          <a href={creator.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-2 rounded-full border border-neutral-200 px-5 hover:border-neutral-950">
            <Linkedin className="size-4" /> LinkedIn
          </a>
        )}
        {creator.website && (
          <a href={creator.website} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-2 rounded-full border border-neutral-200 px-5 hover:border-neutral-950">
            <Globe className="size-4" /> Website
          </a>
        )}
      </div>
    </div>
  );
}
