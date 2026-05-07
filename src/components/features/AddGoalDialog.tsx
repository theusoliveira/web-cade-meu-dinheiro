"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { formatCurrencyBRL, newId } from "@/lib/finance";

export type Goal = {
  id: string;
  description: string;
  currentValue: number;
  targetValue: number;
  forecast: string; // YYYY-MM
  createdAt: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  initial?: Goal | null;
  onSubmit: (goal: Goal) => void | Promise<void>;
};

function formatFromCents(cents: number): string {
  return formatCurrencyBRL(cents / 100);
}

function parseDigitsToCents(raw: string): number {
  const digits = raw.replace(/\D/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

export function AddGoalDialog({ open, onClose, initial, onSubmit }: Props) {
  const [description, setDescription] = React.useState("");
  const [forecast, setForecast] = React.useState("");
  const [currentCents, setCurrentCents] = React.useState(0);
  const [currentText, setCurrentText] = React.useState("");
  const [targetCents, setTargetCents] = React.useState(0);
  const [targetText, setTargetText] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const isEdit = !!initial;

  React.useEffect(() => {
    if (!open) return;
    setError(null);
    setSubmitting(false);

    if (initial) {
      setDescription(initial.description ?? "");
      setForecast(initial.forecast ?? "");
      const c = Math.round((initial.currentValue ?? 0) * 100);
      setCurrentCents(c);
      setCurrentText(c ? formatFromCents(c) : "");
      const t = Math.round((initial.targetValue ?? 0) * 100);
      setTargetCents(t);
      setTargetText(t ? formatFromCents(t) : "");
    } else {
      setDescription(""); setForecast("");
      setCurrentCents(0); setCurrentText("");
      setTargetCents(0); setTargetText("");
    }
  }, [open, initial]);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape" && !submitting) onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, submitting]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    if (!description.trim()) return setError("Digite uma descrição.");
    if (!forecast) return setError("Selecione a previsão (mês/ano).");
    if (targetCents <= 0) return setError("O objetivo precisa ser maior que zero.");
    if (currentCents < 0) return setError("Valor atual inválido.");

    const goal: Goal = {
      id: initial?.id ?? newId(),
      description: description.trim(),
      currentValue: currentCents / 100,
      targetValue: targetCents / 100,
      forecast,
      createdAt: initial?.createdAt ?? Date.now(),
    };

    try {
      setSubmitting(true);
      await Promise.resolve(onSubmit(goal));
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
    "focus:ring-1 focus:ring-[var(--investment)] focus:border-[var(--investment)] transition-all";

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center p-0 sm:p-4" role="dialog" aria-modal>
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px] cursor-pointer"
        onClick={() => { if (!submitting) onClose(); }}
      />

      <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl animate-slide-up sm:animate-scale-in">
        <div className="flex justify-center pt-3 pb-0 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-[var(--border)]" />
        </div>

        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--foreground)]">{isEdit ? "Editar meta" : "Nova meta"}</h3>
              <p className="text-xs text-[var(--muted)]">Defina descrição, valores e previsão</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="cursor-pointer h-8 w-8 flex items-center justify-center rounded-xl text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-raised)] transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          <fieldset disabled={submitting} className="grid gap-4">
            <div className="grid gap-1.5">
              <label className="text-sm font-semibold text-[var(--foreground)]">Descrição</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex.: Reserva de emergência"
                className={inputClass}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <label className="text-sm font-semibold text-[var(--foreground)]">Valor atual</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={currentText}
                  onChange={(e) => {
                    const cents = parseDigitsToCents(e.target.value);
                    setCurrentCents(cents);
                    setCurrentText(cents === 0 ? "" : formatFromCents(cents));
                  }}
                  placeholder="R$ 0,00"
                  className={`${inputClass} `}
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-semibold text-[var(--foreground)]">Objetivo</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={targetText}
                  onChange={(e) => {
                    const cents = parseDigitsToCents(e.target.value);
                    setTargetCents(cents);
                    setTargetText(cents === 0 ? "" : formatFromCents(cents));
                  }}
                  placeholder="R$ 0,00"
                  className={`${inputClass} `}
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-semibold text-[var(--foreground)]">Previsão (mês/ano)</label>
              <input
                type="month"
                value={forecast}
                onChange={(e) => setForecast(e.target.value)}
                className={`${inputClass} cursor-pointer`}
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
            <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>Cancelar</Button>
            <Button type="submit" loading={submitting}>{isEdit ? "Salvar" : "Cadastrar"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
