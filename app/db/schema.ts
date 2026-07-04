import {
  pgTable,
  serial,
  text,
  integer,
  real,
  timestamp,
  jsonb,
  primaryKey,
} from "drizzle-orm/pg-core";
import type { DealLineItem } from "../data/economics";

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  defaultProfitPct: real("default_profit_pct").notNull().default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Buyers are the end customers who receive goods and pay the invoice.
// Distinct from brokers (the `clients` table), who negotiate deals and
// receive the profit-share payout.
export const buyers = pgTable("buyers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contact: text("contact"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const pricingPresets = pgTable("pricing_presets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  // "markup" | "margin"
  mode: text("mode").notNull().default("markup"),
  pct: real("pct").notNull().default(0),
  // "noMoq" | "moq50"
  basis: text("basis").notNull().default("noMoq"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Marketing media (images, PDFs, videos) that reps share with buyers,
// organized by supplier brand. Files are hosted on Vercel Blob (url points
// to the blob) OR an external link the rep pasted. blobPathname is set only
// for Blob-hosted files so we can delete them from storage.
export const supplierMedia = pgTable("supplier_media", {
  id: serial("id").primaryKey(),
  brand: text("brand").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  url: text("url").notNull(),
  // "image" | "video" | "pdf" | "link"
  kind: text("kind").notNull().default("link"),
  blobPathname: text("blob_pathname"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const deals = pgTable("deals", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id"),
  clientName: text("client_name").notNull(),
  // The buyer (end customer) receiving the goods and paying the invoice.
  buyerId: integer("buyer_id"),
  buyerName: text("buyer_name"),
  brand: text("brand").notNull(),
  status: text("status").notNull().default("draft"),
  clientPct: real("client_pct").notNull().default(0),
  lineItems: jsonb("line_items").$type<DealLineItem[]>().notNull().default([]),
  // Order-level discount applied to the exit (sell) total.
  // discountType: "none" | "pct" | "flat"; pct stored as a percentage,
  // flat stored as integer cents.
  discountType: text("discount_type").notNull().default("none"),
  discountValue: real("discount_value").notNull().default(0),
  // Monetary totals stored as integer cents to avoid float drift.
  // exitCents is the discounted exit total; profit/share reflect the discount.
  supplierCostCents: integer("supplier_cost_cents").notNull().default(0),
  exitCents: integer("exit_cents").notNull().default(0),
  profitCents: integer("profit_cents").notNull().default(0),
  clientShareCents: integer("client_share_cents").notNull().default(0),
  companyProfitCents: integer("company_profit_cents").notNull().default(0),
  // Payment tracking (running totals in integer cents).
  buyerPaidCents: integer("buyer_paid_cents").notNull().default(0),
  buyerPaidAt: timestamp("buyer_paid_at", { withTimezone: true }),
  clientPaidCents: integer("client_paid_cents").notNull().default(0),
  clientPaidAt: timestamp("client_paid_at", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Shared, multi-user Aura working state. Per-item rows (one per store+item) so
// two people editing different items don't clobber each other. Stores:
// "overrides" | "additions" | "batches" | "labels" | "order". Replaces the
// former per-browser localStorage so the Aura line can be worked on together.
export const auraState = pgTable(
  "aura_state",
  {
    store: text("store").notNull(),
    item: text("item").notNull(),
    value: jsonb("value").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.store, t.item] })],
);

export type AuraStateRow = typeof auraState.$inferSelect;

export type ClientRow = typeof clients.$inferSelect;
export type BuyerRow = typeof buyers.$inferSelect;
export type DealRow = typeof deals.$inferSelect;
export type PricingPresetRow = typeof pricingPresets.$inferSelect;
export type SupplierMediaRow = typeof supplierMedia.$inferSelect;
