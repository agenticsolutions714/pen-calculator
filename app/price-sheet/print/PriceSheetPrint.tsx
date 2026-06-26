"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import type { PriceSheetRow } from "../../data/pricing";

const currency = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

const BROKERAGE = "Aura";

function fileDate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}-${dd}-${d.getFullYear()}`;
}

function displayDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function PriceSheetPrint({
  rows,
}: {
  rows: PriceSheetRow[];
}) {
  const now = useMemo(() => new Date(), []);
  const fileName = `${BROKERAGE.toLowerCase()}.pricesheet.${fileDate(now)}`;

  useEffect(() => {
    const prev = document.title;
    document.title = fileName;
    return () => {
      document.title = prev;
    };
  }, [fileName]);

  return (
    <main className="min-h-screen bg-neutral-100 text-neutral-900">
      <div className="no-print mx-auto flex max-w-3xl items-center justify-between px-4 pt-6 sm:px-6">
        <Link
          href="/price-sheet"
          className="text-sm font-medium text-neutral-500 hover:text-neutral-900"
        >
          ← Back to Price Sheet
        </Link>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-neutral-400 sm:inline">
            Saves as {fileName}.pdf
          </span>
          <button
            onClick={() => window.print()}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
          >
            Print / Save PDF
          </button>
        </div>
      </div>

      <div className="mx-auto my-6 max-w-3xl bg-white p-10 shadow-sm print:my-0 print:max-w-none print:p-0 print:shadow-none">
        <div className="flex items-start justify-between border-b border-neutral-900 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{BROKERAGE}</h1>
            <p className="text-sm text-neutral-500">Price Sheet</p>
          </div>
          <div className="text-right text-sm">
            <p>
              <span className="text-neutral-500">Date</span>{" "}
              <span className="font-medium">{displayDate(now)}</span>
            </p>
          </div>
        </div>

        <table className="mt-6 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-300 text-left text-xs uppercase tracking-wide text-neutral-500">
              <th className="py-2 pr-2 font-medium">SKU</th>
              <th className="py-2 pr-2 font-medium">Product</th>
              <th className="py-2 pr-2 text-right font-medium">Price / vial</th>
              <th className="py-2 text-right font-medium">Price / pack</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={`${r.brand}-${r.sku}`}
                className="border-b border-neutral-100"
              >
                <td className="py-2 pr-2 font-mono text-xs">{r.sku}</td>
                <td className="py-2 pr-2">{r.label}</td>
                <td className="py-2 pr-2 text-right tabular-nums text-neutral-600">
                  {currency(r.pricePerVial)}
                </td>
                <td className="py-2 text-right font-medium tabular-nums">
                  {currency(r.price)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {rows.length === 0 ? (
          <p className="mt-6 text-center text-sm text-neutral-400">
            No products to display.
          </p>
        ) : (
          <p className="mt-6 text-sm text-neutral-600">
            All products are supplied as whitelabel vials with clear caps. All
            inventory is local and US&#8209;based.
          </p>
        )}

        <p className="mt-10 text-center text-xs text-neutral-400">
          {BROKERAGE} · Prices subject to change · {displayDate(now)}
        </p>
      </div>
    </main>
  );
}
