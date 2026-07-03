"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Nav from "../../components/Nav";
import { AURA_CATEGORIES, standardProducts } from "../../data/products";
import { useMergedProducts } from "../../data/auraOverrides";

const currency = (n: number | null) =>
  n == null
    ? "—"
    : n.toLocaleString("en-US", { style: "currency", currency: "USD" });

// Standard SKUs offered as sources, labelled for the dropdown.
const SOURCE_OPTIONS = standardProducts.map((p) => ({
  sku: p.sku,
  label: `${p.sku} · ${p.product}${p.strength != null ? ` ${p.strength}${p.strengthUnit}` : ""}`,
}));

export default function AuraEditor() {
  const {
    auraResolved,
    overrides,
    setOverrides,
    addFromStandard,
    removeAddition,
    addedSkus,
    hydrated,
  } = useMergedProducts();

  const [addSku, setAddSku] = useState("");
  const [addCategory, setAddCategory] = useState<string>("Supplies");

  const handleAdd = () => {
    if (!addSku) return;
    addFromStandard(addSku, addCategory);
    setAddSku("");
  };

  const setSource = (sku: string, sourceSku: string | null) =>
    setOverrides((prev) => ({
      ...prev,
      [sku]: { ...prev[sku], sourceSku },
    }));

  const setStrength = (sku: string, value: string) =>
    setOverrides((prev) => {
      const next = { ...prev[sku] };
      if (value.trim() === "") {
        // blank ⇒ clear the manual override, fall back to the source strength
        delete next.strength;
      } else {
        next.strength = Number(value);
      }
      return { ...prev, [sku]: next };
    });

  const clearStrength = (sku: string) =>
    setOverrides((prev) => {
      const next = { ...prev[sku] };
      delete next.strength;
      return { ...prev, [sku]: next };
    });

  // Clear every manual strength override so all strengths inherit their source.
  const fillStrengthsFromSource = () =>
    setOverrides((prev) => {
      const next: typeof prev = {};
      for (const [sku, o] of Object.entries(prev)) {
        const rest = { ...o };
        delete rest.strength;
        if (Object.keys(rest).length) next[sku] = rest;
      }
      return next;
    });

  const resetAll = () => setOverrides({});

  // Paste a column copied from a spreadsheet: one value per row, top-to-bottom
  // in the order shown. Empty cells are skipped.
  const pasteColumn = async (field: "sourceSku" | "strength") => {
    try {
      const text = await navigator.clipboard.readText();
      const cells = text
        .split(/\r?\n/)
        .map((c) => c.split("\t")[0].trim());
      setOverrides((prev) => {
        const next = { ...prev };
        auraResolved.forEach((p, i) => {
          const cell = cells[i];
          if (cell == null || cell === "") return;
          const cur = { ...next[p.sku] };
          if (field === "sourceSku") {
            cur.sourceSku = cell;
          } else {
            cur.strength = Number(cell);
          }
          next[p.sku] = cur;
        });
        return next;
      });
    } catch {
      // clipboard blocked — no-op
    }
  };

  const overrideCount = useMemo(
    () =>
      Object.values(overrides).filter(
        (o) => o.sourceSku !== undefined || o.strength !== undefined,
      ).length,
    [overrides],
  );

  return (
    <main className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
      <Nav />

      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900">
            Bulk edit — Aura line
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Each Aura SKU is sourced from a Standard product; strength and cost
            follow the source. Edit like a sheet — change a source, override a
            strength, or paste a whole column from Excel.
          </p>
        </div>
        <Link
          href="/catalog"
          className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          ← Back to tracker
        </Link>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          onClick={fillStrengthsFromSource}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Fill strengths from source
        </button>
        <button
          onClick={() => pasteColumn("sourceSku")}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Paste source column
        </button>
        <button
          onClick={() => pasteColumn("strength")}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Paste strength column
        </button>
        <button
          onClick={resetAll}
          disabled={overrideCount === 0}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
        >
          Reset all{overrideCount ? ` (${overrideCount})` : ""}
        </button>
        <span className="text-xs text-neutral-400">
          Edits save automatically to this browser.
        </span>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-2 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-neutral-500">
            Add a Standard SKU to the Aura line
          </span>
          <select
            value={addSku}
            onChange={(e) => setAddSku(e.target.value)}
            className="w-full min-w-[18rem] rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-neutral-900"
          >
            <option value="">Select a Standard product…</option>
            {SOURCE_OPTIONS.map((s) => (
              <option key={s.sku} value={s.sku}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-neutral-500">Category</span>
          <select
            value={addCategory}
            onChange={(e) => setAddCategory(e.target.value)}
            className="rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-neutral-900"
          >
            {AURA_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={handleAdd}
          disabled={!addSku}
          className="rounded-lg bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-40"
        >
          Add to Aura
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500">
              <th className="px-3 py-2 font-medium">Product</th>
              <th className="px-3 py-2 font-medium">SKU</th>
              <th className="px-3 py-2 font-medium">Source (Standard)</th>
              <th className="px-3 py-2 font-medium">Strength</th>
              <th className="px-3 py-2 font-medium">noMoq</th>
              <th className="px-3 py-2 font-medium">moq50</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {auraResolved.map((p) => {
              const o = overrides[p.sku] ?? {};
              const strengthOverridden = o.strength !== undefined;
              return (
                <tr
                  key={p.sku}
                  className="border-b border-neutral-100 last:border-0"
                >
                  <td className="px-3 py-2">
                    <div className="font-medium text-neutral-900">
                      {p.product}
                    </div>
                    <div className="text-xs text-neutral-400">
                      {p.category}
                    </div>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-neutral-500">
                    {p.sku}
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={p.sourceSku ?? ""}
                      onChange={(e) =>
                        setSource(p.sku, e.target.value || null)
                      }
                      className="w-full max-w-[16rem] rounded-lg border border-neutral-300 bg-white px-2 py-1 text-sm outline-none focus:border-neutral-900"
                    >
                      <option value="">— none (unsourced) —</option>
                      {SOURCE_OPTIONS.map((s) => (
                        <option key={s.sku} value={s.sku}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        value={p.strength ?? ""}
                        onChange={(e) => setStrength(p.sku, e.target.value)}
                        placeholder="—"
                        className={`w-20 rounded-lg border px-2 py-1 text-sm tabular-nums outline-none focus:border-neutral-900 ${
                          strengthOverridden
                            ? "border-amber-400 bg-amber-50"
                            : "border-neutral-300"
                        }`}
                        title={
                          strengthOverridden
                            ? "Manually overridden — clear to inherit from source"
                            : "Inherited from source"
                        }
                      />
                      <span className="text-xs text-neutral-400">
                        {p.strengthUnit || "mg"}
                      </span>
                      {strengthOverridden && (
                        <button
                          onClick={() => clearStrength(p.sku)}
                          title="Reset to source strength"
                          className="text-xs text-neutral-400 hover:text-neutral-700"
                        >
                          ↺
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 tabular-nums text-neutral-700">
                    {currency(p.noMoq)}
                  </td>
                  <td className="px-3 py-2 tabular-nums text-neutral-700">
                    {currency(p.moq50)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {addedSkus.has(p.sku) ? (
                      <button
                        onClick={() => removeAddition(p.sku)}
                        title="Remove this added SKU"
                        className="rounded px-1.5 text-neutral-400 hover:text-red-600"
                      >
                        ✕
                      </button>
                    ) : (
                      <span className="text-xs text-neutral-300">•</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!hydrated && (
        <p className="mt-3 text-xs text-neutral-400">Loading your edits…</p>
      )}
    </main>
  );
}
