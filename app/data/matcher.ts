import { products, type Brand, type Product } from "./products";

export type ParsedRow = {
  qty: number;
  sku: string;
  product: string;
  exitPerPack?: number;
};

export type MatchStatus = "exact" | "fuzzy" | "none";

export type MatchedRow = ParsedRow & {
  matchedSku: string | null;
  matchedProduct: string | null;
  status: MatchStatus;
};

const normalize = (s: string) =>
  s.toUpperCase().replace(/[^A-Z0-9]/g, "");

export function matchRow(row: ParsedRow, brand: Brand): MatchedRow {
  const brandProducts = products.filter((p) => p.brand === brand);
  const rawSku = (row.sku ?? "").trim();
  const normSku = normalize(rawSku);

  const base = { ...row, qty: row.qty, sku: rawSku };

  if (!normSku) {
    return matchByName(base, brandProducts);
  }

  const exact = brandProducts.find((p) => p.sku.toUpperCase() === rawSku.toUpperCase());
  if (exact) {
    return { ...base, matchedSku: exact.sku, matchedProduct: exact.product, status: "exact" };
  }

  const normExact = brandProducts.find((p) => normalize(p.sku) === normSku);
  if (normExact) {
    return { ...base, matchedSku: normExact.sku, matchedProduct: normExact.product, status: "fuzzy" };
  }

  const startsWith = brandProducts.filter(
    (p) => normalize(p.sku).startsWith(normSku) || normSku.startsWith(normalize(p.sku)),
  );
  if (startsWith.length === 1) {
    const m = startsWith[0];
    return { ...base, matchedSku: m.sku, matchedProduct: m.product, status: "fuzzy" };
  }

  return matchByName(base, brandProducts);
}

function matchByName(
  base: ParsedRow & { sku: string },
  brandProducts: Product[],
): MatchedRow {
  const name = normalize(base.product ?? "");
  if (name) {
    const byName = brandProducts.find((p) => normalize(p.product) === name);
    if (byName) {
      return { ...base, matchedSku: byName.sku, matchedProduct: byName.product, status: "fuzzy" };
    }
  }
  return { ...base, matchedSku: null, matchedProduct: null, status: "none" };
}

export function matchRows(rows: ParsedRow[], brand: Brand): MatchedRow[] {
  return rows
    .filter((r) => (r.sku && r.sku.trim()) || (r.product && r.product.trim()))
    .map((r) => matchRow(r, brand));
}
