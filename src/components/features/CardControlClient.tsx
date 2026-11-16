"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/Card";
import { HistoryTable } from "@/components/features/HistoryTable";
import { EntryFiltersBar, useEntryFilters, type KindSegment } from "@/components/features/EntryFilters";
import { formatCurrencyBRL, groupByCategory, type EntryKind, type FinanceEntry } from "@/lib/finance";
import { PageHeader } from "@/components/ui/PageHeader";
import { Plus } from "lucide-react";

const BudgetDonutCard = dynamic(
  () => import("@/components/features/DonutChartCard").then((m) => m.BudgetDonutCard),
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
  const filters = useEntryFilters(entries);
  const segments: KindSegment[] = [
    { key: "all", label: "Todos" },
    { key: "expense", label: "Despesas" },
    { key: "income", label: "Receitas" },
  ];

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
    <div className="grid min-w-0 grid-cols-1 gap-5 animate-fade-in sm:gap-6">
      <PageHeader
        eyebrow="Cartão de crédito"
        title="Controle de gastos"
        actionsDesktopOnly
        description={`Todos os lançamentos · ${entries.length} registro${entries.length === 1 ? "" : "s"}`}
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Receitas" value={formatCurrencyBRL(totals.income)} color="income" />
        <StatCard label="Despesas" value={formatCurrencyBRL(totals.expense)} color="expense" />
        <StatCard
          label="Saldo"
          value={formatCurrencyBRL(totals.balance)}
          color="balance"
          className="col-span-2 sm:col-span-1"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-3">
        <BudgetDonutCard
          title="Controle do saldo"
          data={expenseByCategory}
          income={totals.income}
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
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
          <EntryFiltersBar filters={filters} segments={segments} />
          <div className="mt-4">
            <HistoryTable
              entries={filters.filtered}
              hideKind
              emptyMessage={
                entries.length === 0
                  ? "Nenhum lançamento ainda. Use os botões acima para adicionar."
                  : "Nenhum lançamento encontrado com esses filtros."
              }
              onEdit={onEdit}
              onDelete={onDelete}
              selectable
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
            />
          </div>
        </section>
      </div>
    </div>
  );
}