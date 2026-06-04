"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/Card";
import { HistoryTable } from "@/components/features/HistoryTable";
import { formatCurrencyBRL, groupByCategory, type EntryKind, type FinanceEntry } from "@/lib/finance";

const DonutChartCard = dynamic(
  () => import("@/components/features/DonutChartCard").then((m) => m.DonutChartCard),
  { loading: () => <div className="skeleton h-48 rounded-2xl" /> },
);

type Props = {
  entries: FinanceEntry[];
  openDialog: (kind: Extract<EntryKind, "income" | "expense">) => void;
  onEdit: (entry: FinanceEntry) => void;
  onDelete: (entry: FinanceEntry) => void;
  onDeleteAll: () => void;
  onDeleteSelected?: (ids: string[]) => void;
};

export function CardControlClient({ entries, openDialog, onEdit, onDelete, onDeleteAll, onDeleteSelected }: Props) {
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  const totals = React.useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const entry of entries) {
      if (entry.kind === "income") income += entry.value;
      if (entry.kind === "expense") expense += entry.value;
    }
    return { income, expense, balance: income - expense };
  }, [entries]);

  const incomeByCategory = React.useMemo(() => groupByCategory(entries, "income"), [entries]);
  const expenseByCategory = React.useMemo(() => groupByCategory(entries, "expense"), [entries]);

  // Limpa seleção quando entries muda (após deleção, por exemplo)
  React.useEffect(() => {
    setSelectedIds((prev) => {
      const entryIds = new Set(entries.map((e) => e.id));
      const next = new Set([...prev].filter((id) => entryIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [entries]);

  function confirmDeleteAll() {
    const ok = window.confirm(
      "Excluir TODOS os lançamentos do Controle de gastos?\n\nEssa ação não pode ser desfeita.",
    );
    if (ok) onDeleteAll();
  }

  function confirmDeleteSelected() {
    const count = selectedIds.size;
    const ok = window.confirm(
      `Excluir ${count} lançamento${count === 1 ? "" : "s"} selecionado${count === 1 ? "" : "s"}?\n\nEssa ação não pode ser desfeita.`,
    );
    if (ok) {
      onDeleteSelected?.([...selectedIds]);
      setSelectedIds(new Set());
    }
  }

  return (
    <div className="grid gap-6 animate-fade-in">
      {/* Header */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-[var(--foreground)]">Controle de gastos</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Todos os lançamentos · {entries.length} registro{entries.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="hidden gap-2 sm:flex">
            <Button
              type="button"
              variant="success"
              size="sm"
              onClick={() => openDialog("income")}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              + Receita
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => openDialog("expense")}
            >
              − Despesa
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 grid-cols-1 sm:grid-cols-3">
          <StatCard label="Receitas" value={formatCurrencyBRL(totals.income)} color="income" />
          <StatCard label="Despesas" value={formatCurrencyBRL(totals.expense)} color="expense" />
          <StatCard
            label="Saldo"
            value={formatCurrencyBRL(totals.balance)}
            color="balance"
          />
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-3">
        <DonutChartCard
          title="Onde estou gastando mais"
          data={expenseByCategory}
          colors={["#f43f5e", "#f59e0b", "#8b5cf6", "#ef4444", "#ec4899"]}
          centerLabel="Despesas"
        />
      </div>

      {/* History */}
      <div>
        <div className="mb-3 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-[var(--foreground)]">Histórico</h2>
            {selectedIds.size > 0 && (
              <span className="text-xs text-[var(--muted)] bg-[var(--surface-raised)] border border-[var(--border)] rounded-full px-2.5 py-0.5">
                {selectedIds.size} selecionado{selectedIds.size === 1 ? "" : "s"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && onDeleteSelected && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={confirmDeleteSelected}
                className="text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
              >
                Excluir selecionados ({selectedIds.size})
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={confirmDeleteAll}
              disabled={entries.length === 0}
              className="text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
            >
              Excluir todos
            </Button>
          </div>
        </div>
        <HistoryTable
          entries={entries}
          onEdit={onEdit}
          onDelete={onDelete}
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      </div>
    </div>
  );
}