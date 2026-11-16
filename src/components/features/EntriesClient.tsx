"use client";

import * as React from "react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/Card";
import { HistoryTable } from "@/components/features/HistoryTable";
import { EntryFiltersBar, useEntryFilters, type KindSegment } from "@/components/features/EntryFilters";
import { formatCurrencyBRL, monthLabel, type EntryKind, type FinanceEntry } from "@/lib/finance";
import { PageHeader } from "@/components/ui/PageHeader";

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
};

function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

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
}: Props) {
  const incomeLabel = isPJ ? "Entradas" : "Receitas";
  const expenseLabel = isPJ ? "Saídas" : "Despesas";

  const filters = useEntryFilters(entries);

  const totals = React.useMemo(() => {
    let income = 0; let expense = 0; let investment = 0;
    for (const entry of entries) {
      if (entry.kind === "income") income += entry.value;
      else if (entry.kind === "expense") expense += entry.value;
      else investment += entry.value;
    }
    return { income, expense, investment, balance: income - expense - investment };
  }, [entries]);

  const segments: KindSegment[] = [
    { key: "all", label: "Todos" },
    { key: "expense", label: expenseLabel },
    { key: "income", label: incomeLabel },
    { key: "investment", label: "Investimentos" },
  ];

  return (
    <div className="grid min-w-0 grid-cols-1 gap-5 animate-fade-in sm:gap-6">
      <PageHeader
        eyebrow={isPJ ? "Conta PJ" : "Seu dinheiro"}
        title={title}
        actionsDesktopOnly
        description={description}
        actions={
          <Button
            type="button"
            size="lg"
            onClick={() => openDialog("expense")}
            leftIcon={<Plus className="h-4 w-4" aria-hidden />}
          >
            Novo lançamento
          </Button>
        }
      />

      {/* Resumo */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={incomeLabel} value={formatCurrencyBRL(totals.income)} color="income" />
        <StatCard label={expenseLabel} value={formatCurrencyBRL(totals.expense)} color="expense" />
        <StatCard label="Investimentos" value={formatCurrencyBRL(totals.investment)} color="investment" />
        <StatCard label="Saldo" value={formatCurrencyBRL(totals.balance)} color="balance" />
      </div>

      {/* Mês */}
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
        <p className="text-sm text-[var(--muted)]">
          {entries.length} registro{entries.length === 1 ? "" : "s"}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMonth(shiftMonth(month, -1))}
            aria-label="Mês anterior"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--surface-raised)] hover:text-[var(--foreground)]"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <span className="min-w-36 text-center text-sm font-semibold text-[var(--foreground)]">
            {capitalize(monthLabel(month))}
          </span>
          <button
            type="button"
            onClick={() => setMonth(shiftMonth(month, 1))}
            aria-label="Próximo mês"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--surface-raised)] hover:text-[var(--foreground)]"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      {/* Lista com filtros */}
      <section className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
        <EntryFiltersBar filters={filters} segments={segments} />

        <div className="mt-4">
          <HistoryTable
            entries={filters.filtered}
            hideKind
            onEdit={onEdit}
            onDelete={onDelete}
            emptyMessage={
              entries.length === 0
                ? "Nenhum lançamento neste mês. Use “Novo lançamento” para começar."
                : "Nenhum lançamento encontrado com esses filtros."
            }
          />
        </div>
      </section>
    </div>
  );
}
