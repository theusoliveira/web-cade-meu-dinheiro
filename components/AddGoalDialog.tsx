"use client";

import * as React from "react";
import { Button } from "./Button";
import { formatCurrencyBRL } from "../lib/finance";

export type Goal = {
  id: string;
  description: string;
  currentValue: number; // em reais
  targetValue: number;  // em reais
  forecast: string;     // YYYY-MM
  createdAt: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  initial?: Goal | null;
  onSubmit: (goal: Goal) => void | Promise<void>;
};

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function formatFromCents(cents: number): string {
  return formatCurrencyBRL(cents / 100);
}

function parseDigitsToCents(raw: string): number {
  const digits = raw.replace(/\D/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

export function AddGoalDialog({ open, onClose, initial, onSubmit }: Props) {
  const [description, setDescription] = React.useState("");
  const [forecast, setForecast] = React.useState(""); // YYYY-MM

  const [currentCents, setCurrentCents] = React.useState(0);
  const [currentText, setCurrentText] = React.useState("");

  const [targetCents, setTargetCents] = React.useState(0);
  const [targetText, setTargetText] = React.useState("");

  const [error, setError] = React.useState<string | null>(null);
  const isEdit = !!initial;

  React.useEffect(() => {
    if (!open) return;

    setError(null);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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

    await onSubmit(goal);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">{isEdit ? "Editar meta" : "Nova meta"}</h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Defina descrição, valores e a previsão.
            </p>
          </div>

          <Button variant="ghost" onClick={onClose} className="h-9 px-3">
            Fechar
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 grid gap-3">
          <div className="grid gap-1">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Descrição
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex.: Reserva de emergência"
              className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-400/50 dark:border-zinc-800 dark:bg-zinc-950"
            />
          </div>

          <div className="grid gap-1">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
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
              className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-400/50 dark:border-zinc-800 dark:bg-zinc-950"
            />
          </div>

          <div className="grid gap-1">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
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
              className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-400/50 dark:border-zinc-800 dark:bg-zinc-950"
            />
          </div>

          <div className="grid gap-1">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Previsão (mês/ano)
            </label>
            <input
              type="month"
              value={forecast}
              onChange={(e) => setForecast(e.target.value)}
              className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-400/50 dark:border-zinc-800 dark:bg-zinc-950"
            />
          </div>

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}

          <div className="mt-2 flex items-center justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">{isEdit ? "Salvar" : "Cadastrar"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
