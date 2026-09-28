"use client";

import { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { KeyRound, Save, ShieldCheck, UserRound } from "lucide-react";
import { AuthContext } from "@/app/dashboard/AuthProvider";
import { apiRequest, ApiClientError } from "@/app/lib/apiClient";
import PageHeader from "../kit/PageHeader";
import { Field } from "../kit/Fields";
import type { FieldDef } from "../kit/types";
import type { SafeAdmin } from "@/app/types";

const DETAIL_FIELDS: FieldDef[] = [
  { name: "admin_name", label: "Full name", type: "text", required: true },
  { name: "admin_phone", label: "Phone", type: "text", required: true, placeholder: "01712345678" },
  { name: "admin_email", label: "Email", type: "email", required: true, span: 2 },
  { name: "admin_avatar", label: "Avatar URL", type: "image", span: 2 },
];

export default function MyAccount() {
  const { token, adminData, logOut } = useContext(AuthContext);

  const [details, setDetails] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingDetails, setSavingDetails] = useState(false);

  const [passwords, setPasswords] = useState({ next: "", confirm: "" });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    apiRequest<SafeAdmin>("/admins/me", { token })
      .then(({ data }) => {
        if (!cancelled) setDetails((data ?? {}) as Record<string, unknown>);
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not load your account");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const saveDetails = async () => {
    setSavingDetails(true);
    setErrors({});
    try {
      const { data } = await apiRequest<SafeAdmin>("/admins/me", {
        method: "PATCH",
        body: {
          admin_name: details.admin_name,
          admin_email: details.admin_email,
          admin_phone: details.admin_phone,
          admin_avatar: details.admin_avatar,
        },
        token,
      });
      setDetails((data ?? {}) as Record<string, unknown>);
      toast.success("Account updated");
    } catch (err) {
      if (err instanceof ApiClientError) {
        setErrors(err.errors ?? {});
        toast.error(err.message);
      } else {
        toast.error("Could not save your account");
      }
    } finally {
      setSavingDetails(false);
    }
  };

  const changePassword = async () => {
    setPasswordError(null);

    if (passwords.next.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }
    if (passwords.next !== passwords.confirm) {
      setPasswordError("The two passwords do not match");
      return;
    }

    setSavingPassword(true);
    try {
      await apiRequest("/admins/me", {
        method: "PATCH",
        body: { admin_password: passwords.next },
        token,
      });
      setPasswords({ next: "", confirm: "" });
      toast.success("Password changed — sign in again with the new one");
      // The old access token is still valid, but re-authenticating keeps
      // the session honest after a credential change.
      setTimeout(logOut, 1200);
    } catch (err) {
      setPasswordError(
        err instanceof ApiClientError ? err.message : "Could not change the password",
      );
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <>
      <PageHeader
        title="My account"
        description="Your own sign-in details. Role changes are handled by a superadmin on the Team screen."
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* Details */}
        <section className="a-card a-card--pad">
          <header className="mb-5 flex items-center gap-2.5">
            <span
              className="grid h-9 w-9 place-items-center rounded-[10px]"
              style={{ background: "var(--a-brand-tint)", color: "var(--a-brand)" }}
            >
              <UserRound size={17} />
            </span>
            <h2 className="text-[0.98rem] font-bold text-white">Your details</h2>
          </header>

          {loading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="a-skeleton h-16" aria-hidden="true" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                {DETAIL_FIELDS.map((field) => (
                  <div key={field.name} className={field.span === 2 ? "sm:col-span-2" : ""}>
                    <Field
                      field={field}
                      value={details[field.name]}
                      error={errors[field.name]}
                      onChange={(value) =>
                        setDetails((prev) => ({ ...prev, [field.name]: value }))
                      }
                    />
                  </div>
                ))}
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={saveDetails}
                  disabled={savingDetails}
                  className="a-btn a-btn--primary"
                >
                  <Save size={15} />
                  {savingDetails ? "Saving…" : "Save details"}
                </button>
              </div>
            </>
          )}
        </section>

        <div className="flex flex-col gap-4">
          {/* Role card */}
          <section className="a-card a-card--pad">
            <header className="mb-4 flex items-center gap-2.5">
              <span
                className="grid h-9 w-9 place-items-center rounded-[10px]"
                style={{ background: "var(--a-signal-tint)", color: "var(--a-signal)" }}
              >
                <ShieldCheck size={17} />
              </span>
              <h2 className="text-[0.98rem] font-bold text-white">Access level</h2>
            </header>

            <p className="a-page-head__sub !mt-0">
              You are signed in as{" "}
              <strong style={{ color: "var(--a-text)" }}>{adminData?.role}</strong>.
              {adminData?.role === "viewOnly" &&
                " You can browse every screen but cannot save changes."}
              {adminData?.role === "editor" &&
                " You can manage all site content but not other admin accounts."}
              {adminData?.role === "superadmin" &&
                " You can manage content, the team, and seed or reset site content."}
            </p>
          </section>

          {/* Password */}
          <section className="a-card a-card--pad">
            <header className="mb-5 flex items-center gap-2.5">
              <span
                className="grid h-9 w-9 place-items-center rounded-[10px]"
                style={{ background: "var(--a-ember-tint)", color: "var(--a-ember)" }}
              >
                <KeyRound size={17} />
              </span>
              <h2 className="text-[0.98rem] font-bold text-white">Change password</h2>
            </header>

            <div className="flex flex-col gap-4">
              <div className="a-field">
                <label className="a-label" htmlFor="new-password">
                  New password<span className="req">*</span>
                </label>
                <input
                  id="new-password"
                  type="password"
                  className="a-input"
                  autoComplete="new-password"
                  value={passwords.next}
                  onChange={(e) =>
                    setPasswords((p) => ({ ...p, next: e.target.value }))
                  }
                />
              </div>

              <div className="a-field">
                <label className="a-label" htmlFor="confirm-password">
                  Confirm password<span className="req">*</span>
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  className="a-input"
                  autoComplete="new-password"
                  value={passwords.confirm}
                  onChange={(e) =>
                    setPasswords((p) => ({ ...p, confirm: e.target.value }))
                  }
                />
              </div>

              {passwordError && <p className="a-error">{passwordError}</p>}

              <p className="a-hint">
                You will be signed out afterwards so the new password takes effect
                everywhere.
              </p>

              <button
                type="button"
                onClick={changePassword}
                disabled={savingPassword || !passwords.next}
                className="a-btn a-btn--primary a-btn--block"
              >
                {savingPassword ? "Updating…" : "Change password"}
              </button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
