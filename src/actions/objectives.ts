"use server";

import { getDb } from "@/lib/db/client";
import { requireUserId, vId, vMoney, vNumber, vObject, vText } from "@/lib/server/guard";

export type ObjectiveRecord = {
  id: string;
  name: string;
  initialValue: number;
  targetValue: number;
  monthlyContribution: number;
  /** Taxa mensal em % (ex.: 0.8 = 0,8% a.m.) */
  monthlyRate: number;
  createdAt: number;
};

export async function fetchObjectives(): Promise<ObjectiveRecord[]> {
  const userId = await requireUserId();
  const rows = await getDb()(
    `SELECT id, name, initial_value, target_value, monthly_contribution, monthly_rate, created_at
     FROM public.objectives WHERE user_id = $1
     ORDER BY created_at ASC`,
    [userId],
  );
  return rows.map((row) => ({
    id: row.id as string,
    name: (row.name as string) ?? "",
    initialValue: Number(row.initial_value ?? 0),
    targetValue: Number(row.target_value ?? 0),
    monthlyContribution: Number(row.monthly_contribution ?? 0),
    monthlyRate: Number(row.monthly_rate ?? 0),
    createdAt: new Date(row.created_at as string).getTime(),
  }));
}

export async function upsertObjective(item: ObjectiveRecord) {
  const userId = await requireUserId();
  const o = vObject(item, "objetivo");
  await getDb()(
    `INSERT INTO public.objectives AS t
       (id, user_id, name, initial_value, target_value, monthly_contribution, monthly_rate)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name, initial_value = EXCLUDED.initial_value,
       target_value = EXCLUDED.target_value, monthly_contribution = EXCLUDED.monthly_contribution,
       monthly_rate = EXCLUDED.monthly_rate
     WHERE t.user_id = EXCLUDED.user_id`,
    [
      vId(o.id), userId,
      vText(o.name, "nome", { max: 80, required: true }),
      vMoney(o.initialValue, "valor atual"),
      vMoney(o.targetValue, "valor alvo"),
      vMoney(o.monthlyContribution, "aporte mensal"),
      vNumber(o.monthlyRate, "taxa", 0, 100),
    ],
  );
}

export async function deleteObjective(id: string) {
  const userId = await requireUserId();
  await getDb()(`DELETE FROM public.objectives WHERE id = $1 AND user_id = $2`, [vId(id), userId]);
}
