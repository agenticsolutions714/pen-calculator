"use client";

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardSummary } from "../data/economics";

const currency = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

const compactCurrency = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  });

const BRAND_COLORS = ["#0f172a", "#0ea5e9", "#10b981", "#f59e0b", "#8b5cf6"];
const SPLIT_COLORS = ["#10b981", "#0ea5e9"];

type TooltipEntry = { name?: string; value?: number };

function MoneyTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs shadow-lg">
      {label ? (
        <p className="font-medium text-neutral-900">{label}</p>
      ) : null}
      {payload.map((p, i) => (
        <p key={i} className="tabular-nums text-neutral-600">
          {p.name ? `${p.name}: ` : ""}
          {currency(Number(p.value ?? 0))}
        </p>
      ))}
    </div>
  );
}

export default function DashboardCharts({ s }: { s: DashboardSummary }) {
  const clientData = s.byClient.slice(0, 8).map((c) => ({
    name: c.clientName,
    profit: c.companyProfit,
  }));
  const brandData = s.byBrand.map((b) => ({
    name: b.brand,
    value: b.companyProfit,
  }));
  const splitData = [
    { name: "Company profit", value: s.totalCompanyProfit },
    { name: "Owed to brokers", value: s.totalClientShare },
  ].filter((d) => d.value > 0);

  const barHeight = Math.max(clientData.length * 44, 120);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ChartCard
        title="Company profit by broker"
        className="lg:col-span-2"
        delay={0}
      >
        {clientData.length === 0 ? (
          <Empty />
        ) : (
          <ResponsiveContainer width="100%" height={barHeight}>
            <BarChart
              data={clientData}
              layout="vertical"
              margin={{ top: 4, right: 24, bottom: 4, left: 8 }}
            >
              <XAxis
                type="number"
                tickFormatter={compactCurrency}
                tick={{ fontSize: 12, fill: "#737373" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={120}
                tick={{ fontSize: 12, fill: "#404040" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<MoneyTooltip />}
                cursor={{ fill: "rgba(0,0,0,0.04)" }}
              />
              <Bar
                dataKey="profit"
                name="Company profit"
                fill="#0f172a"
                radius={[0, 6, 6, 0]}
                isAnimationActive
                animationDuration={900}
                animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="Profit by supplier" delay={120}>
        {brandData.length === 0 ? (
          <Empty />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={brandData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                isAnimationActive
                animationDuration={900}
                animationEasing="ease-out"
              >
                {brandData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={BRAND_COLORS[i % BRAND_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<MoneyTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        )}
        <Legend
          items={brandData.map((d, i) => ({
            label: d.name,
            value: currency(d.value),
            color: BRAND_COLORS[i % BRAND_COLORS.length],
          }))}
        />
      </ChartCard>

      <ChartCard title="Where the gross profit goes" delay={240}>
        {splitData.length === 0 ? (
          <Empty />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={splitData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                isAnimationActive
                animationDuration={900}
                animationEasing="ease-out"
              >
                {splitData.map((_, i) => (
                  <Cell key={i} fill={SPLIT_COLORS[i % SPLIT_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<MoneyTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        )}
        <Legend
          items={splitData.map((d, i) => ({
            label: d.name,
            value: currency(d.value),
            color: SPLIT_COLORS[i % SPLIT_COLORS.length],
          }))}
        />
      </ChartCard>
    </div>
  );
}

function ChartCard({
  title,
  children,
  className = "",
  delay = 0,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div
      className={`chart-enter rounded-xl border border-neutral-200 bg-white p-5 shadow-sm ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-500">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Legend({
  items,
}: {
  items: { label: string; value: string; color: string }[];
}) {
  return (
    <ul className="mt-3 space-y-1">
      {items.map((it, i) => (
        <li
          key={i}
          className="flex items-center justify-between text-xs text-neutral-600"
        >
          <span className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: it.color }}
            />
            {it.label}
          </span>
          <span className="tabular-nums">{it.value}</span>
        </li>
      ))}
    </ul>
  );
}

function Empty() {
  return (
    <p className="py-8 text-center text-sm text-neutral-400">No data yet.</p>
  );
}
