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
  const base =
    "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium";
  const styles: Record<FinanceEntry["kind"], string> = {
    income:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200",
    expense:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200",
    investment:
      "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-200",
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
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {emptyMessage ??
            "Nenhum lançamento ainda. Use os botões acima para adicionar receita, despesa ou investimento."}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      {/* Mobile: cards */}
      <div className="sm:hidden divide-y divide-zinc-100 dark:divide-zinc-900">
        {entries.map((e) => {
          const readOnly = Boolean(e.isAutoCarryover);

          return (
            <div key={e.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {formatDateBR(e.date)}
                  </p>

                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {hideKind ? null : <KindBadge kind={e.kind} />}
                    <span className="text-xs text-zinc-600 dark:text-zinc-300 break-words">
                      {e.category}
                    </span>
                  </div>
                </div>

                <p className="whitespace-nowrap text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {kindPrefix(e.kind)} {formatCurrencyBRL(e.value)}
                </p>
              </div>

              {e.description ? (
                <p className="mt-2 text-sm text-zinc-800 dark:text-zinc-200 break-words">
                  {e.description}
                </p>
              ) : null}

              <div className="mt-3 flex items-center justify-end gap-2">
                {readOnly ? (
                  <span className="rounded-full border border-zinc-200 px-2 py-1 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                    Automático
                  </span>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-9 px-3"
                      onClick={() => onEdit(e)}
                    >
                      Editar
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(e)}
                      className="h-9 px-3 text-rose-700 hover:bg-rose-50 dark:text-rose-200 dark:hover:bg-rose-950/30"
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
          <thead className="bg-zinc-50 text-xs text-zinc-600 dark:bg-zinc-900/50 dark:text-zinc-300">
            <tr>
              <th className="px-4 py-3 font-medium">Data</th>
              {hideKind ? null : (
                <th className="px-4 py-3 font-medium">Tipo</th>
              )}
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Descrição</th>
              <th className="px-4 py-3 text-right font-medium">Valor</th>
              <th className="px-4 py-3 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
            {entries.map((e) => {
              const readOnly = Boolean(e.isAutoCarryover);

              return (
                <tr
                  key={e.id}
                  className="hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-700 dark:text-zinc-200">
                    {formatDateBR(e.date)}
                  </td>

                  {hideKind ? null : (
                    <td className="px-4 py-3">
                      <KindBadge kind={e.kind} />
                    </td>
                  )}

                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-200">
                    {e.category}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-200">
                    {e.description}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-zinc-900 dark:text-zinc-50">
                    {kindPrefix(e.kind)} {formatCurrencyBRL(e.value)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {readOnly ? (
                      <span className="rounded-full border border-zinc-200 px-2 py-1 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                        Automático
                      </span>
                    ) : (
                      <div className="inline-flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(e)}
                        >
                          Editar
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(e)}
                          className="text-rose-700 hover:bg-rose-50 dark:text-rose-200 dark:hover:bg-rose-950/30"
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
