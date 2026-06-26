import { listClients } from "../actions/brokerage";
import Nav from "../components/Nav";
import ClientsManager from "./ClientsManager";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  let clients: Awaited<ReturnType<typeof listClients>> = [];
  let loadError: string | null = null;
  try {
    clients = await listClients();
  } catch {
    loadError =
      "Could not load clients. Make sure the database is connected.";
  }

  return (
    <main className="min-h-screen bg-neutral-100 text-neutral-900">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Nav />
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Brokers</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Brokers negotiate deals and earn a profit share. The default profit
            % is the cut of profit paid out to the broker; you can override it
            per order. Buyers (the end customers) are managed separately.
          </p>
        </header>

        {loadError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {loadError}
          </div>
        ) : (
          <ClientsManager initialClients={clients} />
        )}
      </div>
    </main>
  );
}
