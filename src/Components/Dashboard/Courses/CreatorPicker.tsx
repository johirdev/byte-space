"use client";

import { useContext, useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { BadgeCheck, Loader2, Search, Unlink, UserRoundSearch } from "lucide-react";
import { AuthContext } from "@/app/dashboard/AuthProvider";
import { apiRequest } from "@/app/lib/apiClient";
import type { IVerifiedCreator } from "@/app/types";

type Linked = { creator_id?: string | null; name: string; title?: string; avatar?: string };

/**
 * Search verified creators by name, email, Creator ID (CR-…) or id.
 * Selecting one links it to the course; the server then snapshots the
 * creator's name, title, avatar and bio onto the course.
 */
export default function CreatorPicker({
  linked,
  onSelect,
  onUnlink,
  error,
  disabled,
}: {
  linked: Linked;
  onSelect: (creator: IVerifiedCreator) => void;
  onUnlink: () => void;
  error?: string;
  disabled?: boolean;
}) {
  const { token } = useContext(AuthContext);
  const listId = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<IVerifiedCreator[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const [changing, setChanging] = useState(false);

  const isLinked = Boolean(linked.creator_id) && !changing;

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await apiRequest<IVerifiedCreator[]>("/verified-creators/search", {
          token,
          query: { q: query.trim() },
          signal: controller.signal,
        });
        setResults(data);
        setActive(0);
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open, token]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => !boxRef.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  const choose = (creator: IVerifiedCreator) => {
    onSelect(creator);
    setOpen(false);
    setQuery("");
    setChanging(false);
  };

  if (isLinked) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-[12px] p-3" style={{ background: "var(--a-brand-tint)", border: "1px solid rgba(124,92,255,.3)" }}>
        <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full" style={{ background: "var(--a-panel-2)" }}>
          {linked.avatar && <Image src={linked.avatar} alt="" fill sizes="44px" className="object-cover" unoptimized />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[0.88rem] font-semibold text-white">
            {linked.name} <BadgeCheck size={14} style={{ color: "var(--a-brand)" }} />
          </p>
          <p className="a-clamp-1 text-[0.74rem]" style={{ color: "var(--a-text-2)" }}>
            Verified creator{linked.title ? ` · ${linked.title}` : ""} — details sync from their profile
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={() => { setChanging(true); setOpen(true); }} disabled={disabled}>
            <UserRoundSearch size={13} /> Change
          </button>
          <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={onUnlink} disabled={disabled} title="Unlink and type details manually">
            <Unlink size={13} /> Unlink
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={boxRef} className="relative">
      <label className="a-label mb-1.5 block" htmlFor={`${listId}-input`}>
        Verified creator
      </label>
      <div className="relative">
        <Search size={15} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2" style={{ color: "var(--a-text-3)" }} />
        <input
          id={`${listId}-input`}
          className="a-input !pl-10"
          placeholder="Search by name, email or Creator ID (CR-…)…"
          value={query}
          disabled={disabled}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-invalid={Boolean(error)}
          autoComplete="off"
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (!open || !results.length) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((i) => (i + 1) % results.length);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => (i - 1 + results.length) % results.length);
            } else if (e.key === "Enter") {
              e.preventDefault();
              choose(results[active]);
            } else if (e.key === "Escape") setOpen(false);
          }}
        />
        {loading && <Loader2 size={15} className="absolute top-1/2 right-3.5 -translate-y-1/2 animate-spin" style={{ color: "var(--a-text-3)" }} />}
      </div>
      {error ? <p className="a-error mt-1">{error}</p> : <p className="a-hint mt-1">Pick a verified creator, or leave empty and fill the details below manually.</p>}

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-[74px] z-20 max-h-72 overflow-y-auto rounded-[12px] p-1.5 shadow-2xl"
          style={{ background: "var(--a-panel)", border: "1px solid var(--a-line-strong)" }}
        >
          {!loading && !results.length ? (
            <li className="px-3 py-4 text-center text-[0.8rem]" style={{ color: "var(--a-text-3)" }}>
              {query ? "No verified creator matches that." : "No verified creators yet — approve a creator request first."}
            </li>
          ) : (
            results.map((c, i) => (
              <li key={c._id} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(c)}
                  className="flex w-full items-center gap-3 rounded-[9px] px-2.5 py-2 text-left"
                  style={{ background: i === active ? "var(--a-hover)" : "transparent" }}
                >
                  <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full" style={{ background: "var(--a-panel-2)" }}>
                    {c.avatar && <Image src={c.avatar} alt="" fill sizes="36px" className="object-cover" unoptimized />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="a-clamp-1 text-[0.84rem] font-semibold text-white">{c.name}</span>
                    <span className="a-clamp-1 text-[0.72rem]" style={{ color: "var(--a-text-3)" }}>
                      {c.title || "Creator"} · {c.email}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-[0.72rem]" style={{ color: "var(--a-brand)" }}>
                    {c.code}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
