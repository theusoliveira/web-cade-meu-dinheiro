"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Button } from "./Button";
import { HistoryTable } from "./HistoryTable";
import { ChartFallback } from "./ChartFallback";
import { formatCurrencyBRL, groupByCategory, type EntryKind, type FinanceEntry } from "../lib/finance";

const DonutChartCard = dynamic(
  () => import("./DonutChartCard").then((mod) => mod.DonutChartCard),
  { loading: () => <ChartFallback /> },
);

type Props = {
  entries: FinanceEntry[];
  openDialog: (kind: Extract<EntryKind, "income" | "expense">) => void;
  onEdit: (entry: FinanceEntry) => void;
  onDelete: (entry: FinanceEntry) => void;
  onDeleteAll: () => void;
};

export function CardControlClient({ entries, openDialog, onEdit, onDelete, onDeleteAll }: Props) {
  const totals = React.useMemo(() => {
    let income = 0, expense = 0;
    for (const entry of entries) {
      if (entry.kind === "income") income += entry.value;
      if (entry.kind === "expense") expense += entry.value;
    }
    return { income, expense, balance: income - expense };
  }, [entries]);

  const incomeByCategory = React.useMemo(() => groupByCategory(entries, "income"), [entries]);
  const expenseByCategory = React.useMemo(() => groupByCategory(entries, "expense"), [entries]);

  function confirmDeleteAll() {
    const ok = window.confirm(
      "Excluir TODOS os lançamentos do Controle de gastos?\n\nEssa ação não pode ser desfeita.",
    );
    if (ok) onDeleteAll();
  }

  return (
    <section>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Controle de gastos</h1>
          <p className="mt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Todos os lançamentos · {entries.length} registro{entries.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="hidden gap-2 sm:flex">
          <Button
            type="button"
            variant="secondary"
            onClick={() => openDialog("income")}
            className="gap-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/60"
          >
            + Receita
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => openDialog("expense")}
            className="gap-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/60"
          >
            − Despesa
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 grid-cols-3">
        {(
          [
            { label: "Receitas", value: totals.income, color: "text-green-700 dark:text-green-400" },
            { label: "Despesas", value: totals.expense, color: "text-rose-700 dark:text-rose-400" },
            { label: "Saldo", value: totals.balance, color: "text-zinc-900 dark:text-zinc-50" },
          ] as const
        ).map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{label}</p>
            <p className={`mt-1.5 text-lg font-bold ${color}`}>{formatCurrencyBRL(value)}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <DonutChartCard
          title="De onde vem meu dinheiro"
          data={incomeByCategory}
          colors={["#16a34a", "#22c55e", "#4ade80", "#10b981"]}
          centerLabel="Receitas"
        />
        <DonutChartCard
          title="Onde estou gastando mais"
          data={expenseByCategory}
          colors={["#f43f5e", "#f59e0b", "#8b5cf6", "#ef4444"]}
          centerLabel="Despesas"
        />
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Histórico</h2>
          <Button
            type="button"
            variant="ghost"
            onClick={confirmDeleteAll}
            disabled={entries.length === 0}
            className="text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
          >
            Excluir todos
          </Button>
        </div>

        <HistoryTable entries={entries} onEdit={onEdit} onDelete={onDelete} />
      </div>
    </section>
  );
}
