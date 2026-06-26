import type { Brand } from "./products";

export type InventoryEntry = {
  onHand: number;
  reorderPoint: number;
  targetStock: number;
};

export type InventoryMap = Record<string, InventoryEntry>;

export const INVENTORY_STORAGE_KEY = "pen-calc-inventory";

export const DEFAULT_ENTRY: InventoryEntry = {
  onHand: 0,
  reorderPoint: 0,
  targetStock: 0,
};

export const invKey = (brand: Brand, sku: string) => `${brand}:${sku}`;

export function loadInventory(): InventoryMap {
  try {
    const stored = localStorage.getItem(INVENTORY_STORAGE_KEY);
    if (!stored) return {};
    const parsed = JSON.parse(stored);
    if (parsed && typeof parsed === "object") {
      return parsed as InventoryMap;
    }
    return {};
  } catch {
    return {};
  }
}

export function saveInventory(inventory: InventoryMap) {
  try {
    localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventory));
  } catch {
    // ignore write failures (e.g. storage disabled)
  }
}

export function getEntry(inventory: InventoryMap, key: string): InventoryEntry {
  return inventory[key] ?? DEFAULT_ENTRY;
}

export function suggestedPacks(
  entry: InventoryEntry,
  vialsPerPack: number,
): number {
  const { onHand, reorderPoint, targetStock } = entry;
  if (onHand > reorderPoint) return 0;
  const deficit = targetStock - onHand;
  if (deficit <= 0 || vialsPerPack <= 0) return 0;
  return Math.ceil(deficit / vialsPerPack);
}

export function needsReorder(entry: InventoryEntry): boolean {
  return entry.targetStock > 0 && entry.onHand <= entry.reorderPoint;
}
