"use server";

import { getDb } from "@/lib/db/client";
import { mapEntryRows } from "@/lib/db/mappers";
import { nextMonthStart, type FinanceEntry } from "@/lib/finance";
import { requireUserId, vDate, vEnum, vId, vIds, vMoney, vObject, vText, vYm } from "@/lib/server/guard";

export async function fetchCardEntries(): Promise<FinanceEntry[]> {
  const userId = await requireUserId();
  const rows = await getDb()(
    `SELECT id, kind, date::text, category, description, value::float8, created_at
     FROM public.card_entries WHERE user_id = $1
     ORDER BY date DESC, created_at DESC`,
    [userId],
  );
  return mapEntryRows(rows as never[]);
}

/** Totais do cartão em um mês, agregados no banco (só números trafegam). */
export async function fetchCardMonthTotals(ym: string): Promise<{ expense: number; income: number; count: number }> {
  const userId = await requireUserId();
  const rows = await getDb()(
    `SELECT
       COALESCE(SUM(value) FILTER (WHERE kind = 'expense'), 0)::float8 AS expense,
       COALESCE(SUM(value) FILTER (WHERE kind = 'income'), 0)::float8 AS income,
       COUNT(*)::int AS count
     FROM public.card_entries
     WHERE user_id = $1 AND date >= $2::date AND date < $3::date`,
    [userId, `${vYm(ym)}-01`, nextMonthStart(ym)],
  );
  const r = rows[0] ?? {};
  return { expense: Number(r.expense ?? 0), income: Number(r.income ?? 0), count: Number(r.count ?? 0) };
}

export async function upsertCardEntry(entry: FinanceEntry) {
  const userId = await requireUserId();
  const e = vObject(entry, "lançamento");
  const kind = vEnum(e.kind, ["income", "expense"] as const, "tipo");
  await getDb()(
    `INSERT INTO public.card_entries AS t (id, user_id, kind, date, category, description, value)
     VALUES ($1, $2, $3, $4::date, $5, $6, $7)
     ON CONFLICT (id) DO UPDATE SET
       kind = EXCLUDED.kind, date = EXCLUDED.date, category = EXCLUDED.category,
       description = EXCLUDED.description, value = EXCLUDED.value
     WHERE t.user_id = EXCLUDED.user_id`,
    [
      vId(e.id), userId, kind, vDate(e.date),
      vText(e.category, "categoria", { max: 80, required: true }),
      vText(e.description, "descrição", { max: 200 }) || null,
      vMoney(e.value),
    ],
  );
}

export async function deleteCardEntry(id: string) {
  const userId = await requireUserId();
  await getDb()(`DELETE FROM public.card_entries WHERE id = $1 AND user_id = $2`, [vId(id), userId]);
}

export async function deleteCardEntries(ids: string[]) {
  const list = vIds(ids);
  if (list.length === 0) return;
  const userId = await requireUserId();
  await getDb()(
    `DELETE FROM public.card_entries WHERE user_id = $1 AND id = ANY($2::text[])`,
    [userId, list],
  );
}

export async function deleteAllCardEntries() {
  const userId = await requireUserId();
  await getDb()(`DELETE FROM public.card_entries WHERE user_id = $1`, [userId]);
}
