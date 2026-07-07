"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { useBusy } from "@/components/features/BusyProvider";
import { formatBRLFromCents, newId, parseBRLCents } from "@/lib/finance";
import {
  deleteRebalanceClass,
  fetchRebalanceClasses,
  upsertRebalanceClass,
  type RebalanceClassRecord,
} from "@/actions/rebalance";

function IconTrash() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden>
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function RebalanceClient() {
  const [classes, setClasses] = React.useState<RebalanceClassRecord[]>([]);
  const { run } = useBusy();

  const reload = React.useCallback(async () => {
    await run(async () => {
      try {
        setClasses(await fetchRebalanceClasses());
      } catch (error) {
        console.error(error);
      }
    });
  }, [run]);

  React.useEffect(() => { reload(); }, [reload]);

  const totalCurrent = React.useMemo(
    () => classes.reduce((sum, c) => sum + c.currentValue, 0),
    [classes],
  );
  const totalTargetPercent = React.useMemo(
    () => classes.reduce((sum, c) => sum + c.targetPercent, 0),
    [classes],
  );

  async function addClass() {
    const item: RebalanceClassRecord = {
      id: newId(),
      name: "",
      targetPercent: 0,
      currentValue: 0,
      sortOrder: classes.length,
    };
    setClasses((prev) => [...prev, item]);
  }

  async function saveClass(item: RebalanceClassRecord) {
    await run(async () => {
      try {
        await upsertRebalanceClass(item);
      } catch (error) {
        console.error(error);
        alert("Erro ao salvar classe. Veja o console.");
      }
    });
  }

  function updateClass(id: string, patch: Partial<RebalanceClassRecord>) {
    setClasses((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function commitClass(id: string) {
    const item = classes.find((c) => c.id === id);
    if (!item || !item.name.trim()) return;
    saveClass(item);
  }

  async function removeClass(item: RebalanceClassRecord) {
    const ok = window.confirm(`Excluir esta classe?\n\n${item.name || "(sem nome)"}`);
    if (!ok) return;
    await run(async () => {
      try {
        setClasses((prev) => prev.filter((c) => c.id !== item.id));
        if (item.name.trim()) await deleteRebalanceClass(item.id);
      } catch (error) {
        console.error(error);
        alert("Erro ao excluir classe. Veja o console.");
      }
    });
  }

  return (
    <div className="grid gap-6 animate-fade-in">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-[var(--foreground)]">Rebalanceador</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Cadastre classes de ativos, defina a % ideal e acompanhe onde comprar para rebalancear a carteira.
            </p>
          </div>
          <Button onClick={addClass} size="sm">+ Adicionar classe</Button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Total investido</p>
            <p className="mt-1 text-lg font-bold text-[var(--foreground)]">{formatBRLFromCents(Math.round(totalCurrent * 100))}</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Soma % ideal</p>
            <p className={`mt-1 text-lg font-bold ${Math.round(totalTargetPercent) !== 100 ? "text-amber-500" : "text-[var(--foreground)]"}`}>
              {totalTargetPercent.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      <RebalanceTable
        classes={classes}
        totalCurrent={totalCurrent}
        onUpdate={updateClass}
        onCommit={commitClass}
        onRemove={removeClass}
      />
    </div>
  );
}

function RebalanceTable({
  classes,
  totalCurrent,
  onUpdate,
  onCommit,
  onRemove,
}: {
  classes: RebalanceClassRecord[];
  totalCurrent: number;
  onUpdate: (id: string, patch: Partial<RebalanceClassRecord>) => void;
  onCommit: (id: string) => void;
  onRemove: (item: RebalanceClassRecord) => void;
}) {
  const inputClass =
    "w-full h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 text-sm " +
    "text-[var(--foreground)] placeholder:text-[var(--muted-light)] outline-none " +
    "focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-all";

  if (!classes.length) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-raised)]/50 p-10 text-center">
        <p className="text-sm text-[var(--muted)]">Nenhuma classe cadastrada ainda.</p>
        <p className="mt-1 text-xs text-[var(--muted-light)]">Use o botão acima para criar sua primeira classe.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-sm">
          <thead className="bg-[var(--surface-raised)] border-b border-[var(--border)]">
            <tr>
              {["Classe", "% ideal", "R$ atual", "% atual", "Viés", ""].map((col) => (
                <th key={col} className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]${col === "" ? " text-right" : ""}`}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {classes.map((c) => {
              const currentPercent = totalCurrent > 0 ? (c.currentValue / totalCurrent) * 100 : 0;
              const isBuy = currentPercent <= c.targetPercent;
              const valueCents = Math.round(c.currentValue * 100);
              return (
                <tr key={c.id} className="hover:bg-[var(--surface-raised)] transition-colors">
                  <td className="px-4 py-2.5">
                    <input
                      value={c.name}
                      onChange={(e) => onUpdate(c.id, { name: e.target.value })}
                      onBlur={() => onCommit(c.id)}
                      placeholder="Ex.: Renda Fixa"
                      className={inputClass}
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="0.1"
                        value={c.targetPercent === 0 ? "" : c.targetPercent}
                        onChange={(e) => onUpdate(c.id, { targetPercent: e.target.value === "" ? 0 : Number(e.target.value) })}
                        onBlur={() => onCommit(c.id)}
                        placeholder="0"
                        className={`${inputClass} pr-7`}
                      />
                      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)]">%</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={valueCents === 0 ? "" : formatBRLFromCents(valueCents)}
                      onChange={(e) => onUpdate(c.id, { currentValue: parseBRLCents(e.target.value) / 100 })}
                      onBlur={() => onCommit(c.id)}
                      placeholder="R$ 0,00"
                      className={inputClass}
                    />
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-[var(--foreground)]">
                    {currentPercent.toFixed(1)}%
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                        isBuy
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300"
                          : "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-300"
                      }`}
                    >
                      {isBuy ? "Comprar" : "Aguardar"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => onRemove(c)}
                      title="Excluir"
                      className="text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                    >
                      <IconTrash />
                    </Button>
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
