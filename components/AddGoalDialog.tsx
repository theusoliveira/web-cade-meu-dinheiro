"use client";

import * as React from "react";
import { Button } from "./Button";
import { formatCurrencyBRL, newId } from "../lib/finance";

export type Goal = {
  id: string;
  description: string;
  currentValue: number;
  targetValue: number;
  forecast: string;
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

const inputBase =
  "h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-green-400 focus:ring-2 focus:ring-green-400/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-green-500";

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
      setDescription("");
      setForecast("");
      setCurrentCents(0);
      setCurrentText("");
      setTargetCents(0);
      setTargetText("");
    }
  }, [open, initial]);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
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

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-pointer"
        onClick={() => { if (!submitting) onClose(); }}
      />
      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <h3 className="text-lg font-bold text-green-700 dark:text-green-400">
              {isEdit ? "Editar meta" : "Nova meta"}
            </h3>
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
              Defina descrição, valores e a previsão de conclusão.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition dark:hover:bg-zinc-800"
            aria-label="Fechar"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <fieldset disabled={submitting} className="grid gap-3">
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Descrição
              </label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex.: Reserva de emergência"
                className={inputBase}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Valor atual
                </label>
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
                  className={inputBase}
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Objetivo
                </label>
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
                  className={inputBase}
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Previsão (mês/ano)
              </label>
              <input
                type="month"
                value={forecast}
                onChange={(e) => setForecast(e.target.value)}
                className={inputBase}
              />
            </div>
          </fieldset>

          {error ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
              {error}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Salvando…" : isEdit ? "Salvar" : "Cadastrar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
