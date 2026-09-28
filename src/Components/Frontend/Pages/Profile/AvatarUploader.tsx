"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { ApiClientError } from "@/app/lib/apiClient";
import { ACCEPTED_IMAGE_TYPES, checkImageFile, postImage } from "@/app/lib/uploadImage";
import { useAuthStore } from "@/store/authStore";
import type { SessionUser } from "@/app/types";
import UserAvatar from "../../Shared/UserAvatar";

/**
 * Profile photo with a camera button. The file goes to POST /users/me/avatar,
 * which stores it on imgbb and saves the URL on the account in one step.
 */
export default function AvatarUploader({
  user,
  size = 90,
  rounded = "rounded-[20px]",
}: {
  user: SessionUser;
  size?: number;
  rounded?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const setUser = useAuthStore((s) => s.setUser);

  const onFile = async (file?: File) => {
    if (!file) return;
    const problem = checkImageFile(file);
    if (problem) {
      toast.error(problem);
      return;
    }
    const local = URL.createObjectURL(file);
    setPreview(local);
    setBusy(true);
    try {
      const { data, message } = await postImage<SessionUser>("/users/me/avatar", file, { auth: "user" });
      setUser(data);
      toast.success(message);
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      setPreview(null);
      URL.revokeObjectURL(local);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={`group relative shrink-0 overflow-hidden bg-white/20 ${rounded}`} style={{ width: size, height: size }}>
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element -- local blob preview
        <img src={preview} alt="" className="size-full object-cover" />
      ) : (
        <UserAvatar name={user.name} src={user.avatar} size={size} rounded={rounded} />
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        aria-label="Change profile photo"
        className="absolute inset-0 grid cursor-pointer place-items-center bg-neutral-950/0 text-white opacity-0 transition-all group-hover:bg-neutral-950/45 group-hover:opacity-100 focus-visible:bg-neutral-950/45 focus-visible:opacity-100 disabled:bg-neutral-950/45 disabled:opacity-100"
      >
        {busy ? <Loader2 className="size-6 animate-spin" /> : <Camera className="size-6" />}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
    </div>
  );
}
