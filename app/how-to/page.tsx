import Link from "next/link";
import Nav from "../components/Nav";

export const metadata = {
  title: "How to use",
};

const BROKERAGE = "Aura";

export default function HowToPage() {
  return (
    <main className="min-h-screen bg-neutral-100 text-neutral-900">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Nav />

        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            How to use {BROKERAGE}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-500">
            A visual guide to running a brokered deal end to end — from who the
            players are, to building the order, to getting everyone paid.
          </p>
        </header>

        <div className="space-y-6">
          <PlayersSection />
          <FlowSection />
          <MoneySection />
          <StatusSection />
          <GlossarySection />
          <CtaSection />
        </div>
      </div>
    </main>
  );
}

/* ----------------------------- Players ----------------------------- */

function PlayersSection() {
  const players = [
    {
      role: BROKERAGE,
      tag: "You",
      desc: "The brokerage. You source product, build the order, and keep the company profit.",
      color: "bg-neutral-900 text-white",
      ring: "ring-neutral-900",
      icon: <DiamondIcon />,
    },
    {
      role: "Broker",
      tag: "Partner",
      desc: "Brings the deal and the buyer. Earns a negotiated % share of the profit.",
      color: "bg-sky-50 text-sky-900",
      ring: "ring-sky-300",
      icon: <HandshakeIcon />,
    },
    {
      role: "Buyer",
      tag: "Customer",
      desc: "The end customer who receives the goods and pays the invoice.",
      color: "bg-emerald-50 text-emerald-900",
      ring: "ring-emerald-300",
      icon: <CartIcon />,
    },
    {
      role: "Supplier",
      tag: "Source",
      desc: "Fills the purchase order at cost from the Standard catalog.",
      color: "bg-amber-50 text-amber-900",
      ring: "ring-amber-300",
      icon: <FactoryIcon />,
    },
  ];

  return (
    <Card
      title="Who's involved"
      subtitle="Four parties in every deal. Brokers and buyers are tracked separately."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {players.map((p) => (
          <div
            key={p.role}
            className={`flex flex-col rounded-xl p-4 ring-1 ${p.ring} ${p.color}`}
          >
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/60">
                {p.icon}
              </span>
              <span className="rounded-full bg-white/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                {p.tag}
              </span>
            </div>
            <p className="mt-3 text-base font-semibold">{p.role}</p>
            <p className="mt-1 text-xs leading-relaxed opacity-80">{p.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          How the goods and money move
        </p>
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <FlowNode label="Supplier" tone="amber" />
          <FlowArrow caption="PO at cost" />
          <FlowNode label={BROKERAGE} tone="dark" />
          <FlowArrow caption="Invoice (sell)" />
          <FlowNode label="Buyer" tone="emerald" />
        </div>
        <div className="mt-3 flex items-center gap-3">
          <FlowNode label={BROKERAGE} tone="dark" />
          <FlowArrow caption="Profit share" />
          <FlowNode label="Broker" tone="sky" />
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------ Flow ------------------------------- */

function FlowSection() {
  const steps = [
    {
      n: 1,
      title: "Add your brokers & buyers",
      desc: "On the Brokers tab, save each broker with their default profit %. On the Buyers tab, save the end customers.",
      href: "/clients",
      hrefLabel: "Open Brokers",
      icon: <PeopleIcon />,
    },
    {
      n: 2,
      title: "Build the order",
      desc: "On Orders, pick the broker, buyer, and supplier brand. Set quantities and the exit (sell) price per pack — or upload a sheet/photo to autofill.",
      href: "/orders",
      hrefLabel: "Open Orders",
      icon: <BuildIcon />,
    },
    {
      n: 3,
      title: "Price it fast (optional)",
      desc: "Apply a saved markup/margin preset to fill exit prices for the whole catalog, or add an order-level discount.",
      href: "/price-sheet",
      hrefLabel: "Open Price Sheet",
      icon: <TagIcon />,
    },
    {
      n: 4,
      title: "Send the documents",
      desc: "Generate the supplier PO (cost only) and the buyer invoice (sell prices). Each saves as a clean PDF.",
      href: "/orders",
      hrefLabel: "Open Orders",
      icon: <DocIcon />,
    },
    {
      n: 5,
      title: "Track payments",
      desc: "Record what the buyer pays and what you pay out to the broker. Outstanding balances roll up to the Dashboard.",
      href: "/dashboard",
      hrefLabel: "Open Dashboard",
      icon: <CashIcon />,
    },
  ];

  return (
    <Card
      title="The 5-step workflow"
      subtitle="From setup to settled — this is the path every order follows."
    >
      <ol className="relative space-y-5 border-l-2 border-dashed border-neutral-200 pl-6">
        {steps.map((s) => (
          <li key={s.n} className="relative">
            <span className="absolute -left-[35px] flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white">
              {s.n}
            </span>
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700">
                  {s.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{s.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                    {s.desc}
                  </p>
                </div>
                <Link
                  href={s.href}
                  className="hidden shrink-0 rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100 sm:inline-block"
                >
                  {s.hrefLabel}
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

/* ------------------------------ Money ------------------------------ */

function MoneySection() {
  return (
    <Card
      title="How the money splits"
      subtitle="A worked example with a 20% profit share to the broker."
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <WaterfallBar
            label="Exit (sell) total"
            value="$1,000"
            pct={100}
            tone="bg-neutral-900"
            note="What the buyer is invoiced"
          />
          <WaterfallBar
            label="Supplier cost"
            value="$600"
            pct={60}
            tone="bg-amber-400"
            note="What you pay the supplier on the PO"
          />
          <WaterfallBar
            label="Profit"
            value="$400"
            pct={40}
            tone="bg-sky-400"
            note="Exit − cost"
          />
          <WaterfallBar
            label="Owed to broker (20%)"
            value="$80"
            pct={8}
            tone="bg-sky-600"
            note="Broker's negotiated share of profit"
          />
          <WaterfallBar
            label="Company profit"
            value="$320"
            pct={32}
            tone="bg-emerald-500"
            note="What Aura keeps"
          />
        </div>

        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            The formula
          </p>
          <div className="mt-3 space-y-2 text-sm">
            <FormulaRow a="Profit" op="=" b="Exit − Supplier cost" />
            <FormulaRow a="Owed to broker" op="=" b="Profit × broker %" />
            <FormulaRow a="Company profit" op="=" b="Profit − Owed to broker" />
          </div>
          <div className="mt-4 rounded-lg bg-white p-3 text-xs leading-relaxed text-neutral-600 ring-1 ring-neutral-200">
            An order-level <span className="font-medium">discount</span> is
            shared: it lowers the exit total first, which reduces the profit
            before the broker split is applied — so you and the broker absorb it
            proportionally.
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------ Status ----------------------------- */

function StatusSection() {
  const stages = [
    { label: "Draft", desc: "Building the order", tone: "bg-neutral-200 text-neutral-700" },
    { label: "Sent to supplier", desc: "PO forwarded", tone: "bg-sky-100 text-sky-700" },
    { label: "Partially filled", desc: "Some stock short", tone: "bg-orange-100 text-orange-700" },
    { label: "Fulfilled", desc: "Goods shipped", tone: "bg-amber-100 text-amber-700" },
    { label: "Paid out", desc: "Broker settled", tone: "bg-emerald-100 text-emerald-700" },
  ];
  return (
    <Card
      title="Deal status lifecycle"
      subtitle="Move a deal through these stages from the Orders table."
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {stages.map((s, i) => (
          <div key={s.label} className="flex items-center gap-3">
            <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-center">
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.tone}`}
              >
                {s.label}
              </span>
              <p className="mt-1.5 text-[11px] text-neutral-500">{s.desc}</p>
            </div>
            {i < stages.length - 1 ? (
              <span className="hidden text-neutral-300 sm:inline">
                <ChevronIcon />
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ----------------------------- Glossary ---------------------------- */

function GlossarySection() {
  const terms = [
    { term: "Exit price", def: "The sell price per pack the buyer pays. Drives the invoice." },
    { term: "Supplier cost", def: "Your no-MOQ list cost per pack on the PO." },
    { term: "Profit", def: "Exit total minus supplier cost for the whole deal." },
    { term: "Broker %", def: "Negotiated share of profit paid out to the broker." },
    { term: "Company profit", def: "Profit left for Aura after the broker's share." },
    { term: "Preset", def: "A saved markup or margin you can apply to fill exit prices." },
  ];
  return (
    <Card title="Quick glossary" subtitle="The terms you'll see across the app.">
      <dl className="grid gap-3 sm:grid-cols-2">
        {terms.map((t) => (
          <div
            key={t.term}
            className="rounded-xl border border-neutral-200 bg-white p-4"
          >
            <dt className="text-sm font-semibold">{t.term}</dt>
            <dd className="mt-1 text-xs leading-relaxed text-neutral-500">
              {t.def}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function CtaSection() {
  return (
    <div className="rounded-2xl bg-neutral-900 p-6 text-white sm:p-8">
      <h2 className="text-xl font-semibold">Ready to build a deal?</h2>
      <p className="mt-1 text-sm text-neutral-300">
        Set up your brokers and buyers, then head to Orders to put it all
        together.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href="/orders"
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-200"
        >
          Build an order
        </Link>
        <Link
          href="/clients"
          className="rounded-lg border border-white/30 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
        >
          Add a broker
        </Link>
        <Link
          href="/buyers"
          className="rounded-lg border border-white/30 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
        >
          Add a buyer
        </Link>
      </div>
    </div>
  );
}

/* --------------------------- UI primitives -------------------------- */

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {subtitle ? (
          <p className="mt-0.5 text-sm text-neutral-500">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function FlowNode({
  label,
  tone,
}: {
  label: string;
  tone: "dark" | "sky" | "emerald" | "amber";
}) {
  const cls = {
    dark: "bg-neutral-900 text-white",
    sky: "bg-sky-100 text-sky-800",
    emerald: "bg-emerald-100 text-emerald-800",
    amber: "bg-amber-100 text-amber-800",
  }[tone];
  return (
    <div
      className={`flex-1 rounded-lg px-3 py-2 text-center text-xs font-semibold ${cls}`}
    >
      {label}
    </div>
  );
}

function FlowArrow({ caption }: { caption: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-neutral-400">
      <span className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">
        {caption}
      </span>
      <svg
        width="48"
        height="12"
        viewBox="0 0 48 12"
        fill="none"
        className="rotate-90 sm:rotate-0"
      >
        <path
          d="M1 6h40m0 0-5-4m5 4-5 4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function WaterfallBar({
  label,
  value,
  pct,
  tone,
  note,
}: {
  label: string;
  value: string;
  pct: number;
  tone: string;
  note: string;
}) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-neutral-700">{label}</span>
        <span className="text-sm font-semibold tabular-nums">{value}</span>
      </div>
      <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className={`h-full rounded-full ${tone}`}
          style={{ width: `${Math.max(2, pct)}%` }}
        />
      </div>
      <p className="mt-0.5 text-[11px] text-neutral-400">{note}</p>
    </div>
  );
}

function FormulaRow({ a, op, b }: { a: string; op: string; b: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="rounded-md bg-white px-2 py-1 text-xs font-medium ring-1 ring-neutral-200">
        {a}
      </span>
      <span className="text-neutral-400">{op}</span>
      <span className="rounded-md bg-white px-2 py-1 text-xs text-neutral-600 ring-1 ring-neutral-200">
        {b}
      </span>
    </div>
  );
}

/* ------------------------------- Icons ------------------------------ */

const iconProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function DiamondIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 2 22 12 12 22 2 12z" />
    </svg>
  );
}
function HandshakeIcon() {
  return (
    <svg {...iconProps}>
      <path d="M11 17 9 19a2 2 0 1 1-3-3l4-4" />
      <path d="m14 7 3-3 4 4-3 3" />
      <path d="m7 11 5 5 5-5-4-4-3 1-3-1-4 4 2 2" />
    </svg>
  );
}
function CartIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="9" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
      <path d="M2 3h2l2.4 12.4A2 2 0 0 0 8.4 17h8.6a2 2 0 0 0 2-1.6L21 7H5" />
    </svg>
  );
}
function FactoryIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3 21h18" />
      <path d="M4 21V10l6 4V10l6 4V6l4 2v13" />
    </svg>
  );
}
function PeopleIcon() {
  return (
    <svg {...iconProps}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11" />
    </svg>
  );
}
function BuildIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
    </svg>
  );
}
function TagIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12.6 2.6 21 11a2 2 0 0 1 0 2.8l-7.2 7.2a2 2 0 0 1-2.8 0L2.6 12.6A2 2 0 0 1 2 11.2V4a2 2 0 0 1 2-2h7.2a2 2 0 0 1 1.4.6Z" />
      <circle cx="7.5" cy="7.5" r="1" />
    </svg>
  );
}
function DocIcon() {
  return (
    <svg {...iconProps}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M9 13h6M9 17h6" />
    </svg>
  );
}
function CashIcon() {
  return (
    <svg {...iconProps}>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  );
}
function ChevronIcon() {
  return (
    <svg {...iconProps} width={18} height={18}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
