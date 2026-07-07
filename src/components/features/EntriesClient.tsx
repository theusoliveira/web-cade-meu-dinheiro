"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/Button";
import { Card, StatCard } from "@/components/ui/Card";
import { HistoryTable } from "@/components/features/HistoryTable";
import type { DonutSlice } from "@/components/features/DonutChartCard";
import { formatCurrencyBRL, groupByCategory, monthLabel, type EntryKind, type FinanceEntry } from "@/lib/finance";

const DonutChartCard = dynamic(
  () => import("./DonutChartCard").then((m) => m.DonutChartCard),
  { loading: () => <div className="skeleton h-48 rounded-2xl" /> },
);

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

  const effectiveIncomeChartTitle = isPJ ? "Entradas da conta PJ" : incomeChartTitle;
  const effectiveExpenseChartTitle = isPJ ? "Saídas da conta PJ" : expenseChartTitle;

  const incomeByCategory = React.useMemo<DonutSlice[]>(() => groupByCategory(entries, "income"), [entries]);
  const expenseByCategory = React.useMemo<DonutSlice[]>(() => groupByCategory(entries, "expense"), [entries]);
  const investmentByCategory = React.useMemo<DonutSlice[]>(() => groupByCategory(entries, "investment"), [entries]);

  const incomeEntries = React.useMemo(() => entries.filter((e) => e.kind === "income"), [entries]);
  const expenseEntries = React.useMemo(() => entries.filter((e) => e.kind === "expense"), [entries]);
  const investmentEntries = React.useMemo(() => entries.filter((e) => e.kind === "investment"), [entries]);

  const totals = React.useMemo(() => {
    let income = 0; let expense = 0; let investment = 0;
    for (const entry of entries) {
      if (entry.kind === "income") income += entry.value;
      else if (entry.kind === "expense") expense += entry.value;
      else investment += entry.value;
    }
    return { income, expense, investment, balance: income - expense - investment };
  }, [entries]);

  return (
    <div className="grid gap-6 animate-fade-in">
      {/* Header card */}
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-[var(--foreground)]">{title}</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
          </div>

          {/* Desktop action buttons */}
          <div className="hidden flex-wrap gap-2 sm:flex sm:items-center sm:justify-end">
            <Button
              type="button"
              variant="success"
              size="sm"
              onClick={() => openDialog("income")}
              className="gap-1.5"
              leftIcon={<svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clipRule="evenodd" /></svg>}
            >
              {isPJ ? "Entrada" : "Receita"}
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => openDialog("expense")}
              className="gap-1.5"
              leftIcon={<svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clipRule="evenodd" /></svg>}
            >
              {isPJ ? "Saída" : "Despesa"}
            </Button>
            <Button
              type="button"
              variant="info"
              size="sm"
              onClick={() => openDialog("investment")}
              className="gap-1.5"
              leftIcon={<svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M12.577 4.878a.75.75 0 01.919-.53l4.78 1.281a.75.75 0 01.531.919l-1.281 4.78a.75.75 0 01-1.449-.387l.81-3.022a19.407 19.407 0 00-5.594 5.203.75.75 0 01-1.139.093L7 10.06l-3.72 3.72a.75.75 0 11-1.06-1.061l4.25-4.25a.75.75 0 011.06 0l1.956 1.956a20.924 20.924 0 015.293-5.136l-3.023.81a.75.75 0 01-.387-1.45z" clipRule="evenodd" /></svg>}
            >
              Investimento
            </Button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="mt-5 grid gap-3 grid-cols-2 sm:grid-cols-4">
          <StatCard label={incomeLabel} value={formatCurrencyBRL(totals.income)} color="income" />
          <StatCard label={expenseLabel} value={formatCurrencyBRL(totals.expense)} color="expense" />
          <StatCard label="Investimentos" value={formatCurrencyBRL(totals.investment)} color="investment" />
          <StatCard
            label="Saldo"
            value={formatCurrencyBRL(totals.balance)}
            color="balance"
          />
        </div>
      </Card>

      {/* Month selector + charts */}
      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-[var(--foreground)]">Visão do mês</h2>
            <p className="mt-0.5 text-xs text-[var(--muted)]">
              {monthLabel(month)} · {pluralRegistros(entries.length)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="month-select" className="text-xs font-semibold text-[var(--muted)] tracking-wide">
              Mês
            </label>
            <input
              id="month-select"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="h-9 cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-all"
            />
          </div>
        </div>

        {/* Charts */}
        <div className="grid gap-3 md:grid-cols-3">
          <DonutChartCard
            title={effectiveIncomeChartTitle}
            data={incomeByCategory}
            colors={["#10b981", "#14b8a6", "#22c55e", "#06b6d4", "#3b82f6"]}
            centerLabel={incomeLabel}
          />
          <DonutChartCard
            title={effectiveExpenseChartTitle}
            data={expenseByCategory}
            colors={["#f43f5e", "#f59e0b", "#8b5cf6", "#ef4444", "#ec4899"]}
            centerLabel={expenseLabel}
          />
          <DonutChartCard
            title={investmentChartTitle}
            data={investmentByCategory}
            colors={["#0284c7", "#6366f1", "#06b6d4", "#3b82f6", "#8b5cf6"]}
            centerLabel="Investimentos"
          />
        </div>
      </div>

      {/* Entry lists */}
      <div className="grid gap-5">
        {([
          { label: incomeLabel, list: incomeEntries, color: "text-[var(--foreground)]" },
          { label: expenseLabel, list: expenseEntries, color: "text-[var(--foreground)]" },
          { label: "Investimentos", list: investmentEntries, color: "text-[var(--foreground)]" },
        ] as const).map(({ label, list, color }) => (
          <div key={label}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className={`text-sm font-bold ${color}`}>{label}</h3>
              <span className="text-xs text-[var(--muted)]">{pluralRegistros(list.length)}</span>
            </div>
            <HistoryTable entries={list} onEdit={onEdit} onDelete={onDelete} />
          </div>
        ))}
      </div>
    </div>
  );
}