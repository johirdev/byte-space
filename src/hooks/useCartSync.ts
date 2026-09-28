"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { apiRequest } from "@/app/lib/apiClient";
import { useCartStore, toCartItem } from "@/store/cartStore";
import type { ICourse } from "@/app/types";

/**
 * The cart lives in localStorage, so it can go stale. On the cart and
 * checkout pages we re-fetch its courses: unpublished/deleted ones are
 * dropped and prices are refreshed. (Checkout re-prices on the server
 * regardless — this just keeps what the learner sees honest.)
 */
export function useCartSync() {
  const hydrated = useCartStore((s) => s.hydrated);
  const [syncing, setSyncing] = useState(true);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    if (!hydrated || synced) return;
    const items = useCartStore.getState().items;
    if (!items.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSyncing(false);
      setSynced(true);
      return;
    }

    const controller = new AbortController();
    apiRequest<ICourse[]>("/courses", {
      signal: controller.signal,
      query: { ids: items.map((i) => i._id).join(","), limit: 50, page: 1 },
    })
      .then(({ data }) => {
        const live = new Map(data.map((c) => [String(c._id), c]));
        const current = useCartStore.getState().items;
        const removed = current.filter((i) => !live.has(i._id));
        const repriced = current.filter((i) => live.has(i._id) && live.get(i._id)!.price !== i.price);

        useCartStore.setState({
          items: current
            .filter((i) => live.has(i._id))
            .map((i) => ({ ...toCartItem(live.get(i._id)!), added_at: i.added_at })),
        });

        if (removed.length) {
          toast.info(`${removed.map((r) => r.title).join(", ")} ${removed.length > 1 ? "are" : "is"} no longer available and was removed.`);
        }
        if (repriced.length) toast.info("Some prices changed since you added them — your cart is up to date.");
      })
      .catch(() => {})
      .finally(() => {
        if (controller.signal.aborted) return;
        setSyncing(false);
        setSynced(true);
      });
    return () => controller.abort();
  }, [hydrated, synced]);

  return { ready: hydrated && !syncing };
}
