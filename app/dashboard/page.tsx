import { listDeals } from "../actions/brokerage";
import { summarizeDeals } from "../data/economics";
import Nav from "../components/Nav";
import DashboardCharts from "./DashboardCharts";

export const dynamic = "force-dynamic";

const currency = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export default async function DashboardPage() {
  let deals: Awaited<ReturnType<typeof listDeals>> = [];
  let loadError: string | null = null;
  try {
    deals = await listDeals();
  } catch {
    loadError = "Could not load data. Make sure the database is connected.";
  }

  const s = summarizeDeals(deals);
  const monthLabel = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <main className="min-h-screen bg-neutral-100 text-neutral-900">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Nav />
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Company profit, what you owe brokers, and where it&apos;s coming
            from — across all saved deals.
          </p>
        </header>

        {loadError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {loadError}
          </div>
        ) : deals.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-400 shadow-sm">
            No deals yet. Build one on the Orders page to see your numbers here.
          </div>
        ) : (
          <div className="space-y-6">
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Card
                label="Company profit (all time)"
                value={currency(s.totalCompanyProfit)}
                tone="good"
              />
              <Card
                label={`Company profit (${monthLabel})`}
                value={currency(s.companyProfitThisMonth)}
                tone="good"
              />
              <Card
                label="Owed to brokers (unpaid)"
                value={currency(s.outstandingToClients)}
                tone="info"
                hint="Broker share not yet paid out (based on recorded payouts)"
              />
              <Card
                label="Total deals"
                value={String(s.dealCount)}
                tone="neutral"
              />
            </section>

            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Card
                label="Awaiting buyer payment"
                value={currency(s.outstandingFromBuyers)}
                tone="bad"
                hint="Invoiced exit total not yet collected from buyers"
              />
              <Card
                label="Exit (sell) volume"
                value={currency(s.totalExit)}
                tone="neutral"
              />
              <Card
                label="Supplier spend"
                value={currency(s.totalSupplierCost)}
                tone="neutral"
              />
              <Card
                label="Gross profit"
                value={currency(s.totalProfit)}
                tone="neutral"
              />
            </section>

            <DashboardCharts s={s} />

            <section className="grid gap-6 lg:grid-cols-2">
              <Panel title="By broker">
                <Table
                  head={["Broker", "Deals", "Company profit", "Owed"]}
                  rows={s.byClient.map((c) => [
                    c.clientName,
                    String(c.deals),
                    currency(c.companyProfit),
                    currency(c.owed),
                  ])}
                />
              </Panel>
              <Panel title="By supplier">
                <Table
                  head={["Supplier", "Deals", "Company profit"]}
                  rows={s.byBrand.map((b) => [
                    b.brand,
                    String(b.deals),
                    currency(b.companyProfit),
                  ])}
                />
              </Panel>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

function Card({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: string;
  tone: "good" | "info" | "neutral" | "bad";
  hint?: string;
}) {
  const toneClass =
    tone === "good"
      ? "text-emerald-700"
      : tone === "info"
        ? "text-sky-700"
        : tone === "bad"
          ? "text-red-600"
          : "text-neutral-900";
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-semibold tabular-nums ${toneClass}`}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-neutral-400">{hint}</p> : null}
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
      <div className="border-b border-neutral-100 px-5 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          {title}
        </h2>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="scroll-fade overflow-x-auto">
      <table className="w-full min-w-[420px] text-sm">
        <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            {head.map((h, i) => (
              <th
                key={h}
                className={`px-5 py-2 font-medium ${i > 0 ? "text-right" : ""}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {rows.map((r, ri) => (
            <tr key={ri}>
              {r.map((cell, ci) => (
                <td
                  key={ci}
                  className={`px-5 py-2 ${
                    ci === 0
                      ? "font-medium text-neutral-900"
                      : "text-right tabular-nums text-neutral-600"
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
