"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Check, X, AlertCircle } from "lucide-react";
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
  excludeCategories?: Category[];
  /** Tipos disponíveis no seletor (padrão: todos) */
  kinds?: EntryKind[];
  onSubmit: (entry: FinanceEntry) => void | Promise<void>;
};

const KINDS: EntryKind[] = ["expense", "income", "investment"];

export function AddEntryDialog({ open, kind: kindProp, onClose, initial, allowFixed = false, excludeCategories, kinds = KINDS, onSubmit }: Props) {
  const [kind, setKind] = React.useState<EntryKind>(initial?.kind ?? kindProp);
  const availableCategories = React.useCallback(
    (k: EntryKind) => {
      const all = categoriesFor(k) as Category[];
      if (!excludeCategories?.length) return all;
      return all.filter((c) => !excludeCategories.includes(c));
    },
    [excludeCategories],
  );
  const [date, setDate] = React.useState(() => todayAsDateInputValue());
  const [category, setCategory] = React.useState<Category>(() => availableCategories(kindProp)[0]);
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
      setKind(initial.kind);
      setDate(initial.date);
      setCategory(initial.category);
      setDescription(initial.description);
      const cents = Math.round(initial.value * 100);
      setValueCents(cents);
      setValueText(formatCurrencyBRL(cents / 100));
      setIsFixedTemplate(Boolean(initial.isFixedTemplate));
    } else {
      setKind(kindProp);
      setDate(todayAsDateInputValue());
      setCategory(availableCategories(kindProp)[0]);
      setDescription("");
      setValueCents(0);
      setValueText("");
      setIsFixedTemplate(false);
    }
  }, [open, kindProp, initial]);

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
    const base = availableCategories(kind);
    return category && !base.includes(category) ? [category, ...base] : base;
  }, [kind, category, availableCategories]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    const desc = description.trim();
    const num = valueCents / 100;

    if (!date) return setError("Selecione uma data.");
    if (!category) return setError("Selecione uma categoria.");
    if (!desc) return setError("Digite um título.");
    if (!isFixedTemplate && valueCents < 0) return setError("Digite um valor válido.");

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

  const fieldClass =
    "w-full h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 text-sm " +
    "text-[var(--foreground)] placeholder:text-[var(--muted-light)] outline-none " +
    " focus:border-[var(--accent)] transition-all disabled:opacity-60";
  const labelClass = "text-[13px] font-semibold text-[var(--foreground)]";
  const req = <span className="text-[var(--copper)]"> *</span>;
  const title = initial ? "Editar lançamento" : "Novo lançamento";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center p-0 sm:p-4"
      role="dialog"
      aria-modal
      aria-label={title}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 cursor-pointer bg-[#1f2a24]/40 backdrop-blur-sm"
        onClick={() => { if (!submitting) onClose(); }}
      />

      {/* Dialog */}
      <div className="relative max-h-[94dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_24px_60px_-20px_rgba(31,42,36,0.35)] animate-slide-up sm:rounded-3xl sm:animate-scale-in">
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-[var(--border-strong)]" />
        </div>

        <form onSubmit={submit} className="p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:p-7">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow !text-[var(--copper)]">Seu próximo passo</p>
              <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-[var(--foreground)]">{title}</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {initial ? "Atualize os dados do lançamento." : "Um plano simples começa com o próximo passo."}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--surface-raised)] hover:text-[var(--foreground)]"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>

          <fieldset disabled={submitting} className="grid gap-4">
            {allowFixed && !initial && (
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-3 text-sm transition-colors hover:bg-[var(--border)]/50">
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
              <label htmlFor="entry-title" className={labelClass}>Título{req}</label>
              <input
                id="entry-title"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex.: almoço, gasolina, aporte..."
                className={fieldClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="grid gap-1.5">
                <label htmlFor="entry-value" className={labelClass}>Valor (R$){req}</label>
                <input
                  id="entry-value"
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
                  className={fieldClass}
                />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="entry-kind" className={labelClass}>Tipo</label>
                <select
                  id="entry-kind"
                  value={kind}
                  disabled={Boolean(initial)}
                  onChange={(e) => {
                    const next = e.target.value as EntryKind;
                    setKind(next);
                    setCategory(availableCategories(next)[0]);
                  }}
                  className={`${fieldClass} cursor-pointer`}
                >
                  {kinds.map((k) => (
                    <option key={k} value={k}>{kindLabel(k)}</option>
                  ))}
                </select>
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="entry-date" className={labelClass}>Data{req}</label>
                <input id="entry-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={fieldClass} />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="entry-category" className={labelClass}>Categoria</label>
                <select
                  id="entry-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  className={`${fieldClass} cursor-pointer`}
                >
                  {categoryOptions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </fieldset>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 dark:border-rose-900/50 dark:bg-rose-950/30">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
            </div>
          )}

          <div className="mt-6 flex items-center justify-end gap-2 border-t border-[var(--border)] pt-5">
            <Button type="button" variant="ghost" size="lg" onClick={onClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" size="lg" loading={submitting} leftIcon={<Check className="h-4 w-4" aria-hidden />}>
              {initial ? "Salvar alterações" : "Salvar registro"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
