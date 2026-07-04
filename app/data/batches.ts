// Per-SKU batch numbers: a unique 6-character uppercase alphanumeric code for
// each Aura SKU, assigned once and persisted client-side so it stays stable
// across reloads. New SKUs get a fresh unique code the first time they appear.

export const BATCHES_KEY = "pen-calc-batches";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export type BatchMap = Record<string, string>;

// Random float in [0,1). Prefers crypto for better spread; falls back to Math.
function rand(): number {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0] / 2 ** 32;
  }
  return Math.random();
}

export function generateBatch(): string {
  let out = "";
  for (let i = 0; i < 6; i++) out += CHARS[Math.floor(rand() * CHARS.length)];
  return out;
}

// Generate a code that isn't already present in `used`.
function uniqueBatch(used: Set<string>): string {
  let b = generateBatch();
  let guard = 0;
  while (used.has(b) && guard++ < 1000) b = generateBatch();
  return b;
}

// A fresh unique batch avoiding the given in-use codes.
export function freshBatch(inUse: string[]): string {
  return uniqueBatch(new Set(inUse));
}

export function loadBatches(): BatchMap {
  try {
    const stored = localStorage.getItem(BATCHES_KEY);
    if (!stored) return {};
    const parsed = JSON.parse(stored);
    if (parsed && typeof parsed === "object") return parsed as BatchMap;
    return {};
  } catch {
    return {};
  }
}

export function saveBatches(map: BatchMap) {
  try {
    localStorage.setItem(BATCHES_KEY, JSON.stringify(map));
  } catch {
    // ignore write failures (e.g. storage disabled)
  }
}

// Ensure every SKU has a unique batch code. Returns the SAME reference when no
// change is needed (so it's safe to call from an effect without looping).
export function ensureBatches(skus: string[], existing: BatchMap): BatchMap {
  const used = new Set(Object.values(existing));
  let next = existing;
  for (const sku of skus) {
    if (!existing[sku]) {
      if (next === existing) next = { ...existing };
      const b = uniqueBatch(used);
      used.add(b);
      next[sku] = b;
    }
  }
  return next;
}

// Assign a fresh unique code to one SKU.
export function regenerateBatch(sku: string, map: BatchMap): BatchMap {
  const used = new Set(Object.values(map));
  used.delete(map[sku]);
  return { ...map, [sku]: uniqueBatch(used) };
}
