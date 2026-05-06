"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import {
  categoriesFor,
  formatCurrencyBRL,
  kindLabel,
  newId,
  todayAsDateInputValue,
  type Category,
  type EntryKind,
  type FinanceEntry,
} from "@/lib/finance";

type Props = {
  open: boolean;
  kind: EntryKind;
  onClose: () => void;
  initial?: FinanceEntry | null;
  allowFixed?: boolean;
  onSubmit: (entry: FinanceEntry) => void | Promise<void>;
};

const KIND_COLORS: Record<EntryKind, string> = {
  income: "text-emerald-600 dark:text-emerald-400",
  expense: "text-rose-600 dark:text-rose-400",
  investment: "text-sky-600 dark:text-sky-400",
};

const KIND_BG: Record<EntryKind, string> = {
  income: "bg-emerald-50 dark:bg-emerald-950/20",
  expense: "bg-rose-50 dark:bg-rose-950/20",
  investment: "bg-sky-50 dark:bg-sky-950/20",
};

export function AddEntryDialog({ open, kind, onClose, initial, allowFixed = false, onSubmit }: Props) {
  const [date, setDate] = React.useState(() => todayAsDateInputValue());
  const [category, setCategory] = React.useState<Category>(() => categoriesFor(kind)[0] as Category);
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

  const inputClass =
    "w-full h-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm " +
    "text-[var(--foreground)] placeholder:text-[var(--muted-light)] outline-none " +
    "focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-all";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center p-0 sm:p-4"
      role="dialog"
      aria-modal
      aria-label={`${initial ? "Editar" : "Adicionar"} ${kindLabel(kind).toLowerCase()}`}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px] cursor-pointer"
        onClick={() => { if (!submitting) onClose(); }}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-lg rounded-t-3xl sm:rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl animate-slide-up sm:animate-scale-in">
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-0 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-[var(--border)]" />
        </div>

        {/* Header */}
        <div className={`flex items-center justify-between gap-4 px-5 py-4 border-b border-[var(--border)] ${KIND_BG[kind]} rounded-t-3xl sm:rounded-t-2xl`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 dark:bg-black/30 ${KIND_COLORS[kind]}`}>
              {kind === "income" && (
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                  <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
                </svg>
              )}
              {kind === "expense" && (
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                  <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
                </svg>
              )}
              {kind === "investment" && (
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                  <path fillRule="evenodd" d="M12.577 4.878a.75.75 0 01.919-.53l4.78 1.281a.75.75 0 01.531.919l-1.281 4.78a.75.75 0 01-1.449-.387l.81-3.022a19.407 19.407 0 00-5.594 5.203.75.75 0 01-1.139.093L7 10.06l-3.72 3.72a.75.75 0 11-1.06-1.061l4.25-4.25a.75.75 0 011.06 0l1.956 1.956a20.924 20.924 0 015.293-5.136l-3.023.81a.75.75 0 01-.387-1.45z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div>
              <h2 className={`text-base font-bold ${KIND_COLORS[kind]}`}>
                {initial ? "Editar" : "Adicionar"} {kindLabel(kind).toLowerCase()}
              </h2>
              <p className="text-xs text-[var(--muted)]">
                {initial ? "Atualize os dados do lançamento" : "Preencha os dados abaixo"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="cursor-pointer h-8 w-8 flex items-center justify-center rounded-xl text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-raised)] transition-colors"
            aria-label="Fechar"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={submit} className="p-5">
          <fieldset disabled={submitting} className="grid gap-4">
            {allowFixed && !initial && (
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-3 text-sm hover:bg-[var(--border)]/50 transition-colors">
                <input
                  type="checkbox"
                  checked={isFixedTemplate}
                  onChange={(e) => setIsFixedTemplate(e.target.checked)}
                  className="mt-0.5 h-4 w-4 cursor-pointer rounded border-[var(--border)] accent-[var(--accent)]"
                />
                <span>
                  <span className="block font-semibold text-[var(--foreground)]">Lançamento fixo</span>
                  <span className="text-xs text-[var(--muted)]">
                    Aparece automaticamente em todos os meses (valor R$ 0,00 para atualizar depois)
                  </span>
                </span>
              </label>
            )}

            <div className="grid gap-1.5">
              <label className="text-sm font-semibold text-[var(--foreground)]">Data</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-semibold text-[var(--foreground)]">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className={`${inputClass} cursor-pointer`}
              >
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-semibold text-[var(--foreground)]">Descrição</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex.: almoço, gasolina, aporte..."
                className={inputClass}
              />
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-semibold text-[var(--foreground)]">Valor</label>
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
                className={`${inputClass} font-mono`}
              />
            </div>
          </fieldset>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 px-3 py-2.5">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-rose-500 shrink-0">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
            </div>
          )}

          <div className="mt-5 flex items-center justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" loading={submitting}>
              {initial ? "Salvar alterações" : "Salvar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
