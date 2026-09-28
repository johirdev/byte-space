"use client";

import { useCallback, useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { AuthContext } from "@/app/dashboard/AuthProvider";
import { apiRequest, ApiClientError } from "@/app/lib/apiClient";
import type { ApiMeta } from "@/app/types";

type Query = Record<string, string | number | boolean | undefined | null>;

/**
 * Auth-aware CRUD hook backing every admin management screen: it owns the
 * list, the loading/error state, and toasts the outcome of each mutation.
 */
export function useAdminResource<T extends { _id?: string }>(
  path: string,
  options: { query?: Query; label?: string; auto?: boolean } = {},
) {
  const { query, label = "Item", auto = true } = options;
  const { token } = useContext(AuthContext);
  const queryKey = JSON.stringify(query ?? {});

  const [items, setItems] = useState<T[]>([]);
  const [meta, setMeta] = useState<ApiMeta | undefined>();
  const [loading, setLoading] = useState(auto);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const describe = (err: unknown): string => {
    if (err instanceof ApiClientError) {
      setFieldErrors(err.errors ?? {});
      return err.message;
    }
    return "Something went wrong";
  };

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, meta: m } = await apiRequest<T[]>(path, {
        token,
        query: JSON.parse(queryKey) as Query,
      });
      setItems(Array.isArray(data) ? data : []);
      setMeta(m);
    } catch (err) {
      setError(describe(err));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [path, token, queryKey]);

  useEffect(() => {
    // Loading the list is an external-system read; see useResource for the
    // same pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (auto) void refetch();
  }, [refetch, auto]);

  const create = async (body: Record<string, unknown>): Promise<T | null> => {
    setSaving(true);
    setFieldErrors({});
    try {
      const { data } = await apiRequest<T>(path, { method: "POST", body, token });
      toast.success(`${label} created`);
      await refetch();
      return data;
    } catch (err) {
      toast.error(describe(err));
      return null;
    } finally {
      setSaving(false);
    }
  };

  const update = async (
    id: string,
    body: Record<string, unknown>,
  ): Promise<T | null> => {
    setSaving(true);
    setFieldErrors({});
    try {
      const { data } = await apiRequest<T>(`${path}/${id}`, {
        method: "PATCH",
        body,
        token,
      });
      toast.success(`${label} updated`);
      await refetch();
      return data;
    } catch (err) {
      toast.error(describe(err));
      return null;
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string): Promise<boolean> => {
    setSaving(true);
    try {
      await apiRequest(`${path}/${id}`, { method: "DELETE", token });
      toast.success(`${label} deleted`);
      // Optimistically drop the row so the table does not flash.
      setItems((prev) => prev.filter((row) => row._id !== id));
      await refetch();
      return true;
    } catch (err) {
      toast.error(describe(err));
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    items,
    meta,
    loading,
    saving,
    error,
    fieldErrors,
    setFieldErrors,
    refetch,
    create,
    update,
    remove,
    token,
  };
}

/** Persists a drag-to-sort order for one of the reorderable collections. */
export async function saveOrder(
  collection:
    | "services"
    | "case-studies"
    | "faq"
    | "portfolio"
    | "prices"
    | "reviews",
  items: { id: string; order: number }[],
  token: string | null,
): Promise<boolean> {
  try {
    await apiRequest("/reorder", {
      method: "PATCH",
      body: { collection, items },
      token,
    });
    return true;
  } catch (err) {
    toast.error(err instanceof ApiClientError ? err.message : "Could not save order");
    return false;
  }
}
