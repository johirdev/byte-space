"use client";

import { useContext, useRef, useState, type DragEvent } from "react";
import Image from "next/image";
import { ImagePlus, Link2, Loader2, RefreshCw, Trash2, UploadCloud, X } from "lucide-react";
import { toast } from "react-toastify";
import { AuthContext } from "@/app/dashboard/AuthProvider";
import { ApiClientError } from "@/app/lib/apiClient";
import { ACCEPTED_IMAGE_TYPES, checkImageFile, uploadImage } from "@/app/lib/uploadImage";

const describe = (err: unknown) =>
  err instanceof ApiClientError ? err.message : "Upload failed — please try again";

/** Shared uploader state: file picking, drag & drop, and the imgbb call. */
function useUploader(onUploaded: (urls: string[]) => void, multiple: boolean) {
  const { token } = useContext(AuthContext);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [dragging, setDragging] = useState(false);

  const handleFiles = async (list: FileList | File[] | null) => {
    const files = Array.from(list ?? []).slice(0, multiple ? 8 : 1);
    if (!files.length) return;

    const valid = files.filter((file) => {
      const problem = checkImageFile(file);
      if (problem) toast.error(`${file.name}: ${problem}`);
      return !problem;
    });
    if (!valid.length) return;

    setBusy(valid.length);
    const results = await Promise.allSettled(valid.map((file) => uploadImage(file, token)));
    setBusy(0);

    const urls: string[] = [];
    results.forEach((result, i) => {
      if (result.status === "fulfilled") urls.push(result.value.url);
      else toast.error(`${valid[i].name}: ${describe(result.reason)}`);
    });
    if (urls.length) {
      onUploaded(urls);
      toast.success(urls.length > 1 ? `${urls.length} images uploaded` : "Image uploaded");
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  const dropProps = {
    onDragOver: (e: DragEvent) => {
      e.preventDefault();
      setDragging(true);
    },
    onDragLeave: () => setDragging(false),
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      setDragging(false);
      void handleFiles(e.dataTransfer.files);
    },
  };

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept={ACCEPTED_IMAGE_TYPES.join(",")}
      multiple={multiple}
      className="sr-only"
      tabIndex={-1}
      onChange={(e) => void handleFiles(e.target.files)}
    />
  );

  return { busy, dragging, dropProps, input, pick: () => inputRef.current?.click() };
}

/**
 * Single image: drop zone → preview with replace/remove, plus an optional
 * "paste a URL" escape hatch for images hosted elsewhere.
 */
export function ImageUpload({
  value,
  onChange,
  invalid,
  aspect = "16/9",
  hint = "JPG, PNG or WEBP · up to 5 MB",
  compact = false,
}: {
  value: string;
  onChange: (url: string) => void;
  invalid?: boolean;
  aspect?: string;
  hint?: string;
  compact?: boolean;
}) {
  const { busy, dragging, dropProps, input, pick } = useUploader((urls) => onChange(urls[0]), false);
  const [showUrl, setShowUrl] = useState(false);
  const [draft, setDraft] = useState("");

  const zoneStyle = {
    borderColor: invalid ? "var(--a-coral)" : dragging ? "var(--a-brand)" : "var(--a-line-strong)",
    background: dragging ? "var(--a-brand-tint)" : "var(--a-surface)",
  };

  return (
    <div className="flex flex-col gap-2">
      {value ? (
        <div
          className="group relative overflow-hidden rounded-[12px] border"
          style={{ aspectRatio: aspect, borderColor: "var(--a-line)", maxHeight: compact ? 120 : undefined }}
          {...dropProps}
        >
          <Image src={value} alt="" fill sizes="600px" className="object-cover" unoptimized />
          <div className="absolute inset-0 flex items-end justify-end gap-2 bg-gradient-to-t from-black/70 via-black/0 p-2.5 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
            <button type="button" onClick={pick} className="a-btn a-btn--ghost a-btn--sm" disabled={busy > 0}>
              <RefreshCw size={13} /> Replace
            </button>
            <button type="button" onClick={() => onChange("")} className="a-btn a-btn--danger a-btn--sm">
              <Trash2 size={13} /> Remove
            </button>
          </div>
          {busy > 0 && <BusyOverlay />}
        </div>
      ) : (
        <button
          type="button"
          onClick={pick}
          disabled={busy > 0}
          className="relative flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-[12px] border border-dashed px-4 text-center transition-colors"
          style={{ ...zoneStyle, aspectRatio: compact ? undefined : aspect, minHeight: compact ? 96 : 150 }}
          {...dropProps}
        >
          {busy > 0 ? (
            <Loader2 size={22} className="animate-spin" style={{ color: "var(--a-brand)" }} />
          ) : (
            <span
              className="grid h-10 w-10 place-items-center rounded-full"
              style={{ background: "var(--a-brand-tint)", color: "var(--a-brand)" }}
            >
              <UploadCloud size={19} />
            </span>
          )}
          <span className="text-[0.82rem] font-semibold text-white">
            {busy > 0 ? "Uploading to imgbb…" : dragging ? "Drop to upload" : "Click or drag an image here"}
          </span>
          <span className="text-[0.72rem]" style={{ color: "var(--a-text-3)" }}>
            {hint}
          </span>
        </button>
      )}
      {input}

      {showUrl ? (
        <div className="flex gap-2">
          <input
            className="a-input"
            type="url"
            placeholder="https://…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
          />
          <button
            type="button"
            className="a-btn a-btn--ghost shrink-0"
            disabled={!/^https?:\/\//.test(draft.trim())}
            onClick={() => {
              onChange(draft.trim());
              setDraft("");
              setShowUrl(false);
            }}
          >
            Use URL
          </button>
          <button type="button" className="a-btn a-btn--ghost a-btn--icon shrink-0 !h-auto" onClick={() => setShowUrl(false)} aria-label="Cancel">
            <X size={15} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowUrl(true)}
          className="inline-flex items-center gap-1.5 self-start text-[0.74rem] font-medium transition-colors hover:text-white"
          style={{ color: "var(--a-text-3)" }}
        >
          <Link2 size={13} /> Paste an image URL instead
        </button>
      )}
    </div>
  );
}

/** Multiple images (sneak peek gallery): grid of thumbs + an add tile. */
export function MultiImageUpload({
  value,
  onChange,
  max = 8,
  invalid,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  invalid?: boolean;
}) {
  const { busy, dragging, dropProps, input, pick } = useUploader(
    (urls) => onChange([...value, ...urls].slice(0, max)),
    true,
  );
  const full = value.length >= max;

  return (
    <div className="flex flex-col gap-2">
      <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-4" {...dropProps}>
        {value.map((src, i) => (
          <li
            key={`${src}-${i}`}
            className="group relative aspect-[4/3] overflow-hidden rounded-[10px] border"
            style={{ borderColor: "var(--a-line)" }}
          >
            <Image src={src} alt="" fill sizes="160px" className="object-cover" unoptimized />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              aria-label={`Remove image ${i + 1}`}
              className="absolute top-1.5 right-1.5 grid h-7 w-7 place-items-center rounded-full bg-black/70 text-white opacity-100 transition-opacity hover:bg-[var(--a-coral)] md:opacity-0 md:group-hover:opacity-100"
            >
              <X size={14} />
            </button>
          </li>
        ))}
        {Array.from({ length: busy }, (_, i) => (
          <li key={`busy-${i}`} className="a-skeleton aspect-[4/3]" aria-hidden="true" />
        ))}
        {!full && busy === 0 && (
          <li>
            <button
              type="button"
              onClick={pick}
              className="flex aspect-[4/3] w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[10px] border border-dashed text-[0.74rem] font-semibold transition-colors"
              style={{
                borderColor: invalid ? "var(--a-coral)" : dragging ? "var(--a-brand)" : "var(--a-line-strong)",
                background: dragging ? "var(--a-brand-tint)" : "var(--a-surface)",
                color: "var(--a-text-2)",
              }}
            >
              <ImagePlus size={18} style={{ color: "var(--a-brand)" }} />
              Add images
            </button>
          </li>
        )}
      </ul>
      {input}
      <p className="a-hint">
        {value.length}/{max} images · drag several at once · uploaded to imgbb
      </p>
    </div>
  );
}

function BusyOverlay() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-black/60">
      <span className="flex items-center gap-2 text-[0.8rem] font-semibold text-white">
        <Loader2 size={16} className="animate-spin" /> Uploading…
      </span>
    </div>
  );
}
