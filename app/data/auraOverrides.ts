"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type AuraResolveOverride,
  type Product,
  auraProducts,
  resolveAuraProduct,
  standardBySku,
  standardProducts,
} from "./products";

// User edits from the bulk editor, persisted client-side. Keyed by Aura SKU.
// Empty/absent entry ⇒ fall back to the default source mapping.
export type AuraOverrideMap = Record<string, AuraResolveOverride>;

// A Standard SKU pulled into the Aura line as a new relabeled product. Strength
// and cost resolve from the Standard source just like the built-in Aura SKUs.
export type AuraAddition = {
  sku: string;
  product: string;
  subtitle?: string;
  category: string;
  sourceSku: string;
};

export const AURA_OVERRIDES_KEY = "pen-calc-aura-overrides";
export const AURA_ADDITIONS_KEY = "pen-calc-aura-additions";

function loadJson<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return fallback;
    const parsed = JSON.parse(stored);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore write failures (e.g. storage disabled)
  }
}

export const loadAuraOverrides = (): AuraOverrideMap =>
  loadJson<AuraOverrideMap>(AURA_OVERRIDES_KEY, {});
export const loadAuraAdditions = (): AuraAddition[] =>
  loadJson<AuraAddition[]>(AURA_ADDITIONS_KEY, []);

// Turn a user addition into a seed Product, inheriting vial spec from its
// Standard source, then resolving strength + cost through the shared resolver.
function additionToProduct(a: AuraAddition): Product {
  const src = standardBySku.get(a.sourceSku);
  return {
    brand: "Aura",
    sku: a.sku,
    product: a.product,
    strength: null,
    strengthUnit: "",
    vialSize: src?.vialSize ?? 3,
    vialUnit: src?.vialUnit ?? "mL",
    vialsPerPack: src?.vialsPerPack ?? 10,
    noMoq: null,
    moq50: null,
    category: a.category,
    subtitle: a.subtitle,
    sourceSku: a.sourceSku,
  };
}

// The full Aura catalog = built-in SKUs + user additions, each resolved with
// any per-SKU override layered on top.
export function buildAuraList(
  overrides: AuraOverrideMap,
  additions: AuraAddition[],
): Product[] {
  const builtIn = auraProducts.map((p) => resolveAuraProduct(p, overrides[p.sku]));
  const added = additions.map((a) =>
    resolveAuraProduct(additionToProduct(a), overrides[a.sku]),
  );
  return [...builtIn, ...added];
}

// Generate a stable, collision-free Aura SKU for an added Standard product.
function makeAuraSku(sourceSku: string, taken: Set<string>): string {
  const base = `A-${sourceSku}`;
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

// Client hook: the full catalog (Standard + Aura, incl. additions) with user
// overrides applied, plus editing APIs that persist to localStorage.
export function useMergedProducts() {
  const [overrides, setOverrides] = useState<AuraOverrideMap>({});
  const [additions, setAdditions] = useState<AuraAddition[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setOverrides(loadAuraOverrides());
    setAdditions(loadAuraAdditions());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveJson(AURA_OVERRIDES_KEY, overrides);
  }, [overrides, hydrated]);
  useEffect(() => {
    if (hydrated) saveJson(AURA_ADDITIONS_KEY, additions);
  }, [additions, hydrated]);

  const auraResolved = useMemo(
    () => buildAuraList(overrides, additions),
    [overrides, additions],
  );
  const products = useMemo(
    () => [...standardProducts, ...auraResolved],
    [auraResolved],
  );

  // Add a Standard SKU into the Aura line as a new relabeled product.
  const addFromStandard = useCallback(
    (sourceSku: string, category: string) => {
      const src = standardBySku.get(sourceSku);
      if (!src) return;
      setAdditions((prev) => {
        const taken = new Set([
          ...auraProducts.map((p) => p.sku),
          ...prev.map((a) => a.sku),
        ]);
        const sku = makeAuraSku(sourceSku, taken);
        const subtitle =
          src.strength != null
            ? `${src.strength}${src.strengthUnit} · from Standard ${src.sku}`
            : `from Standard ${src.sku}`;
        return [
          ...prev,
          { sku, product: src.product, subtitle, category, sourceSku },
        ];
      });
    },
    [],
  );

  const removeAddition = useCallback((sku: string) => {
    setAdditions((prev) => prev.filter((a) => a.sku !== sku));
    setOverrides((prev) => {
      if (!(sku in prev)) return prev;
      const next = { ...prev };
      delete next[sku];
      return next;
    });
  }, []);

  const addedSkus = useMemo(
    () => new Set(additions.map((a) => a.sku)),
    [additions],
  );

  return {
    products,
    auraResolved,
    overrides,
    setOverrides,
    additions,
    addFromStandard,
    removeAddition,
    addedSkus,
    hydrated,
  };
}
