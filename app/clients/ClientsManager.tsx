"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ClientRow } from "../db/schema";
import {
  createClient,
  deleteClient,
  updateClient,
} from "../actions/brokerage";

type Props = { initialClients: ClientRow[] };

const emptyForm = { name: "", defaultProfitPct: "", notes: "" };

export default function ClientsManager({ initialClients }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<{
    name: string;
    defaultProfitPct: string;
    notes: string;
  }>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError(null);
  };

  const submit = () => {
    setError(null);
    const name = form.name.trim();
    if (!name) {
      setError("Broker name is required.");
      return;
    }
    const pct = parseFloat(form.defaultProfitPct);
    const payload = {
      name,
      defaultProfitPct: Number.isNaN(pct) ? 0 : pct,
      notes: form.notes,
    };
    startTransition(async () => {
      try {
        if (editingId != null) {
          await updateClient(editingId, payload);
        } else {
          await createClient(payload);
        }
        resetForm();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save broker.");
      }
    });
  };

  const startEdit = (c: ClientRow) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      defaultProfitPct: String(c.defaultProfitPct),
      notes: c.notes ?? "",
    });
    setError(null);
  };

  const remove = (id: number) => {
    if (!confirm("Delete this broker? Saved deals will keep their name.")) {
      return;
    }
    startTransition(async () => {
      await deleteClient(id);
      if (editingId === id) resetForm();
      router.refresh();
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-100 px-5 py-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            {initialClients.length} broker
            {initialClients.length === 1 ? "" : "s"}
          </h2>
        </div>
        {initialClients.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-neutral-400">
            No brokers yet. Add your first one on the right.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {initialClients.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-4 px-5 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-neutral-900">
                    {c.name}
                  </p>
                  {c.notes ? (
                    <p className="truncate text-xs text-neutral-400">
                      {c.notes}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
                    {c.defaultProfitPct}% to broker
                  </span>
                  <button
                    onClick={() => startEdit(c)}
                    className="text-xs font-medium text-neutral-500 hover:text-neutral-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(c.id)}
                    className="text-xs font-medium text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="h-fit rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          {editingId != null ? "Edit broker" : "Add broker"}
        </h2>
        <div className="mt-4 space-y-4">
          <label className="block">
            <span className="text-xs font-medium text-neutral-500">Name</span>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Acme Wellness"
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-neutral-500">
              Default profit % to broker
            </span>
            <div className="relative mt-1">
              <input
                value={form.defaultProfitPct}
                onChange={(e) =>
                  setForm({ ...form, defaultProfitPct: e.target.value })
                }
                inputMode="decimal"
                placeholder="0"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 pr-8 text-sm outline-none focus:border-neutral-900"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">
                %
              </span>
            </div>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-neutral-500">
              Notes (optional)
            </span>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="mt-1 w-full resize-none rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
            />
          </label>

          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex items-center gap-2">
            <button
              onClick={submit}
              disabled={isPending}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending
                ? "Saving…"
                : editingId != null
                  ? "Save changes"
                  : "Add broker"}
            </button>
            {editingId != null ? (
              <button
                onClick={resetForm}
                disabled={isPending}
                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
