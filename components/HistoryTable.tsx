import * as React from "react";
import {
  formatCurrencyBRL,
  formatDateBR,
  kindLabel,
  kindPrefix,
  type FinanceEntry,
} from "../lib/finance";
import { Button } from "./Button";

type Props = {
  entries: FinanceEntry[];
  onEdit: (entry: FinanceEntry) => void;
  onDelete: (entry: FinanceEntry) => void;
  hideKind?: boolean;
  emptyMessage?: string;
};

function KindBadge({ kind }: { kind: FinanceEntry["kind"] }) {
  const base = "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold";
  const styles: Record<FinanceEntry["kind"], string> = {
    income:
      "border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-300",
    expense:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300",
    investment:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300",
  };
  return <span className={`${base} ${styles[kind]}`}>{kindLabel(kind)}</span>;
}

export function HistoryTable({
  entries,
  onEdit,
  onDelete,
  hideKind = false,
  emptyMessage,
}: Props) {
  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-900/30">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {emptyMessage ??
            "Nenhum lançamento ainda. Use os botões acima para adicionar receita, despesa ou investimento."}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      {/* Mobile: cards */}
      <div className="sm:hidden divide-y divide-zinc-100 dark:divide-zinc-800">
        {entries.map((e) => {
          const readOnly = Boolean(e.isAutoCarryover);
          return (
            <div key={e.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
                    {formatDateBR(e.date)}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {hideKind ? null : <KindBadge kind={e.kind} />}
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 break-words">
                      {e.category}
                    </span>
                  </div>
                </div>
                <p className="whitespace-nowrap text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  {kindPrefix(e.kind)} {formatCurrencyBRL(e.value)}
                </p>
              </div>

              {e.description ? (
                <p className="mt-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-200 break-words">
                  {e.description}
                </p>
              ) : null}

              <div className="mt-3 flex items-center justify-end gap-2">
                {readOnly ? (
                  <span className="rounded-full border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
                    Automático
                  </span>
                ) : (
                  <>
                    <Button type="button" variant="secondary" size="sm" onClick={() => onEdit(e)}>
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
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
          <thead className="border-b border-zinc-100 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/30">
            <tr className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              <th className="px-4 py-3 font-semibold">Data</th>
              {hideKind ? null : <th className="px-4 py-3 font-semibold">Tipo</th>}
              <th className="px-4 py-3 font-semibold">Categoria</th>
              <th className="px-4 py-3 font-semibold">Descrição</th>
              <th className="px-4 py-3 text-right font-semibold">Valor</th>
              <th className="px-4 py-3 text-right font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/40">
            {entries.map((e) => {
              const readOnly = Boolean(e.isAutoCarryover);
              return (
                <tr key={e.id} className="transition hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-zinc-600 dark:text-zinc-300">
                    {formatDateBR(e.date)}
                  </td>
                  {hideKind ? null : (
                    <td className="px-4 py-3">
                      <KindBadge kind={e.kind} />
                    </td>
                  )}
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{e.category}</td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-200">{e.description}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-zinc-900 dark:text-zinc-50">
                    {kindPrefix(e.kind)} {formatCurrencyBRL(e.value)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {readOnly ? (
                      <span className="rounded-full border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
                        Automático
                      </span>
                    ) : (
                      <div className="inline-flex items-center gap-1">
                        <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(e)}>
                          Editar
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
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
