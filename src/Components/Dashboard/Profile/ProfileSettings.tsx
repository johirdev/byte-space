"use client";

import { useCallback, useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { RefreshCw, Save, TriangleAlert } from "lucide-react";
import { AuthContext } from "@/app/dashboard/AuthProvider";
import { apiRequest, ApiClientError } from "@/app/lib/apiClient";
import PageHeader from "../kit/PageHeader";
import { Field } from "../kit/Fields";
import type { FieldDef, FormValues } from "../kit/types";

/** Platforms offered in the social links picker. */
const SOCIAL_PLATFORMS = [
  "facebook",
  "instagram",
  "linkedin",
  "twitter",
  "youtube",
  "tiktok",
  "github",
  "behance",
  "dribbble",
  "website",
] as const;

/** Tabs keep this very large singleton form navigable. */
const TABS = [
  { id: "identity", label: "Identity" },
  { id: "stats", label: "Stats & skills" },
  { id: "process", label: "Process" },
  { id: "history", label: "Experience" },
  { id: "contact", label: "Contact & social" },
  { id: "seo", label: "SEO" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const SECTIONS: Record<TabId, FieldDef[]> = {
  identity: [
    { name: "full_name", label: "Full name", type: "text", required: true },
    {
      name: "short_name",
      label: "Short name",
      type: "text",
      placeholder: "Nafi",
    },
    {
      name: "headline",
      label: "Hero headline",
      type: "text",
      required: true,
      span: 2,
      hint: "The last two words are rendered in the brand gradient.",
    },
    {
      name: "roles",
      label: "Typed roles",
      type: "tags",
      span: 2,
      hint: "Cycled by the typewriter under the headline.",
    },
    {
      name: "bio",
      label: "Short bio",
      type: "textarea",
      required: true,
      span: 2,
      rows: 3,
      hint: "Used in the hero, the footer and as the default meta description.",
    },
    {
      name: "long_bio",
      label: "Long bio",
      type: "textarea",
      span: 2,
      rows: 4,
      hint: "Shown as the About section subtitle.",
    },
    { name: "avatar", label: "Portrait URL", type: "image", span: 2 },
    {
      name: "resume_url",
      label: "CV / resume URL",
      type: "text",
      placeholder: "/anamul_hasan_rafi.pdf",
    },
    {
      name: "intro_video_url",
      label: "Intro video URL",
      type: "url",
      placeholder: "https://youtube.com/watch?v=…",
      hint: "Leave blank to hide the video section entirely.",
    },
    {
      name: "availability",
      label: "Availability badge",
      type: "text",
      span: 2,
      placeholder: "Available for new projects",
    },
  ],

  stats: [
    {
      name: "stats",
      label: "Hero stats",
      type: "group",
      span: 2,
      max: 4,
      addLabel: "Add a stat",
      hint: "Exactly four reads best. Numbers count up when they scroll into view.",
      fields: [
        {
          name: "value",
          label: "Value",
          type: "text",
          required: true,
          placeholder: "4.3x",
        },
        {
          name: "label",
          label: "Label",
          type: "text",
          required: true,
          placeholder: "Average blended ROAS",
        },
      ],
    },
    {
      name: "skills",
      label: "Skill bars",
      type: "group",
      span: 2,
      addLabel: "Add a skill",
      fields: [
        { name: "label", label: "Skill", type: "text", required: true },
        {
          name: "level",
          label: "Level (0–100)",
          type: "number",
          required: true,
          min: 0,
          max: 100,
        },
      ],
    },
    {
      name: "tools",
      label: "Tools & platforms",
      type: "tags",
      span: 2,
      hint: "Drives the scrolling trust bar under the hero.",
    },
  ],

  process: [
    {
      name: "process",
      label: "Process steps",
      type: "group",
      span: 2,
      max: 6,
      addLabel: "Add a step",
      hint: "Five steps fit the desktop rail exactly.",
      fields: [
        { name: "title", label: "Step title", type: "text", required: true },
        {
          name: "description",
          label: "Description",
          type: "textarea",
          required: true,
          span: 2,
          rows: 2,
        },
      ],
    },
  ],

  history: [
    {
      name: "experience",
      label: "Experience",
      type: "group",
      span: 2,
      addLabel: "Add a role",
      fields: [
        { name: "title", label: "Role", type: "text", required: true },
        {
          name: "organization",
          label: "Company",
          type: "text",
          required: true,
        },
        {
          name: "period",
          label: "Period",
          type: "text",
          required: true,
          placeholder: "2023 — Present",
        },
        { name: "description", label: "Summary", type: "text" },
      ],
    },
    {
      name: "education",
      label: "Education",
      type: "group",
      span: 2,
      addLabel: "Add a qualification",
      fields: [
        { name: "title", label: "Qualification", type: "text", required: true },
        {
          name: "organization",
          label: "Institution",
          type: "text",
          required: true,
        },
        { name: "period", label: "Period", type: "text", required: true },
        { name: "description", label: "Summary", type: "text" },
      ],
    },
    {
      name: "certifications",
      label: "Certifications",
      type: "group",
      span: 2,
      addLabel: "Add a certification",
      fields: [
        { name: "title", label: "Certification", type: "text", required: true },
        { name: "issuer", label: "Issuer", type: "text", required: true },
        { name: "year", label: "Year", type: "text" },
        { name: "credential_url", label: "Verify URL", type: "url" },
      ],
    },
  ],

  contact: [
    { name: "email", label: "Email", type: "email", required: true },
    {
      name: "phone",
      label: "Phone",
      type: "text",
      placeholder: "+8801700000000",
    },
    {
      name: "whatsapp",
      label: "WhatsApp number",
      type: "text",
      placeholder: "+8801700000000",
    },
    {
      name: "location",
      label: "Location",
      type: "text",
      placeholder: "Dhaka, Bangladesh · Working worldwide",
    },
    { name: "hourly_rate", label: "Hourly rate (USD)", type: "number", min: 0 },
    {
      name: "socials",
      label: "Social links",
      type: "group",
      span: 2,
      addLabel: "Add a profile",
      fields: [
        {
          name: "platform",
          label: "Platform",
          type: "select",
          required: true,
          options: SOCIAL_PLATFORMS.map((value) => ({ label: value, value })),
        },
        { name: "url", label: "URL", type: "url", required: true },
      ],
    },
  ],

  seo: [
    {
      name: "seo_title",
      label: "Meta title",
      type: "text",
      span: 2,
      hint: "Around 60 characters. Falls back to your name and first role.",
    },
    {
      name: "seo_description",
      label: "Meta description",
      type: "textarea",
      span: 2,
      rows: 3,
      hint: "Around 155 characters. Falls back to your short bio.",
    },
    { name: "seo_keywords", label: "Keywords", type: "tags", span: 2 },
  ],
};

export default function ProfileSettings() {
  const { token, isReadOnly } = useContext(AuthContext);

  const [tab, setTab] = useState<TabId>("identity");
  const [values, setValues] = useState<FormValues>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { data } = await apiRequest<FormValues>("/profile", { token });
      setValues((data ?? {}) as FormValues);
    } catch (err) {
      setLoadError(err instanceof ApiClientError ? err.message : "Could not load the profile");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async data load
    void load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    setErrors({});
    try {
      const { data } = await apiRequest<FormValues>("/profile", {
        method: "PATCH",
        body: values,
        token,
      });
      setValues((data ?? {}) as FormValues);
      toast.success("Profile saved — the site is updated");
    } catch (err) {
      if (err instanceof ApiClientError) {
        setErrors(err.errors ?? {});
        toast.error(err.message);
      } else {
        toast.error("Could not save the profile");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Profile & hero"
        description="One record that feeds the hero, about section, process rail, footer and every SEO tag on the site."
        actions={
          <>
            <button
              type="button"
              onClick={load}
              disabled={loading || saving}
              className="a-btn a-btn--ghost"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : undefined} />
              Reload
            </button>

            <button
              type="button"
              onClick={save}
              disabled={saving || loading || isReadOnly}
              className="a-btn a-btn--primary"
            >
              <Save size={15} />
              {saving ? "Saving…" : "Save changes"}
            </button>
          </>
        }
      />

      {/* Tabs */}
      <div
        className="no-scrollbar mb-5 flex gap-1.5 overflow-x-auto"
        role="tablist"
        aria-label="Profile sections"
      >
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className="shrink-0 rounded-[10px] px-4 py-2 text-[0.82rem] font-semibold transition-colors"
            style={{
              background: tab === item.id ? "var(--a-brand-tint)" : "var(--a-panel)",
              color: tab === item.id ? "#fff" : "var(--a-text-3)",
              boxShadow: tab === item.id ? "inset 0 0 0 1px rgba(124,92,255,.28)" : undefined,
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="a-skeleton h-20" aria-hidden="true" />
          ))}
        </div>
      ) : loadError ? (
        <div className="a-card a-card--pad flex flex-col items-center gap-3 py-14 text-center">
          <TriangleAlert size={24} style={{ color: "#ff8a8d" }} />
          <p className="text-[0.88rem]" style={{ color: "var(--a-text-2)" }}>
            {loadError}
          </p>
          <button type="button" onClick={load} className="a-btn a-btn--ghost">
            Try again
          </button>
        </div>
      ) : (
        <div className="a-card a-card--pad">
          <div className="grid gap-4 sm:grid-cols-2">
            {SECTIONS[tab].map((field) => (
              <div key={field.name} className={field.span === 2 ? "sm:col-span-2" : ""}>
                <Field
                  field={field}
                  value={values[field.name]}
                  error={errors[field.name]}
                  onChange={(value) =>
                    setValues((prev) => ({ ...prev, [field.name]: value }))
                  }
                />
              </div>
            ))}
          </div>

          <div
            className="mt-6 flex items-center justify-end gap-2.5 pt-5"
            style={{ borderTop: "1px solid var(--a-line)" }}
          >
            <button
              type="button"
              onClick={save}
              disabled={saving || isReadOnly}
              className="a-btn a-btn--primary"
            >
              <Save size={15} />
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
