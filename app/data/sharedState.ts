"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  type AuraStore,
  clearAuraStore,
  deleteAuraItem,
  loadAuraStore,
  setAuraItem,
} from "../actions/auraState";

// A shared key→value store backed by Postgres so multiple people see the same
// data. Writes are debounced per item; reads refresh on window focus and on a
// light interval, but never overwrite items with a write still pending locally.
export function useSharedMap<T = unknown>(store: AuraStore) {
  const [map, setMap] = useState<Record<string, T>>({});
  const [hydrated, setHydrated] = useState(false);
  // Items with an in-flight/debounced local write — protected from refresh.
  const pending = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const refresh = useCallback(async () => {
    const data = (await loadAuraStore(store)) as Record<string, T>;
    setMap((prev) => {
      const merged = { ...data };
      for (const k of Object.keys(pending.current)) {
        if (k in prev) merged[k] = prev[k];
      }
      return merged;
    });
    setHydrated(true);
  }, [store]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    const id = window.setInterval(refresh, 15000);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.clearInterval(id);
    };
  }, [refresh]);

  const setItem = useCallback(
    (item: string, value: T) => {
      setMap((prev) => ({ ...prev, [item]: value }));
      if (pending.current[item]) clearTimeout(pending.current[item]);
      pending.current[item] = setTimeout(() => {
        void setAuraItem(store, item, value);
        delete pending.current[item];
      }, 400);
    },
    [store],
  );

  const removeItem = useCallback(
    (item: string) => {
      setMap((prev) => {
        const next = { ...prev };
        delete next[item];
        return next;
      });
      if (pending.current[item]) {
        clearTimeout(pending.current[item]);
        delete pending.current[item];
      }
      void deleteAuraItem(store, item);
    },
    [store],
  );

  const clear = useCallback(() => {
    setMap({});
    for (const k of Object.keys(pending.current)) {
      clearTimeout(pending.current[k]);
      delete pending.current[k];
    }
    void clearAuraStore(store);
  }, [store]);

  return { map, hydrated, setItem, removeItem, clear, refresh };
}
