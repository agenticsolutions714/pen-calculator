import type { Brand } from "./products";

// Per-SKU label/production tracking, persisted client-side (same approach as
// the inventory store). Tracks where each SKU is in the label pipeline and any
// note the operator wants to keep against it.
export type LabelStatus = "design" | "to-order" | "ordered" | "received";

export const LABEL_STATUSES: { value: LabelStatus; label: string }[] = [
  { value: "design", label: "Artwork ready" },
  { value: "to-order", label: "To order" },
  { value: "ordered", label: "Ordered" },
  { value: "received", label: "Received" },
];

export type CatalogEntry = {
  labelStatus: LabelStatus;
  // How many labels/vials to order for this SKU.
  labelQty: number;
  note: string;
};

export type CatalogMap = Record<string, CatalogEntry>;

export const CATALOG_STORAGE_KEY = "pen-calc-catalog";

// Artwork exists for the whole line (the Aura label sheet), so the pipeline
// starts at "design ready" rather than a blank state.
export const DEFAULT_CATALOG_ENTRY: CatalogEntry = {
  labelStatus: "design",
  labelQty: 0,
  note: "",
};

export const catKey = (brand: Brand, sku: string) => `${brand}:${sku}`;

export function loadCatalog(): CatalogMap {
  try {
    const stored = localStorage.getItem(CATALOG_STORAGE_KEY);
    if (!stored) return {};
    const parsed = JSON.parse(stored);
    if (parsed && typeof parsed === "object") return parsed as CatalogMap;
    return {};
  } catch {
    return {};
  }
}

export function saveCatalog(map: CatalogMap) {
  try {
    localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore write failures (e.g. storage disabled)
  }
}

export function getCatalogEntry(map: CatalogMap, key: string): CatalogEntry {
  return map[key] ?? DEFAULT_CATALOG_ENTRY;
}
