import type { Brand, Product } from "./products";
import { products } from "./products";

export type PriceMode = "markup" | "margin";
export type CostBasis = "noMoq" | "moq50";

const toCents = (n: number) => Math.round(n * 100);
const fromCents = (c: number) => c / 100;

/**
 * Apply a markup or margin percentage to a cost.
 * - markup: price = cost * (1 + pct/100)
 * - margin: price = cost / (1 - pct/100)  (pct is the share of price that is profit)
 * Result is rounded to whole cents.
 */
export function applyPricing(cost: number, mode: PriceMode, pct: number): number {
  if (!Number.isFinite(cost) || cost <= 0) return 0;
  const p = Number.isFinite(pct) ? pct : 0;
  if (mode === "markup") {
    return fromCents(toCents(cost * (1 + p / 100)));
  }
  // margin: guard against >= 100% which would divide by zero / go negative
  const denom = 1 - p / 100;
  if (denom <= 0) return 0;
  return fromCents(toCents(cost / denom));
}

export type PriceSheetRow = {
  brand: Brand;
  sku: string;
  product: string;
  label: string;
  cost: number;
  price: number;
  vialsPerPack: number;
  pricePerVial: number;
};

export type PriceSheetConfig = {
  mode: PriceMode;
  pct: number;
  basis: CostBasis;
  brand: Brand | "all";
  search: string;
};

function strengthLabel(p: Product): string {
  if (p.strength == null || p.strengthUnit === "") return "";
  return `${p.strength}${p.strengthUnit}`;
}

export function productLabel(p: Product): string {
  const s = strengthLabel(p);
  const size = `${p.vialSize}${p.vialUnit}`;
  const parts = [p.product, s, size].filter(Boolean);
  return parts.join(" · ");
}

export function buildPriceSheet(config: PriceSheetConfig): PriceSheetRow[] {
  const search = config.search.trim().toLowerCase();
  const rows: PriceSheetRow[] = [];

  for (const p of products) {
    if (config.brand !== "all" && p.brand !== config.brand) continue;

    const cost = config.basis === "moq50" ? p.moq50 : p.noMoq;
    if (cost == null) continue;

    if (search) {
      const hay = `${p.sku} ${p.product}`.toLowerCase();
      if (!hay.includes(search)) continue;
    }

    const price = applyPricing(cost, config.mode, config.pct);
    const vialsPerPack = p.vialsPerPack > 0 ? p.vialsPerPack : 1;
    const pricePerVial = fromCents(toCents(price / vialsPerPack));

    rows.push({
      brand: p.brand,
      sku: p.sku,
      product: p.product,
      label: productLabel(p),
      cost,
      price,
      vialsPerPack,
      pricePerVial,
    });
  }

  return rows;
}
