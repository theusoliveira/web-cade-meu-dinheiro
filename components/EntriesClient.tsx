"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Button } from "./Button";
import { HistoryTable } from "./HistoryTable";
import type { DonutSlice } from "./DonutChartCard";
import {
  formatCurrencyBRL,
  monthLabel,
  type EntryKind,
  type FinanceEntry,
} from "../lib/finance";

function ChartFallback() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
      Carregando gráfico...
    </div>
  );
}

const DonutChartCard = dynamic(
  () => import("./DonutChartCard").then((mod) => mod.DonutChartCard),
  { loading: () => <ChartFallback /> },
);

function groupByCategory(entries: FinanceEntry[], kind: EntryKind): DonutSlice[] {
  const map = new Map<string, number>();
  for (const entry of entries) {
    if (entry.kind !== kind) continue;
    map.set(entry.category, (map.get(entry.category) ?? 0) + entry.value);
  }
  return [...map.entries()].map(([name, value]) => ({ name, value }));
}

function pluralRegistros(n: number) {
  return `${n} registro${n === 1 ? "" : "s"}`;
}

type Props = {
  month: string;
  setMonth: (m: string) => void;
  entries: FinanceEntry[];
  openDialog: (kind: EntryKind) => void;
  onEdit: (entry: FinanceEntry) => void;
  onDelete: (entry: FinanceEntry) => void;
};

export function EntriesClient({
  month,
  setMonth,
  entries,
  openDialog,
  onEdit,
  onDelete,
}: Props) {
  const incomeByCategory = React.useMemo(() => groupByCategory(entries, "income"), [entries]);
  const expenseByCategory = React.useMemo(() => groupByCategory(entries, "expense"), [entries]);
  const investmentByCategory = React.useMemo(
    () => groupByCategory(entries, "investment"),
    [entries],
  );

  const incomeEntries = React.useMemo(
    () => entries.filter((entry) => entry.kind === "income"),
    [entries],
  );
  const expenseEntries = React.useMemo(
    () => entries.filter((entry) => entry.kind === "expense"),
    [entries],
  );
  const investmentEntries = React.useMemo(
    () => entries.filter((entry) => entry.kind === "investment"),
    [entries],
  );

  const totals = React.useMemo(() => {
    let income = 0;
    let expense = 0;
    let investment = 0;

    for (const entry of entries) {
      if (entry.kind === "income") income += entry.value;
      else if (entry.kind === "expense") expense += entry.value;
      else investment += entry.value;
    }

    return { income, expense, investment, balance: income - expense - investment };
  }, [entries]);

  return (
    <>
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold">Lançamentos</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Registre receitas, despesas e investimentos do mês.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => openDialog("income")}
              className="w-full gap-2 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 sm:w-auto dark:bg-emerald-900/30 dark:text-emerald-100 dark:hover:bg-emerald-900/45"
            >
              + Receita
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => openDialog("expense")}
              className="w-full gap-2 bg-rose-100 text-rose-800 hover:bg-rose-200 sm:w-auto dark:bg-rose-900/30 dark:text-rose-100 dark:hover:bg-rose-900/45"
            >
              - Despesa
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => openDialog("investment")}
              className="w-full gap-2 bg-sky-100 text-sky-800 hover:bg-sky-200 sm:w-auto dark:bg-sky-900/30 dark:text-sky-100 dark:hover:bg-sky-900/45"
            >
              + Investimento
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Receitas</p>
            <p className="mt-1 text-lg font-semibold">{formatCurrencyBRL(totals.income)}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Despesas</p>
            <p className="mt-1 text-lg font-semibold">{formatCurrencyBRL(totals.expense)}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Investimentos</p>
            <p className="mt-1 text-lg font-semibold">{formatCurrencyBRL(totals.investment)}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Saldo</p>
            <p className="mt-1 text-lg font-semibold">{formatCurrencyBRL(totals.balance)}</p>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              Visão do mês
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {monthLabel(month)} · {pluralRegistros(entries.length)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="month" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Mês
            </label>
            <input
              id="month"
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-400/50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
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
          <DonutChartCard
            title="Onde estou investindo"
            data={investmentByCategory}
            colors={["#f59e0b", "#38bdf8", "#fb7185", "#a3e635"]}
            centerLabel="Investimentos"
          />
        </div>

        <div className="mt-6 grid gap-4">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Receitas</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {pluralRegistros(incomeEntries.length)}
              </p>
            </div>
            <HistoryTable entries={incomeEntries} onEdit={onEdit} onDelete={onDelete} />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Despesas</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {pluralRegistros(expenseEntries.length)}
              </p>
            </div>
            <HistoryTable entries={expenseEntries} onEdit={onEdit} onDelete={onDelete} />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Investimentos
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {pluralRegistros(investmentEntries.length)}
              </p>
            </div>
            <HistoryTable entries={investmentEntries} onEdit={onEdit} onDelete={onDelete} />
          </div>
        </div>
      </section>
    </>
  );
}
