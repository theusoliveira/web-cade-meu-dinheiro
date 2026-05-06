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
  initial?: FinanceEntry | null;
  allowFixed?: boolean;
  onSubmit: (entry: FinanceEntry) => void | Promise<void>;
};

const inputBase =
  "h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-green-400 focus:ring-2 focus:ring-green-400/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-green-500";

export function AddEntryDialog({
  open,
  kind,
  onClose,
  initial,
  allowFixed = false,
  onSubmit,
}: Props) {
  const [date, setDate] = React.useState(() => todayAsDateInputValue());
  const [category, setCategory] = React.useState<Category>(
    () => categoriesFor(kind)[0] as Category,
  );
  const [description, setDescription] = React.useState("");
  const [valueCents, setValueCents] = React.useState(0);
  const [valueText, setValueText] = React.useState("");
  const [isFixedTemplate, setIsFixedTemplate] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setError(null);
    setSubmitting(false);
    if (initial) {
      setDate(initial.date);
      setCategory(initial.category);
      setDescription(initial.description);
      const cents = Math.round(initial.value * 100);
      setValueCents(cents);
      setValueText(formatCurrencyBRL(cents / 100));
      setIsFixedTemplate(Boolean(initial.isFixedTemplate));
    } else {
      setDate(todayAsDateInputValue());
      setCategory(categoriesFor(kind)[0] as Category);
      setDescription("");
      setValueCents(0);
      setValueText("");
      setIsFixedTemplate(false);
    }
  }, [open, kind, initial]);

  React.useEffect(() => {
    if (!open || !isFixedTemplate) return;
    setValueCents(0);
    setValueText(formatCurrencyBRL(0));
  }, [open, isFixedTemplate]);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, submitting]);

  const categoryOptions = React.useMemo<Category[]>(() => {
    const base = [...categoriesFor(kind)] as Category[];
    return category && !base.includes(category) ? [category, ...base] : base;
  }, [kind, category]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    setError(null);
    const desc = description.trim();
    const num = valueCents / 100;

    if (!date) return setError("Selecione uma data.");
    if (!category) return setError("Selecione uma categoria.");
    if (!desc) return setError("Digite uma descrição.");
    if (!isFixedTemplate && valueCents <= 0) return setError("Digite um valor válido.");

    const editingVirtualFixed = Boolean(initial?.isVirtualFixed && initial?.fixedEntryId);

    const entry: FinanceEntry = editingVirtualFixed
      ? {
          id: newId(),
          kind,
          date,
          category,
          description: desc,
          value: num,
          createdAt: Date.now(),
          fixedEntryId: initial!.fixedEntryId,
        }
      : initial
        ? { ...initial, date, category, description: desc, value: isFixedTemplate ? 0 : num, isFixedTemplate }
        : {
            id: newId(),
            kind,
            date,
            category,
            description: desc,
            value: isFixedTemplate ? 0 : num,
            createdAt: Date.now(),
            isFixedTemplate,
          };

    try {
      setSubmitting(true);
      await Promise.resolve(onSubmit(entry));
      setSubmitting(false);
      onClose();
    } catch (err) {
      console.error(err);
      setSubmitting(false);
      setError("Não foi possível salvar agora. Tente novamente.");
    }
  }

  if (!open) return null;

  const kindColors: Record<EntryKind, string> = {
    income: "text-emerald-600",
    expense: "text-rose-600",
    investment: "text-green-600",
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${initial ? "Editar" : "Adicionar"} ${kindLabel(kind).toLowerCase()}`}
    >
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-pointer"
        onClick={() => { if (!submitting) onClose(); }}
      />

      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 p-5 dark:border-zinc-800">
          <div>
            <h2 className={`text-lg font-bold ${kindColors[kind]}`}>
              {initial ? "Editar" : "Adicionar"} {kindLabel(kind).toLowerCase()}
            </h2>
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
              {initial ? "Atualize os dados do lançamento." : "Informe os dados do lançamento."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            aria-label="Fechar"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={submit} className="p-5">
          <fieldset disabled={submitting} className="grid gap-4">
            {allowFixed && !initial ? (
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm hover:bg-zinc-100 transition dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:bg-zinc-900/60">
                <input
                  type="checkbox"
                  checked={isFixedTemplate}
                  onChange={(e) => setIsFixedTemplate(e.target.checked)}
                  className="mt-1 h-4 w-4 cursor-pointer rounded border-zinc-300 accent-green-600 dark:border-zinc-700"
                />
                <span className="grid gap-0.5">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    Lançamento fixo
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    Aparece automaticamente em todos os meses com valor R$ 0,00.
                  </span>
                </span>
              </label>
            ) : null}

            <label className="grid gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Data</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputBase} />
            </label>

            <label className="grid gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Categoria</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className={inputBase + " cursor-pointer"}
              >
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Descrição</span>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex.: almoço, gasolina, aporte..."
                className={inputBase}
              />
            </label>

            <label className="grid gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Valor</span>
              <input
                type="text"
                inputMode="numeric"
                value={valueText}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "");
                  const cents = digits ? parseInt(digits, 10) : 0;
                  setValueCents(cents);
                  setValueText(cents === 0 ? "" : formatCurrencyBRL(cents / 100));
                }}
                disabled={isFixedTemplate}
                placeholder="R$ 0,00"
                className={inputBase}
              />
            </label>
          </fieldset>

          {error ? (
            <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
              {error}
            </p>
          ) : null}

          <div className="mt-5 flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Salvando…" : initial ? "Salvar alterações" : "Salvar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
