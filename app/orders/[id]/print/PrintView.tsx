"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { Deal } from "../../../data/economics";

const currency = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

const BROKERAGE = "Aura";

function fileDate(iso: string): string {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}-${dd}-${yyyy}`;
}

function displayDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function PrintView({ deal }: { deal: Deal }) {
  const fileName = `${BROKERAGE.toLowerCase()}.${deal.brand.toLowerCase()}.po.${fileDate(
    deal.createdAt,
  )}`;

  const fulfilledOf = (l: Deal["lineItems"][number]) =>
    l.fulfilledQty == null ? l.qty : Math.max(0, l.fulfilledQty);
  const hasShortfall = deal.lineItems.some(
    (l) => l.fulfilledQty != null && l.fulfilledQty < l.qty,
  );
  const totalOrdered = deal.lineItems.reduce((s, l) => s + l.qty, 0);
  const totalFulfilled = deal.lineItems.reduce((s, l) => s + fulfilledOf(l), 0);

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
          href="/orders"
          className="text-sm font-medium text-neutral-500 hover:text-neutral-900"
        >
          ← Back to Orders
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
            <p className="text-sm text-neutral-500">Purchase Order</p>
          </div>
          <div className="text-right text-sm">
            <p>
              <span className="text-neutral-500">PO #</span>{" "}
              <span className="font-medium">
                {String(deal.id).padStart(5, "0")}
              </span>
            </p>
            <p>
              <span className="text-neutral-500">Date</span>{" "}
              <span className="font-medium">
                {displayDate(deal.createdAt)}
              </span>
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Supplier
            </p>
            <p className="mt-1 font-medium">{deal.brand}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Ordered by
            </p>
            <p className="mt-1 font-medium">{BROKERAGE}</p>
          </div>
        </div>

        <table className="mt-6 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-300 text-left text-xs uppercase tracking-wide text-neutral-500">
              <th className="py-2 pr-2 font-medium">SKU</th>
              <th className="py-2 pr-2 font-medium">Product</th>
              <th className="py-2 pr-2 text-right font-medium">
                {hasShortfall ? "Ordered" : "Qty"}
              </th>
              {hasShortfall ? (
                <th className="py-2 pr-2 text-right font-medium">Fulfilled</th>
              ) : null}
              <th className="py-2 pr-2 text-right font-medium">Unit price</th>
              <th className="py-2 text-right font-medium">Line total</th>
            </tr>
          </thead>
          <tbody>
            {deal.lineItems.map((l) => {
              const filled = fulfilledOf(l);
              const short = l.fulfilledQty != null && l.fulfilledQty < l.qty;
              return (
                <tr key={l.sku} className="border-b border-neutral-100">
                  <td className="py-2 pr-2 font-mono text-xs">{l.sku}</td>
                  <td className="py-2 pr-2">{l.product}</td>
                  <td className="py-2 pr-2 text-right tabular-nums">{l.qty}</td>
                  {hasShortfall ? (
                    <td className="py-2 pr-2 text-right tabular-nums">
                      {filled}
                      {short ? (
                        <span className="ml-1 text-xs font-medium text-neutral-500">
                          ({l.qty - filled} short)
                        </span>
                      ) : null}
                    </td>
                  ) : null}
                  <td className="py-2 pr-2 text-right tabular-nums">
                    {currency(l.unitCost)}
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {currency(filled * l.unitCost)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-neutral-900 font-semibold">
              <td className="py-2 pr-2" colSpan={2}>
                Total
              </td>
              <td className="py-2 pr-2 text-right tabular-nums">
                {totalOrdered}
              </td>
              {hasShortfall ? (
                <td className="py-2 pr-2 text-right tabular-nums">
                  {totalFulfilled}
                </td>
              ) : null}
              <td className="py-2 pr-2"></td>
              <td className="py-2 text-right tabular-nums">
                {currency(deal.supplierCost)}
              </td>
            </tr>
          </tfoot>
        </table>

        {hasShortfall ? (
          <p className="mt-3 text-xs text-neutral-500">
            Line totals and the amount payable reflect the quantities fulfilled
            by the supplier. {totalOrdered - totalFulfilled} pack
            {totalOrdered - totalFulfilled === 1 ? "" : "s"} of the original
            order remain unfilled.
          </p>
        ) : null}

        {deal.notes ? (
          <div className="mt-6 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Notes
            </p>
            <p className="mt-1 whitespace-pre-wrap text-neutral-700">
              {deal.notes}
            </p>
          </div>
        ) : null}

        <p className="mt-10 text-center text-xs text-neutral-400">
          {BROKERAGE} · Purchase Order {String(deal.id).padStart(5, "0")}
        </p>
      </div>
    </main>
  );
}
