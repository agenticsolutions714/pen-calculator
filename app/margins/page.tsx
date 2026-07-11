"use client";

import { useMemo, useState } from "react";
import Nav from "../components/Nav";
import { type AuraVariant, expandAuraVariants, useMergedProducts } from "../data/auraOverrides";
import { useSharedMap } from "../data/sharedState";

type RetailEntry = { price: number };

const currency = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

function StatCard({ label, value, hint, color }: { label: string; value: string; hint?: string; color?: string }) {
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${color === "red" ? "border-red-200 bg-red-50" : color === "green" ? "border-emerald-200 bg-emerald-50" : "border-neutral-200 bg-white"}`}>
      <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${color === "red" ? "text-red-700" : color === "green" ? "text-emerald-700" : "text-neutral-900"}`}>{value}</div>
      {hint && <div className="mt-0.5 text-xs text-neutral-500">{hint}</div>}
    </div>
  );
}

export default function MarginsPage() {
  const { auraResolved } = useMergedProducts();
  const retailStore = useSharedMap<RetailEntry>("retail");
  const retailMap = retailStore.map;

  const [processingRate, setProcessingRate] = useState(12);
  const [monthlyFee, setMonthlyFee] = useState(500);
  const [adSpend, setAdSpend] = useState(0);
  const [ordersPerMonth, setOrdersPerMonth] = useState(30);
  const [sellingUnit, setSellingUnit] = useState<"vial" | "pack">("vial");
  const [showOnlyPriced, setShowOnlyPriced] = useState(false);

  const variants = useMemo(() => expandAuraVariants(auraResolved), [auraResolved]);

  const setRetail = (sku: string, price: number) => {
    retailStore.setItem(sku, { price });
  };

  const rows = useMemo(() => {
    return variants.map((v) => {
      const retail = retailMap[v.sku]?.price ?? null;
      const costPack = v.noMoq;
      const vialsPerPack = v.vialsPerPack || 10;
      const costVial = costPack != null ? costPack / vialsPerPack : null;
      const unitCost = sellingUnit === "vial" ? costVial : costPack;

      let afterProcessing: number | null = null;
      let grossProfit: number | null = null;
      let margin: number | null = null;

      if (retail != null && retail > 0) {
        afterProcessing = retail * (1 - processingRate / 100);
        if (unitCost != null) {
          grossProfit = afterProcessing - unitCost;
          margin = grossProfit / retail;
        }
      }

      return { ...v, retail, unitCost, afterProcessing, grossProfit, margin, vialsPerPack };
    });
  }, [variants, retailMap, processingRate, sellingUnit]);

  const pricedRows = useMemo(() => rows.filter((r) => r.retail != null && r.unitCost != null), [rows]);
  const profitableRows = pricedRows.filter((r) => r.grossProfit != null && r.grossProfit > 0);
  const losingRows = pricedRows.filter((r) => r.grossProfit != null && r.grossProfit <= 0);

  const totalRevPerOrder = pricedRows.length > 0
    ? pricedRows.reduce((s, r) => s + (r.retail ?? 0), 0) / pricedRows.length
    : 0;
  const avgMargin = pricedRows.length > 0
    ? pricedRows.reduce((s, r) => s + (r.margin ?? 0), 0) / pricedRows.length
    : 0;

  const monthlyRevenue = totalRevPerOrder * ordersPerMonth;
  const monthlyProcessingCost = monthlyRevenue * (processingRate / 100);
  const totalMonthlyCosts = monthlyProcessingCost + monthlyFee + adSpend;
  const avgCostPerOrder = pricedRows.length > 0
    ? pricedRows.reduce((s, r) => s + (r.unitCost ?? 0), 0) / pricedRows.length
    : 0;
  const monthlyGross = (totalRevPerOrder - avgCostPerOrder) * ordersPerMonth;
  const monthlyNet = monthlyGross - totalMonthlyCosts;

  const breakEvenOrders = totalRevPerOrder > 0 && avgMargin > 0
    ? Math.ceil((monthlyFee + adSpend) / (totalRevPerOrder * avgMargin - totalRevPerOrder * (processingRate / 100)))
    : null;

  const displayRows = showOnlyPriced ? pricedRows : rows;

  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
      <Nav />

      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-neutral-900">Margin Calculator</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Calculate profitability per SKU using your Aura catalog costs and auravials.com retail prices.
          Factors in merchant processing fees, monthly costs, and ad spend.
        </p>
      </header>

      <section className="mb-6 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-neutral-900">Merchant Processing & Costs</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <div>
            <label className="block text-xs font-medium text-neutral-600">Processing Rate</label>
            <div className="mt-1 flex items-center gap-1">
              <input
                type="number"
                min={0}
                max={50}
                step={0.5}
                value={processingRate}
                onChange={(e) => setProcessingRate(Number(e.target.value) || 0)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-sm tabular-nums outline-none focus:border-neutral-900"
              />
              <span className="text-sm text-neutral-500">%</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600">Monthly Fee</label>
            <div className="mt-1 flex items-center gap-1">
              <span className="text-sm text-neutral-500">$</span>
              <input
                type="number"
                min={0}
                value={monthlyFee}
                onChange={(e) => setMonthlyFee(Number(e.target.value) || 0)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-sm tabular-nums outline-none focus:border-neutral-900"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600">Ad Spend / mo</label>
            <div className="mt-1 flex items-center gap-1">
              <span className="text-sm text-neutral-500">$</span>
              <input
                type="number"
                min={0}
                value={adSpend}
                onChange={(e) => setAdSpend(Number(e.target.value) || 0)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-sm tabular-nums outline-none focus:border-neutral-900"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600">Orders / mo</label>
            <input
              type="number"
              min={1}
              value={ordersPerMonth}
              onChange={(e) => setOrdersPerMonth(Math.max(1, Number(e.target.value) || 1))}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-sm tabular-nums outline-none focus:border-neutral-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600">Selling Unit</label>
            <select
              value={sellingUnit}
              onChange={(e) => setSellingUnit(e.target.value as "vial" | "pack")}
              className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-neutral-900"
            >
              <option value="vial">Per Vial</option>
              <option value="pack">Per Pack (10 vials)</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-neutral-600">
              <input
                type="checkbox"
                checked={showOnlyPriced}
                onChange={(e) => setShowOnlyPriced(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300"
              />
              Only priced
            </label>
          </div>
        </div>
      </section>

      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Avg Retail" value={totalRevPerOrder > 0 ? currency(totalRevPerOrder) : "—"} hint="per order" />
        <StatCard label="Avg Margin" value={avgMargin > 0 ? pct(avgMargin) : "—"} hint="after processing" color={avgMargin > 0.3 ? "green" : avgMargin > 0 ? undefined : "red"} />
        <StatCard label="Profitable" value={`${profitableRows.length}/${pricedRows.length}`} hint="SKUs" color="green" />
        <StatCard label="Losing Money" value={String(losingRows.length)} hint="SKUs" color={losingRows.length > 0 ? "red" : undefined} />
        <StatCard label="Monthly Net" value={monthlyNet !== 0 ? currency(monthlyNet) : "—"} hint={`on ${ordersPerMonth} orders`} color={monthlyNet > 0 ? "green" : monthlyNet < 0 ? "red" : undefined} />
        <StatCard label="Breakeven" value={breakEvenOrders != null && breakEvenOrders > 0 ? `${breakEvenOrders}` : "—"} hint="orders/mo" />
      </section>

      {losingRows.length > 0 && (
        <section className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
          <h2 className="text-sm font-semibold text-red-900">Losing money on {losingRows.length} SKU{losingRows.length > 1 ? "s" : ""}</h2>
          <p className="mt-1 text-sm text-red-800/80">
            {losingRows.map((r) => `${r.product} ${r.strength ?? ""}${r.strengthUnit} (${currency(r.grossProfit!)})`).join(", ")}
          </p>
        </section>
      )}

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500">
              <th className="px-3 py-2 font-medium">Product</th>
              <th className="px-3 py-2 font-medium">SKU</th>
              <th className="px-3 py-2 font-medium">Cost/{sellingUnit}</th>
              <th className="px-3 py-2 font-medium">Retail Price</th>
              <th className="px-3 py-2 font-medium">After {processingRate}%</th>
              <th className="px-3 py-2 font-medium">Profit</th>
              <th className="px-3 py-2 font-medium">Margin</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((r) => {
              const losing = r.grossProfit != null && r.grossProfit <= 0;
              return (
                <tr key={r.sku} className={`border-b border-neutral-100 last:border-0 ${losing ? "bg-red-50/50" : ""}`}>
                  <td className="px-3 py-2">
                    <div className="font-medium text-neutral-900">{r.product}</div>
                    {r.subtitle && <div className="text-xs text-neutral-500">{r.subtitle}</div>}
                    {r.strength != null && (
                      <div className="text-xs text-neutral-400">{r.strength}{r.strengthUnit} · {r.vialsPerPack} vials/pack</div>
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-neutral-500">{r.sku}</td>
                  <td className="px-3 py-2 tabular-nums text-neutral-700">
                    {r.unitCost != null ? currency(r.unitCost) : <span className="text-amber-600 text-xs">No cost</span>}
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={r.retail ?? ""}
                      onChange={(e) => setRetail(r.sku, Number(e.target.value) || 0)}
                      placeholder="$0"
                      className="w-24 rounded-lg border border-neutral-300 px-2 py-1 text-sm tabular-nums outline-none focus:border-neutral-900"
                    />
                  </td>
                  <td className="px-3 py-2 tabular-nums text-neutral-700">
                    {r.afterProcessing != null ? currency(r.afterProcessing) : "—"}
                  </td>
                  <td className={`px-3 py-2 tabular-nums font-medium ${losing ? "text-red-600" : r.grossProfit != null ? "text-emerald-700" : "text-neutral-400"}`}>
                    {r.grossProfit != null ? currency(r.grossProfit) : "—"}
                  </td>
                  <td className={`px-3 py-2 tabular-nums ${losing ? "text-red-600" : r.margin != null ? "text-neutral-700" : "text-neutral-400"}`}>
                    {r.margin != null ? pct(r.margin) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <section className="mt-8 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-neutral-900">Monthly P&L Estimate</h2>
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <div className="flex justify-between border-b border-neutral-100 py-1">
            <span className="text-neutral-600">Revenue ({ordersPerMonth} orders × {currency(totalRevPerOrder)} avg)</span>
            <span className="font-medium tabular-nums">{currency(monthlyRevenue)}</span>
          </div>
          <div className="flex justify-between border-b border-neutral-100 py-1">
            <span className="text-neutral-600">COGS (product cost)</span>
            <span className="font-medium tabular-nums text-red-600">-{currency(avgCostPerOrder * ordersPerMonth)}</span>
          </div>
          <div className="flex justify-between border-b border-neutral-100 py-1">
            <span className="text-neutral-600">Processing ({processingRate}%)</span>
            <span className="font-medium tabular-nums text-red-600">-{currency(monthlyProcessingCost)}</span>
          </div>
          <div className="flex justify-between border-b border-neutral-100 py-1">
            <span className="text-neutral-600">Compliance fee</span>
            <span className="font-medium tabular-nums text-red-600">-{currency(monthlyFee)}</span>
          </div>
          <div className="flex justify-between border-b border-neutral-100 py-1">
            <span className="text-neutral-600">Ad spend</span>
            <span className="font-medium tabular-nums text-red-600">-{currency(adSpend)}</span>
          </div>
          <div className="flex justify-between border-t border-neutral-300 pt-2 font-semibold">
            <span>Net Profit</span>
            <span className={`tabular-nums ${monthlyNet >= 0 ? "text-emerald-700" : "text-red-600"}`}>{currency(monthlyNet)}</span>
          </div>
        </div>
      </section>
    </main>
  );
}
