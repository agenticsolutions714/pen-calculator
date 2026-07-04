"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Nav from "../../components/Nav";
import {
  AURA_CATEGORIES,
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
  compound: string;
  category: string;
  strength: number | null;
  strengthUnit: string;
  vialsPerPack: number;
  label: string;
  unit: number;
};

// Distinct Standard peptide names, each with its representative (lowest-mg) SKU.
const STANDARD_PEPTIDES = (() => {
  const byName = new Map<string, Product>();
  for (const p of standardProducts) {
    const cur = byName.get(p.product);
    if (!cur || (p.strength ?? 0) < (cur.strength ?? 0)) byName.set(p.product, p);
  }
  return [...byName.entries()]
    .map(([name, rep]) => ({ name, repSku: rep.sku }))
    .sort((a, b) => a.name.localeCompare(b.name));
})();

export default function AuraOrderPage() {
  const { auraResolved, addFromStandard, additions, removeAddition } =
    useMergedProducts();
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
  const { allRows, usedCompounds } = useMemo(() => {
    const byName = new Map<
      string,
      { name: string; compound: string; category: string; variants: Product[] }
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
        compound: src.product,
        category: a.category ?? "Supplies",
        variants,
      });
    }
    const rows: OrderRow[] = [];
    for (const g of byName.values()) {
      const head =
        g.compound && g.compound !== g.name
          ? `${g.name} (${g.compound})`
          : g.name;
      for (const v of g.variants) {
        const strengthPart =
          v.strength != null ? ` · ${v.strength}${v.strengthUnit}` : "";
        rows.push({
          sku: v.sku,
          peptide: g.name,
          compound: g.compound,
          category: g.category,
          strength: v.strength,
          strengthUnit: v.strengthUnit,
          vialsPerPack: v.vialsPerPack,
          label: `${head}${strengthPart} · ${v.vialSize}${v.vialUnit}`,
          unit: v.noMoq ?? 0,
        });
      }
    }
    rows.sort(
      (a, b) =>
        a.peptide.localeCompare(b.peptide) ||
        (a.strength ?? 0) - (b.strength ?? 0),
    );
    return {
      allRows: rows,
      usedCompounds: new Set([...byName.values()].map((g) => g.compound)),
    };
  }, [auraResolved]);

  const q = search.trim().toLowerCase();
  const rowMatches = (r: OrderRow) =>
    !q ||
    r.peptide.toLowerCase().includes(q) ||
    r.compound.toLowerCase().includes(q) ||
    r.sku.toLowerCase().includes(q);

  // Standard peptides not yet in the Aura line — offered in the add dropdowns.
  const availablePeptides = useMemo(
    () => STANDARD_PEPTIDES.filter((p) => !usedCompounds.has(p.name)),
    [usedCompounds],
  );

  const addPeptide = (name: string, category: string) => {
    const p = STANDARD_PEPTIDES.find((x) => x.name === name);
    if (p) addFromStandard(p.repSku, category);
  };

  // Which added Aura SKU (if any) backs a given compound — so we can remove it.
  const additionByCompound = useMemo(() => {
    const m = new Map<string, string>();
    for (const a of additions) {
      const src = standardBySku.get(a.sourceSku);
      if (src) m.set(src.product, a.sku);
    }
    return m;
  }, [additions]);

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
            Peptides are grouped by category with every mg Standard stocks
            preloaded. Add a peptide to any category to populate its orderable
            strengths, then enter quantities (in packs).
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

      <div className="no-print mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

      {AURA_CATEGORIES.map((category) => {
        const catRows = allRows.filter(
          (r) => r.category === category && rowMatches(r),
        );
        // Peptides in this category, to allow removing user-added ones.
        const peptidesHere = [...new Set(catRows.map((r) => r.compound))];
        return (
          <section
            key={category}
            className="no-print mb-6 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 bg-neutral-50 px-5 py-2.5">
              <h2 className="text-sm font-semibold text-neutral-900">
                {category}
                <span className="ml-2 font-normal text-neutral-400">
                  {peptidesHere.length} peptide
                  {peptidesHere.length === 1 ? "" : "s"}
                </span>
              </h2>
              <AddPeptide
                category={category}
                options={availablePeptides.map((p) => p.name)}
                onAdd={(name) => addPeptide(name, category)}
              />
            </div>

            {catRows.length === 0 ? (
              <p className="px-5 py-6 text-sm text-neutral-400">
                No peptides here yet. Add one from Standard above to populate its
                orderable strengths.
              </p>
            ) : (
              <div className="scroll-fade overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-sm">
                  <thead className="text-left text-xs uppercase tracking-wide text-neutral-500">
                    <tr>
                      <th className="px-5 py-2 font-medium">SKU</th>
                      <th className="px-5 py-2 font-medium">Product</th>
                      <th className="px-5 py-2 text-right font-medium">
                        Cost/pack
                      </th>
                      <th className="px-5 py-2 text-right font-medium">
                        Qty (packs)
                      </th>
                      <th className="px-5 py-2 text-right font-medium">
                        Line total
                      </th>
                      <th className="px-2 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {catRows.map((r) => {
                      const qty = order[r.sku] ?? 0;
                      const addedSku = additionByCompound.get(r.compound);
                      const isFirstOfPeptide =
                        catRows.find((x) => x.compound === r.compound) === r;
                      return (
                        <tr
                          key={r.sku}
                          className={`border-t border-neutral-100 ${
                            qty > 0 ? "bg-blue-50/50" : ""
                          }`}
                        >
                          <td className="px-5 py-2 font-mono text-xs">
                            {r.sku}
                          </td>
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
                                  Math.max(
                                    0,
                                    Math.floor(Number(e.target.value) || 0),
                                  ),
                                )
                              }
                              placeholder="0"
                              className="w-24 rounded-lg border border-neutral-300 px-2 py-1 text-right text-sm tabular-nums outline-none focus:border-neutral-900"
                            />
                          </td>
                          <td className="px-5 py-2 text-right font-medium tabular-nums">
                            {qty > 0 ? currency(r.unit * qty) : "—"}
                          </td>
                          <td className="px-2 py-2 text-right">
                            {addedSku && isFirstOfPeptide && (
                              <button
                                onClick={() => removeAddition(addedSku)}
                                title={`Remove ${r.peptide} from the Aura line`}
                                className="text-xs text-neutral-300 hover:text-red-600"
                              >
                                ✕
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        );
      })}

      {po.lines.length > 0 && (
        <section className="no-print mb-6 flex flex-wrap items-center gap-x-6 gap-y-1 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <span className="font-semibold">PO → Standard</span>
          <span className="text-neutral-500">{po.lines.length} lines</span>
          <span className="text-neutral-500">{po.packs} packs</span>
          <span className="text-neutral-500">{po.vials} vials</span>
          <span className="flex items-center gap-2">
            <span className="text-neutral-500">Total:</span>
            <span className="rounded-md bg-neutral-900 px-2 py-1 font-semibold text-white">
              {currency(po.cost)}
            </span>
          </span>
        </section>
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

function AddPeptide({
  category,
  options,
  onAdd,
}: {
  category: string;
  options: string[];
  onAdd: (name: string) => void;
}) {
  const [value, setValue] = useState("");
  return (
    <div className="flex items-center gap-2">
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label={`Add a peptide to ${category}`}
        className="max-w-[14rem] rounded-lg border border-neutral-300 bg-white px-2 py-1 text-sm outline-none focus:border-neutral-900"
      >
        <option value="">Add peptide from Standard…</option>
        {options.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
      <button
        onClick={() => {
          if (value) {
            onAdd(value);
            setValue("");
          }
        }}
        disabled={!value}
        className="rounded-lg bg-neutral-900 px-3 py-1 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-40"
      >
        Add
      </button>
    </div>
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
