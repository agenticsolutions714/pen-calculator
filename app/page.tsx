"use client";

import { useMemo, useState } from "react";
import { products, type Product } from "./data/products";

type SortKey = "sku" | "product" | "strength" | "noMoqPen" | "moq50Pen";
type SortDir = "asc" | "desc";

const currency = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

function AddOnInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
        {label}
      </span>
      <div className="flex items-center rounded-lg border border-neutral-300 bg-white px-3 focus-within:border-neutral-900 focus-within:ring-1 focus-within:ring-neutral-900">
        <span className="text-neutral-400">$</span>
        <input
          type="number"
          step="0.01"
          min="0"
          value={Number.isNaN(value) ? "" : value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full bg-transparent py-2 pl-1 text-sm outline-none"
        />
      </div>
    </label>
  );
}

export default function Home() {
  const [hardware, setHardware] = useState(5);
  const [packaging, setPackaging] = useState(2);
  const [packagingLabor, setPackagingLabor] = useState(1.5);
  const [fillingLabor, setFillingLabor] = useState(5);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("product");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const addOns =
    (Number.isNaN(hardware) ? 0 : hardware) +
    (Number.isNaN(packaging) ? 0 : packaging) +
    (Number.isNaN(packagingLabor) ? 0 : packagingLabor) +
    (Number.isNaN(fillingLabor) ? 0 : fillingLabor);

  const rows = useMemo(() => {
    const perVial = (packPrice: number | null) =>
      packPrice == null ? null : packPrice / 10;
    const penPrice = (packPrice: number | null) => {
      const pv = perVial(packPrice);
      return pv == null ? null : pv + addOns;
    };

    const mapped = products.map((p: Product) => ({
      ...p,
      noMoqVial: perVial(p.noMoq),
      moq50Vial: perVial(p.moq50),
      noMoqPen: penPrice(p.noMoq),
      moq50Pen: penPrice(p.moq50),
    }));

    const q = search.trim().toLowerCase();
    const filtered = q
      ? mapped.filter(
          (r) =>
            r.product.toLowerCase().includes(q) ||
            r.sku.toLowerCase().includes(q),
        )
      : mapped;

    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number")
        return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [addOns, search, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortArrow = (key: SortKey) =>
    sortKey === key ? (sortDir === "asc" ? " ▲" : " ▼") : "";

  return (
    <main className="min-h-screen bg-neutral-100 text-neutral-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Per-Pen Pricing Calculator
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Showing 1 vial / pen pricing. Per-vial cost = pack price ÷ 10, plus
            adjustable add-ons below.
          </p>
        </header>

        <section className="mb-6 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Adjustable add-ons (per pen)
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <AddOnInput label="Pen hardware" value={hardware} onChange={setHardware} />
            <AddOnInput label="Packaging" value={packaging} onChange={setPackaging} />
            <AddOnInput
              label="Packaging labor"
              value={packagingLabor}
              onChange={setPackagingLabor}
            />
            <AddOnInput
              label="Filling labor"
              value={fillingLabor}
              onChange={setFillingLabor}
            />
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="text-neutral-500">Total add-on per pen:</span>
            <span className="rounded-md bg-neutral-900 px-2 py-1 font-semibold text-white">
              {currency(addOns)}
            </span>
          </div>
        </section>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search product or SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
          />
        </div>

        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
                <Th onClick={() => toggleSort("sku")}>SKU{sortArrow("sku")}</Th>
                <Th onClick={() => toggleSort("product")}>
                  Product{sortArrow("product")}
                </Th>
                <Th onClick={() => toggleSort("strength")} className="text-right">
                  Strength{sortArrow("strength")}
                </Th>
                <Th className="text-right">Vial</Th>
                <Th className="text-right">No MOQ /vial</Th>
                <Th
                  onClick={() => toggleSort("noMoqPen")}
                  className="bg-neutral-100 text-right font-semibold text-neutral-900"
                >
                  No MOQ /pen{sortArrow("noMoqPen")}
                </Th>
                <Th className="text-right">50 MOQ /vial</Th>
                <Th
                  onClick={() => toggleSort("moq50Pen")}
                  className="bg-neutral-100 text-right font-semibold text-neutral-900"
                >
                  50 MOQ /pen{sortArrow("moq50Pen")}
                </Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={`${r.sku}-${i}`}
                  className="border-t border-neutral-100 hover:bg-amber-50"
                >
                  <td className="px-3 py-2 font-mono text-xs text-neutral-600">
                    {r.sku}
                  </td>
                  <td className="px-3 py-2">{r.product}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {r.strength != null
                      ? `${r.strength} ${r.strengthUnit}`
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-neutral-500">
                    {r.vialSize} {r.vialUnit}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-neutral-500">
                    {r.noMoqVial != null ? currency(r.noMoqVial) : "—"}
                  </td>
                  <td className="bg-neutral-50 px-3 py-2 text-right font-semibold tabular-nums">
                    {r.noMoqPen != null ? currency(r.noMoqPen) : "—"}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-neutral-500">
                    {r.moq50Vial != null ? currency(r.moq50Vial) : "—"}
                  </td>
                  <td className="bg-neutral-50 px-3 py-2 text-right font-semibold tabular-nums">
                    {r.moq50Pen != null ? currency(r.moq50Pen) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-neutral-400">
          {rows.length} SKUs shown. Pen price = (pack price ÷ 10) + add-ons.
        </p>
      </div>
    </main>
  );
}

function Th({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <th
      onClick={onClick}
      className={`whitespace-nowrap px-3 py-3 ${
        onClick ? "cursor-pointer select-none hover:text-neutral-900" : ""
      } ${className}`}
    >
      {children}
    </th>
  );
}
