"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest, ApiClientError } from "@/app/lib/apiClient";
import type { ApiMeta } from "@/app/types";

type Query = Record<string, string | number | boolean | undefined | null>;

type State<T> = {
  data: T;
  meta?: ApiMeta;
  loading: boolean;
  error: string | null;
};

/**
 * Read-only fetch hook for public sections. Falls back to `fallback` when the
 * endpoint errors or returns nothing, so a section never renders empty.
 *
 * Fetching is a subscription to an external system, so the state updates here
 * are intentional; they all happen after an await, never synchronously in the
 * effect body.
 */
export function useCollection<T>(
  path: string,
  options: { query?: Query; fallback?: T[]; enabled?: boolean } = {},
) {
  const { query, fallback, enabled = true } = options;

  // Serialised so object literals passed inline do not retrigger the effect.
  const queryKey = JSON.stringify(query ?? {});
  const fallbackKey = JSON.stringify(fallback ?? []);

  const [state, setState] = useState<State<T[]>>(() => ({
    data: (fallback ?? []) as T[],
    loading: enabled,
    error: null,
  }));

  const load = useCallback(
    async (signal?: AbortSignal) => {
      const safety = JSON.parse(fallbackKey) as T[];

      try {
        const { data, meta } = await apiRequest<T[]>(path, {
          query: JSON.parse(queryKey) as Query,
          signal,
        });
        if (signal?.aborted) return;

        const rows = Array.isArray(data) ? data : [];
        setState({
          data: rows.length ? rows : safety,
          meta,
          loading: false,
          error: null,
        });
      } catch (err) {
        if (signal?.aborted || (err as Error)?.name === "AbortError") return;
        setState({
          data: safety,
          loading: false,
          error:
            err instanceof ApiClientError ? err.message : "Failed to load data",
        });
      }
    },
    [path, queryKey, fallbackKey],
  );

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    // Fetching is a subscription to an external system: state is only written
    // after the await resolves, never synchronously during the effect body.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(controller.signal);
    return () => controller.abort();
  }, [load, enabled]);

  const refetch = useCallback(() => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    return load();
  }, [load]);

  return { ...state, refetch };
}

/** Same contract for a single document. */
export function useDocument<T>(
  path: string,
  options: { query?: Query; fallback?: T | null; enabled?: boolean } = {},
) {
  const { query, fallback = null, enabled = true } = options;

  const queryKey = JSON.stringify(query ?? {});
  const fallbackKey = JSON.stringify(fallback);

  const [state, setState] = useState<State<T | null>>(() => ({
    data: fallback,
    loading: enabled,
    error: null,
  }));

  const load = useCallback(
    async (signal?: AbortSignal) => {
      const safety = JSON.parse(fallbackKey) as T | null;

      try {
        const { data } = await apiRequest<T>(path, {
          query: JSON.parse(queryKey) as Query,
          signal,
        });
        if (signal?.aborted) return;
        setState({ data: data ?? safety, loading: false, error: null });
      } catch (err) {
        if (signal?.aborted || (err as Error)?.name === "AbortError") return;
        setState({
          data: safety,
          loading: false,
          error:
            err instanceof ApiClientError ? err.message : "Failed to load data",
        });
      }
    },
    [path, queryKey, fallbackKey],
  );

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    // Fetching is a subscription to an external system: state is only written
    // after the await resolves, never synchronously during the effect body.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(controller.signal);
    return () => controller.abort();
  }, [load, enabled]);

  const refetch = useCallback(() => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    return load();
  }, [load]);

  return { ...state, refetch };
}
