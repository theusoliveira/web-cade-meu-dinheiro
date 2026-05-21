"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/Card";
import { AddGoalDialog, type Goal } from "@/components/features/AddGoalDialog";
import { GoalsTable } from "@/components/features/GoalsTable";
import { formatCurrencyBRL } from "@/lib/finance";
import { useBusy } from "@/components/features/BusyProvider";
import {
  deleteGoal as deleteGoalQuery,
  fetchGoals,
  upsertGoal as upsertGoalQuery,
} from "@/actions/goals";

export function GoalsClient({ addTrigger }: { addTrigger?: number }) {
  const [goals, setGoals] = React.useState<Goal[]>([]);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Goal | null>(null);
  const { run } = useBusy();

  const handledTriggerRef = React.useRef(0);

  React.useEffect(() => {
    if (!addTrigger || addTrigger === handledTriggerRef.current) return;
    handledTriggerRef.current = addTrigger;
    openNew();
  }, [addTrigger]);

  const reloadGoals = React.useCallback(async () => {
    await run(async () => {
      try {
        setGoals(await fetchGoals());
      } catch (error) {
        console.error(error);
      }
    });
  }, [run]);

  React.useEffect(() => { reloadGoals(); }, [reloadGoals]);

  function openNew() { setEditing(null); setDialogOpen(true); }
  function openEdit(goal: Goal) { setEditing(goal); setDialogOpen(true); }

  async function upsertGoal(goal: Goal) {
    await run(async () => {
      try {
        await upsertGoalQuery(goal);
        setGoals(await fetchGoals());
      } catch (error) {
        console.error(error);
        alert("Erro ao salvar meta. Veja o console.");
      }
    });
  }

  async function deleteGoal(id: string) {
    await run(async () => {
      try {
        await deleteGoalQuery(id);
        setGoals(await fetchGoals());
      } catch (error) {
        console.error(error);
        alert("Erro ao excluir meta. Veja o console.");
      }
    });
  }

  const totals = React.useMemo(() => {
    let current = 0; let target = 0;
    for (const goal of goals) { current += goal.currentValue; target += goal.targetValue; }
    return { current, target };
  }, [goals]);

  return (
    <>
      <div className="grid gap-6 animate-fade-in">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-[var(--foreground)]">Metas</h1>
              <p className="mt-1 text-sm text-[var(--muted)]">Cadastre metas e acompanhe a evolução do valor atual.</p>
            </div>
            <Button onClick={openNew} className="hidden sm:inline-flex" size="sm">
              + Adicionar meta
            </Button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <StatCard label="Total atual (somado)" value={formatCurrencyBRL(totals.current)} color="income" />
            <StatCard label="Total objetivo (somado)" value={formatCurrencyBRL(totals.target)} color="investment" />
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-[var(--foreground)]">Listagem de metas</h2>
            <p className="text-xs text-[var(--muted)]">{goals.length} meta{goals.length === 1 ? "" : "s"}</p>
          </div>

          <GoalsTable
            goals={goals}
            onEdit={openEdit}
            onDelete={(goal) => {
              const ok = window.confirm(
                `Excluir esta meta?\n\n${goal.description}\nAtual: ${formatCurrencyBRL(goal.currentValue)}\nObjetivo: ${formatCurrencyBRL(goal.targetValue)}`,
              );
              if (ok) deleteGoal(goal.id);
            }}
          />
        </div>
      </div>

      <AddGoalDialog
        open={dialogOpen}
        initial={editing}
        onClose={() => { setDialogOpen(false); setEditing(null); }}
        onSubmit={upsertGoal}
      />
    </>
  );
}