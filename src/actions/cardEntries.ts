"use server";

import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { mapEntryRows } from "@/lib/db/mappers";
import type { FinanceEntry } from "@/lib/finance";

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado");
  return session.user.id;
}

export async function fetchCardEntries(): Promise<FinanceEntry[]> {
  const sql = getDb();
  const userId = await getUserId();
  const rows = await sql(
    `SELECT id, kind, date::text, category, description, value::float8, created_at
     FROM public.card_entries WHERE user_id = $1
     ORDER BY date DESC, created_at DESC`,
    [userId],
  );
  return mapEntryRows(rows as never[]);
}

export async function upsertCardEntry(entry: FinanceEntry) {
  if (entry.kind === "investment") throw new Error("No Controle de gastos, só é permitido Receita ou Despesa.");
  const sql = getDb();
  const userId = await getUserId();
  await sql(
    `INSERT INTO public.card_entries (id, user_id, kind, date, category, description, value)
     VALUES ($1, $2, $3, $4::date, $5, $6, $7)
     ON CONFLICT (id) DO UPDATE SET
       kind = EXCLUDED.kind, date = EXCLUDED.date, category = EXCLUDED.category,
       description = EXCLUDED.description, value = EXCLUDED.value`,
    [entry.id, userId, entry.kind, entry.date, entry.category, entry.description ?? null, entry.value],
  );
}

export async function deleteCardEntry(id: string) {
  const sql = getDb();
  const userId = await getUserId();
  await sql(`DELETE FROM public.card_entries WHERE id = $1 AND user_id = $2`, [id, userId]);
}

export async function deleteAllCardEntries() {
  const sql = getDb();
  const userId = await getUserId();
  await sql(`DELETE FROM public.card_entries WHERE user_id = $1`, [userId]);
}
