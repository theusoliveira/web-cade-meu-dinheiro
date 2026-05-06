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
  const color = value >= 100 ? "from-green-500 to-emerald-400" : value >= 75 ? "from-green-500 to-green-400" : value >= 50 ? "from-green-400 to-lime-400" : "from-green-300 to-green-400";
  return (
    <div className="h-2.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
      <div
        className={`h-2.5 rounded-full bg-gradient-to-r ${color} transition-all duration-300`}
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
      <div className="rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 p-10 text-center dark:border-zinc-800 dark:bg-zinc-900/30">
        <div className="mb-3 text-3xl">🎯</div>
        <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">Nenhuma meta cadastrada.</p>
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">Use o botão acima para adicionar sua primeira meta.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 shadow-sm">
      {/* Mobile: cards */}
      <div className="divide-y divide-zinc-100 sm:hidden dark:divide-zinc-800">
        {goals.map((g) => {
          const p = percent(g.currentValue, g.targetValue);
          return (
            <div key={g.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 break-words text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  {g.description}
                </p>
                <span className={`shrink-0 text-xs font-bold ${p >= 100 ? "text-green-600" : "text-zinc-500"}`}>
                  {Math.round(p)}%
                </span>
              </div>

              <div className="mt-2.5">
                <ProgressBar value={p} />
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-xs font-medium text-zinc-400">Atual</p>
                  <p className="text-sm font-semibold text-green-700 dark:text-green-400">{formatCurrencyBRL(g.currentValue)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-400">Objetivo</p>
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{formatCurrencyBRL(g.targetValue)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-400">Previsão</p>
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{monthShortLabel(g.forecast)}</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => onEdit(g)}>
                  Editar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
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

      {/* Desktop: table */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/30">
            <tr className="text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              {["Descrição", "Valor atual", "Objetivo", "Previsão", "Progresso", ""].map((col) => (
                <th key={col} className={`px-4 py-3 font-semibold${col === "" ? " text-right" : ""}`}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
            {goals.map((g) => {
              const p = percent(g.currentValue, g.targetValue);
              return (
                <tr key={g.id} className="transition hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40">
                  <td className="px-4 py-3.5 font-semibold text-zinc-900 dark:text-zinc-50">
                    {g.description}
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-green-700 dark:text-green-400">
                    {formatCurrencyBRL(g.currentValue)}
                  </td>
                  <td className="px-4 py-3.5 text-zinc-700 dark:text-zinc-200">
                    {formatCurrencyBRL(g.targetValue)}
                  </td>
                  <td className="px-4 py-3.5 text-zinc-700 dark:text-zinc-200">
                    {monthShortLabel(g.forecast)}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className={`w-10 text-xs font-bold ${p >= 100 ? "text-green-600" : "text-zinc-500"}`}>
                        {Math.round(p)}%
                      </span>
                      <div className="w-36">
                        <ProgressBar value={p} />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex justify-end gap-1.5">
                      <Button variant="secondary" size="sm" onClick={() => onEdit(g)}>
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
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
