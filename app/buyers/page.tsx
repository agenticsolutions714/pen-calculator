import { listBuyers } from "../actions/brokerage";
import Nav from "../components/Nav";
import BuyersManager from "./BuyersManager";

export const dynamic = "force-dynamic";

export default async function BuyersPage() {
  let buyers: Awaited<ReturnType<typeof listBuyers>> = [];
  let loadError: string | null = null;
  try {
    buyers = await listBuyers();
  } catch {
    loadError = "Could not load buyers. Make sure the database is connected.";
  }

  return (
    <main className="min-h-screen bg-neutral-100 text-neutral-900">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Nav />
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Buyers</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Buyers are the end customers who receive the goods and pay the
            invoice. They&apos;re separate from brokers, who negotiate deals and
            take a profit share.
          </p>
        </header>

        {loadError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {loadError}
          </div>
        ) : (
          <BuyersManager initialBuyers={buyers} />
        )}
      </div>
    </main>
  );
}
