"use client";

import * as React from "react";
import { Button } from "./Button";
import { AddGoalDialog, type Goal } from "./AddGoalDialog";
import { GoalsTable } from "./GoalsTable";
import { formatCurrencyBRL } from "../lib/finance";
import { supabase } from "../lib/supabaseClient";
import { useBusy } from "./BusyProvider";

function forecastToDate(ym: string): string {
  // YYYY-MM -> YYYY-MM-01
  return `${ym}-01`;
}

function dateToForecast(dateStr: string): string {
  // YYYY-MM-DD -> YYYY-MM
  return (dateStr ?? "").slice(0, 7);
}

export function GoalsClient() {
  const [goals, setGoals] = React.useState<Goal[]>([]);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Goal | null>(null);

  const busy = useBusy();

  async function fetchGoals() {
    await busy.run(async () => {
      const { data, error } = await supabase
        .from("goals")
        .select("id, description, current_value, target_value, forecast, created_at")
        .order("forecast", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        return;
      }

      const mapped: Goal[] = (data ?? []).map((r: any) => ({
        id: r.id,
        description: r.description ?? "",
        currentValue: Number(r.current_value ?? 0),
        targetValue: Number(r.target_value ?? 0),
        forecast: dateToForecast(r.forecast as string),
        createdAt: new Date(r.created_at as string).getTime(),
      }));

      setGoals(mapped);
    });
  }

  React.useEffect(() => {
    fetchGoals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openNew() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(goal: Goal) {
    setEditing(goal);
    setDialogOpen(true);
  }

  async function upsertGoal(goal: Goal) {
    await busy.run(async () => {
      const exists = goals.some((g) => g.id === goal.id);

      const payload = {
        id: goal.id,
        description: goal.description,
        current_value: goal.currentValue,
        target_value: goal.targetValue,
        forecast: forecastToDate(goal.forecast),
      };

      const q = exists
        ? supabase.from("goals").update(payload).eq("id", goal.id)
        : supabase.from("goals").insert(payload);

      const { error } = await q;
      if (error) {
        console.error(error);
        alert("Erro ao salvar meta. Veja o console.");
        return;
      }

      await fetchGoals();
    });
  }

  async function deleteGoal(id: string) {
    await busy.run(async () => {
      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) {
        console.error(error);
        alert("Erro ao excluir meta. Veja o console.");
        return;
      }
      await fetchGoals();
    });
  }

  const totals = React.useMemo(() => {
    let current = 0;
    let target = 0;
    for (const g of goals) {
      current += g.currentValue;
      target += g.targetValue;
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

          <Button onClick={openNew} className="w-full sm:w-auto">
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
                goal.currentValue
              )}\nObjetivo: ${formatCurrencyBRL(goal.targetValue)}`
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
