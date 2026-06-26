import {
  listBuyers,
  listClients,
  listDeals,
  listPresets,
} from "../actions/brokerage";
import Nav from "../components/Nav";
import OrderBuilder from "./OrderBuilder";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  let clients: Awaited<ReturnType<typeof listClients>> = [];
  let buyers: Awaited<ReturnType<typeof listBuyers>> = [];
  let deals: Awaited<ReturnType<typeof listDeals>> = [];
  let presets: Awaited<ReturnType<typeof listPresets>> = [];
  let loadError: string | null = null;
  try {
    [clients, buyers, deals, presets] = await Promise.all([
      listClients(),
      listBuyers(),
      listDeals(),
      listPresets(),
    ]);
  } catch {
    loadError = "Could not load data. Make sure the database is connected.";
  }

  return (
    <main className="min-h-screen bg-neutral-100 text-neutral-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Nav />
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Orders</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Build an order, pick the broker and buyer, set the exit price per
            pack, and see profit, what&apos;s owed to the broker, and company
            profit in real time.
          </p>
        </header>

        {loadError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {loadError}
          </div>
        ) : (
          <OrderBuilder
            clients={clients}
            buyers={buyers}
            deals={deals}
            presets={presets}
          />
        )}
      </div>
    </main>
  );
}
