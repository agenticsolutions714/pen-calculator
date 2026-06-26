"use server";

import { revalidatePath } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { getDb } from "../db";
import { buyers, clients, deals, pricingPresets } from "../db/schema";
import {
  dealEconomics,
  centsToDollars,
  dollarsToCents,
  type Deal,
  type DealLineItem,
  type DealStatus,
  type Discount,
  type DiscountType,
} from "../data/economics";
import type { Brand } from "../data/products";
import type { CostBasis, PriceMode } from "../data/pricing";

export type ClientInput = {
  name: string;
  defaultProfitPct: number;
  notes?: string | null;
};

export async function listClients() {
  const db = getDb();
  return db.select().from(clients).orderBy(clients.name);
}

export async function createClient(input: ClientInput) {
  const db = getDb();
  const name = input.name.trim();
  if (!name) throw new Error("Client name is required.");
  const [row] = await db
    .insert(clients)
    .values({
      name,
      defaultProfitPct: clampPct(input.defaultProfitPct),
      notes: input.notes?.trim() || null,
    })
    .returning();
  revalidatePath("/clients");
  revalidatePath("/orders");
  return row;
}

export async function updateClient(id: number, input: ClientInput) {
  const db = getDb();
  const name = input.name.trim();
  if (!name) throw new Error("Client name is required.");
  await db
    .update(clients)
    .set({
      name,
      defaultProfitPct: clampPct(input.defaultProfitPct),
      notes: input.notes?.trim() || null,
    })
    .where(eq(clients.id, id));
  revalidatePath("/clients");
  revalidatePath("/orders");
}

export async function deleteClient(id: number) {
  const db = getDb();
  await db.delete(clients).where(eq(clients.id, id));
  revalidatePath("/clients");
  revalidatePath("/orders");
}

export type BuyerInput = {
  name: string;
  contact?: string | null;
  notes?: string | null;
};

export async function listBuyers() {
  const db = getDb();
  return db.select().from(buyers).orderBy(buyers.name);
}

export async function createBuyer(input: BuyerInput) {
  const db = getDb();
  const name = input.name.trim();
  if (!name) throw new Error("Buyer name is required.");
  const [row] = await db
    .insert(buyers)
    .values({
      name,
      contact: input.contact?.trim() || null,
      notes: input.notes?.trim() || null,
    })
    .returning();
  revalidatePath("/buyers");
  revalidatePath("/orders");
  return row;
}

export async function updateBuyer(id: number, input: BuyerInput) {
  const db = getDb();
  const name = input.name.trim();
  if (!name) throw new Error("Buyer name is required.");
  await db
    .update(buyers)
    .set({
      name,
      contact: input.contact?.trim() || null,
      notes: input.notes?.trim() || null,
    })
    .where(eq(buyers.id, id));
  revalidatePath("/buyers");
  revalidatePath("/orders");
}

export async function deleteBuyer(id: number) {
  const db = getDb();
  await db.delete(buyers).where(eq(buyers.id, id));
  revalidatePath("/buyers");
  revalidatePath("/orders");
}

export type PresetInput = {
  name: string;
  mode: PriceMode;
  pct: number;
  basis: CostBasis;
};

export async function listPresets() {
  const db = getDb();
  return db.select().from(pricingPresets).orderBy(pricingPresets.name);
}

export async function createPreset(input: PresetInput) {
  const db = getDb();
  const name = input.name.trim();
  if (!name) throw new Error("Preset name is required.");
  const [row] = await db
    .insert(pricingPresets)
    .values({
      name,
      mode: input.mode === "margin" ? "margin" : "markup",
      pct: Number.isFinite(input.pct) ? input.pct : 0,
      basis: input.basis === "moq50" ? "moq50" : "noMoq",
    })
    .returning();
  revalidatePath("/price-sheet");
  revalidatePath("/orders");
  return row;
}

export async function deletePreset(id: number) {
  const db = getDb();
  await db.delete(pricingPresets).where(eq(pricingPresets.id, id));
  revalidatePath("/price-sheet");
  revalidatePath("/orders");
}

export type SaveDealInput = {
  clientId: number | null;
  clientName: string;
  buyerId?: number | null;
  buyerName?: string | null;
  brand: Brand;
  status: DealStatus;
  clientPct: number;
  lineItems: DealLineItem[];
  discountType?: DiscountType;
  discountValue?: number;
  notes?: string | null;
};

function inputDiscount(input: SaveDealInput): Discount {
  const type: DiscountType =
    input.discountType === "pct" || input.discountType === "flat"
      ? input.discountType
      : "none";
  const value = Number.isFinite(input.discountValue ?? 0)
    ? (input.discountValue ?? 0)
    : 0;
  return { type, value: Math.max(0, value) };
}

export async function listDeals(): Promise<Deal[]> {
  const db = getDb();
  const rows = await db.select().from(deals).orderBy(desc(deals.createdAt));
  return rows.map(mapDeal);
}

export async function getDeal(id: number): Promise<Deal | null> {
  const db = getDb();
  const [row] = await db.select().from(deals).where(eq(deals.id, id)).limit(1);
  return row ? mapDeal(row) : null;
}

function mapDeal(r: typeof deals.$inferSelect): Deal {
  return {
    id: r.id,
    clientId: r.clientId,
    clientName: r.clientName,
    buyerId: r.buyerId ?? null,
    buyerName: r.buyerName ?? null,
    brand: r.brand as Brand,
    status: r.status as DealStatus,
    clientPct: r.clientPct,
    lineItems: r.lineItems as DealLineItem[],
    discountType: (r.discountType as DiscountType) ?? "none",
    discountValue: r.discountValue ?? 0,
    supplierCost: centsToDollars(r.supplierCostCents),
    exit: centsToDollars(r.exitCents),
    profit: centsToDollars(r.profitCents),
    clientShare: centsToDollars(r.clientShareCents),
    companyProfit: centsToDollars(r.companyProfitCents),
    buyerPaid: centsToDollars(r.buyerPaidCents),
    buyerPaidAt: r.buyerPaidAt ? r.buyerPaidAt.toISOString() : null,
    clientPaid: centsToDollars(r.clientPaidCents),
    clientPaidAt: r.clientPaidAt ? r.clientPaidAt.toISOString() : null,
    notes: r.notes,
    createdAt: r.createdAt.toISOString(),
  };
}

function econToCents(econ: {
  supplierCost: number;
  exit: number;
  profit: number;
  clientShare: number;
  companyProfit: number;
}) {
  return {
    supplierCostCents: dollarsToCents(econ.supplierCost),
    exitCents: dollarsToCents(econ.exit),
    profitCents: dollarsToCents(econ.profit),
    clientShareCents: dollarsToCents(econ.clientShare),
    companyProfitCents: dollarsToCents(econ.companyProfit),
  };
}

export async function createDeal(input: SaveDealInput) {
  const db = getDb();
  const lines = input.lineItems.filter((l) => l.qty > 0);
  if (lines.length === 0) {
    throw new Error("Add at least one line item with a quantity.");
  }
  const discount = inputDiscount(input);
  const econ = dealEconomics(lines, input.clientPct, discount);
  const [row] = await db
    .insert(deals)
    .values({
      clientId: input.clientId,
      clientName: input.clientName.trim() || "Unassigned",
      buyerId: input.buyerId ?? null,
      buyerName: input.buyerName?.trim() || null,
      brand: input.brand,
      status: input.status,
      clientPct: clampPct(input.clientPct),
      lineItems: lines,
      discountType: discount.type,
      discountValue: discount.value,
      ...econToCents(econ),
      notes: input.notes?.trim() || null,
    })
    .returning();
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  return row;
}

export async function updateDeal(id: number, input: SaveDealInput) {
  const db = getDb();
  const lines = input.lineItems.filter((l) => l.qty > 0);
  if (lines.length === 0) {
    throw new Error("Add at least one line item with a quantity.");
  }
  const discount = inputDiscount(input);
  const econ = dealEconomics(lines, input.clientPct, discount);
  await db
    .update(deals)
    .set({
      clientId: input.clientId,
      clientName: input.clientName.trim() || "Unassigned",
      buyerId: input.buyerId ?? null,
      buyerName: input.buyerName?.trim() || null,
      brand: input.brand,
      status: input.status,
      clientPct: clampPct(input.clientPct),
      lineItems: lines,
      discountType: discount.type,
      discountValue: discount.value,
      ...econToCents(econ),
      notes: input.notes?.trim() || null,
    })
    .where(eq(deals.id, id));
  revalidatePath("/orders");
  revalidatePath("/dashboard");
}

export async function updateDealStatus(id: number, status: DealStatus) {
  const db = getDb();
  await db.update(deals).set({ status }).where(eq(deals.id, id));
  revalidatePath("/orders");
  revalidatePath("/dashboard");
}

/** Set the buyer's total paid amount (dollars). Pass the running total, not a delta. */
export async function recordBuyerPayment(id: number, amountDollars: number) {
  const db = getDb();
  const cents = Math.max(0, dollarsToCents(amountDollars || 0));
  await db
    .update(deals)
    .set({
      buyerPaidCents: cents,
      buyerPaidAt: cents > 0 ? new Date() : null,
    })
    .where(eq(deals.id, id));
  revalidatePath("/orders");
  revalidatePath("/dashboard");
}

/** Set the client's payout total (dollars). Pass the running total, not a delta. */
export async function recordClientPayout(id: number, amountDollars: number) {
  const db = getDb();
  const cents = Math.max(0, dollarsToCents(amountDollars || 0));
  await db
    .update(deals)
    .set({
      clientPaidCents: cents,
      clientPaidAt: cents > 0 ? new Date() : null,
    })
    .where(eq(deals.id, id));
  revalidatePath("/orders");
  revalidatePath("/dashboard");
}

export async function deleteDeal(id: number) {
  const db = getDb();
  await db.delete(deals).where(eq(deals.id, id));
  revalidatePath("/orders");
  revalidatePath("/dashboard");
}

function clampPct(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, n));
}
