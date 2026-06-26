import {
  type CostBasis,
  type PriceMode,
  type PriceSheetConfig,
  buildPriceSheet,
} from "../../data/pricing";
import type { Brand } from "../../data/products";
import PriceSheetPrint from "./PriceSheetPrint";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function str(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export const metadata = {
  title: "Aura Price Sheet",
};

export default async function PriceSheetPrintPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;

  const mode: PriceMode = str(sp.mode) === "margin" ? "margin" : "markup";
  const basis: CostBasis = str(sp.basis) === "moq50" ? "moq50" : "noMoq";
  const brandRaw = str(sp.brand);
  const brand: Brand | "all" = brandRaw === "Standard" ? brandRaw : "all";
  const pct = Number.parseFloat(str(sp.pct) ?? "0");
  const search = str(sp.q) ?? "";

  const config: PriceSheetConfig = {
    mode,
    pct: Number.isFinite(pct) ? pct : 0,
    basis,
    brand,
    search,
  };

  const rows = buildPriceSheet(config);

  return <PriceSheetPrint rows={rows} />;
}
