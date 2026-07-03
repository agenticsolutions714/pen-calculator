"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Nav from "../components/Nav";
import { AURA_CATEGORIES, type Product } from "../data/products";
import { useMergedProducts } from "../data/auraOverrides";
import {
  type BatchMap,
  ensureBatches,
  loadBatches,
  regenerateBatch,
  saveBatches,
} from "../data/batches";
import {
  type CatalogEntry,
  type CatalogMap,
  type LabelStatus,
  DEFAULT_CATALOG_ENTRY,
  LABEL_STATUSES,
  catKey,
  getCatalogEntry,
  loadCatalog,
  saveCatalog,
} from "../data/catalog";

// Category → color treatment, mirroring the printed Aura label sheet.
const CATEGORY_STYLE: Record<
  string,
  { header: string; dot: string; chip: string }
> = {
  "Healing & Recovery": {
    header: "text-pink-700",
    dot: "bg-pink-400",
    chip: "bg-pink-50 text-pink-700 ring-pink-200",
  },
  "Weight Loss": {
    header: "text-blue-700",
    dot: "bg-blue-400",
    chip: "bg-blue-50 text-blue-700 ring-blue-200",
  },
  "Anti-Aging": {
    header: "text-emerald-700",
    dot: "bg-emerald-400",
    chip: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  Cognitive: {
    header: "text-amber-700",
    dot: "bg-amber-400",
    chip: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  "Sexual Health": {
    header: "text-rose-700",
    dot: "bg-rose-400",
    chip: "bg-rose-50 text-rose-700 ring-rose-200",
  },
  Supplies: {
    header: "text-slate-600",
    dot: "bg-slate-400",
    chip: "bg-slate-50 text-slate-600 ring-slate-200",
  },
};

const isPriced = (p: Product) => p.noMoq != null && p.moq50 != null;
const hasStrength = (p: Product) => p.strength != null;
const strengthLabel = (p: Product) =>
  p.strength == null ? "—" : `${p.strength}${p.strengthUnit}`;

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
        ok
          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
          : "bg-amber-50 text-amber-700 ring-amber-200"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          ok ? "bg-emerald-500" : "bg-amber-500"
        }`}
      />
      {label}
    </span>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-neutral-900">
        {value}
      </div>
      {hint && <div className="mt-0.5 text-xs text-neutral-500">{hint}</div>}
    </div>
  );
}

export default function CatalogPage() {
  const { auraResolved } = useMergedProducts();
  const [map, setMap] = useState<CatalogMap>({});
  const [hydrated, setHydrated] = useState(false);
  const [actionOnly, setActionOnly] = useState(false);
  const [batches, setBatches] = useState<BatchMap>({});
  const [batchHydrated, setBatchHydrated] = useState(false);

  useEffect(() => {
    setMap(loadCatalog());
    setBatches(loadBatches());
    setBatchHydrated(true);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveCatalog(map);
  }, [map, hydrated]);

  // Assign a unique batch number to any SKU that doesn't have one yet.
  useEffect(() => {
    if (!batchHydrated) return;
    const next = ensureBatches(
      auraResolved.map((p) => p.sku),
      batches,
    );
    if (next !== batches) setBatches(next);
  }, [auraResolved, batches, batchHydrated]);

  useEffect(() => {
    if (batchHydrated) saveBatches(batches);
  }, [batches, batchHydrated]);

  const regenerate = (sku: string) =>
    setBatches((prev) => regenerateBatch(sku, prev));

  const updateEntry = (key: string, patch: Partial<CatalogEntry>) => {
    setMap((prev) => {
      const current = prev[key] ?? DEFAULT_CATALOG_ENTRY;
      return { ...prev, [key]: { ...current, ...patch } };
    });
  };

  const rows = useMemo(
    () =>
      auraResolved.map((p) => {
        const key = catKey(p.brand, p.sku);
        const entry = getCatalogEntry(map, key);
        const priced = isPriced(p);
        const strength = hasStrength(p);
        const needsAction =
          !priced || !strength || entry.labelStatus !== "received";
        return { p, key, entry, priced, strength, needsAction };
      }),
    [auraResolved, map],
  );

  const stats = useMemo(() => {
    const total = rows.length;
    const priced = rows.filter((r) => r.priced).length;
    const strength = rows.filter((r) => r.strength).length;
    const received = rows.filter((r) => r.entry.labelStatus === "received")
      .length;
    const toOrder = rows.filter((r) => r.entry.labelStatus === "to-order");
    const toOrderQty = toOrder.reduce((s, r) => s + (r.entry.labelQty || 0), 0);
    return { total, priced, strength, received, toOrder, toOrderQty };
  }, [rows]);

  const missing = useMemo(() => {
    const noPrice = rows.filter((r) => !r.priced).map((r) => r.p);
    const noStrength = rows.filter((r) => !r.strength).map((r) => r.p);
    return { noPrice, noStrength };
  }, [rows]);

  const copyOrderList = () => {
    const lines = stats.toOrder.map((r) => {
      const qty = r.entry.labelQty ? `${r.entry.labelQty}×` : "—";
      const batch = batches[r.p.sku] ?? "";
      return `${qty}\t${r.p.product} ${strengthLabel(r.p)}\t${r.p.sku}\t${batch}`;
    });
    const text = lines.length
      ? `Aura labels to order\n${lines.join("\n")}`
      : "No labels currently marked “To order”.";
    navigator.clipboard?.writeText(text).catch(() => {});
  };

  return (
    <main className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
      <Nav />

      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-neutral-900">
          Aura Supply Tracker
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Everything Aura Labs can supply, from the label sheet. Track what’s
          priced, what strengths are confirmed, and which labels still need to
          be ordered.
        </p>
      </header>

      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="SKUs" value={String(stats.total)} hint="Aura line" />
        <StatCard
          label="Priced"
          value={`${stats.priced}/${stats.total}`}
          hint="cost tiers set"
        />
        <StatCard
          label="Strength set"
          value={`${stats.strength}/${stats.total}`}
          hint="mg confirmed"
        />
        <StatCard
          label="Labels received"
          value={`${stats.received}/${stats.total}`}
        />
        <StatCard
          label="To order"
          value={String(stats.toOrder.length)}
          hint={`${stats.toOrderQty} labels`}
        />
      </section>

      {(missing.noPrice.length > 0 || missing.noStrength.length > 0) && (
        <section className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h2 className="text-sm font-semibold text-amber-900">
            Needs data before these can be sold
          </h2>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-amber-800">
                Missing price ({missing.noPrice.length})
              </div>
              <p className="mt-1 text-sm text-amber-900/90">
                {missing.noPrice.length === stats.total
                  ? "All SKUs — paste the supplier price list to fill noMoq / moq50."
                  : missing.noPrice.map((p) => p.product).join(", ")}
              </p>
            </div>
            {missing.noStrength.length > 0 && (
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-amber-800">
                  Missing strength ({missing.noStrength.length})
                </div>
                <p className="mt-1 text-sm text-amber-900/90">
                  {missing.noStrength
                    .map((p) => `${p.product} (${p.sku})`)
                    .join(", ")}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      <div className="no-print mb-4 flex flex-wrap items-center gap-3">
        <Link
          href="/catalog/edit"
          className="rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Bulk edit
        </Link>
        <Link
          href="/catalog/order"
          className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Order from Standard
        </Link>
        <label className="flex items-center gap-2 text-sm text-neutral-600">
          <input
            type="checkbox"
            checked={actionOnly}
            onChange={(e) => setActionOnly(e.target.checked)}
            className="h-4 w-4 rounded border-neutral-300"
          />
          Only show items needing action
        </label>
        <button
          onClick={copyOrderList}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Copy “to order” list
        </button>
        <button
          onClick={() => window.print()}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Print
        </button>
      </div>

      {AURA_CATEGORIES.map((category) => {
        const style = CATEGORY_STYLE[category];
        const catRows = rows.filter(
          (r) =>
            r.p.category === category && (!actionOnly || r.needsAction),
        );
        if (catRows.length === 0) return null;
        return (
          <section key={category} className="mb-8">
            <h2
              className={`mb-2 flex items-center gap-2 text-sm font-semibold ${style.header}`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />
              {category}
              <span className="font-normal text-neutral-400">
                ({catRows.length})
              </span>
            </h2>

            <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500">
                    <th className="px-3 py-2 font-medium">Product</th>
                    <th className="px-3 py-2 font-medium">Strength</th>
                    <th className="px-3 py-2 font-medium">SKU</th>
                    <th className="px-3 py-2 font-medium">Batch</th>
                    <th className="px-3 py-2 font-medium">Price</th>
                    <th className="px-3 py-2 font-medium">Label status</th>
                    <th className="px-3 py-2 font-medium">Qty</th>
                    <th className="px-3 py-2 font-medium">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {catRows.map(({ p, key, entry, priced, strength }) => (
                    <tr
                      key={key}
                      className="border-b border-neutral-100 last:border-0"
                    >
                      <td className="px-3 py-2">
                        <div className="font-medium text-neutral-900">
                          {p.product}
                        </div>
                        {p.subtitle && (
                          <div className="text-xs text-neutral-500">
                            {p.subtitle}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 tabular-nums text-neutral-700">
                        {strength ? (
                          strengthLabel(p)
                        ) : (
                          <span className="text-amber-600">TBD</span>
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-neutral-500">
                        {p.sku}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-xs font-semibold tracking-wider text-neutral-800">
                            {batches[p.sku] ?? "—"}
                          </span>
                          <button
                            onClick={() => regenerate(p.sku)}
                            title="Regenerate batch number"
                            className="no-print text-xs text-neutral-300 hover:text-neutral-700"
                          >
                            ↻
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge
                          ok={priced}
                          label={priced ? "Set" : "Missing"}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={entry.labelStatus}
                          onChange={(e) =>
                            updateEntry(key, {
                              labelStatus: e.target.value as LabelStatus,
                            })
                          }
                          className="rounded-lg border border-neutral-300 bg-white px-2 py-1 text-sm outline-none focus:border-neutral-900"
                        >
                          {LABEL_STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          value={entry.labelQty || ""}
                          onChange={(e) =>
                            updateEntry(key, {
                              labelQty: Math.max(
                                0,
                                Math.floor(Number(e.target.value) || 0),
                              ),
                            })
                          }
                          placeholder="0"
                          className="w-20 rounded-lg border border-neutral-300 px-2 py-1 text-sm tabular-nums outline-none focus:border-neutral-900"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={entry.note}
                          onChange={(e) =>
                            updateEntry(key, { note: e.target.value })
                          }
                          placeholder="—"
                          className="w-full min-w-[8rem] rounded-lg border border-neutral-300 px-2 py-1 text-sm outline-none focus:border-neutral-900"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      <section className="mt-10">
        <h2 className="mb-2 text-sm font-semibold text-neutral-900">
          Labels to order
        </h2>
        {stats.toOrder.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Nothing marked “To order”. Set a SKU’s label status to{" "}
            <span className="font-medium">To order</span> and it appears here.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500">
                  <th className="px-3 py-2 font-medium">Qty</th>
                  <th className="px-3 py-2 font-medium">Product</th>
                  <th className="px-3 py-2 font-medium">SKU</th>
                  <th className="px-3 py-2 font-medium">Batch</th>
                  <th className="px-3 py-2 font-medium">Note</th>
                </tr>
              </thead>
              <tbody>
                {stats.toOrder.map((r) => (
                  <tr
                    key={r.key}
                    className="border-b border-neutral-100 last:border-0"
                  >
                    <td className="px-3 py-2 tabular-nums font-medium">
                      {r.entry.labelQty || "—"}
                    </td>
                    <td className="px-3 py-2">
                      {r.p.product} {strengthLabel(r.p)}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-neutral-500">
                      {r.p.sku}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs font-semibold tracking-wider text-neutral-800">
                      {batches[r.p.sku] ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-neutral-500">
                      {r.entry.note || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
