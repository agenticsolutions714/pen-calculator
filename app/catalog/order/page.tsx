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

export default function AuraOrderPage() {
  const { auraResolved } = useMergedProducts();
  const [order, setOrder] = useState<OrderMap>({});
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

  // Each Aura peptide expands to the full strength family its Standard source
  // belongs to — i.e. every mg Standard offers for that peptide.
  const groups = useMemo(() => {
    const byName = new Map<
      string,
      { name: string; category?: string; variants: Product[] }
    >();
    for (const a of auraResolved) {
      if (!a.sourceSku) continue;
      const src = standardBySku.get(a.sourceSku);
      if (!src || byName.has(src.product)) continue;
      const variants = standardProducts
        .filter((p) => p.product === src.product)
        .sort((x, y) => (x.strength ?? 0) - (y.strength ?? 0));
      byName.set(src.product, {
        name: a.product,
        category: a.category,
        variants,
      });
    }
    return [...byName.values()];
  }, [auraResolved]);

  const unsourced = useMemo(
    () => auraResolved.filter((a) => !a.sourceSku),
    [auraResolved],
  );

  // Roll the entered quantities up into a Standard purchase order.
  const po = useMemo(() => {
    const lines = Object.entries(order)
      .filter(([, qty]) => qty > 0)
      .map(([sku, packs]) => {
        const p = standardBySku.get(sku);
        const unit = p?.noMoq ?? 0;
        return {
          sku,
          product: p?.product ?? sku,
          strength: p?.strength ?? null,
          strengthUnit: p?.strengthUnit ?? "",
          vialsPerPack: p?.vialsPerPack ?? 10,
          packs,
          unit,
          lineTotal: unit * packs,
        };
      })
      .sort(
        (a, b) =>
          a.product.localeCompare(b.product) ||
          (a.strength ?? 0) - (b.strength ?? 0),
      );
    return {
      lines,
      packs: lines.reduce((s, l) => s + l.packs, 0),
      vials: lines.reduce((s, l) => s + l.packs * l.vialsPerPack, 0),
      cost: lines.reduce((s, l) => s + l.lineTotal, 0),
    };
  }, [order]);

  const orderDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const copyPo = () => {
    const header = "Packs\tSKU\tProduct\tUnit\tLine total";
    const lines = po.lines.map(
      (l) =>
        `${l.packs}\t${l.sku}\t${l.product}${
          l.strength != null ? ` ${l.strength}${l.strengthUnit}` : ""
        }\t${l.unit.toFixed(2)}\t${l.lineTotal.toFixed(2)}`,
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
    const header = ["SKU", "Product", "Strength", "Pack size", "Packs", "Unit", "Line total"];
    const rows = po.lines.map((l) =>
      [
        l.sku,
        l.product,
        l.strength != null ? `${l.strength} ${l.strengthUnit}` : "",
        l.vialsPerPack,
        l.packs,
        l.unit.toFixed(2),
        l.lineTotal.toFixed(2),
      ]
        .map(esc)
        .join(","),
    );
    const totalsRow = ["TOTAL", "", "", "", po.packs, "", po.cost.toFixed(2)]
      .map(esc)
      .join(",");
    const csv = [header.join(","), ...rows, totalsRow].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `PO-Standard-${date}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
            Each peptide lists every mg Standard stocks. Type quantities (in
            packs) next to the strengths you want — they roll up into a Standard
            purchase order below.
          </p>
        </div>
        <Link
          href="/catalog"
          className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          ← Back to tracker
        </Link>
      </header>

      <div className="no-print grid gap-4 sm:grid-cols-2">
        {groups.map((g) => (
          <section
            key={g.name}
            className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
          >
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="text-sm font-semibold text-neutral-900">
                {g.name}
              </h2>
              {g.category && (
                <span className="text-xs text-neutral-400">{g.category}</span>
              )}
            </div>
            <div className="space-y-1">
              {g.variants.map((v) => {
                const qty = order[v.sku] ?? 0;
                return (
                  <div
                    key={v.sku}
                    className={`flex items-center justify-between gap-3 rounded-lg px-2 py-1 ${
                      qty > 0 ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex items-baseline gap-2">
                      <span className="w-16 text-sm font-medium tabular-nums text-neutral-800">
                        {v.strength != null ? `${v.strength}${v.strengthUnit}` : "—"}
                      </span>
                      <span className="text-xs text-neutral-400">
                        {v.noMoq != null ? currency(v.noMoq) : "—"}/pack
                      </span>
                    </div>
                    <input
                      type="number"
                      min={0}
                      value={qty || ""}
                      onChange={(e) =>
                        setQty(
                          v.sku,
                          Math.max(0, Math.floor(Number(e.target.value) || 0)),
                        )
                      }
                      placeholder="0"
                      className="w-20 rounded-lg border border-neutral-300 px-2 py-1 text-right text-sm tabular-nums outline-none focus:border-neutral-900"
                    />
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {unsourced.length > 0 && (
        <p className="no-print mt-3 text-xs text-neutral-400">
          No Standard source (order elsewhere):{" "}
          {unsourced.map((u) => u.product).join(", ")}.
        </p>
      )}

      {/* Standard PO roll-up */}
      <section className="mt-8 rounded-xl border border-blue-200 bg-blue-50/60 p-5 shadow-sm">
        <div className="no-print mb-3 flex flex-wrap items-center gap-x-6 gap-y-1">
          <h2 className="text-sm font-semibold text-blue-900">
            Purchase Order → Standard
          </h2>
          <span className="text-xs text-blue-800/80">
            {po.lines.length} line{po.lines.length === 1 ? "" : "s"} ·{" "}
            {po.packs} packs · {po.vials} vials
          </span>
        </div>

        {po.lines.length === 0 ? (
          <p className="no-print text-sm text-neutral-500">
            Enter quantities above to build the order.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-blue-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-blue-200 text-left text-xs uppercase tracking-wide text-neutral-500">
                  <th className="px-3 py-2 font-medium text-right">Packs</th>
                  <th className="px-3 py-2 font-medium">SKU</th>
                  <th className="px-3 py-2 font-medium">Product</th>
                  <th className="px-3 py-2 font-medium text-right">Unit</th>
                  <th className="px-3 py-2 font-medium text-right">Line total</th>
                </tr>
              </thead>
              <tbody>
                {po.lines.map((l) => (
                  <tr
                    key={l.sku}
                    className="border-b border-neutral-100 last:border-0"
                  >
                    <td className="px-3 py-2 text-right tabular-nums font-semibold">
                      {l.packs}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-neutral-600">
                      {l.sku}
                    </td>
                    <td className="px-3 py-2">
                      {l.product}
                      {l.strength != null
                        ? ` · ${l.strength}${l.strengthUnit}`
                        : ""}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-neutral-500">
                      {currency(l.unit)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold">
                      {currency(l.lineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-blue-200 font-semibold">
                  <td className="px-3 py-2 text-right tabular-nums">
                    {po.packs}
                  </td>
                  <td className="px-3 py-2" colSpan={3}>
                    Total ({po.lines.length} lines, {po.vials} vials)
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {currency(po.cost)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <div className="no-print mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => window.print()}
            disabled={po.lines.length === 0}
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-40"
          >
            Print
          </button>
          <button
            onClick={exportCsv}
            disabled={po.lines.length === 0}
            className="rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-40"
          >
            Export CSV
          </button>
          <button
            onClick={copyPo}
            disabled={po.lines.length === 0}
            className="rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-40"
          >
            Copy
          </button>
          <button
            onClick={clearOrder}
            disabled={po.lines.length === 0}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-500 hover:bg-neutral-100 disabled:opacity-40"
          >
            Clear
          </button>
        </div>
      </section>
    </main>
  );
}
