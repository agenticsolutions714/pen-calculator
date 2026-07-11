"use server";

import { and, eq } from "drizzle-orm";
import { getDb } from "../db";
import { auraState } from "../db/schema";

// Shared Aura working state, stored per-item in Postgres so multiple people can
// edit the same Aura line simultaneously without clobbering each other.
export type AuraStore =
  | "overrides"
  | "additions"
  | "batches"
  | "labels"
  | "order"
  | "retail";

export type AuraStateSnapshot = Record<AuraStore, Record<string, unknown>>;

const EMPTY: AuraStateSnapshot = {
  overrides: {},
  additions: {},
  batches: {},
  labels: {},
  order: {},
  retail: {},
};

// Load the whole shared state as { store: { item: value } } maps.
export async function loadAuraState(): Promise<AuraStateSnapshot> {
  const db = getDb();
  const snapshot: AuraStateSnapshot = {
    overrides: {},
    additions: {},
    batches: {},
    labels: {},
    order: {},
    retail: {},
  };
  try {
    const rows = await db.select().from(auraState);
    for (const r of rows) {
      const bucket = snapshot[r.store as AuraStore];
      if (bucket) bucket[r.item] = r.value;
    }
  } catch {
    return EMPTY;
  }
  return snapshot;
}

// Load a single store as { item: value }.
export async function loadAuraStore(
  store: AuraStore,
): Promise<Record<string, unknown>> {
  const db = getDb();
  try {
    const rows = await db
      .select()
      .from(auraState)
      .where(eq(auraState.store, store));
    return Object.fromEntries(rows.map((r) => [r.item, r.value]));
  } catch {
    return {};
  }
}

// Upsert one item in a store.
export async function setAuraItem(
  store: AuraStore,
  item: string,
  value: unknown,
) {
  const db = getDb();
  await db
    .insert(auraState)
    .values({ store, item, value })
    .onConflictDoUpdate({
      target: [auraState.store, auraState.item],
      set: { value, updatedAt: new Date() },
    });
}

// Remove one item from a store.
export async function deleteAuraItem(store: AuraStore, item: string) {
  const db = getDb();
  await db
    .delete(auraState)
    .where(and(eq(auraState.store, store), eq(auraState.item, item)));
}

// Remove every item in a store (e.g. clearing the draft order).
export async function clearAuraStore(store: AuraStore) {
  const db = getDb();
  await db.delete(auraState).where(eq(auraState.store, store));
}
