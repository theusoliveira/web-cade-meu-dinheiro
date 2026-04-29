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

  // Popula o formulário quando o dialog abre ou quando o lançamento editado muda
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

  // Lançamentos fixos não têm valor — zera o campo quando a opção é marcada
  React.useEffect(() => {
    if (!open || !isFixedTemplate) return;
    setValueCents(0);
    setValueText(formatCurrencyBRL(0));
  }, [open, isFixedTemplate]);

  // Fecha com ESC (exceto durante submit)
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, submitting]);

  // Categorias disponíveis: inclui a categoria atual se ela não estiver na lista padrão (edição)
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
        onClick={() => { if (!submitting) onClose(); }}
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
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={submitting}>
            Fechar
          </Button>
        </div>

        <form onSubmit={submit} className="p-5">
          <fieldset disabled={submitting} className="grid gap-4">
            {allowFixed && !initial ? (
              <label className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900/40">
                <input
                  type="checkbox"
                  checked={isFixedTemplate}
                  onChange={(e) => setIsFixedTemplate(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400/50 dark:border-zinc-700 dark:bg-zinc-950"
                />
                <span className="grid gap-0.5">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    Lançamento fixo
                  </span>
                  <span className="text-xs text-zinc-600 dark:text-zinc-300">
                    Ele vai aparecer automaticamente em todos os meses com valor R$ 0,00 (no dia
                    escolhido).
                  </span>
                </span>
              </label>
            ) : null}

            <label className="grid gap-2">
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Data</span>
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
                {categoryOptions.map((c) => (
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
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Valor</span>
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
                className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:ring-2 focus:ring-zinc-400/50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </label>
          </fieldset>

          {error ? (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
              {error}
            </p>
          ) : null}

          <div className="mt-5 flex items-center justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
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
