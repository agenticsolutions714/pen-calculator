"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import {
  type Deal,
  discountAmount as calcDiscount,
} from "../../../data/economics";

const currency = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

const BROKERAGE = "Aura";

function fileDate(iso: string): string {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}-${dd}-${d.getFullYear()}`;
}

function displayDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function slug(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "client"
  );
}

export default function InvoiceView({ deal }: { deal: Deal }) {
  const invoiceNo = String(deal.id).padStart(5, "0");
  const billTo = deal.buyerName?.trim() || deal.clientName;

  const fulfilledOf = (l: Deal["lineItems"][number]) =>
    l.fulfilledQty == null ? l.qty : Math.max(0, l.fulfilledQty);

  // Only bill for what was actually delivered.
  const billedLines = useMemo(
    () => deal.lineItems.filter((l) => fulfilledOf(l) > 0),
    [deal.lineItems],
  );

  const grossExit = useMemo(
    () =>
      billedLines.reduce(
        (s, l) => s + fulfilledOf(l) * (l.exitPerPack || 0),
        0,
      ),
    [billedLines],
  );

  const discount = useMemo(
    () =>
      calcDiscount(grossExit, {
        type: deal.discountType ?? "none",
        value: deal.discountValue ?? 0,
      }),
    [grossExit, deal.discountType, deal.discountValue],
  );

  const total = deal.exit;
  const totalPacks = billedLines.reduce((s, l) => s + fulfilledOf(l), 0);

  const fileName = `${BROKERAGE.toLowerCase()}.invoice.${slug(
    billTo,
  )}.${fileDate(deal.createdAt)}`;

  useEffect(() => {
    const prev = document.title;
    document.title = fileName;
    return () => {
      document.title = prev;
    };
  }, [fileName]);

  const discountLabel =
    deal.discountType === "pct"
      ? `Discount (${deal.discountValue}%)`
      : "Discount";

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
            <p className="text-sm text-neutral-500">Invoice</p>
          </div>
          <div className="text-right text-sm">
            <p>
              <span className="text-neutral-500">Invoice #</span>{" "}
              <span className="font-medium">{invoiceNo}</span>
            </p>
            <p>
              <span className="text-neutral-500">Date</span>{" "}
              <span className="font-medium">
                {displayDate(deal.createdAt)}
              </span>
            </p>
          </div>
        </div>

        <div className="mt-5 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Bill to
          </p>
          <p className="mt-1 font-medium">{billTo}</p>
        </div>

        <table className="mt-6 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-300 text-left text-xs uppercase tracking-wide text-neutral-500">
              <th className="py-2 pr-2 font-medium">SKU</th>
              <th className="py-2 pr-2 font-medium">Product</th>
              <th className="py-2 pr-2 text-right font-medium">Qty</th>
              <th className="py-2 pr-2 text-right font-medium">Unit price</th>
              <th className="py-2 text-right font-medium">Line total</th>
            </tr>
          </thead>
          <tbody>
            {billedLines.map((l) => {
              const qty = fulfilledOf(l);
              return (
                <tr key={l.sku} className="border-b border-neutral-100">
                  <td className="py-2 pr-2 font-mono text-xs">{l.sku}</td>
                  <td className="py-2 pr-2">{l.product}</td>
                  <td className="py-2 pr-2 text-right tabular-nums">{qty}</td>
                  <td className="py-2 pr-2 text-right tabular-nums">
                    {currency(l.exitPerPack || 0)}
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {currency(qty * (l.exitPerPack || 0))}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            {discount > 0 ? (
              <>
                <tr className="border-t border-neutral-200">
                  <td className="py-2 pr-2" colSpan={4}>
                    Subtotal
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {currency(grossExit)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-2 text-neutral-600" colSpan={4}>
                    {discountLabel}
                  </td>
                  <td className="py-2 text-right tabular-nums text-neutral-600">
                    −{currency(discount)}
                  </td>
                </tr>
              </>
            ) : null}
            <tr className="border-t-2 border-neutral-900 font-semibold">
              <td className="py-2 pr-2" colSpan={2}>
                Total due
              </td>
              <td className="py-2 pr-2 text-right tabular-nums">
                {totalPacks}
              </td>
              <td className="py-2 pr-2"></td>
              <td className="py-2 text-right tabular-nums">
                {currency(total)}
              </td>
            </tr>
          </tfoot>
        </table>

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
          {BROKERAGE} · Invoice {invoiceNo} · Thank you for your business
        </p>
      </div>
    </main>
  );
}
