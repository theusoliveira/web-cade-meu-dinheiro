"use client";

import * as React from "react";
import { Button } from "./Button";
import { AddGoalDialog, type Goal } from "./AddGoalDialog";
import { GoalsTable } from "./GoalsTable";
import { formatCurrencyBRL } from "../lib/finance";
import { useBusy } from "./BusyProvider";
import {
  deleteGoal as deleteGoalQuery,
  fetchGoals,
  upsertGoal as upsertGoalQuery,
} from "../lib/supabase/queries/goals";

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
      try { setGoals(await fetchGoals()); }
      catch (error) { console.error(error); }
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
        alert("Erro ao salvar meta.");
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
        alert("Erro ao excluir meta.");
      }
    });
  }

  const totals = React.useMemo(() => {
    let current = 0, target = 0;
    for (const goal of goals) { current += goal.currentValue; target += goal.targetValue; }
    return { current, target };
  }, [goals]);

  const overallProgress = totals.target > 0 ? Math.round((totals.current / totals.target) * 100) : 0;

  return (
    <div className="grid gap-5">
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Metas</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Cadastre metas e acompanhe a evolução.
            </p>
          </div>
          <Button onClick={openNew} className="hidden w-full sm:block sm:w-auto gap-1.5">
            + Nova meta
          </Button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900/30 dark:bg-green-950/20">
            <p className="text-xs font-semibold uppercase tracking-wider text-green-600 dark:text-green-400">Total atual</p>
            <p className="mt-1.5 text-xl font-bold text-green-700 dark:text-green-300">{formatCurrencyBRL(totals.current)}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Total objetivo</p>
            <p className="mt-1.5 text-xl font-bold text-zinc-900 dark:text-zinc-50">{formatCurrencyBRL(totals.target)}</p>
          </div>
        </div>

        {totals.target > 0 && (
          <div className="mt-4">
            <div className="mb-1.5 flex justify-between text-xs">
              <span className="font-semibold text-zinc-600 dark:text-zinc-400">Progresso geral</span>
              <span className="font-bold text-green-600 dark:text-green-400">{overallProgress}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
                style={{ width: `${Math.min(100, overallProgress)}%` }}
              />
            </div>
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Listagem de metas</h2>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            {goals.length} meta{goals.length === 1 ? "" : "s"}
          </p>
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
      </section>

      <AddGoalDialog
        open={dialogOpen}
        initial={editing}
        onClose={() => { setDialogOpen(false); setEditing(null); }}
        onSubmit={upsertGoal}
      />
    </div>
  );
}
