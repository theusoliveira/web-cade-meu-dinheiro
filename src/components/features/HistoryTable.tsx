import * as React from "react";
import { formatCurrencyBRL, formatDateBR, kindLabel, kindPrefix, type FinanceEntry } from "@/lib/finance";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Card";

type Props = {
  entries: FinanceEntry[];
  onEdit: (entry: FinanceEntry) => void;
  onDelete: (entry: FinanceEntry) => void;
  hideKind?: boolean;
  emptyMessage?: string;
};

const KIND_TO_BADGE: Record<FinanceEntry["kind"], "income" | "expense" | "investment"> = {
  income: "income",
  expense: "expense",
  investment: "investment",
};

export function HistoryTable({ entries, onEdit, onDelete, hideKind = false, emptyMessage }: Props) {
  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-raised)]/50 p-10 text-center">
        <svg viewBox="0 0 48 48" fill="none" className="mx-auto mb-3 h-10 w-10 text-[var(--muted-light)]" aria-hidden>
          <rect x="8" y="12" width="32" height="24" rx="4" stroke="currentColor" strokeWidth="2" />
          <path d="M8 20h32M16 28h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
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
          return (
            <div key={e.id} className="px-4 py-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    {!hideKind && <Badge variant={KIND_TO_BADGE[e.kind]}>{kindLabel(e.kind)}</Badge>}
                    <span className="text-xs font-medium text-[var(--muted)]">{e.category}</span>
                    <span className="text-xs text-[var(--muted-light)]">{formatDateBR(e.date)}</span>
                  </div>
                  {e.description && (
                    <p className="text-sm font-medium text-[var(--muted)] break-words">{e.description}</p>
                  )}
                </div>
                <p className={`whitespace-nowrap text-sm font-bold  shrink-0 ${e.kind === "income" ? "text-emerald-600 dark:text-emerald-400" : e.kind === "expense" ? "text-rose-600 dark:text-rose-400" : "text-sky-600 dark:text-sky-400"}`}>
                  {kindPrefix(e.kind)} {formatCurrencyBRL(e.value)}
                </p>
              </div>

              <div className="mt-2.5 flex items-center justify-end gap-1.5">
                {readOnly ? (
                  <Badge variant="muted">Automático</Badge>
                ) : (
                  <>
                    <Button type="button" variant="ghost" size="xs" onClick={() => onEdit(e)}>
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => onDelete(e)}
                      className="text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                    >
                      Excluir
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--surface-raised)] border-b border-[var(--border)]">
            <tr>
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
              return (
                <tr key={e.id} className="hover:bg-[var(--surface-raised)] transition-colors">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-[var(--foreground)]">
                    {formatDateBR(e.date)}
                  </td>
                  {!hideKind && (
                    <td className="px-4 py-3">
                      <Badge variant={KIND_TO_BADGE[e.kind]}>{kindLabel(e.kind)}</Badge>
                    </td>
                  )}
                  <td className="px-4 py-3 text-sm text-[var(--foreground)]">{e.category}</td>
                  <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)] max-w-xs truncate">{e.description}</td>
                  {/* <td className={`whitespace-nowrap px-4 py-3 text-right text-sm font-bold  ${e.kind === "income" ? "text-emerald-600 dark:text-emerald-400" : e.kind === "expense" ? "text-rose-600 dark:text-rose-400" : "text-sky-600 dark:text-sky-400"}`}> */}
                  <td className={`whitespace-nowrap px-4 py-3 text-right text-sm font-medium  ${e.kind === "income" ? "text-emerald-600 dark:text-emerald-400" : e.kind === "expense" ? "text-rose-600 dark:text-rose-400" : "text-sky-600 dark:text-sky-400"}`}>
                    {kindPrefix(e.kind)} {formatCurrencyBRL(e.value)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {readOnly ? (
                      <Badge variant="muted">Automático</Badge>
                    ) : (
                      <div className="inline-flex items-center gap-1">
                        <Button type="button" variant="ghost" size="xs" onClick={() => onEdit(e)}>Editar</Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={() => onDelete(e)}
                          className="text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                        >
                          Excluir
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
