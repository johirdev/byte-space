"use client";

import { useState } from "react";
import { KeyRound, Loader2, Trash2, UserRound } from "lucide-react";
import { toast } from "react-toastify";
import { apiRequest, ApiClientError } from "@/app/lib/apiClient";
import { useAuthStore } from "@/store/authStore";
import type { SessionUser } from "@/app/types";
import AvatarUploader from "./AvatarUploader";
import AuthField, { StrengthMeter } from "../Auth/AuthField";

type Errors = Record<string, string>;

export default function AccountSettings({ user }: { user: SessionUser }) {
  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <ProfileForm user={user} />
      <PasswordForm />
    </div>
  );
}

function Card({ icon: Icon, title, sub, children, className = "" }: { icon: typeof UserRound; title: string; sub: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-neutral-100 p-5 md:p-8 ${className}`}>
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-600">
          <Icon className="size-5" />
        </span>
        <div>
          <h2 className="font-heading text-lg font-semibold">{title}</h2>
          <p className="text-sm text-neutral-500">{sub}</p>
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function ProfileForm({ user }: { user: SessionUser }) {
  const setUser = useAuthStore((s) => s.setUser);
  const [values, setValues] = useState({
    name: user.name,
    headline: user.headline ?? "",
    bio: user.bio ?? "",
    phone: user.phone ?? "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState(false);

  const dirty =
    values.name !== user.name ||
    values.headline !== (user.headline ?? "") ||
    values.bio !== (user.bio ?? "") ||
    values.phone !== (user.phone ?? "");

  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: "" }));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const found: Errors = {};
    if (values.name.trim().length < 2) found.name = "Enter your name";
    if (values.phone && !/^\+?[0-9\s\-()]{7,20}$/.test(values.phone)) found.phone = "Enter a valid phone number";
    setErrors(found);
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      const { data, message } = await apiRequest<SessionUser>("/users/me", { method: "PATCH", body: values, auth: "user" });
      setUser(data);
      toast.success(message);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setErrors(err.errors ?? {});
        toast.error(err.message);
      }
    } finally {
      setBusy(false);
    }
  };

  const removePhoto = async () => {
    setRemoving(true);
    try {
      const { data, message } = await apiRequest<SessionUser>("/users/me/avatar", { method: "DELETE", auth: "user" });
      setUser(data);
      toast.success(message);
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Could not remove photo");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <Card icon={UserRound} title="Profile" sub="Shown on your profile and next to your reviews." className="lg:col-span-7">
      <div className="mb-6 flex items-center gap-4">
        <AvatarUploader user={user} size={72} rounded="rounded-2xl" />
        <div className="text-sm">
          <p className="font-medium">Profile photo</p>
          <p className="text-neutral-500">Click the photo to upload · JPG, PNG or WEBP up to 5 MB · stored on imgbb</p>
          {user.avatar && (
            <button type="button" onClick={removePhoto} disabled={removing} className="mt-1 inline-flex cursor-pointer items-center gap-1 text-red-600 hover:underline">
              {removing ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />} Remove photo
            </button>
          )}
        </div>
      </div>

      <form onSubmit={save} noValidate className="grid gap-5 sm:grid-cols-2">
        <AuthField id="name" label="Full name" value={values.name} error={errors.name} onChange={set("name")} className="sm:col-span-2" />
        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm text-neutral-950" htmlFor="email-ro">
            Email
          </label>
          <input id="email-ro" value={user.email} readOnly className="h-[52px] w-full cursor-not-allowed rounded-xl border border-neutral-100 bg-neutral-50 px-6 text-neutral-500" />
        </div>
        <AuthField
          id="headline"
          label="Headline"
          placeholder="Passionate UI/UX, Web designer"
          value={values.headline}
          error={errors.headline}
          maxLength={120}
          onChange={set("headline")}
          className="sm:col-span-2"
        />
        <AuthField id="phone" label="Phone (optional)" type="tel" placeholder="01XXXXXXXXX" value={values.phone} error={errors.phone} onChange={set("phone")} className="sm:col-span-2" />
        <div className="sm:col-span-2">
          <label htmlFor="bio" className="mb-2 block text-sm text-neutral-950">
            Bio
          </label>
          <textarea
            id="bio"
            rows={4}
            maxLength={1000}
            value={values.bio}
            onChange={set("bio")}
            placeholder="Tell other learners a little about yourself."
            className="w-full rounded-xl border border-neutral-200 px-6 py-4 text-base outline-none focus:border-primary-600 focus:ring-4 focus:ring-primary-600/10"
          />
          <p className="mt-1 text-right text-xs text-neutral-400">{values.bio.length}/1000</p>
        </div>
        <div className="flex justify-end sm:col-span-2">
          <button
            type="submit"
            disabled={busy || !dirty}
            className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-secondary-400 px-6 font-medium text-neutral-950 hover:bg-secondary-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy && <Loader2 className="size-4 animate-spin" />} Save changes
          </button>
        </div>
      </form>
    </Card>
  );
}

function PasswordForm() {
  const [values, setValues] = useState({ current_password: "", new_password: "", confirm: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: "" }));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const found: Errors = {};
    if (!values.current_password) found.current_password = "Enter your current password";
    if (values.new_password.length < 8) found.new_password = "At least 8 characters";
    else if (!/[A-Za-z]/.test(values.new_password) || !/\d/.test(values.new_password)) found.new_password = "Use at least one letter and one number";
    if (values.confirm !== values.new_password) found.confirm = "Passwords don't match";
    setErrors(found);
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      const { message } = await apiRequest("/users/me/password", {
        method: "PATCH",
        body: { current_password: values.current_password, new_password: values.new_password },
        auth: "user",
      });
      toast.success(message);
      setValues({ current_password: "", new_password: "", confirm: "" });
    } catch (err) {
      if (err instanceof ApiClientError) {
        setErrors(err.errors ?? {});
        toast.error(err.message);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card icon={KeyRound} title="Password" sub="Use 8+ characters with letters and numbers." className="self-start lg:col-span-5">
      <form onSubmit={save} noValidate className="space-y-5">
        <AuthField id="current_password" label="Current password" type="password" autoComplete="current-password" value={values.current_password} error={errors.current_password} onChange={set("current_password")} />
        <AuthField
          id="new_password"
          label="New password"
          type="password"
          autoComplete="new-password"
          value={values.new_password}
          error={errors.new_password}
          hint={<StrengthMeter password={values.new_password} />}
          onChange={set("new_password")}
        />
        <AuthField id="confirm" label="Confirm new password" type="password" autoComplete="new-password" value={values.confirm} error={errors.confirm} onChange={set("confirm")} />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-neutral-950 px-6 font-medium text-neutral-950 hover:bg-neutral-950 hover:text-white disabled:opacity-50"
          >
            {busy && <Loader2 className="size-4 animate-spin" />} Update password
          </button>
        </div>
      </form>
    </Card>
  );
}
