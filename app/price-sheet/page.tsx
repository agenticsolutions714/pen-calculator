import Nav from "../components/Nav";
import PriceSheetBuilder from "./PriceSheetBuilder";
import { listPresets } from "../actions/brokerage";
import type { PricingPresetRow } from "../db/schema";

export const metadata = {
  title: "Price Sheet",
};

export const dynamic = "force-dynamic";

export default async function PriceSheetPage() {
  let presets: PricingPresetRow[] = [];
  try {
    presets = await listPresets();
  } catch {
    presets = [];
  }
  return (
    <main className="min-h-screen bg-neutral-100 px-4 py-6 text-neutral-900 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Nav />
        <h1 className="mb-1 text-2xl font-bold tracking-tight">Price Sheet</h1>
        <p className="mb-6 text-sm text-neutral-500">
          Set a markup or margin on your costs and generate a clean,
          buyer-facing price list to print or export. Save a configuration as a
          preset to reuse it when building orders.
        </p>
        <PriceSheetBuilder presets={presets} />
      </div>
    </main>
  );
}
