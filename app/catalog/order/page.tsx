"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Nav from "../../components/Nav";
import {
  standardBySku,
  standardProducts,
  type Product,
} from "../../data/products";
import { useMergedProducts } from "../../data/auraOverrides";

const currency = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

const ORDER_KEY = "pen-calc-aura-order";

type OrderMap = Record<string, number>;

type OrderRow = {
  sku: string;
  peptide: string;
  category?: string;
  strength: number | null;
  strengthUnit: string;
  vialsPerPack: number;
  label: string;
  unit: number;
};

export default function AuraOrderPage() {
  const { auraResolved } = useMergedProducts();
  const [order, setOrder] = useState<OrderMap>({});
  const [search, setSearch] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(ORDER_KEY);
      if (stored) setOrder(JSON.parse(stored));
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      try {
        localStorage.setItem(ORDER_KEY, JSON.stringify(order));
      } catch {
        // ignore
      }
    }
  }, [order, hydrated]);

  const setQty = (sku: string, qty: number) =>
    setOrder((prev) => {
      const next = { ...prev };
      if (!qty || qty <= 0 || Number.isNaN(qty)) delete next[sku];
      else next[sku] = qty;
      return next;
    });

  // Preload one row per mg option per peptide: each Aura peptide expands to the
  // full strength family its Standard source belongs to.
  const allRows = useMemo(() => {
    const byName = new Map<string, { name: string; category?: string; variants: Product[] }>();
    for (const a of auraResolved) {
      if (!a.sourceSku) continue;
      const src = standardBySku.get(a.sourceSku);
      if (!src || byName.has(src.product)) continue;
      const variants = standardProducts
        .filter((p) => p.product === src.product)
        .sort((x, y) => (x.strength ?? 0) - (y.strength ?? 0));
      byName.set(src.product, { name: a.product, category: a.category, variants });
    }
    const rows: OrderRow[] = [];
    for (const g of byName.values()) {
      for (const v of g.variants) {
        const strengthPart =
          v.strength != null ? ` · ${v.strength}${v.strengthUnit}` : "";
        rows.push({
          sku: v.sku,
          peptide: g.name,
          category: g.category,
          strength: v.strength,
          strengthUnit: v.strengthUnit,
          vialsPerPack: v.vialsPerPack,
          label: `${g.name}${strengthPart} · ${v.vialSize}${v.vialUnit}`,
          unit: v.noMoq ?? 0,
        });
      }
    }
    return rows.sort(
      (a, b) =>
        a.peptide.localeCompare(b.peptide) ||
        (a.strength ?? 0) - (b.strength ?? 0),
    );
  }, [auraResolved]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allRows;
    return allRows.filter(
      (r) =>
        r.peptide.toLowerCase().includes(q) || r.sku.toLowerCase().includes(q),
    );
  }, [allRows, search]);

  const unsourced = useMemo(
    () => auraResolved.filter((a) => !a.sourceSku),
    [auraResolved],
  );

  // Roll the entered quantities up into a Standard purchase order.
  const po = useMemo(() => {
    const lines = allRows
      .filter((r) => (order[r.sku] ?? 0) > 0)
      .map((r) => {
        const packs = order[r.sku];
        return { ...r, packs, lineTotal: r.unit * packs };
      });
    return {
      lines,
      packs: lines.reduce((s, l) => s + l.packs, 0),
      vials: lines.reduce((s, l) => s + l.packs * l.vialsPerPack, 0),
      cost: lines.reduce((s, l) => s + l.lineTotal, 0),
    };
  }, [allRows, order]);

  const orderDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const copyPo = () => {
    const header = "Packs\tSKU\tProduct\tUnit\tLine total";
    const lines = po.lines.map(
      (l) =>
        `${l.packs}\t${l.sku}\t${l.label}\t${l.unit.toFixed(2)}\t${l.lineTotal.toFixed(2)}`,
    );
    const text = [
      `Purchase Order → Standard (${orderDate})`,
      header,
      ...lines,
      `TOTAL\t\t\t\t${po.cost.toFixed(2)}`,
    ].join("\n");
    navigator.clipboard?.writeText(text).catch(() => {});
  };

  const exportCsv = () => {
    if (po.lines.length === 0) return;
    const esc = (v: string | number) => {
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = ["SKU", "Product", "Pack size", "Packs", "Unit", "Line total"];
    const csvRows = po.lines.map((l) =>
      [l.sku, l.label, l.vialsPerPack, l.packs, l.unit.toFixed(2), l.lineTotal.toFixed(2)]
        .map(esc)
        .join(","),
    );
    const totalsRow = ["TOTAL", "", "", po.packs, "", po.cost.toFixed(2)]
      .map(esc)
      .join(",");
    const csv = [header.join(","), ...csvRows, totalsRow].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `PO-Standard-${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearOrder = () => setOrder({});

  return (
    <main className="mx-auto max-w-5xl px-4 pb-20 sm:px-6 lg:px-8">
      <Nav />

      <header className="no-print mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900">
            Order from Standard
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Every mg Standard stocks for each peptide is preloaded below. Enter
            quantities (in packs) next to the strengths you want; totals roll up
            into a Standard purchase order.
          </p>
        </div>
        <Link
          href="/catalog"
          className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          ← Back to tracker
        </Link>
      </header>

      <section className="no-print mb-4 grid gap-3 sm:grid-cols-3">
        <Stat label="Lines ordered" value={String(po.lines.length)} />
        <Stat label="Packs" value={String(po.packs)} />
        <Stat label="Total cost" value={currency(po.cost)} />
      </section>

      <div className="no-print mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          placeholder="Search by peptide or SKU…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-neutral-200 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-neutral-300 sm:max-w-xs"
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => window.print()}
            disabled={po.lines.length === 0}
            className="rounded-lg bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-40"
          >
            Print / PDF
          </button>
          <button
            onClick={exportCsv}
            disabled={po.lines.length === 0}
            className="rounded-lg border border-neutral-200 px-4 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-40"
          >
            Export CSV
          </button>
          <button
            onClick={copyPo}
            disabled={po.lines.length === 0}
            className="rounded-lg border border-neutral-200 px-4 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-40"
          >
            Copy
          </button>
          <button
            onClick={clearOrder}
            disabled={po.lines.length === 0}
            className="rounded-lg border border-neutral-200 px-4 py-1.5 text-sm font-medium text-neutral-500 hover:bg-neutral-100 disabled:opacity-40"
          >
            Clear
          </button>
        </div>
      </div>

      <section className="no-print overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="scroll-fade overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-5 py-3 font-medium">SKU</th>
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 text-right font-medium">Cost/pack</th>
                <th className="px-5 py-3 text-right font-medium">Qty (packs)</th>
                <th className="px-5 py-3 text-right font-medium">Line total</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-sm text-neutral-400"
                  >
                    No peptides match your search.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const qty = order[r.sku] ?? 0;
                  return (
                    <tr
                      key={r.sku}
                      className={`border-t border-neutral-100 ${
                        qty > 0 ? "bg-blue-50/50" : ""
                      }`}
                    >
                      <td className="px-5 py-2 font-mono text-xs">{r.sku}</td>
                      <td className="px-5 py-2">{r.label}</td>
                      <td className="px-5 py-2 text-right tabular-nums text-neutral-500">
                        {r.unit ? currency(r.unit) : "—"}
                      </td>
                      <td className="px-5 py-1.5 text-right">
                        <input
                          type="number"
                          min={0}
                          value={qty || ""}
                          onChange={(e) =>
                            setQty(
                              r.sku,
                              Math.max(0, Math.floor(Number(e.target.value) || 0)),
                            )
                          }
                          placeholder="0"
                          className="w-24 rounded-lg border border-neutral-300 px-2 py-1 text-right text-sm tabular-nums outline-none focus:border-neutral-900"
                        />
                      </td>
                      <td className="px-5 py-2 text-right font-medium tabular-nums">
                        {qty > 0 ? currency(r.unit * qty) : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {po.lines.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-neutral-200 bg-neutral-50 font-semibold">
                  <td className="px-5 py-3" colSpan={3}>
                    Total ({po.lines.length} lines, {po.packs} packs, {po.vials}{" "}
                    vials)
                  </td>
                  <td />
                  <td className="px-5 py-3 text-right tabular-nums">
                    {currency(po.cost)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>

      {unsourced.length > 0 && (
        <p className="no-print mt-3 text-xs text-neutral-400">
          No Standard source (order elsewhere):{" "}
          {unsourced.map((u) => u.product).join(", ")}.
        </p>
      )}

      {/* Print-only purchase order: ordered lines only */}
      {hydrated && po.lines.length > 0 && (
        <div className="print-only">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Purchase Order</h1>
            <p className="mt-1 text-sm">
              Supplier: <strong>Standard</strong>
            </p>
            <p className="text-sm">Date: {orderDate}</p>
          </div>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-black text-left">
                <th className="py-2 pr-3">SKU</th>
                <th className="py-2 pr-3">Product</th>
                <th className="py-2 pr-3 text-right">Pack</th>
                <th className="py-2 pr-3 text-right">Packs</th>
                <th className="py-2 pr-3 text-right">Unit</th>
                <th className="py-2 text-right">Line total</th>
              </tr>
            </thead>
            <tbody>
              {po.lines.map((l) => (
                <tr key={l.sku} className="border-b border-neutral-300">
                  <td className="py-1 pr-3 font-mono text-xs">{l.sku}</td>
                  <td className="py-1 pr-3">{l.label}</td>
                  <td className="py-1 pr-3 text-right">{l.vialsPerPack}</td>
                  <td className="py-1 pr-3 text-right">{l.packs}</td>
                  <td className="py-1 pr-3 text-right">{currency(l.unit)}</td>
                  <td className="py-1 text-right">{currency(l.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-black font-bold">
                <td className="py-2 pr-3" colSpan={3}>
                  Total ({po.lines.length} lines, {po.vials} vials)
                </td>
                <td className="py-2 pr-3 text-right">{po.packs}</td>
                <td className="py-2 pr-3" />
                <td className="py-2 text-right">{currency(po.cost)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
