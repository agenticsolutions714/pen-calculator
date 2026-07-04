"use client";

import { useCallback, useMemo } from "react";
import {
  type AuraResolveOverride,
  type Product,
  auraProducts,
  resolveAuraProduct,
  standardBySku,
  standardProducts,
} from "./products";
import { useSharedMap } from "./sharedState";

// One orderable/labelable row per mg option: each sourced Aura peptide expands
// to the full strength family of its Standard source; unsourced peptides stay a
// single row. `sku` is unique per row (Standard variant SKU, or the Aura SKU for
// unsourced items) so batch numbers and label status can be tracked per mg.
export type AuraVariant = {
  auraSku: string;
  product: string; // Aura peptide display name
  compound: string | null; // underlying Standard compound
  category: string;
  sku: string;
  strength: number | null;
  strengthUnit: string;
  vialSize: number;
  vialUnit: string;
  vialsPerPack: number;
  subtitle?: string;
  noMoq: number | null;
  moq50: number | null;
  sourced: boolean;
};

export function expandAuraVariants(aura: Product[]): AuraVariant[] {
  const seen = new Set<string>();
  const out: AuraVariant[] = [];
  for (const a of aura) {
    const category = a.category ?? "Supplies";
    const src = a.sourceSku ? standardBySku.get(a.sourceSku) : undefined;
    if (!src) {
      // Unsourced peptide — keep as a single row on its own Aura SKU.
      out.push({
        auraSku: a.sku,
        product: a.product,
        compound: null,
        category,
        sku: a.sku,
        strength: a.strength,
        strengthUnit: a.strengthUnit,
        vialSize: a.vialSize,
        vialUnit: a.vialUnit,
        vialsPerPack: a.vialsPerPack,
        subtitle: a.subtitle,
        noMoq: a.noMoq,
        moq50: a.moq50,
        sourced: false,
      });
      continue;
    }
    if (seen.has(src.product)) continue;
    seen.add(src.product);
    const variants = standardProducts
      .filter((p) => p.product === src.product)
      .sort((x, y) => (x.strength ?? 0) - (y.strength ?? 0));
    for (const v of variants) {
      out.push({
        auraSku: a.sku,
        product: a.product,
        compound: src.product,
        category,
        sku: v.sku,
        strength: v.strength,
        strengthUnit: v.strengthUnit,
        vialSize: v.vialSize,
        vialUnit: v.vialUnit,
        vialsPerPack: v.vialsPerPack,
        subtitle: a.subtitle,
        noMoq: v.noMoq,
        moq50: v.moq50,
        sourced: true,
      });
    }
  }
  return out;
}

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
// overrides applied, backed by the shared Postgres state so multiple people can
// edit the Aura line at the same time.
export function useMergedProducts() {
  const ov = useSharedMap<AuraResolveOverride>("overrides");
  const ad = useSharedMap<AuraAddition>("additions");

  const overrides = ov.map;
  const additions = useMemo(
    () => Object.values(ad.map) as AuraAddition[],
    [ad.map],
  );

  const auraResolved = useMemo(
    () => buildAuraList(overrides, additions),
    [overrides, additions],
  );
  const products = useMemo(
    () => [...standardProducts, ...auraResolved],
    [auraResolved],
  );

  // Upsert (or clear, when empty) a single SKU's override.
  const setOverride = useCallback(
    (sku: string, override: AuraResolveOverride) => {
      if (override.sourceSku === undefined && override.strength === undefined) {
        ov.removeItem(sku);
      } else {
        ov.setItem(sku, override);
      }
    },
    [ov],
  );

  const resetOverrides = useCallback(() => ov.clear(), [ov]);

  // Add a Standard SKU into the Aura line as a new relabeled product.
  const addFromStandard = useCallback(
    (sourceSku: string, category: string) => {
      const src = standardBySku.get(sourceSku);
      if (!src) return;
      const taken = new Set([
        ...auraProducts.map((p) => p.sku),
        ...Object.keys(ad.map),
      ]);
      const sku = makeAuraSku(sourceSku, taken);
      const subtitle =
        src.strength != null
          ? `${src.strength}${src.strengthUnit} · from Standard ${src.sku}`
          : `from Standard ${src.sku}`;
      ad.setItem(sku, {
        sku,
        product: src.product,
        subtitle,
        category,
        sourceSku,
      });
    },
    [ad],
  );

  const removeAddition = useCallback(
    (sku: string) => {
      ad.removeItem(sku);
      ov.removeItem(sku);
    },
    [ad, ov],
  );

  const addedSkus = useMemo(() => new Set(Object.keys(ad.map)), [ad.map]);

  return {
    products,
    auraResolved,
    overrides,
    setOverride,
    resetOverrides,
    additions,
    addFromStandard,
    removeAddition,
    addedSkus,
    hydrated: ov.hydrated && ad.hydrated,
  };
}
