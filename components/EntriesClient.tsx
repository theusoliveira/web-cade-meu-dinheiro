"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Button } from "./Button";
import { HistoryTable } from "./HistoryTable";
import { ChartFallback } from "./ChartFallback";
import type { DonutSlice } from "./DonutChartCard";
import {
  formatCurrencyBRL,
  groupByCategory,
  monthLabel,
  type EntryKind,
  type FinanceEntry,
} from "../lib/finance";

const DonutChartCard = dynamic(
  () => import("./DonutChartCard").then((mod) => mod.DonutChartCard),
  { loading: () => <ChartFallback /> },
);

function pluralRegistros(n: number) {
  return `${n} registro${n === 1 ? "" : "s"}`;
}

type SummaryCardProps = {
  label: string;
  value: number;
  accent?: "green" | "rose" | "amber" | "zinc";
};

function SummaryCard({ label, value, accent = "zinc" }: SummaryCardProps) {
  const accentStyles = {
    green: "border-green-200 bg-green-50 dark:border-green-900/30 dark:bg-green-950/20",
    rose: "border-rose-200 bg-rose-50 dark:border-rose-900/30 dark:bg-rose-950/20",
    amber: "border-amber-200 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-950/20",
    zinc: "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/40",
  };
  const valueStyles = {
    green: "text-green-700 dark:text-green-400",
    rose: "text-rose-700 dark:text-rose-400",
    amber: "text-amber-700 dark:text-amber-400",
    zinc: "text-zinc-900 dark:text-zinc-50",
  };

  return (
    <div className={`rounded-xl border p-4 ${accentStyles[accent]}`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className={`mt-1.5 text-xl font-bold ${valueStyles[accent]}`}>{formatCurrencyBRL(value)}</p>
    </div>
  );
}

type Props = {
  month: string;
  setMonth: (m: string) => void;
  entries: FinanceEntry[];
  openDialog: (kind: EntryKind) => void;
  onEdit: (entry: FinanceEntry) => void;
  onDelete: (entry: FinanceEntry) => void;
  isPJ?: boolean;
  title?: string;
  description?: string;
  incomeChartTitle?: string;
  expenseChartTitle?: string;
  investmentChartTitle?: string;
};

export function EntriesClient({
  month,
  setMonth,
  entries,
  openDialog,
  onEdit,
  onDelete,
  isPJ = false,
  title = "Lançamentos",
  description = "Registre receitas, despesas e investimentos do mês.",
  incomeChartTitle = "De onde vem meu dinheiro",
  expenseChartTitle = "Onde estou gastando mais",
  investmentChartTitle = "Onde estou investindo",
}: Props) {
  const incomeLabel = isPJ ? "Entradas" : "Receitas";
  const expenseLabel = isPJ ? "Saídas" : "Despesas";
  const effectiveDescription = isPJ ? "Registre entradas, saídas e investimentos da conta PJ." : description;
  const effectiveIncomeChartTitle = isPJ ? "Entradas da conta PJ" : incomeChartTitle;
  const effectiveExpenseChartTitle = isPJ ? "Saídas da conta PJ" : expenseChartTitle;

  const incomeByCategory = React.useMemo<DonutSlice[]>(() => groupByCategory(entries, "income"), [entries]);
  const expenseByCategory = React.useMemo<DonutSlice[]>(() => groupByCategory(entries, "expense"), [entries]);
  const investmentByCategory = React.useMemo<DonutSlice[]>(() => groupByCategory(entries, "investment"), [entries]);

  const incomeEntries = React.useMemo(() => entries.filter((e) => e.kind === "income"), [entries]);
  const expenseEntries = React.useMemo(() => entries.filter((e) => e.kind === "expense"), [entries]);
  const investmentEntries = React.useMemo(() => entries.filter((e) => e.kind === "investment"), [entries]);

  const totals = React.useMemo(() => {
    let income = 0, expense = 0, investment = 0;
    for (const entry of entries) {
      if (entry.kind === "income") income += entry.value;
      else if (entry.kind === "expense") expense += entry.value;
      else investment += entry.value;
    }
    return { income, expense, investment, balance: income - expense - investment };
  }, [entries]);

  return (
    <>
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{title}</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{effectiveDescription}</p>
          </div>

          <div className="hidden flex-col gap-2 sm:flex sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="secondary"
              onClick={() => openDialog("income")}
              className="gap-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/60"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>
              {isPJ ? "Entrada" : "Receita"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => openDialog("expense")}
              className="gap-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/60"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden><path d="M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>
              {isPJ ? "Saída" : "Despesa"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => openDialog("investment")}
              className="gap-1.5 bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-950/40 dark:text-green-300 dark:hover:bg-green-950/60"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden><path d="M5 15l7-7 7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Investimento
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 grid-cols-2 sm:grid-cols-4">
          <SummaryCard label={incomeLabel} value={totals.income} accent="green" />
          <SummaryCard label={expenseLabel} value={totals.expense} accent="rose" />
          <SummaryCard label="Investimentos" value={totals.investment} accent="amber" />
          <SummaryCard label="Saldo" value={totals.balance} accent="zinc" />
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200">Visão do mês</h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {monthLabel(month)} · {pluralRegistros(entries.length)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="month" className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Mês
            </label>
            <input
              id="month"
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-green-400 focus:ring-2 focus:ring-green-400/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 cursor-pointer"
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <DonutChartCard
            title={effectiveIncomeChartTitle}
            data={incomeByCategory}
            colors={["#16a34a", "#22c55e", "#4ade80", "#86efac", "#10b981"]}
            centerLabel={incomeLabel}
          />
          <DonutChartCard
            title={effectiveExpenseChartTitle}
            data={expenseByCategory}
            colors={["#f43f5e", "#f59e0b", "#8b5cf6", "#ef4444"]}
            centerLabel={expenseLabel}
          />
          <DonutChartCard
            title={investmentChartTitle}
            data={investmentByCategory}
            colors={["#f59e0b", "#38bdf8", "#a3e635", "#fb923c"]}
            centerLabel="Investimentos"
          />
        </div>

        <div className="mt-6 grid gap-5">
          {(
            [
              { label: incomeLabel, list: incomeEntries },
              { label: expenseLabel, list: expenseEntries },
              { label: "Investimentos", list: investmentEntries },
            ] as const
          ).map(({ label, list }) => (
            <div key={label}>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{label}</h3>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">{pluralRegistros(list.length)}</p>
              </div>
              <HistoryTable entries={list} onEdit={onEdit} onDelete={onDelete} />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
