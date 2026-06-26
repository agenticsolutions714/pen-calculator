"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { BuyerRow } from "../db/schema";
import { createBuyer, deleteBuyer, updateBuyer } from "../actions/brokerage";

type Props = { initialBuyers: BuyerRow[] };

const emptyForm = { name: "", contact: "", notes: "" };

export default function BuyersManager({ initialBuyers }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<{
    name: string;
    contact: string;
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
      setError("Buyer name is required.");
      return;
    }
    const payload = {
      name,
      contact: form.contact,
      notes: form.notes,
    };
    startTransition(async () => {
      try {
        if (editingId != null) {
          await updateBuyer(editingId, payload);
        } else {
          await createBuyer(payload);
        }
        resetForm();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save buyer.");
      }
    });
  };

  const startEdit = (b: BuyerRow) => {
    setEditingId(b.id);
    setForm({
      name: b.name,
      contact: b.contact ?? "",
      notes: b.notes ?? "",
    });
    setError(null);
  };

  const remove = (id: number) => {
    if (!confirm("Delete this buyer? Saved deals will keep their name.")) {
      return;
    }
    startTransition(async () => {
      await deleteBuyer(id);
      if (editingId === id) resetForm();
      router.refresh();
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-100 px-5 py-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            {initialBuyers.length} buyer
            {initialBuyers.length === 1 ? "" : "s"}
          </h2>
        </div>
        {initialBuyers.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-neutral-400">
            No buyers yet. Add your first one on the right.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {initialBuyers.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between gap-4 px-5 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-neutral-900">
                    {b.name}
                  </p>
                  {b.contact ? (
                    <p className="truncate text-xs text-neutral-500">
                      {b.contact}
                    </p>
                  ) : null}
                  {b.notes ? (
                    <p className="truncate text-xs text-neutral-400">
                      {b.notes}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => startEdit(b)}
                    className="text-xs font-medium text-neutral-500 hover:text-neutral-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(b.id)}
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
          {editingId != null ? "Edit buyer" : "Add buyer"}
        </h2>
        <div className="mt-4 space-y-4">
          <label className="block">
            <span className="text-xs font-medium text-neutral-500">Name</span>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Downtown Clinic"
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-neutral-500">
              Contact (optional)
            </span>
            <input
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
              placeholder="Email, phone, or address"
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
            />
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
                  : "Add buyer"}
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
