"use client";

import * as React from "react";
import { Button } from "./Button";
import { formatCurrencyBRL, monthShortLabel } from "../lib/finance";
import type { Goal } from "./AddGoalDialog";

function percent(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.max(0, Math.min(100, (current / target) * 100));
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-800">
      <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${value}%` }} />
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
      <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center dark:border-zinc-800 dark:bg-zinc-900/30">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Nenhuma meta cadastrada.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      {/* Mobile: cards */}
      <div className="divide-y divide-zinc-100 sm:hidden dark:divide-zinc-900">
        {goals.map((g) => {
          const p = percent(g.currentValue, g.targetValue);
          return (
            <div key={g.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 break-words text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {g.description}
                </p>
                <p className="shrink-0 text-xs font-medium text-zinc-700 dark:text-zinc-200">
                  {Math.round(p)}%
                </p>
              </div>

              <div className="mt-2">
                <ProgressBar value={p} />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                {(
                  [
                    { label: "Valor atual", display: formatCurrencyBRL(g.currentValue) },
                    { label: "Objetivo", display: formatCurrencyBRL(g.targetValue) },
                  ] as const
                ).map(({ label, display }) => (
                  <div key={label}>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
                    <p className="text-zinc-800 dark:text-zinc-200">{display}</p>
                  </div>
                ))}
                <div className="col-span-2">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Previsão</p>
                  <p className="text-zinc-800 dark:text-zinc-200">{monthShortLabel(g.forecast)}</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-end gap-2">
                <Button variant="secondary" className="h-9 px-3" onClick={() => onEdit(g)}>
                  Editar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(g)}
                  className="h-9 px-3 text-rose-700 hover:bg-rose-50 dark:text-rose-200 dark:hover:bg-rose-950/30"
                >
                  Excluir
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="border-b border-zinc-200/60 dark:border-zinc-800/60">
            <tr className="text-left text-xs text-zinc-500 dark:text-zinc-400">
              {["Descrição", "Valor atual", "Objetivo", "Previsão", "Progresso", ""].map(
                (col) => (
                  <th key={col} className={`px-4 py-3 font-medium${col === "" ? " text-right" : ""}`}>
                    {col}
                  </th>
                ),
              )}
            </tr>
          </thead>

          <tbody>
            {goals.map((g) => {
              const p = percent(g.currentValue, g.targetValue);
              return (
                <tr
                  key={g.id}
                  className="border-b border-zinc-200/50 last:border-b-0 dark:border-zinc-800/50"
                >
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                    {g.description}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-200">
                    {formatCurrencyBRL(g.currentValue)}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-200">
                    {formatCurrencyBRL(g.targetValue)}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-200">
                    {monthShortLabel(g.forecast)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="w-12 text-xs font-medium text-zinc-700 dark:text-zinc-200">
                        {Math.round(p)}%
                      </span>
                      <div className="w-40">
                        <ProgressBar value={p} />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" className="h-9 px-3" onClick={() => onEdit(g)}>
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(g)}
                        className="text-rose-700 hover:bg-rose-50 dark:text-rose-200 dark:hover:bg-rose-950/30"
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
