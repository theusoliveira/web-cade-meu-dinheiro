"use server";

import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db/client";

export type RebalanceClassRecord = {
  id: string;
  name: string;
  targetPercent: number;
  currentValue: number;
  sortOrder: number;
};

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado");
  return session.user.id;
}

export async function fetchRebalanceClasses(): Promise<RebalanceClassRecord[]> {
  const sql = getDb();
  const userId = await getUserId();
  const rows = await sql(
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
  const sql = getDb();
  const userId = await getUserId();
  await sql(
    `INSERT INTO public.rebalance_classes (id, user_id, name, target_percent, current_value, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name, target_percent = EXCLUDED.target_percent,
       current_value = EXCLUDED.current_value, sort_order = EXCLUDED.sort_order`,
    [item.id, userId, item.name, item.targetPercent, item.currentValue, item.sortOrder],
  );
}

export async function deleteRebalanceClass(id: string) {
  const sql = getDb();
  const userId = await getUserId();
  await sql(`DELETE FROM public.rebalance_classes WHERE id = $1 AND user_id = $2`, [id, userId]);
}
