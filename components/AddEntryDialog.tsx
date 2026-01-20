"use client";

import * as React from "react";
import { Button } from "./Button";
import {
  categoriesFor,
  formatCurrencyBRL,
  kindLabel,
  newId,
  todayAsDateInputValue,
  type Category,
  type EntryKind,
  type FinanceEntry,
} from "../lib/finance";

type Props = {
  open: boolean;
  kind: EntryKind;
  onClose: () => void;
  /** If provided, dialog works in edit mode. */
  initial?: FinanceEntry | null;
  onSubmit: (entry: FinanceEntry) => void;
};

export function AddEntryDialog({ open, kind, onClose, initial, onSubmit }: Props) {
  const [date, setDate] = React.useState(() => todayAsDateInputValue());
  const [category, setCategory] = React.useState<Category>(() => categoriesFor(kind)[0] as Category);
  const [description, setDescription] = React.useState("");
  const [valueCents, setValueCents] = React.useState(0);
  const [valueText, setValueText] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  // Reset fields when opening
  React.useEffect(() => {
    if (!open) return;
    if (initial) {
      setDate(initial.date);
      setCategory(initial.category);
      setDescription(initial.description);
      const cents = Math.round(initial.value * 100);
      setValueCents(cents);
      setValueText(formatCurrencyBRL(cents / 100));
    } else {
      setDate(todayAsDateInputValue());
      setCategory(categoriesFor(kind)[0] as Category);
      setDescription("");
      setValueCents(0);
      setValueText("");
    }
    setError(null);
  }, [open, kind, initial]);

  // Close on ESC
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const desc = description.trim();
    const num = valueCents / 100;

    if (!date) return setError("Selecione uma data.");
    if (!category) return setError("Selecione uma categoria.");
    if (!desc) return setError("Digite uma descrição.");
    if (valueCents <= 0) return setError("Digite um valor válido.");

    const entry: FinanceEntry = initial
      ? {
          ...initial,
          // Keep id/createdAt, update other fields.
          date,
          category,
          description: desc,
          value: num,
        }
      : {
          id: newId(),
          kind,
          date,
          category,
          description: desc,
          value: num,
          createdAt: Date.now(),
        };

    onSubmit(entry);
    onClose();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${initial ? "Editar" : "Adicionar"} ${kindLabel(kind).toLowerCase()}`}
    >
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 p-5 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {initial ? "Editar" : "Adicionar"} {kindLabel(kind).toLowerCase()}
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {initial ? "Atualize os dados do lançamento." : "Informe os dados do lançamento."}
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </div>

        <form onSubmit={submit} className="p-5">
          <div className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                Data
              </span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-400/50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                Categoria
              </span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-400/50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
              >
                {(() => {
                  const base = [...categoriesFor(kind)];
                  // If editing an old entry whose category is no longer in the filtered list,
                  // keep it available so the select isn't blank.
                  const merged = category && !base.includes(category) ? [category, ...base] : base;
                  return merged;
                })().map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                Descrição
              </span>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex.: almoço, gasolina, aporte..."
                className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:ring-2 focus:ring-zinc-400/50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                Valor
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={valueText}
                onChange={(e) => {
                  const raw = e.target.value;

                  const digits = raw.replace(/\D/g, "");
                  const cents = digits ? parseInt(digits, 10) : 0;

                  setValueCents(cents);
                  setValueText(cents === 0 ? "" : formatCurrencyBRL(cents / 100));
                }}
                placeholder="R$ 0,00"
                className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:ring-2 focus:ring-zinc-400/50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </label>
          </div>

          {error ? (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
              {error}
            </p>
          ) : null}

          <div className="mt-5 flex items-center justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">{initial ? "Salvar alterações" : "Salvar"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
