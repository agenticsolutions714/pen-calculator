"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  type CostBasis,
  type PriceMode,
  buildPriceSheet,
} from "../data/pricing";
import type { Brand } from "../data/products";
import { createPreset, deletePreset } from "../actions/brokerage";
import type { PricingPresetRow } from "../db/schema";

const currency = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

type BrandFilter = Brand | "all";

export default function PriceSheetBuilder({
  presets,
}: {
  presets: PricingPresetRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [mode, setMode] = useState<PriceMode>("markup");
  const [pctInput, setPctInput] = useState("40");
  const [basis, setBasis] = useState<CostBasis>("noMoq");
  const [brand, setBrand] = useState<BrandFilter>("all");
  const [search, setSearch] = useState("");
  const [presetName, setPresetName] = useState("");

  const pct = Number.parseFloat(pctInput);
  const pctValid =
    Number.isFinite(pct) && pct >= 0 && (mode === "markup" || pct < 100);

  const rows = useMemo(
    () =>
      buildPriceSheet({
        mode,
        pct: pctValid ? pct : 0,
        basis,
        brand,
        search,
      }),
    [mode, pct, pctValid, basis, brand, search],
  );

  const totals = useMemo(() => {
    const cost = rows.reduce((s, r) => s + r.cost, 0);
    const price = rows.reduce((s, r) => s + r.price, 0);
    return { cost, price, profit: price - cost };
  }, [rows]);

  const printHref = useMemo(() => {
    const params = new URLSearchParams({
      mode,
      pct: pctValid ? String(pct) : "0",
      basis,
      brand,
    });
    if (search.trim()) params.set("q", search.trim());
    return `/price-sheet/print?${params.toString()}`;
  }, [mode, pct, pctValid, basis, brand, search]);

  const downloadCsv = () => {
    const header = ["SKU", "Product", "Brand", "Price/vial", "Price/pack"];
    const lines = rows.map((r) =>
      [r.sku, r.label, r.brand, r.pricePerVial.toFixed(2), r.price.toFixed(2)]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(","),
    );
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const d = new Date();
    const stamp = `${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}-${d.getFullYear()}`;
    a.href = url;
    a.download = `aura.pricesheet.${stamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadPreset = (id: number) => {
    const p = presets.find((x) => x.id === id);
    if (!p) return;
    setMode(p.mode === "margin" ? "margin" : "markup");
    setPctInput(String(p.pct));
    setBasis(p.basis === "moq50" ? "moq50" : "noMoq");
  };

  const saveAsPreset = () => {
    const name = presetName.trim();
    if (!name || !pctValid) return;
    startTransition(async () => {
      await createPreset({ name, mode, pct, basis });
      setPresetName("");
      router.refresh();
    });
  };

  const removePreset = (id: number) => {
    if (!confirm("Delete this preset?")) return;
    startTransition(async () => {
      await deletePreset(id);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Pricing presets
        </h2>
        {presets.length === 0 ? (
          <p className="text-sm text-neutral-400">
            No presets yet. Configure a markup or margin below and save it as a
            preset to reuse it on the Orders page.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm"
              >
                <button
                  onClick={() => loadPreset(p.id)}
                  className="font-medium text-neutral-700 hover:text-neutral-900"
                  title="Load this preset into the controls"
                >
                  {p.name}
                </button>
                <span className="text-xs text-neutral-400">
                  {p.mode === "margin" ? "Margin" : "Markup"} {p.pct}% ·{" "}
                  {p.basis === "moq50" ? "MOQ 50+" : "List"}
                </span>
                <button
                  onClick={() => removePreset(p.id)}
                  disabled={isPending}
                  className="text-xs text-red-400 hover:text-red-600"
                  aria-label={`Delete preset ${p.name}`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="Name this configuration…"
            className="w-full rounded-lg border border-neutral-200 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-neutral-300 sm:max-w-xs"
          />
          <button
            onClick={saveAsPreset}
            disabled={isPending || !presetName.trim() || !pctValid}
            className="rounded-lg border border-neutral-300 px-4 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-40"
          >
            Save current as preset
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Pricing method
            </label>
            <div className="flex rounded-lg border border-neutral-200 p-0.5">
              <button
                onClick={() => setMode("markup")}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  mode === "markup"
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                Markup
              </button>
              <button
                onClick={() => setMode("margin")}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  mode === "margin"
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                Margin
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {mode === "markup" ? "Markup %" : "Margin %"}
            </label>
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                value={pctInput}
                onChange={(e) => setPctInput(e.target.value)}
                className={`w-full rounded-lg border px-3 py-1.5 text-sm tabular-nums outline-none focus:ring-2 ${
                  pctValid
                    ? "border-neutral-200 focus:ring-neutral-300"
                    : "border-red-300 focus:ring-red-200"
                }`}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">
                %
              </span>
            </div>
            {!pctValid ? (
              <p className="mt-1 text-xs text-red-500">
                {mode === "margin"
                  ? "Margin must be between 0 and 99.99%."
                  : "Enter a valid percentage."}
              </p>
            ) : null}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Cost basis
            </label>
            <select
              value={basis}
              onChange={(e) => setBasis(e.target.value as CostBasis)}
              className="w-full rounded-lg border border-neutral-200 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-neutral-300"
            >
              <option value="noMoq">List (no MOQ)</option>
              <option value="moq50">MOQ 50+</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Supplier
            </label>
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value as BrandFilter)}
              className="w-full rounded-lg border border-neutral-200 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-neutral-300"
            >
              <option value="all">All suppliers</option>
              <option value="Standard">Standard</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="search"
            placeholder="Search by SKU or product…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-neutral-300 sm:max-w-xs"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={downloadCsv}
              disabled={rows.length === 0}
              className="rounded-lg border border-neutral-200 px-4 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-40"
            >
              Export CSV
            </button>
            <Link
              href={printHref}
              className="rounded-lg bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
            >
              Print / PDF
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Stat label="Products" value={String(rows.length)} />
        <Stat label="Total cost" value={currency(totals.cost)} />
        <Stat label="Total sell" value={currency(totals.price)} />
      </section>

      <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-100 px-5 py-2.5 text-xs text-neutral-500">
          All products are whitelabel vials with clear caps. All inventory is
          local and US&#8209;based. This note appears on the printed sheet.
        </div>
        <div className="scroll-fade overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-5 py-3 font-medium">SKU</th>
              <th className="px-5 py-3 font-medium">Product</th>
              <th className="px-5 py-3 font-medium">Supplier</th>
              <th className="px-5 py-3 text-right font-medium">Cost</th>
              <th className="px-5 py-3 text-right font-medium">Sell/vial</th>
              <th className="px-5 py-3 text-right font-medium">Sell/pack</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-10 text-center text-sm text-neutral-400"
                >
                  No products match your filters.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={`${r.brand}-${r.sku}`}
                  className="border-t border-neutral-100"
                >
                  <td className="px-5 py-2 font-mono text-xs">{r.sku}</td>
                  <td className="px-5 py-2">{r.label}</td>
                  <td className="px-5 py-2 text-neutral-500">{r.brand}</td>
                  <td className="px-5 py-2 text-right tabular-nums text-neutral-500">
                    {currency(r.cost)}
                  </td>
                  <td className="px-5 py-2 text-right tabular-nums text-neutral-600">
                    {currency(r.pricePerVial)}
                  </td>
                  <td className="px-5 py-2 text-right font-medium tabular-nums">
                    {currency(r.price)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </section>
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
