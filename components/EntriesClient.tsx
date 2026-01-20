"use client";

import * as React from "react";
import { Button } from "./Button";
import { HistoryTable } from "./HistoryTable";
import { DonutChartCard, type DonutSlice } from "./DonutChartCard";
import {
  formatCurrencyBRL,
  type EntryKind,
  type FinanceEntry,
} from "../lib/finance";

function monthLabel(ym: string): string {
  if (!ym) return "Todos os meses";
  const [y, m] = ym.split("-").map((v) => Number(v));
  const dt = new Date(y, (m ?? 1) - 1, 1);
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(dt);
}

function groupByCategory(entries: FinanceEntry[], kind: EntryKind): DonutSlice[] {
  const map = new Map<string, number>();
  for (const e of entries) {
    if (e.kind !== kind) continue;
    map.set(e.category, (map.get(e.category) ?? 0) + e.value);
  }
  return [...map.entries()].map(([name, value]) => ({ name, value }));
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
    [entries]
  );

  const totals = React.useMemo(() => {
    let income = 0;
    let expense = 0;
    let investment = 0;
    for (const e of entries) {
      if (e.kind === "income") income += e.value;
      else if (e.kind === "expense") expense += e.value;
      else investment += e.value;
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
              Adicione uma receita, despesa ou investimento e acompanhe o histórico.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-nowrap sm:items-center sm:justify-end">
            <Button
              onClick={() => openDialog("income")}
              className="gap-2 w-full sm:w-auto bg-emerald-100 text-emerald-900 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-100 dark:hover:bg-emerald-900/45"
            >
              + Adicionar receita
            </Button>

            <Button
              onClick={() => openDialog("expense")}
              className="gap-2 w-full sm:w-auto bg-rose-100 text-rose-900 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-100 dark:hover:bg-rose-900/45"
            >
              - Adicionar despesa
            </Button>

            <Button
              onClick={() => openDialog("investment")}
              className="gap-2 w-full sm:w-auto bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-100 dark:hover:bg-amber-900/45"
            >
              ▸ Adicionar investimento
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
              {monthLabel(month)} · {entries.length} registro{entries.length === 1 ? "" : "s"}
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
              onChange={(e) => setMonth(e.target.value)}
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

        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Histórico</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {entries.length} registro{entries.length === 1 ? "" : "s"}
            </p>
          </div>

          <HistoryTable entries={entries} onEdit={onEdit} onDelete={onDelete} />
        </div>
      </section>
    </>
  );
}
