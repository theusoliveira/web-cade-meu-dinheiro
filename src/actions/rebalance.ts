"use server";

import { getDb } from "@/lib/db/client";
import { requireUserId, vId, vInt, vMoney, vNumber, vObject, vText } from "@/lib/server/guard";

export type RebalanceClassRecord = {
  id: string;
  name: string;
  targetPercent: number;
  currentValue: number;
  sortOrder: number;
};

export async function fetchRebalanceClasses(): Promise<RebalanceClassRecord[]> {
  const userId = await requireUserId();
  const rows = await getDb()(
    `SELECT id, name, target_percent, current_value, sort_order
     FROM public.rebalance_classes WHERE user_id = $1
     ORDER BY sort_order ASC, created_at ASC`,
    [userId],
  );
  return rows.map((row) => ({
    id: row.id as string,
    name: (row.name as string) ?? "",
    targetPercent: Number(row.target_percent ?? 0),
    currentValue: Number(row.current_value ?? 0),
    sortOrder: Number(row.sort_order ?? 0),
  }));
}

export async function upsertRebalanceClass(item: RebalanceClassRecord) {
  const userId = await requireUserId();
  const r = vObject(item, "classe");
  await getDb()(
    `INSERT INTO public.rebalance_classes AS t (id, user_id, name, target_percent, current_value, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name, target_percent = EXCLUDED.target_percent,
       current_value = EXCLUDED.current_value, sort_order = EXCLUDED.sort_order
     WHERE t.user_id = EXCLUDED.user_id`,
    [
      vId(r.id), userId,
      vText(r.name, "nome", { max: 80 }),
      vNumber(r.targetPercent, "percentual", 0, 1000),
      vMoney(r.currentValue, "valor atual"),
      vInt(r.sortOrder, "ordem", 0, 10_000),
    ],
  );
}

export async function deleteRebalanceClass(id: string) {
  const userId = await requireUserId();
  await getDb()(`DELETE FROM public.rebalance_classes WHERE id = $1 AND user_id = $2`, [vId(id), userId]);
}
