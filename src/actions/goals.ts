"use server";

import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db/client";

export type GoalRecord = {
  id: string;
  description: string;
  currentValue: number;
  targetValue: number;
  forecast: string;
  createdAt: number;
};

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado");
  return session.user.id;
}

export async function fetchGoals(): Promise<GoalRecord[]> {
  const sql = getDb();
  const userId = await getUserId();
  const rows = await sql(
    `SELECT id, description, current_value, target_value, forecast::text, created_at
     FROM public.goals WHERE user_id = $1
     ORDER BY forecast ASC, created_at DESC`,
    [userId],
  );
  return rows.map((row) => ({
    id: row.id as string,
    description: (row.description as string) ?? "",
    currentValue: Number(row.current_value ?? 0),
    targetValue: Number(row.target_value ?? 0),
    forecast: ((row.forecast as string) ?? "").slice(0, 7),
    createdAt: new Date(row.created_at as string).getTime(),
  }));
}

export async function upsertGoal(goal: GoalRecord) {
  const sql = getDb();
  const userId = await getUserId();
  await sql(
    `INSERT INTO public.goals (id, user_id, description, current_value, target_value, forecast)
     VALUES ($1, $2, $3, $4, $5, $6::date)
     ON CONFLICT (id) DO UPDATE SET
       description = EXCLUDED.description, current_value = EXCLUDED.current_value,
       target_value = EXCLUDED.target_value, forecast = EXCLUDED.forecast`,
    [goal.id, userId, goal.description, goal.currentValue, goal.targetValue, `${goal.forecast}-01`],
  );
}

export async function deleteGoal(id: string) {
  const sql = getDb();
  const userId = await getUserId();
  await sql(`DELETE FROM public.goals WHERE id = $1 AND user_id = $2`, [id, userId]);
}