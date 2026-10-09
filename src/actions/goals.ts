"use server";

import { getDb } from "@/lib/db/client";
import { requireUserId, vId, vMoney, vObject, vText, vYm } from "@/lib/server/guard";

export type GoalRecord = {
  id: string;
  description: string;
  currentValue: number;
  targetValue: number;
  forecast: string;
  createdAt: number;
};

export async function fetchGoals(): Promise<GoalRecord[]> {
  const userId = await requireUserId();
  const rows = await getDb()(
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
  const userId = await requireUserId();
  const g = vObject(goal, "meta");
  await getDb()(
    `INSERT INTO public.goals AS t (id, user_id, description, current_value, target_value, forecast)
     VALUES ($1, $2, $3, $4, $5, $6::date)
     ON CONFLICT (id) DO UPDATE SET
       description = EXCLUDED.description, current_value = EXCLUDED.current_value,
       target_value = EXCLUDED.target_value, forecast = EXCLUDED.forecast
     WHERE t.user_id = EXCLUDED.user_id`,
    [
      vId(g.id), userId,
      vText(g.description, "descrição", { max: 200, required: true }),
      vMoney(g.currentValue, "valor atual"),
      vMoney(g.targetValue, "valor alvo"),
      `${vYm(g.forecast, "previsão")}-01`,
    ],
  );
}

export async function deleteGoal(id: string) {
  const userId = await requireUserId();
  await getDb()(`DELETE FROM public.goals WHERE id = $1 AND user_id = $2`, [vId(id), userId]);
}
