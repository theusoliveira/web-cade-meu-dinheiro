"use client";

import * as React from "react";
import { Edit2, Trash2, Inbox } from "lucide-react";
import { formatCurrencyBRL, formatDateBR, kindLabel, kindPrefix, type FinanceEntry } from "@/lib/finance";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Card";

type Props = {
  entries: FinanceEntry[];
  onEdit: (entry: FinanceEntry) => void;
  onDelete: (entry: FinanceEntry) => void;
  hideKind?: boolean;
  emptyMessage?: string;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
};

const KIND_TO_BADGE: Record<FinanceEntry["kind"], "income" | "expense" | "investment"> = {
  income: "income",
  expense: "expense",
  investment: "investment",
};

function IconEdit() {
  return <Edit2 className="h-3.5 w-3.5" aria-hidden />;
}

function IconTrash() {
  return <Trash2 className="h-3.5 w-3.5" aria-hidden />;
}

export function HistoryTable({
  entries,
  onEdit,
  onDelete,
  hideKind = false,
  emptyMessage,
  selectable = false,
  selectedIds = new Set(),
  onSelectionChange,
}: Props) {
  // Apenas entradas que podem ser selecionadas (não automáticas)
  const selectableEntries = React.useMemo(
    () => (selectable ? entries.filter((e) => !e.isAutoCarryover) : []),
    [entries, selectable],
  );

  const allSelected =
    selectableEntries.length > 0 && selectableEntries.every((e) => selectedIds.has(e.id));
  const someSelected = selectableEntries.some((e) => selectedIds.has(e.id));

  function toggleAll() {
    if (!onSelectionChange) return;
    if (allSelected) {
      // Desselecionar todos
      const next = new Set(selectedIds);
      for (const e of selectableEntries) next.delete(e.id);
      onSelectionChange(next);
    } else {
      // Selecionar todos
      const next = new Set(selectedIds);
      for (const e of selectableEntries) next.add(e.id);
      onSelectionChange(next);
    }
  }

  function toggleOne(id: string) {
    if (!onSelectionChange) return;
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelectionChange(next);
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-raised)]/50 p-10 text-center">
        <Inbox className="mx-auto mb-3 h-10 w-10 text-[var(--muted-light)]" aria-hidden strokeWidth={2} />
        <p className="text-sm text-[var(--muted)]">
          {emptyMessage ?? "Nenhum lançamento ainda. Use os botões acima para adicionar."}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
      {/* Mobile: cards */}
      <div className="divide-y divide-[var(--border)] sm:hidden">
        {entries.map((e) => {
          const readOnly = Boolean(e.isAutoCarryover);
          const isSelected = selectedIds.has(e.id);
          return (
            <div
              key={e.id}
              className={`px-4 py-3.5 transition-colors ${isSelected ? "bg-[var(--surface-raised)]" : ""}`}
            >
              <div className="flex items-start gap-3">
                {selectable && !readOnly && (
                  <div className="mt-0.5 shrink-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOne(e.id)}
                      aria-label={`Selecionar lançamento ${e.description ?? e.category}`}
                      className="h-4 w-4 rounded border-[var(--border)] accent-[var(--accent)] cursor-pointer"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {!hideKind && <Badge variant={KIND_TO_BADGE[e.kind]}>{kindLabel(e.kind)}</Badge>}
                        <span className="text-xs font-medium text-[var(--muted)]">{e.category}</span>
                        <span className="text-xs text-[var(--muted-light)]">{formatDateBR(e.date)}</span>
                      </div>
                      {e.description && (
                        <p className="text-sm font-medium break-words">{e.description}</p>
                      )}
                    </div>
                    <p className={`whitespace-nowrap text-sm font-medium shrink-0 ${e.kind === "income" ? "text-emerald-600 dark:text-emerald-400" : e.kind === "expense" ? "text-rose-600 dark:text-rose-400" : "text-sky-600 dark:text-sky-400"}`}>
                      {kindPrefix(e.kind)} {formatCurrencyBRL(e.value)}
                    </p>
                  </div>

                  <div className="mt-2.5 flex items-center justify-end gap-1.5">
                    {readOnly ? (
                      <Badge variant="muted">Automático</Badge>
                    ) : (
                      <>
                        <Button type="button" variant="ghost" size="xs" onClick={() => onEdit(e)} title="Editar">
                          <IconEdit />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={() => onDelete(e)}
                          title="Excluir"
                          className="text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                        >
                          <IconTrash />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full table-fixed text-left text-sm">
          <colgroup>
            {selectable && <col className="w-[44px]" />}
            <col className="w-[110px]" />
            {!hideKind && <col className="w-[110px]" />}
            <col className="w-[160px]" />
            <col className="w-[160px]" />
            <col className="w-[140px]" />
            <col className="w-[130px]" />
          </colgroup>
          <thead className="bg-[var(--surface-raised)] border-b border-[var(--border)]">
            <tr>
              {selectable && (
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected && !allSelected;
                    }}
                    onChange={toggleAll}
                    disabled={selectableEntries.length === 0}
                    aria-label="Selecionar todos"
                    className="h-4 w-4 rounded border-[var(--border)] accent-[var(--accent)] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                </th>
              )}
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Data</th>
              {!hideKind && <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Tipo</th>}
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Categoria</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Descrição</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Valor</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {entries.map((e) => {
              const readOnly = Boolean(e.isAutoCarryover);
              const isSelected = selectedIds.has(e.id);
              return (
                <tr
                  key={e.id}
                  className={`transition-colors ${isSelected ? "bg-[var(--accent)]/5" : "hover:bg-[var(--surface-raised)]"}`}
                >
                  {selectable && (
                    <td className="px-4 py-3">
                      {!readOnly ? (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleOne(e.id)}
                          aria-label={`Selecionar ${e.description ?? e.category}`}
                          className="h-4 w-4 rounded border-[var(--border)] accent-[var(--accent)] cursor-pointer"
                        />
                      ) : null}
                    </td>
                  )}
                  <td className="whitespace-nowrap px-4 py-3 text-[var(--foreground)]">
                    {formatDateBR(e.date)}
                  </td>
                  {!hideKind && (
                    <td className="px-4 py-3">
                      <Badge variant={KIND_TO_BADGE[e.kind]}>{kindLabel(e.kind)}</Badge>
                    </td>
                  )}
                  <td className="px-4 py-3 text-[var(--foreground)] truncate">{e.category}</td>
                  <td className="px-4 py-3 text-[var(--foreground)] truncate">{e.description}</td>
                  <td className={`whitespace-nowrap px-4 py-3 text-right ${e.kind === "income" ? "text-emerald-600 dark:text-emerald-400" : e.kind === "expense" ? "text-rose-600 dark:text-rose-400" : "text-sky-600 dark:text-sky-400"}`}>
                    {kindPrefix(e.kind)} {formatCurrencyBRL(e.value)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {readOnly ? (
                      <Badge variant="muted">Automático</Badge>
                    ) : (
                      <div className="inline-flex items-center gap-1">
                        <Button type="button" variant="ghost" size="xs" onClick={() => onEdit(e)} title="Editar"><IconEdit /></Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={() => onDelete(e)}
                          title="Excluir"
                          className="text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                        >
                          <IconTrash />
                        </Button>
                      </div>
                    )}
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