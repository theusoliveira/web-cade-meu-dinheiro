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

  // Quando o HomeClient (via FAB mobile) pede para abrir o dialog
  React.useEffect(() => {
    if (!addTrigger) return;
    openNew();
  }, [addTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  const reloadGoals = React.useCallback(async () => {
    await run(async () => {
      try {
        setGoals(await fetchGoals());
      } catch (error) {
        console.error(error);
      }
    });
  }, [run]);

  React.useEffect(() => {
    reloadGoals();
  }, [reloadGoals]);

  function openNew() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(goal: Goal) {
    setEditing(goal);
    setDialogOpen(true);
  }

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
    let current = 0;
    let target = 0;
    for (const goal of goals) {
      current += goal.currentValue;
      target += goal.targetValue;
    }
    return { current, target };
  }, [goals]);

  return (
    <div className="grid gap-4">
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold">Metas</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Cadastre metas e acompanhe a evolução do valor atual.
            </p>
          </div>

          <Button onClick={openNew} className="hidden w-full sm:block sm:w-auto">
            + Adicionar meta
          </Button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Total atual (somado)</p>
            <p className="mt-1 text-lg font-semibold">{formatCurrencyBRL(totals.current)}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Total objetivo (somado)</p>
            <p className="mt-1 text-lg font-semibold">{formatCurrencyBRL(totals.target)}</p>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            Listagem de metas
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {goals.length} meta{goals.length === 1 ? "" : "s"}
          </p>
        </div>

        <GoalsTable
          goals={goals}
          onEdit={openEdit}
          onDelete={(goal) => {
            const ok = window.confirm(
              `Excluir esta meta?\n\n${goal.description}\nAtual: ${formatCurrencyBRL(
                goal.currentValue,
              )}\nObjetivo: ${formatCurrencyBRL(goal.targetValue)}`,
            );
            if (ok) deleteGoal(goal.id);
          }}
        />
      </section>

      <AddGoalDialog
        open={dialogOpen}
        initial={editing}
        onClose={() => {
          setDialogOpen(false);
          setEditing(null);
        }}
        onSubmit={upsertGoal}
      />
    </div>
  );
}
