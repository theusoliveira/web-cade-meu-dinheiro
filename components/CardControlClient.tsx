"use client";

import * as React from "react";
import { Button } from "./Button";
import { HistoryTable } from "./HistoryTable";
import { DonutChartCard, type DonutSlice } from "./DonutChartCard";
import { formatCurrencyBRL, type EntryKind, type FinanceEntry } from "../lib/finance";

function groupByCategory(entries: FinanceEntry[], kind: EntryKind): DonutSlice[] {
  const map = new Map<string, number>();
  for (const e of entries) {
    if (e.kind !== kind) continue;
    map.set(e.category, (map.get(e.category) ?? 0) + e.value);
  }
  return [...map.entries()].map(([name, value]) => ({ name, value }));
}

type Props = {
  entries: FinanceEntry[];

  openDialog: (kind: Extract<EntryKind, "income" | "expense">) => void;
  onEdit: (entry: FinanceEntry) => void;
  onDelete: (entry: FinanceEntry) => void;

  onDeleteAll: () => void;
};

export function CardControlClient({
  entries,
  openDialog,
  onEdit,
  onDelete,
  onDeleteAll,
}: Props) {
  const totals = React.useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const e of entries) {
      if (e.kind === "income") income += e.value;
      if (e.kind === "expense") expense += e.value;
    }
    return { income, expense, balance: income - expense };
  }, [entries]);

  const incomeByCategory = React.useMemo(() => groupByCategory(entries, "income"), [entries]);
  const expenseByCategory = React.useMemo(() => groupByCategory(entries, "expense"), [entries]);

  function confirmDeleteAll() {
    const ok = window.confirm(
      "Excluir TODOS os lançamentos do Controle de gastos?\n\nEssa ação não pode ser desfeita."
    );
    if (ok) onDeleteAll();
  }

  return (
    <>
      <section>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Controle de gastos
            </h1>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Todos os lançamentos · {entries.length} registro{entries.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => openDialog("income")}
                className="gap-2 w-full sm:w-auto bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-100 dark:hover:bg-emerald-900/45"
              >
                + Adicionar receita
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => openDialog("expense")}
                className="gap-2 w-full sm:w-auto bg-rose-100 text-rose-800 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-100 dark:hover:bg-rose-900/45"
              >
                - Adicionar despesa
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Receitas</p>
            <p className="mt-1 text-lg font-semibold">{formatCurrencyBRL(totals.income)}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Despesas</p>
            <p className="mt-1 text-lg font-semibold">{formatCurrencyBRL(totals.expense)}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Saldo</p>
            <p className="mt-1 text-lg font-semibold">{formatCurrencyBRL(totals.balance)}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <DonutChartCard
            title="De onde vem meu dinheiro"
            data={incomeByCategory}
            colors={["#10b981", "#14b8a6", "#22c55e", "#06b6d4"]}
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
            <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Histórico</h2>
            {/* <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {entries.length} registro{entries.length === 1 ? "" : "s"}
            </p> */}

            <Button
              type="button"
              variant="ghost"
              onClick={confirmDeleteAll}
              disabled={entries.length === 0}
              className="w-full sm:w-auto text-rose-700 hover:bg-rose-50 dark:text-rose-200 dark:hover:bg-rose-950/30"
            >
              Excluir todos os lançamentos
            </Button>
          </div>

          <HistoryTable entries={entries} onEdit={onEdit} onDelete={onDelete} />
        </div>
      </section>
    </>
  );
}
