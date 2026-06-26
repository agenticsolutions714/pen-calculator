"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { products, type Product, type Brand } from "../data/products";
import Nav from "../components/Nav";
import {
  type MatchedRow,
  matchRows,
} from "../data/matcher";
import { fileToBase64, parseSpreadsheet } from "../data/parse";
import {
  type InventoryEntry,
  type InventoryMap,
  DEFAULT_ENTRY,
  getEntry,
  invKey,
  loadInventory,
  needsReorder,
  saveInventory,
  suggestedPacks,
} from "../data/inventory";

type OrderMap = Record<string, number>;

const currency = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

type LineRow = Product & {
  key: string;
  entry: InventoryEntry;
  suggested: number;
  orderQty: number;
  lineTotal: number;
  low: boolean;
};

export default function Restock() {
  const [brand, setBrand] = useState<Brand>("Standard");
  const [search, setSearch] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [inventory, setInventory] = useState<InventoryMap>({});
  const [order, setOrder] = useState<OrderMap>({});
  const [hydrated, setHydrated] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<
    "idle" | "parsing" | "error"
  >("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [reviewRows, setReviewRows] = useState<MatchedRow[] | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setInventory(loadInventory());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveInventory(inventory);
  }, [inventory, hydrated]);

  const updateEntry = (key: string, patch: Partial<InventoryEntry>) => {
    setInventory((prev) => {
      const current = prev[key] ?? DEFAULT_ENTRY;
      return { ...prev, [key]: { ...current, ...patch } };
    });
  };

  const setOrderQty = (key: string, qty: number) => {
    setOrder((prev) => {
      const next = { ...prev };
      if (!qty || qty <= 0 || Number.isNaN(qty)) {
        delete next[key];
      } else {
        next[key] = qty;
      }
      return next;
    });
  };

  const brandProducts = useMemo(
    () => products.filter((p) => p.brand === brand),
    [brand],
  );

  const rows = useMemo<LineRow[]>(() => {
    const q = search.trim().toLowerCase();
    return brandProducts
      .map((p): LineRow => {
        const key = invKey(p.brand, p.sku);
        const entry = getEntry(inventory, key);
        const suggested = suggestedPacks(entry, p.vialsPerPack);
        const orderQty = order[key] ?? 0;
        const unit = p.noMoq ?? 0;
        return {
          ...p,
          key,
          entry,
          suggested,
          orderQty,
          lineTotal: orderQty * unit,
          low: needsReorder(entry),
        };
      })
      .filter((r) =>
        q
          ? r.product.toLowerCase().includes(q) ||
            r.sku.toLowerCase().includes(q)
          : true,
      )
      .filter((r) => (lowOnly ? r.low : true));
  }, [brandProducts, inventory, order, search, lowOnly]);

  const orderRows = useMemo(
    () => rows.filter((r) => r.orderQty > 0),
    [rows],
  );

  const totals = useMemo(() => {
    let packs = 0;
    let vials = 0;
    let cost = 0;
    for (const r of orderRows) {
      packs += r.orderQty;
      vials += r.orderQty * r.vialsPerPack;
      cost += r.lineTotal;
    }
    return { lines: orderRows.length, packs, vials, cost };
  }, [orderRows]);

  const useSuggested = (key: string, suggested: number) => {
    setOrderQty(key, suggested);
  };

  const applyAllSuggested = () => {
    setOrder((prev) => {
      const next = { ...prev };
      for (const r of rows) {
        if (r.suggested > 0) next[r.key] = r.suggested;
      }
      return next;
    });
  };

  const clearOrder = () => setOrder({});

  const markReceived = () => {
    if (orderRows.length === 0) return;
    setInventory((prev) => {
      const next = { ...prev };
      for (const r of orderRows) {
        const current = next[r.key] ?? DEFAULT_ENTRY;
        next[r.key] = {
          ...current,
          onHand: current.onHand + r.orderQty * r.vialsPerPack,
        };
      }
      return next;
    });
    setOrder({});
  };

  const handleFile = async (file: File) => {
    setUploadState("parsing");
    setUploadError(null);
    setReviewRows(null);
    try {
      const name = file.name.toLowerCase();
      const type = file.type;
      const isSpreadsheet =
        type.includes("sheet") ||
        type.includes("excel") ||
        type === "text/csv" ||
        /\.(csv|xlsx|xls)$/.test(name);
      const isImage = type.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/.test(name);
      const isPdf = type === "application/pdf" || /\.pdf$/.test(name);

      let parsed;
      if (isSpreadsheet) {
        parsed = await parseSpreadsheet(file);
      } else if (isImage || isPdf) {
        const data = await fileToBase64(file);
        const mediaType = type || (isPdf ? "application/pdf" : "image/png");
        const res = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data, mediaType }),
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "Extraction failed.");
        }
        parsed = json.rows ?? [];
      } else {
        throw new Error(
          "Unsupported file type. Upload an image, PDF, CSV, or Excel file.",
        );
      }

      const matched = matchRows(parsed, brand);
      if (matched.length === 0) {
        throw new Error("No line items were found in that file.");
      }
      setReviewRows(matched);
      setUploadState("idle");
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to read file.");
      setUploadState("error");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const setReviewMatch = (index: number, sku: string) => {
    setReviewRows((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      const p = brandProducts.find((bp) => bp.sku === sku);
      next[index] = {
        ...next[index],
        matchedSku: p ? p.sku : null,
        matchedProduct: p ? p.product : null,
        status: p ? "exact" : "none",
      };
      return next;
    });
  };

  const setReviewQty = (index: number, qty: number) => {
    setReviewRows((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      next[index] = { ...next[index], qty: Number.isNaN(qty) ? 0 : qty };
      return next;
    });
  };

  const applyReview = () => {
    if (!reviewRows) return;
    setOrder((prev) => {
      const next = { ...prev };
      for (const r of reviewRows) {
        if (r.matchedSku && r.qty > 0) {
          next[invKey(brand, r.matchedSku)] = r.qty;
        }
      }
      return next;
    });
    setReviewRows(null);
  };

  const downloadSampleCsv = () => {
    const sample = brandProducts.slice(0, 5);
    const header = "Qty,SKU,Product";
    const lines = sample.map(
      (p) =>
        `1,${p.sku},"${p.product}${
          p.strength != null ? ` ${p.strength}${p.strengthUnit}` : ""
        }"`,
    );
    const csv = [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `restock-template-${brand}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    if (orderRows.length === 0) return;
    const esc = (v: string | number) => {
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = [
      "SKU",
      "Product",
      "Strength",
      "Pack size (vials)",
      "Order packs",
      "Unit price",
      "Line total",
    ];
    const lines = orderRows.map((r) =>
      [
        r.sku,
        r.product,
        r.strength != null ? `${r.strength} ${r.strengthUnit}` : "",
        r.vialsPerPack,
        r.orderQty,
        (r.noMoq ?? 0).toFixed(2),
        r.lineTotal.toFixed(2),
      ]
        .map(esc)
        .join(","),
    );
    const totalsRow = [
      "TOTAL",
      "",
      "",
      "",
      totals.packs,
      "",
      totals.cost.toFixed(2),
    ]
      .map(esc)
      .join(",");
    const csv = [header.join(","), ...lines, totalsRow].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `PO-${brand}-${date}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const orderDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="min-h-screen bg-neutral-100 text-neutral-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Nav />

        <header className="no-print mb-6">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Supplier Restock &amp; Purchase Orders
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Track inventory per SKU, get reorder suggestions, and build a
            purchase order at supplier list price. Quantities are in packs (
            {brandProducts[0]?.vialsPerPack ?? 10} vials each, unless noted).
          </p>
        </header>

        <section
          onDragOver={(e) => {
            e.preventDefault();
            if (!isDragging) setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
          className={`no-print mb-6 rounded-xl border-2 border-dashed p-5 shadow-sm transition-colors ${
            isDragging
              ? "border-neutral-900 bg-neutral-50"
              : "border-neutral-300 bg-white"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                Autofill from a file
              </h2>
              <p className="mt-1 text-xs text-neutral-400">
                Drag &amp; drop or upload an order list as an image, PDF, CSV, or
                Excel file. We read the quantities and SKUs, match them to the{" "}
                {brand} catalog, and let you review before filling the order.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.csv,.xlsx,.xls,application/pdf,text/csv"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
                className="hidden"
              />
              <button
                onClick={downloadSampleCsv}
                className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
              >
                Sample CSV
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadState === "parsing"}
                className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploadState === "parsing" ? "Reading file…" : "Upload file"}
              </button>
            </div>
          </div>
          {isDragging && (
            <p className="mt-3 text-center text-sm font-medium text-neutral-600">
              Drop the file to upload
            </p>
          )}
          {uploadError && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {uploadError}
            </p>
          )}
        </section>

        {reviewRows && (
          <section className="no-print mb-6 rounded-xl border border-amber-300 bg-amber-50/40 p-5 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-600">
                Review parsed order ({reviewRows.length} rows)
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={applyReview}
                  className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
                >
                  Apply matched rows to order
                </button>
                <button
                  onClick={() => setReviewRows(null)}
                  className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-100"
                >
                  Cancel
                </button>
              </div>
            </div>
            <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2">From file (SKU / product)</th>
                    <th className="px-3 py-2">Matched catalog item</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewRows.map((r, i) => (
                    <tr key={i} className="border-t border-neutral-100">
                      <td className="px-2 py-1 text-right">
                        <input
                          type="number"
                          min="0"
                          value={r.qty === 0 ? "" : r.qty}
                          placeholder="0"
                          onChange={(e) =>
                            setReviewQty(i, parseInt(e.target.value, 10))
                          }
                          className="w-16 rounded-md border border-neutral-200 bg-white px-2 py-1 text-right text-sm tabular-nums outline-none focus:border-neutral-900"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-xs text-neutral-600">
                          {r.sku || "—"}
                        </span>
                        {r.product && (
                          <span className="ml-2 text-neutral-500">
                            {r.product}
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-1">
                        <select
                          value={r.matchedSku ?? ""}
                          onChange={(e) => setReviewMatch(i, e.target.value)}
                          className="w-full max-w-xs rounded-md border border-neutral-200 bg-white px-2 py-1 text-sm outline-none focus:border-neutral-900"
                        >
                          <option value="">— No match (skip) —</option>
                          {brandProducts.map((p) => (
                            <option key={p.sku} value={p.sku}>
                              {p.sku} — {p.product}
                              {p.strength != null
                                ? ` ${p.strength}${p.strengthUnit}`
                                : ""}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-neutral-500">
              Only rows with a matched item and a quantity above zero will be
              applied to &ldquo;Order packs&rdquo;. Fix any mismatches with the
              dropdown.
            </p>
          </section>
        )}

        <div className="no-print mb-6 flex flex-wrap items-center gap-4">
          <div className="flex gap-1 rounded-xl border border-neutral-200 bg-white p-1 shadow-sm">
            {(["Standard"] as Brand[]).map((b) => (
              <button
                key={b}
                onClick={() => setBrand(b)}
                className={`rounded-lg px-5 py-2 text-sm font-medium transition-colors ${
                  brand === b
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                {b}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Search product or SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
          />

          <label className="flex items-center gap-2 text-sm text-neutral-600">
            <input
              type="checkbox"
              checked={lowOnly}
              onChange={(e) => setLowOnly(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300"
            />
            Show only items needing reorder
          </label>

          <button
            onClick={applyAllSuggested}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
          >
            Order all suggested
          </button>
        </div>

        <div className="no-print overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
                <th className="px-3 py-3">SKU</th>
                <th className="px-3 py-3">Product</th>
                <th className="px-3 py-3 text-right">Strength</th>
                <th className="px-3 py-3 text-right">Pack</th>
                <th className="px-3 py-3 text-right">List /pack</th>
                <th className="px-3 py-3 text-right">On hand</th>
                <th className="px-3 py-3 text-right">Reorder pt</th>
                <th className="px-3 py-3 text-right">Target</th>
                <th className="px-3 py-3 text-right">Suggested</th>
                <th className="bg-neutral-100 px-3 py-3 text-right font-semibold text-neutral-900">
                  Order packs
                </th>
                <th className="px-3 py-3 text-right">Line total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.key}
                  className={`border-t border-neutral-100 hover:bg-amber-50 ${
                    r.low ? "bg-red-50/60" : ""
                  }`}
                >
                  <td className="px-3 py-2 font-mono text-xs text-neutral-600">
                    {r.sku}
                  </td>
                  <td className="px-3 py-2">{r.product}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {r.strength != null
                      ? `${r.strength} ${r.strengthUnit}`
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-neutral-500">
                    {r.vialsPerPack}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-neutral-500">
                    {r.noMoq != null ? currency(r.noMoq) : "—"}
                  </td>
                  <td className="px-2 py-1 text-right">
                    <NumCell
                      value={r.entry.onHand}
                      onChange={(v) => updateEntry(r.key, { onHand: v })}
                    />
                  </td>
                  <td className="px-2 py-1 text-right">
                    <NumCell
                      value={r.entry.reorderPoint}
                      onChange={(v) => updateEntry(r.key, { reorderPoint: v })}
                    />
                  </td>
                  <td className="px-2 py-1 text-right">
                    <NumCell
                      value={r.entry.targetStock}
                      onChange={(v) => updateEntry(r.key, { targetStock: v })}
                    />
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {r.suggested > 0 ? (
                      <button
                        onClick={() => useSuggested(r.key, r.suggested)}
                        className="rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-200"
                        title="Use suggested quantity"
                      >
                        {r.suggested} packs
                      </button>
                    ) : (
                      <span className="text-neutral-300">—</span>
                    )}
                  </td>
                  <td className="bg-neutral-50 px-2 py-1 text-right">
                    <NumCell
                      value={r.orderQty}
                      onChange={(v) => setOrderQty(r.key, v)}
                      emphasis
                    />
                  </td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">
                    {r.orderQty > 0 ? currency(r.lineTotal) : "—"}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={11}
                    className="px-3 py-8 text-center text-sm text-neutral-400"
                  >
                    No SKUs match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="no-print mt-6 flex flex-wrap items-center gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
            <span className="font-semibold">{brand} PO</span>
            <span className="text-neutral-500">
              {totals.lines} line{totals.lines === 1 ? "" : "s"}
            </span>
            <span className="text-neutral-500">{totals.packs} packs</span>
            <span className="text-neutral-500">{totals.vials} vials</span>
            <span className="flex items-center gap-2">
              <span className="text-neutral-500">Total:</span>
              <span className="rounded-md bg-neutral-900 px-2 py-1 font-semibold text-white">
                {currency(totals.cost)}
              </span>
            </span>
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            <button
              onClick={() => window.print()}
              disabled={totals.lines === 0}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Print / PDF
            </button>
            <button
              onClick={exportCsv}
              disabled={totals.lines === 0}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Export CSV
            </button>
            <button
              onClick={markReceived}
              disabled={totals.lines === 0}
              className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Mark received
            </button>
            <button
              onClick={clearOrder}
              disabled={totals.lines === 0}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear order
            </button>
          </div>
        </div>

        {hydrated && (
          <div className="print-only">
            <div className="mb-6">
              <h1 className="text-2xl font-bold">Purchase Order</h1>
              <p className="mt-1 text-sm">
                Supplier: <strong>{brand}</strong>
              </p>
              <p className="text-sm">Date: {orderDate}</p>
            </div>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-black text-left">
                  <th className="py-2 pr-3">SKU</th>
                  <th className="py-2 pr-3">Product</th>
                  <th className="py-2 pr-3">Strength</th>
                  <th className="py-2 pr-3 text-right">Pack</th>
                  <th className="py-2 pr-3 text-right">Packs</th>
                  <th className="py-2 pr-3 text-right">Unit</th>
                  <th className="py-2 text-right">Line total</th>
                </tr>
              </thead>
              <tbody>
                {orderRows.map((r) => (
                  <tr key={r.key} className="border-b border-neutral-300">
                    <td className="py-1 pr-3 font-mono text-xs">{r.sku}</td>
                    <td className="py-1 pr-3">{r.product}</td>
                    <td className="py-1 pr-3">
                      {r.strength != null
                        ? `${r.strength} ${r.strengthUnit}`
                        : "—"}
                    </td>
                    <td className="py-1 pr-3 text-right">{r.vialsPerPack}</td>
                    <td className="py-1 pr-3 text-right">{r.orderQty}</td>
                    <td className="py-1 pr-3 text-right">
                      {currency(r.noMoq ?? 0)}
                    </td>
                    <td className="py-1 text-right">{currency(r.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-black font-bold">
                  <td className="py-2 pr-3" colSpan={4}>
                    Total ({totals.lines} lines, {totals.vials} vials)
                  </td>
                  <td className="py-2 pr-3 text-right">{totals.packs}</td>
                  <td className="py-2 pr-3" />
                  <td className="py-2 text-right">{currency(totals.cost)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <p className="no-print mt-4 text-xs text-neutral-400">
          Inventory and order drafts are saved in this browser. Quantities for
          on hand / reorder point / target are in vials; orders are in packs.
          Suggested packs = ceil((target − on hand) ÷ pack size) when on hand ≤
          reorder point. &ldquo;Mark received&rdquo; adds ordered packs to on-hand
          stock.
        </p>
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: MatchedRow["status"] }) {
  if (status === "exact") {
    return (
      <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
        Matched
      </span>
    );
  }
  if (status === "fuzzy") {
    return (
      <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
        Best guess
      </span>
    );
  }
  return (
    <span className="rounded-md bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
      No match
    </span>
  );
}

function NumCell({
  value,
  onChange,
  emphasis = false,
}: {
  value: number;
  onChange: (v: number) => void;
  emphasis?: boolean;
}) {
  return (
    <input
      type="number"
      min="0"
      step="1"
      value={value === 0 ? "" : value}
      placeholder="0"
      onChange={(e) => {
        const v = parseInt(e.target.value, 10);
        onChange(Number.isNaN(v) ? 0 : v);
      }}
      className={`w-16 rounded-md border bg-white px-2 py-1 text-right text-sm tabular-nums outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 ${
        emphasis
          ? "border-neutral-400 font-semibold"
          : "border-neutral-200"
      }`}
    />
  );
}
