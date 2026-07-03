"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BRANDS, type Brand } from "../data/products";
import { useMergedProducts } from "../data/auraOverrides";
import {
  dealEconomics,
  lineEconomics,
  effectiveQty,
  backorderQty,
  type Deal,
  type DealLineItem,
  type DealStatus,
  type Discount,
  type DiscountType,
  DEAL_STATUSES,
} from "../data/economics";
import { applyPricing } from "../data/pricing";
import { type MatchedRow, matchRows } from "../data/matcher";
import { fileToBase64, parseSpreadsheet } from "../data/parse";
import type { BuyerRow, ClientRow, PricingPresetRow } from "../db/schema";
import {
  createDeal,
  updateDeal,
  deleteDeal,
  updateDealStatus,
  recordBuyerPayment,
  recordClientPayout,
} from "../actions/brokerage";

type Props = {
  clients: ClientRow[];
  buyers: BuyerRow[];
  deals: Deal[];
  presets: PricingPresetRow[];
};

type DraftLine = {
  qty: string;
  fulfilled: string;
  exitPerPack: string;
};

const currency = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

const num = (s: string) => {
  const n = parseFloat(s);
  return Number.isNaN(n) ? 0 : n;
};

const STATUS_LABEL: Record<DealStatus, string> = {
  draft: "Draft",
  sent: "Sent to supplier",
  partial: "Partially filled",
  fulfilled: "Fulfilled",
  paid: "Paid out",
};

export default function OrderBuilder({ clients, buyers, deals, presets }: Props) {
  const router = useRouter();
  const { products: mergedProducts } = useMergedProducts();
  const [isPending, startTransition] = useTransition();

  const [brand, setBrand] = useState<Brand>("Standard");
  const [clientId, setClientId] = useState<number | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientPct, setClientPct] = useState("0");
  const [buyerId, setBuyerId] = useState<number | null>(null);
  const [buyerName, setBuyerName] = useState("");
  const [status, setStatus] = useState<DealStatus>("draft");
  const [notes, setNotes] = useState("");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<Record<string, DraftLine>>({});
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [editingDealId, setEditingDealId] = useState<number | null>(null);
  const [presetId, setPresetId] = useState<number | "">("");
  const [discountType, setDiscountType] = useState<DiscountType>("none");
  const [discountValue, setDiscountValue] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<"idle" | "parsing" | "error">(
    "idle",
  );
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [reviewRows, setReviewRows] = useState<MatchedRow[] | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const brandProducts = useMemo(
    () => mergedProducts.filter((p) => p.brand === brand),
    [mergedProducts, brand],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return brandProducts;
    return brandProducts.filter(
      (p) =>
        p.product.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q),
    );
  }, [brandProducts, search]);

  const pct = num(clientPct);

  const lineItems = useMemo<DealLineItem[]>(() => {
    const items: DealLineItem[] = [];
    for (const p of brandProducts) {
      const d = draft[p.sku];
      if (!d) continue;
      const qty = num(d.qty);
      if (qty <= 0) continue;
      const fulfilledRaw = d.fulfilled?.trim() ?? "";
      items.push({
        sku: p.sku,
        product: p.product,
        qty,
        fulfilledQty: fulfilledRaw === "" ? null : num(d.fulfilled),
        unitCost: p.noMoq ?? 0,
        exitPerPack: num(d.exitPerPack),
      });
    }
    return items;
  }, [brandProducts, draft]);

  const discount = useMemo<Discount>(() => {
    if (discountType === "none") return { type: "none", value: 0 };
    return { type: discountType, value: num(discountValue) };
  }, [discountType, discountValue]);

  const econ = useMemo(
    () => dealEconomics(lineItems, pct, discount),
    [lineItems, pct, discount],
  );

  const backorderTotal = useMemo(
    () => lineItems.reduce((sum, l) => sum + backorderQty(l), 0),
    [lineItems],
  );

  const selectClient = (id: number | null) => {
    setClientId(id);
    if (id == null) {
      setClientName("");
      return;
    }
    const c = clients.find((x) => x.id === id);
    if (c) {
      setClientName(c.name);
      setClientPct(String(c.defaultProfitPct));
    }
  };

  const selectBuyer = (id: number | null) => {
    setBuyerId(id);
    if (id == null) {
      setBuyerName("");
      return;
    }
    const b = buyers.find((x) => x.id === id);
    if (b) setBuyerName(b.name);
  };

  const setLine = (sku: string, patch: Partial<DraftLine>) => {
    setDraft((prev) => {
      const current = prev[sku] ?? { qty: "", fulfilled: "", exitPerPack: "" };
      return { ...prev, [sku]: { ...current, ...patch } };
    });
  };

  const applyPreset = () => {
    if (presetId === "") return;
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) return;
    const mode = preset.mode === "margin" ? "margin" : "markup";
    const basis = preset.basis === "moq50" ? "moq50" : "noMoq";
    setDraft((prev) => {
      const next = { ...prev };
      for (const p of brandProducts) {
        const cost = basis === "moq50" ? p.moq50 : p.noMoq;
        if (cost == null) continue;
        const price = applyPricing(cost, mode, preset.pct);
        if (price <= 0) continue;
        const current = next[p.sku] ?? { qty: "", fulfilled: "", exitPerPack: "" };
        next[p.sku] = { ...current, exitPerPack: price.toFixed(2) };
      }
      return next;
    });
    setSavedMsg(
      `Applied "${preset.name}" exit prices to all ${brand} products.`,
    );
  };

  const handleFile = async (file: File) => {
    setUploadError(null);
    setUploadState("parsing");
    try {
      const type = file.type;
      const name = file.name.toLowerCase();
      const isSpreadsheet =
        type.includes("sheet") ||
        type.includes("excel") ||
        type === "text/csv" ||
        /\.(csv|xlsx|xls)$/.test(name);
      const isImage =
        type.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/.test(name);
      const isPdf = type === "application/pdf" || /\.pdf$/.test(name);

      let parsed;
      if (isSpreadsheet) {
        parsed = await parseSpreadsheet(file);
      } else if (isImage || isPdf) {
        const data = await fileToBase64(file);
        const mediaType = type || (isPdf ? "application/pdf" : "image/png");
        const res = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data, mediaType }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Extraction failed.");
        parsed = json.rows ?? [];
      } else {
        throw new Error(
          "Unsupported file type. Upload an image, PDF, CSV, or Excel file.",
        );
      }

      const matched = matchRows(parsed, brand);
      if (matched.length === 0) {
        throw new Error("No line items were found in that file.");
      }
      setReviewRows(matched);
      setUploadState("idle");
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Failed to read file.",
      );
      setUploadState("error");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const setReviewMatch = (index: number, sku: string) => {
    setReviewRows((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      const p = brandProducts.find((bp) => bp.sku === sku);
      next[index] = {
        ...next[index],
        matchedSku: p ? p.sku : null,
        matchedProduct: p ? p.product : null,
        status: p ? "exact" : "none",
      };
      return next;
    });
  };

  const setReviewQty = (index: number, qty: number) => {
    setReviewRows((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      next[index] = { ...next[index], qty: Number.isNaN(qty) ? 0 : qty };
      return next;
    });
  };

  const applyReview = () => {
    if (!reviewRows) return;
    setDraft((prev) => {
      const next = { ...prev };
      for (const r of reviewRows) {
        if (r.matchedSku && r.qty > 0) {
          const current = next[r.matchedSku] ?? { qty: "", fulfilled: "", exitPerPack: "" };
          const exit =
            r.exitPerPack != null && r.exitPerPack > 0
              ? String(r.exitPerPack)
              : current.exitPerPack;
          next[r.matchedSku] = {
            ...current,
            qty: String(r.qty),
            exitPerPack: exit,
          };
        }
      }
      return next;
    });
    setReviewRows(null);
  };

  const downloadSampleCsv = () => {
    const sample = brandProducts.slice(0, 5);
    const header = "Qty,SKU,Product";
    const lines = sample.map(
      (p) =>
        `1,${p.sku},"${p.product}${
          p.strength != null ? ` ${p.strength}${p.strengthUnit}` : ""
        }"`,
    );
    const csv = [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `order-template-${brand}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetDeal = () => {
    setDraft({});
    setNotes("");
    setStatus("draft");
    setError(null);
    setEditingDealId(null);
    setBuyerId(null);
    setBuyerName("");
    setDiscountType("none");
    setDiscountValue("");
    setPresetId("");
  };

  const loadDeal = (deal: Deal) => {
    setEditingDealId(deal.id);
    setBrand(deal.brand);
    setClientId(deal.clientId);
    setClientName(deal.clientName);
    setClientPct(String(deal.clientPct));
    setBuyerId(deal.buyerId ?? null);
    setBuyerName(deal.buyerName ?? "");
    setStatus(deal.status);
    setNotes(deal.notes ?? "");
    setDiscountType(deal.discountType ?? "none");
    setDiscountValue(
      deal.discountType && deal.discountType !== "none"
        ? String(deal.discountValue)
        : "",
    );
    const next: Record<string, DraftLine> = {};
    for (const l of deal.lineItems) {
      next[l.sku] = {
        qty: String(l.qty),
        fulfilled: l.fulfilledQty == null ? "" : String(l.fulfilledQty),
        exitPerPack: l.exitPerPack ? String(l.exitPerPack) : "",
      };
    }
    setDraft(next);
    setError(null);
    setSavedMsg(null);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const validate = (): string | null => {
    if (lineItems.length === 0) {
      return "Add at least one line item with a quantity.";
    }
    const pctVal = num(clientPct);
    if (pctVal < 0 || pctVal > 100) {
      return "Profit % to broker must be between 0 and 100.";
    }
    const missingExit = lineItems.some((l) => l.exitPerPack <= 0);
    if (missingExit) {
      return "Every line with a quantity needs an exit price greater than 0.";
    }
    return null;
  };

  const save = () => {
    setError(null);
    setSavedMsg(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (
      econ.profit < 0 &&
      !confirm(
        `This deal loses money (profit ${currency(
          econ.profit,
        )}). Save it anyway?`,
      )
    ) {
      return;
    }
    const payload = {
      clientId,
      clientName: clientName.trim() || "Unassigned",
      buyerId,
      buyerName: buyerName.trim() || null,
      brand,
      status,
      clientPct: pct,
      lineItems,
      discountType,
      discountValue: discountType === "none" ? 0 : num(discountValue),
      notes,
    };
    startTransition(async () => {
      try {
        if (editingDealId != null) {
          await updateDeal(editingDealId, payload);
          setSavedMsg("Deal updated.");
        } else {
          await createDeal(payload);
          setSavedMsg("Deal saved.");
        }
        resetDeal();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save deal.");
      }
    });
  };

  const changeStatus = (id: number, next: DealStatus) => {
    startTransition(async () => {
      await updateDealStatus(id, next);
      router.refresh();
    });
  };

  const removeDeal = (id: number) => {
    if (!confirm("Delete this saved deal?")) return;
    startTransition(async () => {
      await deleteDeal(id);
      router.refresh();
    });
  };

  const recordPayment = (d: Deal) => {
    const due = Math.max(0, d.exit - d.buyerPaid);
    const who = d.buyerName || d.clientName;
    const input = prompt(
      `Buyer payment from ${who}\n` +
        `Invoice total: ${currency(d.exit)} · Paid so far: ${currency(d.buyerPaid)}\n\n` +
        `Enter the total amount the buyer has paid (running total):`,
      String(d.buyerPaid > 0 ? d.buyerPaid : due),
    );
    if (input === null) return;
    const amount = num(input);
    if (Number.isNaN(amount) || amount < 0) {
      setError("Enter a valid payment amount.");
      return;
    }
    startTransition(async () => {
      await recordBuyerPayment(d.id, amount);
      router.refresh();
    });
  };

  const recordPayout = (d: Deal) => {
    const due = Math.max(0, d.clientShare - d.clientPaid);
    const input = prompt(
      `Broker payout for ${d.clientName}\n` +
        `Owed to broker: ${currency(d.clientShare)} · Paid so far: ${currency(d.clientPaid)}\n\n` +
        `Enter the total payout to the broker (running total):`,
      String(d.clientPaid > 0 ? d.clientPaid : due),
    );
    if (input === null) return;
    const amount = num(input);
    if (Number.isNaN(amount) || amount < 0) {
      setError("Enter a valid payout amount.");
      return;
    }
    startTransition(async () => {
      await recordClientPayout(d.id, amount);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="text-xs font-medium text-neutral-500">
              Broker
            </span>
            <select
              value={clientId ?? ""}
              onChange={(e) =>
                selectClient(e.target.value ? Number(e.target.value) : null)
              }
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
            >
              <option value="">Unassigned / one-off</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.defaultProfitPct}%)
                </option>
              ))}
            </select>
            {clientId == null ? (
              <input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Or type a name"
                className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
              />
            ) : null}
          </label>

          <label className="block">
            <span className="text-xs font-medium text-neutral-500">
              Buyer
            </span>
            <select
              value={buyerId ?? ""}
              onChange={(e) =>
                selectBuyer(e.target.value ? Number(e.target.value) : null)
              }
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
            >
              <option value="">None / same as broker</option>
              {buyers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            {buyerId == null ? (
              <input
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="Or type a buyer name"
                className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
              />
            ) : null}
          </label>

          <label className="block">
            <span className="text-xs font-medium text-neutral-500">
              Supplier brand
            </span>
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value as Brand)}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
            >
              {BRANDS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-medium text-neutral-500">
              Profit % to broker
            </span>
            <div className="relative mt-1">
              <input
                value={clientPct}
                onChange={(e) => setClientPct(e.target.value)}
                inputMode="decimal"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 pr-8 text-sm outline-none focus:border-neutral-900"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">
                %
              </span>
            </div>
          </label>

          <label className="block">
            <span className="text-xs font-medium text-neutral-500">
              Status
            </span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as DealStatus)}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
            >
              {DEAL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section
        onDragOver={(e) => {
          e.preventDefault();
          if (!isDragging) setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f) handleFile(f);
        }}
        className={`rounded-xl border-2 border-dashed p-5 shadow-sm transition-colors ${
          isDragging
            ? "border-neutral-900 bg-neutral-50"
            : "border-neutral-300 bg-white"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Autofill from a file
            </h2>
            <p className="mt-1 text-xs text-neutral-400">
              Drag &amp; drop or upload a client order as an image, PDF, CSV, or
              Excel file. We read the quantities and SKUs, match them to the{" "}
              {brand} catalog, and let you review before filling the line items.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.csv,.xlsx,.xls,application/pdf,text/csv"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
              className="hidden"
            />
            <button
              onClick={downloadSampleCsv}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
            >
              Sample CSV
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadState === "parsing"}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploadState === "parsing" ? "Reading file…" : "Upload file"}
            </button>
          </div>
        </div>
        {isDragging && (
          <p className="mt-3 text-center text-sm font-medium text-neutral-600">
            Drop the file to upload
          </p>
        )}
        {uploadError && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {uploadError}
          </p>
        )}
      </section>

      {reviewRows && (
        <section className="rounded-xl border border-amber-300 bg-amber-50/40 p-5 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-600">
              Review parsed order ({reviewRows.length} rows)
            </h2>
            <div className="flex gap-2">
              <button
                onClick={applyReview}
                className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
              >
                Fill quantities from matched rows
              </button>
              <button
                onClick={() => setReviewRows(null)}
                className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-100"
              >
                Cancel
              </button>
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2">From file (SKU / product)</th>
                  <th className="px-3 py-2">Matched catalog item</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {reviewRows.map((r, i) => (
                  <tr key={i} className="border-t border-neutral-100">
                    <td className="px-2 py-1 text-right">
                      <input
                        type="number"
                        min="0"
                        value={r.qty === 0 ? "" : r.qty}
                        placeholder="0"
                        onChange={(e) =>
                          setReviewQty(i, parseInt(e.target.value, 10))
                        }
                        className="w-16 rounded-md border border-neutral-200 bg-white px-2 py-1 text-right text-sm tabular-nums outline-none focus:border-neutral-900"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <span className="font-mono text-xs text-neutral-600">
                        {r.sku || "—"}
                      </span>
                      {r.product && (
                        <span className="ml-2 text-neutral-500">
                          {r.product}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-1">
                      <select
                        value={r.matchedSku ?? ""}
                        onChange={(e) => setReviewMatch(i, e.target.value)}
                        className="w-full max-w-xs rounded-md border border-neutral-200 bg-white px-2 py-1 text-sm outline-none focus:border-neutral-900"
                      >
                        <option value="">— No match (skip) —</option>
                        {brandProducts.map((p) => (
                          <option key={p.sku} value={p.sku}>
                            {p.sku} — {p.product}
                            {p.strength != null
                              ? ` ${p.strength}${p.strengthUnit}`
                              : ""}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-neutral-500">
            Applying fills the Qty column below. Set the Exit /pack price after
            filling.
          </p>
        </section>
      )}

      <section className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-5 py-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Line items
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={presetId}
              onChange={(e) =>
                setPresetId(e.target.value ? Number(e.target.value) : "")
              }
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm outline-none focus:border-neutral-900"
            >
              <option value="">Apply pricing preset…</option>
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.mode === "margin" ? "margin" : "markup"} {p.pct}%)
                </option>
              ))}
            </select>
            <button
              onClick={applyPreset}
              disabled={presetId === ""}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-40"
              title={`Fill exit prices for all ${brand} products from the selected preset`}
            >
              Apply to all
            </button>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className="w-44 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm outline-none focus:border-neutral-900"
            />
          </div>
        </div>
        <div className="scroll-fade max-h-[28rem] overflow-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="sticky top-0 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-5 py-2 font-medium">Product</th>
                <th className="px-3 py-2 text-right font-medium">List /pack</th>
                <th className="px-3 py-2 text-right font-medium">Qty</th>
                <th className="px-3 py-2 text-right font-medium">Fulfilled</th>
                <th className="px-3 py-2 text-right font-medium">Exit /pack</th>
                <th className="px-3 py-2 text-right font-medium">Profit</th>
                <th className="px-5 py-2 text-right font-medium">
                  Owed to broker
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((p) => {
                const d = draft[p.sku] ?? {
                  qty: "",
                  fulfilled: "",
                  exitPerPack: "",
                };
                const qty = num(d.qty);
                const fulfilledRaw = d.fulfilled?.trim() ?? "";
                const line: DealLineItem = {
                  sku: p.sku,
                  product: p.product,
                  qty,
                  fulfilledQty: fulfilledRaw === "" ? null : num(d.fulfilled),
                  unitCost: p.noMoq ?? 0,
                  exitPerPack: num(d.exitPerPack),
                };
                const e = lineEconomics(line, pct);
                const active = qty > 0;
                const back = backorderQty(line);
                const filledQty = effectiveQty(line);
                const short = active && back > 0;
                return (
                  <tr
                    key={p.sku}
                    className={
                      short
                        ? "bg-amber-50/60"
                        : active
                          ? "bg-emerald-50/40"
                          : undefined
                    }
                  >
                    <td className="px-5 py-2">
                      <div className="font-medium text-neutral-900">
                        {p.product}
                        {p.strength != null ? (
                          <span className="text-neutral-500">
                            {" "}
                            {p.strength}
                            {p.strengthUnit}
                          </span>
                        ) : null}
                      </div>
                      <div className="text-xs text-neutral-400">{p.sku}</div>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-neutral-500">
                      {p.noMoq != null ? currency(p.noMoq) : "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        value={d.qty}
                        onChange={(ev) =>
                          setLine(p.sku, { qty: ev.target.value })
                        }
                        inputMode="numeric"
                        placeholder="0"
                        className="w-16 rounded-md border border-neutral-300 px-2 py-1 text-right text-sm outline-none focus:border-neutral-900"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        value={d.fulfilled}
                        onChange={(ev) =>
                          setLine(p.sku, { fulfilled: ev.target.value })
                        }
                        inputMode="numeric"
                        placeholder={active ? String(qty) : "—"}
                        disabled={!active}
                        title="Leave blank if the supplier filled the full quantity"
                        className="w-16 rounded-md border border-neutral-300 px-2 py-1 text-right text-sm outline-none focus:border-neutral-900 disabled:bg-neutral-50 disabled:text-neutral-300"
                      />
                      {short ? (
                        <div className="mt-0.5 text-[10px] font-medium text-amber-600">
                          {back} short
                        </div>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        value={d.exitPerPack}
                        onChange={(ev) =>
                          setLine(p.sku, { exitPerPack: ev.target.value })
                        }
                        inputMode="decimal"
                        placeholder="0.00"
                        className="w-20 rounded-md border border-neutral-300 px-2 py-1 text-right text-sm outline-none focus:border-neutral-900"
                      />
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {active && filledQty > 0 ? (
                        <span
                          className={
                            e.profit >= 0
                              ? "text-neutral-900"
                              : "text-red-600"
                          }
                        >
                          {currency(e.profit)}
                        </span>
                      ) : (
                        <span className="text-neutral-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-2 text-right tabular-nums text-neutral-600">
                      {active && filledQty > 0 ? (
                        currency(e.clientShare)
                      ) : (
                        <span className="text-neutral-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          {editingDealId != null
            ? `Deal summary — editing #${String(editingDealId).padStart(5, "0")}`
            : "Deal summary"}
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Stat label="Supplier cost" value={currency(econ.supplierCost)} />
          <Stat
            label={
              econ.discountAmount > 0 ? "Exit after discount" : "Exit (sell) total"
            }
            value={currency(econ.exit)}
          />
          <Stat
            label="Total profit"
            value={currency(econ.profit)}
            tone={econ.profit >= 0 ? "neutral" : "bad"}
          />
          <Stat
            label="Owed to broker"
            value={currency(econ.clientShare)}
            tone="info"
          />
          <Stat
            label="Company profit"
            value={currency(econ.companyProfit)}
            tone={econ.companyProfit >= 0 ? "good" : "bad"}
          />
        </div>

        <div className="mt-4 rounded-lg border border-neutral-100 bg-neutral-50 p-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="text-xs font-medium text-neutral-500">
                Order discount
              </span>
              <select
                value={discountType}
                onChange={(e) =>
                  setDiscountType(e.target.value as DiscountType)
                }
                className="mt-1 block w-40 rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
              >
                <option value="none">No discount</option>
                <option value="pct">Percentage (%)</option>
                <option value="flat">Flat amount ($)</option>
              </select>
            </label>
            {discountType !== "none" ? (
              <label className="block">
                <span className="text-xs font-medium text-neutral-500">
                  {discountType === "pct" ? "Percent off" : "Dollars off"}
                </span>
                <div className="relative mt-1">
                  <input
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    inputMode="decimal"
                    placeholder={discountType === "pct" ? "5" : "0.00"}
                    className="w-32 rounded-lg border border-neutral-300 px-3 py-2 pr-8 text-sm outline-none focus:border-neutral-900"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">
                    {discountType === "pct" ? "%" : "$"}
                  </span>
                </div>
              </label>
            ) : null}
            {econ.discountAmount > 0 ? (
              <p className="text-sm text-neutral-500">
                Gross exit {currency(econ.grossExit)} − discount{" "}
                <span className="font-medium text-neutral-700">
                  {currency(econ.discountAmount)}
                </span>{" "}
                = {currency(econ.exit)}. The discount is shared by company and
                client per the profit split.
              </p>
            ) : (
              <p className="text-sm text-neutral-400">
                Optional. Lowers the sell total; profit and the client split are
                recalculated on the discounted total.
              </p>
            )}
          </div>
        </div>

        {econ.lines > 0 && econ.profit < 0 ? (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            ⚠ This deal loses money — the exit total is below supplier cost.
            You can still save it, but double-check the exit prices.
          </p>
        ) : null}

        {backorderTotal > 0 ? (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Partial fill: {backorderTotal} pack
            {backorderTotal === 1 ? "" : "s"} short of what was ordered. Costs,
            profit, and the buyer invoice are based on the fulfilled quantities.
            Set status to “Partially filled” to track the backorder.
          </p>
        ) : null}

        <label className="mt-4 block">
          <span className="text-xs font-medium text-neutral-500">
            Notes (optional)
          </span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Broker, exit terms, anything to remember…"
            className="mt-1 w-full resize-none rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
          />
        </label>

        {error ? (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        {savedMsg ? (
          <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {savedMsg}
          </p>
        ) : null}

        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={save}
            disabled={isPending}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending
              ? "Saving…"
              : editingDealId != null
                ? "Update deal"
                : "Save deal"}
          </button>
          <button
            onClick={resetDeal}
            disabled={isPending}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
          >
            {editingDealId != null ? "Cancel edit" : "Clear"}
          </button>
          <span className="ml-auto text-sm text-neutral-400">
            {econ.lines} line{econ.lines === 1 ? "" : "s"} ·{" "}
            {backorderTotal > 0
              ? `${econ.qty} of ${econ.qty + backorderTotal} packs filled`
              : `${econ.qty} pack${econ.qty === 1 ? "" : "s"}`}
          </span>
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-5 py-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Saved deals ({deals.length})
          </h2>
          {deals.length > 0 ? (
            <span className="text-xs text-neutral-400 lg:hidden">
              Swipe to see more →
            </span>
          ) : null}
        </div>
        {deals.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-neutral-400">
            No saved deals yet.
          </p>
        ) : (
          <div className="scroll-fade overflow-x-auto">
            <table className="w-full min-w-[920px] text-sm">
              <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-5 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Broker</th>
                  <th className="px-3 py-2 font-medium">Buyer</th>
                  <th className="px-3 py-2 font-medium">Brand</th>
                  <th className="px-3 py-2 text-right font-medium">Cost</th>
                  <th className="px-3 py-2 text-right font-medium">Exit</th>
                  <th className="px-3 py-2 text-right font-medium">Owed</th>
                  <th className="px-3 py-2 text-right font-medium">Company</th>
                  <th className="px-3 py-2 font-medium">Buyer paid</th>
                  <th className="px-3 py-2 font-medium">Broker paid</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-5 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {deals.map((d) => (
                  <tr key={d.id}>
                    <td className="whitespace-nowrap px-5 py-2 text-neutral-500">
                      {new Date(d.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-3 py-2 font-medium text-neutral-900">
                      {d.clientName}
                    </td>
                    <td className="px-3 py-2 text-neutral-500">
                      {d.buyerName || "—"}
                    </td>
                    <td className="px-3 py-2 text-neutral-500">{d.brand}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-neutral-500">
                      {currency(d.supplierCost)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-neutral-500">
                      {currency(d.exit)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-neutral-600">
                      {currency(d.clientShare)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums font-medium text-emerald-700">
                      {currency(d.companyProfit)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <PayStatus paid={d.buyerPaid} total={d.exit} />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <PayStatus paid={d.clientPaid} total={d.clientShare} />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={d.status}
                        onChange={(e) =>
                          changeStatus(d.id, e.target.value as DealStatus)
                        }
                        className="rounded-md border border-neutral-300 px-2 py-1 text-xs outline-none focus:border-neutral-900"
                      >
                        {DEAL_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABEL[s]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-2 text-right">
                      <button
                        onClick={() => loadDeal(d)}
                        className="mr-3 text-xs font-medium text-neutral-500 hover:text-neutral-900"
                      >
                        Edit
                      </button>
                      <a
                        href={`/orders/${d.id}/print`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mr-3 text-xs font-medium text-neutral-500 hover:text-neutral-900"
                      >
                        PO PDF
                      </a>
                      <a
                        href={`/orders/${d.id}/invoice`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mr-3 text-xs font-medium text-neutral-500 hover:text-neutral-900"
                      >
                        Invoice
                      </a>
                      <button
                        onClick={() => recordPayment(d)}
                        className="mr-3 text-xs font-medium text-neutral-500 hover:text-neutral-900"
                      >
                        Record payment
                      </button>
                      <button
                        onClick={() => recordPayout(d)}
                        className="mr-3 text-xs font-medium text-neutral-500 hover:text-neutral-900"
                      >
                        Pay broker
                      </button>
                      <button
                        onClick={() => removeDeal(d.id)}
                        className="text-xs font-medium text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function PayStatus({ paid, total }: { paid: number; total: number }) {
  const outstanding = Math.max(0, total - paid);
  if (total <= 0) {
    return <span className="text-xs text-neutral-400">—</span>;
  }
  if (paid >= total - 0.005) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
        Paid {currency(paid)}
      </span>
    );
  }
  if (paid > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
        {currency(paid)} · {currency(outstanding)} due
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">
      {currency(outstanding)} due
    </span>
  );
}

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "good" | "bad" | "info";
}) {
  const toneClass =
    tone === "good"
      ? "text-emerald-700"
      : tone === "bad"
        ? "text-red-600"
        : tone === "info"
          ? "text-sky-700"
          : "text-neutral-900";
  return (
    <div className="rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-3">
      <p className="text-xs font-medium text-neutral-500">{label}</p>
      <p className={`mt-1 text-lg font-semibold tabular-nums ${toneClass}`}>
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: MatchedRow["status"] }) {
  const map = {
    exact: { label: "Matched", cls: "bg-emerald-100 text-emerald-700" },
    fuzzy: { label: "Fuzzy match", cls: "bg-amber-100 text-amber-700" },
    none: { label: "No match", cls: "bg-neutral-100 text-neutral-500" },
  } as const;
  const s = map[status];
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}
    >
      {s.label}
    </span>
  );
}
