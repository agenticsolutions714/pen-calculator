"use client";

import { useEffect, useMemo, useState } from "react";
import { products, type Product, type Brand } from "./data/products";

type SortKey = "sku" | "product" | "strength" | "noMoqPen" | "moq50Pen";
type SortDir = "asc" | "desc";

type Row = Product & {
  noMoqVial: number | null;
  moq50Vial: number | null;
  noMoqPen: number | null;
  moq50Pen: number | null;
};

const STORAGE_KEY = "pen-calc-favorites";
const TIERS_STORAGE_KEY = "pen-calc-volume-tiers";

const currency = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

type VolumeTier = { qty: number; label: string; discount: number };

const DEFAULT_TIERS: VolumeTier[] = [
  { qty: 5000, label: "5k", discount: 8 },
  { qty: 10000, label: "10k", discount: 15 },
  { qty: 20000, label: "20k", discount: 22 },
  { qty: 50000, label: "50k", discount: 30 },
  { qty: 100000, label: "100k", discount: 38 },
];

const favKey = (brand: Brand, sku: string) => `${brand}:${sku}`;

function defaultFavorites(): string[] {
  return products
    .filter((p) => {
      const name = p.product.toLowerCase();
      const sku = p.sku.toLowerCase();
      return (
        name.includes("retatrutide") ||
        name.includes("nad") ||
        sku.startsWith("klow") ||
        sku.startsWith("glow")
      );
    })
    .map((p) => favKey(p.brand, p.sku));
}

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
  const [brand, setBrand] = useState<Brand>("Revolve");
  const [sortKey, setSortKey] = useState<SortKey>("product");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [tiers, setTiers] = useState<VolumeTier[]>(DEFAULT_TIERS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      } else {
        setFavorites(defaultFavorites());
      }
    } catch {
      setFavorites(defaultFavorites());
    }
    try {
      const storedTiers = localStorage.getItem(TIERS_STORAGE_KEY);
      if (storedTiers) {
        const parsed = JSON.parse(storedTiers) as VolumeTier[];
        if (Array.isArray(parsed) && parsed.length === DEFAULT_TIERS.length) {
          setTiers(parsed);
        }
      }
    } catch {
      setTiers(DEFAULT_TIERS);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    }
  }, [favorites, hydrated]);

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(TIERS_STORAGE_KEY, JSON.stringify(tiers));
    }
  }, [tiers, hydrated]);

  const setTierDiscount = (index: number, value: number) => {
    setTiers((prev) =>
      prev.map((t, i) => (i === index ? { ...t, discount: value } : t)),
    );
  };

  const showMoq50 = brand === "Revolve";

  const addOns =
    (Number.isNaN(hardware) ? 0 : hardware) +
    (Number.isNaN(packaging) ? 0 : packaging) +
    (Number.isNaN(packagingLabor) ? 0 : packagingLabor) +
    (Number.isNaN(fillingLabor) ? 0 : fillingLabor);

  const toggleFavorite = (brand: Brand, sku: string) => {
    const key = favKey(brand, sku);
    setFavorites((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const isFavorite = (brand: Brand, sku: string) =>
    favorites.includes(favKey(brand, sku));

  const allRows = useMemo(() => {
    const perVial = (price: number | null) =>
      price == null ? null : price / 10;
    const penPrice = (price: number | null) => {
      const pv = perVial(price);
      return pv == null ? null : pv + addOns;
    };
    return products.map(
      (p: Product): Row => ({
        ...p,
        noMoqVial: perVial(p.noMoq),
        moq50Vial: perVial(p.moq50),
        noMoqPen: penPrice(p.noMoq),
        moq50Pen: penPrice(p.moq50),
      }),
    );
  }, [addOns]);

  const sortRows = (input: Row[]) => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...input].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number")
        return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  };

  const brandRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = allRows
      .filter((r) => r.brand === brand)
      .filter((r) =>
        q
          ? r.product.toLowerCase().includes(q) ||
            r.sku.toLowerCase().includes(q)
          : true,
      );
    return sortRows(filtered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allRows, search, brand, sortKey, sortDir]);

  const favoriteRows = useMemo(() => {
    const favs = allRows.filter((r) => favorites.includes(favKey(r.brand, r.sku)));
    return sortRows(favs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allRows, favorites, sortKey, sortDir]);

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
            Showing 1 vial / pen pricing. Per-vial cost = list price ÷ 10, plus
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

        <section className="mb-8 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Volume discount tiers
          </h2>
          <p className="mb-4 text-xs text-neutral-400">
            Base prices are at 1,000 pens. Predicted per-pen price = base price ×
            (1 − discount). Edit the discount % for each volume.
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {tiers.map((t, i) => (
              <label key={t.qty} className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  {t.qty.toLocaleString()} pens
                </span>
                <div className="flex items-center rounded-lg border border-neutral-300 bg-white px-3 focus-within:border-neutral-900 focus-within:ring-1 focus-within:ring-neutral-900">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={Number.isNaN(t.discount) ? "" : t.discount}
                    onChange={(e) =>
                      setTierDiscount(i, parseFloat(e.target.value))
                    }
                    className="w-full bg-transparent py-2 pr-1 text-sm outline-none"
                  />
                  <span className="text-neutral-400">%</span>
                </div>
              </label>
            ))}
          </div>
          <button
            onClick={() => setTiers(DEFAULT_TIERS)}
            className="mt-4 text-xs font-medium text-neutral-500 underline-offset-2 hover:text-neutral-900 hover:underline"
          >
            Reset to defaults
          </button>
        </section>

        {hydrated && favoriteRows.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
              <span className="text-amber-500">★</span> Favorites
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                {favoriteRows.length}
              </span>
            </h2>
            <ProductTable
              rows={favoriteRows}
              showMoq50AsAvailable
              isFavorite={isFavorite}
              onToggleFavorite={toggleFavorite}
              toggleSort={toggleSort}
              sortArrow={sortArrow}
              showBrandColumn
              tiers={tiers}
            />
          </section>
        )}

        <div className="mb-6 flex gap-1 rounded-xl border border-neutral-200 bg-white p-1 shadow-sm sm:inline-flex">
          {(["Revolve", "Powerhouse"] as Brand[]).map((b) => (
            <button
              key={b}
              onClick={() => setBrand(b)}
              className={`flex-1 rounded-lg px-5 py-2 text-sm font-medium transition-colors sm:flex-none ${
                brand === b
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              {b}
            </button>
          ))}
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search product or SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
          />
        </div>

        <ProductTable
          rows={brandRows}
          showMoq50={showMoq50}
          isFavorite={isFavorite}
          onToggleFavorite={toggleFavorite}
          toggleSort={toggleSort}
          sortArrow={sortArrow}
          tiers={tiers}
        />

        <p className="mt-4 text-xs text-neutral-400">
          {brandRows.length} {brand} SKUs shown. 1k /pen = (list price ÷ 10) +
          add-ons (base at 1,000 pens). Volume columns apply each tier&apos;s
          discount. Tap the star to add or remove favorites.
        </p>
      </div>
    </main>
  );
}

function ProductTable({
  rows,
  showMoq50 = false,
  showMoq50AsAvailable = false,
  showBrandColumn = false,
  isFavorite,
  onToggleFavorite,
  toggleSort,
  sortArrow,
  tiers,
}: {
  rows: Row[];
  showMoq50?: boolean;
  showMoq50AsAvailable?: boolean;
  showBrandColumn?: boolean;
  isFavorite: (brand: Brand, sku: string) => boolean;
  onToggleFavorite: (brand: Brand, sku: string) => void;
  toggleSort: (key: SortKey) => void;
  sortArrow: (key: SortKey) => string;
  tiers: VolumeTier[];
}) {
  const moq50Visible = showMoq50 || showMoq50AsAvailable;

  const tierPrice = (base: number | null, discount: number) =>
    base == null ? null : base * (1 - (Number.isNaN(discount) ? 0 : discount) / 100);

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <th className="w-10 px-3 py-3" />
            <Th onClick={() => toggleSort("sku")}>SKU{sortArrow("sku")}</Th>
            <Th onClick={() => toggleSort("product")}>
              Product{sortArrow("product")}
            </Th>
            {showBrandColumn && <Th>Brand</Th>}
            <Th onClick={() => toggleSort("strength")} className="text-right">
              Strength{sortArrow("strength")}
            </Th>
            <Th className="text-right">Vial</Th>
            <Th className="text-right">List /vial</Th>
            <Th
              onClick={() => toggleSort("noMoqPen")}
              className="bg-neutral-100 text-right font-semibold text-neutral-900"
            >
              1k /pen{sortArrow("noMoqPen")}
            </Th>
            {tiers.map((t) => (
              <Th
                key={t.qty}
                className="bg-emerald-50 text-right font-semibold text-emerald-800"
              >
                {t.label} /pen
              </Th>
            ))}
            {moq50Visible && (
              <>
                <Th className="text-right">50 MOQ /vial</Th>
                <Th
                  onClick={() => toggleSort("moq50Pen")}
                  className="bg-neutral-100 text-right font-semibold text-neutral-900"
                >
                  50 MOQ /pen{sortArrow("moq50Pen")}
                </Th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const fav = isFavorite(r.brand, r.sku);
            return (
              <tr
                key={`${r.brand}-${r.sku}-${i}`}
                className="border-t border-neutral-100 hover:bg-amber-50"
              >
                <td className="px-3 py-2 text-center">
                  <button
                    onClick={() => onToggleFavorite(r.brand, r.sku)}
                    aria-label={fav ? "Remove from favorites" : "Add to favorites"}
                    className={`text-lg leading-none transition-colors ${
                      fav
                        ? "text-amber-500 hover:text-amber-600"
                        : "text-neutral-300 hover:text-amber-400"
                    }`}
                  >
                    {fav ? "★" : "☆"}
                  </button>
                </td>
                <td className="px-3 py-2 font-mono text-xs text-neutral-600">
                  {r.sku}
                </td>
                <td className="px-3 py-2">{r.product}</td>
                {showBrandColumn && (
                  <td className="px-3 py-2 text-xs text-neutral-500">
                    {r.brand}
                  </td>
                )}
                <td className="px-3 py-2 text-right tabular-nums">
                  {r.strength != null ? `${r.strength} ${r.strengthUnit}` : "—"}
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
                {tiers.map((t) => {
                  const p = tierPrice(r.noMoqPen, t.discount);
                  return (
                    <td
                      key={t.qty}
                      className="bg-emerald-50/60 px-3 py-2 text-right tabular-nums text-emerald-900"
                    >
                      {p != null ? currency(p) : "—"}
                    </td>
                  );
                })}
                {moq50Visible && (
                  <>
                    <td className="px-3 py-2 text-right tabular-nums text-neutral-500">
                      {r.moq50Vial != null ? currency(r.moq50Vial) : "—"}
                    </td>
                    <td className="bg-neutral-50 px-3 py-2 text-right font-semibold tabular-nums">
                      {r.moq50Pen != null ? currency(r.moq50Pen) : "—"}
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
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
