import type { Brand } from "./products";

export type DealLineItem = {
  sku: string;
  product: string;
  /** Quantity the buyer ordered. */
  qty: number;
  /**
   * Quantity the supplier actually shipped. When null/undefined the line is
   * assumed fully fulfilled (fulfilled === ordered). Economics, the buyer
   * invoice, and the cost owed to the supplier all key off this value.
   */
  fulfilledQty?: number | null;
  unitCost: number;
  exitPerPack: number;
};

/**
 * The quantity that drives economics: how much the supplier actually shipped.
 * Falls back to the ordered qty when no explicit fulfillment is recorded, so
 * full-fill orders and existing deals behave exactly as before.
 */
export function effectiveQty(line: DealLineItem): number {
  if (line.fulfilledQty == null) return Math.max(0, line.qty || 0);
  return Math.max(0, line.fulfilledQty || 0);
}

/** Units still owed on a line (ordered minus fulfilled). 0 when fully filled. */
export function backorderQty(line: DealLineItem): number {
  if (line.fulfilledQty == null) return 0;
  return Math.max(0, (line.qty || 0) - (line.fulfilledQty || 0));
}

export type LineEconomics = {
  supplierCost: number;
  exit: number;
  profit: number;
  clientShare: number;
  companyProfit: number;
};

export type DealEconomics = LineEconomics & {
  lines: number;
  qty: number;
  grossExit: number;
  discountAmount: number;
};

export type DiscountType = "none" | "pct" | "flat";

export type Discount = {
  type: DiscountType;
  /** For "pct": a percentage (0-100). For "flat": a dollar amount. */
  value: number;
};

export const NO_DISCOUNT: Discount = { type: "none", value: 0 };

const toCents = (n: number) => Math.round(n * 100);
const fromCents = (c: number) => c / 100;

/** Round a dollar amount to whole cents to avoid float drift. */
export const roundMoney = (n: number) => fromCents(toCents(n));

/** Convert a dollar amount to integer cents for storage. */
export const dollarsToCents = (n: number) => toCents(n);

/** Convert stored integer cents back to a dollar amount. */
export const centsToDollars = (c: number) => fromCents(c);

/**
 * Resolve the dollar discount amount applied to a gross exit total.
 * Clamped to the range [0, grossExit].
 */
export function discountAmount(grossExit: number, discount: Discount): number {
  if (!discount || discount.type === "none") return 0;
  const v = Number.isFinite(discount.value) ? discount.value : 0;
  if (v <= 0) return 0;
  const raw = discount.type === "pct" ? (grossExit * v) / 100 : v;
  return roundMoney(Math.max(0, Math.min(grossExit, raw)));
}

export function lineEconomics(
  line: DealLineItem,
  clientPct: number,
): LineEconomics {
  const pct = Number.isNaN(clientPct) ? 0 : Math.max(0, Math.min(100, clientPct));
  const qty = effectiveQty(line);
  const supplierCost = roundMoney(qty * (line.unitCost || 0));
  const exit = roundMoney(qty * (line.exitPerPack || 0));
  const profit = roundMoney(exit - supplierCost);
  const clientShare = roundMoney((profit * pct) / 100);
  const companyProfit = roundMoney(profit - clientShare);
  return { supplierCost, exit, profit, clientShare, companyProfit };
}

export function dealEconomics(
  lines: DealLineItem[],
  clientPct: number,
  discount: Discount = NO_DISCOUNT,
): DealEconomics {
  let supplierCost = 0;
  let grossExit = 0;
  let lineCount = 0;
  let qty = 0;

  for (const line of lines) {
    const eq = effectiveQty(line);
    if (eq <= 0) continue;
    const e = lineEconomics(line, clientPct);
    supplierCost = roundMoney(supplierCost + e.supplierCost);
    grossExit = roundMoney(grossExit + e.exit);
    lineCount += 1;
    qty += eq;
  }

  const discAmount = discountAmount(grossExit, discount);
  const exit = roundMoney(grossExit - discAmount);

  // Shared model: the discount reduces total profit, then the client % split
  // is applied to the reduced profit.
  const pct = Number.isNaN(clientPct)
    ? 0
    : Math.max(0, Math.min(100, clientPct));
  const profit = roundMoney(exit - supplierCost);
  const clientShare = roundMoney((profit * pct) / 100);
  const companyProfit = roundMoney(profit - clientShare);

  return {
    supplierCost,
    exit,
    profit,
    clientShare,
    companyProfit,
    lines: lineCount,
    qty,
    grossExit,
    discountAmount: discAmount,
  };
}

export type DealStatus = "draft" | "sent" | "partial" | "fulfilled" | "paid";

export const DEAL_STATUSES: DealStatus[] = [
  "draft",
  "sent",
  "partial",
  "fulfilled",
  "paid",
];

export type Deal = {
  id: number;
  clientId: number | null;
  clientName: string;
  buyerId: number | null;
  buyerName: string | null;
  brand: Brand;
  status: DealStatus;
  clientPct: number;
  lineItems: DealLineItem[];
  discountType: DiscountType;
  discountValue: number;
  supplierCost: number;
  exit: number;
  profit: number;
  clientShare: number;
  companyProfit: number;
  buyerPaid: number;
  buyerPaidAt: string | null;
  clientPaid: number;
  clientPaidAt: string | null;
  notes: string | null;
  createdAt: string;
};

export type DashboardSummary = {
  dealCount: number;
  totalExit: number;
  totalSupplierCost: number;
  totalProfit: number;
  totalCompanyProfit: number;
  totalClientShare: number;
  companyProfitThisMonth: number;
  outstandingToClients: number;
  outstandingFromBuyers: number;
  byClient: {
    clientName: string;
    deals: number;
    companyProfit: number;
    owed: number;
  }[];
  byBrand: { brand: string; deals: number; companyProfit: number }[];
};

export function summarizeDeals(deals: Deal[]): DashboardSummary {
  const now = new Date();
  const summary: DashboardSummary = {
    dealCount: deals.length,
    totalExit: 0,
    totalSupplierCost: 0,
    totalProfit: 0,
    totalCompanyProfit: 0,
    totalClientShare: 0,
    companyProfitThisMonth: 0,
    outstandingToClients: 0,
    outstandingFromBuyers: 0,
    byClient: [],
    byBrand: [],
  };

  const clientMap = new Map<
    string,
    { deals: number; companyProfit: number; owed: number }
  >();
  const brandMap = new Map<string, { deals: number; companyProfit: number }>();

  for (const d of deals) {
    summary.totalExit = roundMoney(summary.totalExit + d.exit);
    summary.totalSupplierCost = roundMoney(
      summary.totalSupplierCost + d.supplierCost,
    );
    summary.totalProfit = roundMoney(summary.totalProfit + d.profit);
    summary.totalCompanyProfit = roundMoney(
      summary.totalCompanyProfit + d.companyProfit,
    );
    summary.totalClientShare = roundMoney(
      summary.totalClientShare + d.clientShare,
    );

    const created = new Date(d.createdAt);
    if (
      created.getFullYear() === now.getFullYear() &&
      created.getMonth() === now.getMonth()
    ) {
      summary.companyProfitThisMonth = roundMoney(
        summary.companyProfitThisMonth + d.companyProfit,
      );
    }

    // Outstanding = what's recorded as still unpaid, based on actual payments.
    const clientOwed = roundMoney(Math.max(0, d.clientShare - d.clientPaid));
    const buyerOwed = roundMoney(Math.max(0, d.exit - d.buyerPaid));
    summary.outstandingToClients = roundMoney(
      summary.outstandingToClients + clientOwed,
    );
    summary.outstandingFromBuyers = roundMoney(
      summary.outstandingFromBuyers + buyerOwed,
    );

    const c = clientMap.get(d.clientName) ?? {
      deals: 0,
      companyProfit: 0,
      owed: 0,
    };
    c.deals += 1;
    c.companyProfit = roundMoney(c.companyProfit + d.companyProfit);
    c.owed = roundMoney(c.owed + clientOwed);
    clientMap.set(d.clientName, c);

    const b = brandMap.get(d.brand) ?? { deals: 0, companyProfit: 0 };
    b.deals += 1;
    b.companyProfit = roundMoney(b.companyProfit + d.companyProfit);
    brandMap.set(d.brand, b);
  }

  summary.byClient = [...clientMap.entries()]
    .map(([clientName, v]) => ({ clientName, ...v }))
    .sort((a, b) => b.companyProfit - a.companyProfit);
  summary.byBrand = [...brandMap.entries()]
    .map(([brand, v]) => ({ brand, ...v }))
    .sort((a, b) => b.companyProfit - a.companyProfit);

  return summary;
}
