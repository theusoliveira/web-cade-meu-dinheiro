"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { formatCurrencyBRL, monthShortLabel } from "@/lib/finance";
import type { Goal } from "@/components/features/AddGoalDialog";

function percent(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.max(0, Math.min(100, (current / target) * 100));
}

function ProgressBar({ value }: { value: number }) {
  const color = value >= 100 ? "bg-emerald-500" : value >= 50 ? "bg-sky-500" : "bg-amber-500";
  return (
    <div className="h-2 w-full rounded-full bg-[var(--surface-raised)]">
      <div
        className={`h-2 rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export function GoalsTable({
  goals,
  onEdit,
  onDelete,
}: {
  goals: Goal[];
  onEdit: (goal: Goal) => void;
  onDelete: (goal: Goal) => void;
}) {
  if (!goals.length) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-raised)]/50 p-10 text-center">
        <svg viewBox="0 0 48 48" fill="none" className="mx-auto mb-3 h-10 w-10 text-[var(--muted-light)]" aria-hidden>
          <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="2" />
          <circle cx="24" cy="24" r="10" stroke="currentColor" strokeWidth="2" />
          <circle cx="24" cy="24" r="3" fill="currentColor" />
        </svg>
        <p className="text-sm text-[var(--muted)]">Nenhuma meta cadastrada ainda.</p>
        <p className="mt-1 text-xs text-[var(--muted-light)]">Use o botão acima para criar sua primeira meta.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
      {/* Mobile cards */}
      <div className="divide-y divide-[var(--border)] sm:hidden">
        {goals.map((g) => {
          const p = percent(g.currentValue, g.targetValue);
          return (
            <div key={g.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 text-sm font-semibold text-[var(--foreground)] break-words">{g.description}</p>
                <span className={`shrink-0 text-xs font-bold ${p >= 100 ? "text-emerald-500" : p >= 50 ? "text-sky-500" : "text-amber-500"}`}>
                  {Math.round(p)}%
                </span>
              </div>

              <div className="mt-2.5">
                <ProgressBar value={p} />
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-[var(--muted)]">Atual</p>
                  <p className="font-semibold text-[var(--foreground)] ">{formatCurrencyBRL(g.currentValue)}</p>
                </div>
                <div>
                  <p className="text-[var(--muted)]">Objetivo</p>
                  <p className="font-semibold text-[var(--foreground)] ">{formatCurrencyBRL(g.targetValue)}</p>
                </div>
                <div>
                  <p className="text-[var(--muted)]">Previsão</p>
                  <p className="font-semibold text-[var(--foreground)]">{monthShortLabel(g.forecast)}</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-end gap-1.5">
                <Button variant="ghost" size="xs" onClick={() => onEdit(g)}>Editar</Button>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => onDelete(g)}
                  className="text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                >
                  Excluir
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-[var(--surface-raised)] border-b border-[var(--border)]">
            <tr>
              {["Descrição", "Valor atual", "Objetivo", "Previsão", "Progresso", ""].map((col) => (
                <th key={col} className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]${col === "" ? " text-right" : ""}`}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {goals.map((g) => {
              const p = percent(g.currentValue, g.targetValue);
              return (
                <tr key={g.id} className="hover:bg-[var(--surface-raised)] transition-colors">
                  <td className="px-4 py-3 font-semibold text-[var(--foreground)] max-w-xs">{g.description}</td>
                  <td className="px-4 py-3  text-sm text-[var(--foreground)]">{formatCurrencyBRL(g.currentValue)}</td>
                  <td className="px-4 py-3  text-sm text-[var(--foreground)]">{formatCurrencyBRL(g.targetValue)}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">{monthShortLabel(g.forecast)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-32">
                        <ProgressBar value={p} />
                      </div>
                      <span className={`text-xs font-bold w-10 ${p >= 100 ? "text-emerald-500" : p >= 50 ? "text-sky-500" : "text-amber-500"}`}>
                        {Math.round(p)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <Button variant="ghost" size="xs" onClick={() => onEdit(g)}>Editar</Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => onDelete(g)}
                        className="text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                      >
                        Excluir
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
