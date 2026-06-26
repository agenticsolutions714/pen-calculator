import * as XLSX from "xlsx";
import type { ParsedRow } from "./matcher";

const QTY_HEADERS = ["qty", "quantity", "packs", "order", "amount", "count"];
const SKU_HEADERS = ["sku", "code", "item", "item code", "product code"];
const PRODUCT_HEADERS = ["product", "name", "description", "item name", "peptide"];
const EXIT_HEADERS = [
  "exit",
  "exit price",
  "exit/pack",
  "price",
  "unit price",
  "sell",
  "sell price",
  "sale price",
  "rate",
];

function findHeaderIndex(headers: string[], candidates: string[]): number {
  const norm = headers.map((h) => String(h ?? "").trim().toLowerCase());
  for (const c of candidates) {
    const idx = norm.indexOf(c);
    if (idx !== -1) return idx;
  }
  for (let i = 0; i < norm.length; i++) {
    if (candidates.some((c) => norm[i].includes(c))) return i;
  }
  return -1;
}

function toQty(value: unknown): number {
  if (typeof value === "number") return Math.round(value);
  const n = parseInt(String(value ?? "").replace(/[^0-9.-]/g, ""), 10);
  return Number.isNaN(n) ? 0 : n;
}

function toMoney(value: unknown): number | undefined {
  if (value === "" || value == null) return undefined;
  if (typeof value === "number") return value;
  const n = parseFloat(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isNaN(n) ? undefined : n;
}

export function rowsFromMatrix(matrix: unknown[][]): ParsedRow[] {
  if (matrix.length === 0) return [];

  let headerRowIdx = -1;
  let qtyIdx = -1;
  let skuIdx = -1;
  let productIdx = -1;
  let exitIdx = -1;

  for (let i = 0; i < Math.min(matrix.length, 10); i++) {
    const row = (matrix[i] ?? []).map((c) => String(c ?? ""));
    const sIdx = findHeaderIndex(row, SKU_HEADERS);
    const pIdx = findHeaderIndex(row, PRODUCT_HEADERS);
    const qIdx = findHeaderIndex(row, QTY_HEADERS);
    if (sIdx !== -1 || (pIdx !== -1 && qIdx !== -1)) {
      headerRowIdx = i;
      qtyIdx = qIdx;
      skuIdx = sIdx;
      productIdx = pIdx;
      exitIdx = findHeaderIndex(row, EXIT_HEADERS);
      break;
    }
  }

  const out: ParsedRow[] = [];

  if (headerRowIdx === -1) {
    // No recognizable header: assume [qty, sku, product] column order.
    for (const row of matrix) {
      const qty = toQty(row?.[0]);
      const sku = String(row?.[1] ?? "").trim();
      const product = String(row?.[2] ?? "").trim();
      if (sku || product) out.push({ qty, sku, product });
    }
    return out;
  }

  for (let i = headerRowIdx + 1; i < matrix.length; i++) {
    const row = matrix[i] ?? [];
    const sku = skuIdx !== -1 ? String(row[skuIdx] ?? "").trim() : "";
    const product = productIdx !== -1 ? String(row[productIdx] ?? "").trim() : "";
    const qty = qtyIdx !== -1 ? toQty(row[qtyIdx]) : 0;
    const exitPerPack = exitIdx !== -1 ? toMoney(row[exitIdx]) : undefined;
    if (sku || product) out.push({ qty, sku, product, exitPerPack });
  }
  return out;
}

export async function parseSpreadsheet(file: File): Promise<ParsedRow[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return [];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    blankrows: false,
    defval: "",
  });
  return rowsFromMatrix(matrix);
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const comma = result.indexOf(",");
      resolve(comma === -1 ? result : result.slice(comma + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
