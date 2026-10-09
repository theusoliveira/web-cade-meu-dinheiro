"use server";

import { getDb } from "@/lib/db/client";
import { mapEntryRows, mapFixedEntryRows } from "@/lib/db/mappers";
import { calculateOpeningBalance, nextMonthStart } from "@/lib/finance";
import type { FinanceEntry, FixedEntry } from "@/lib/finance";
import {
  ENTRY_KINDS, SCOPES, requireUserId, vDate, vEnum, vId, vMoney, vObject, vOptionalId, vText, vYear, vYm,
} from "@/lib/server/guard";

export type MonthlyEntriesScope = "personal" | "business";

// Nomes de tabela vêm de um mapa fixo — nunca de entrada do usuário.
function entryTable(scope: unknown) {
  return vEnum(scope, SCOPES, "escopo") === "business" ? "pj_entries" : "entries";
}
function fixedEntryTable(scope: unknown) {
  return vEnum(scope, SCOPES, "escopo") === "business" ? "pj_fixed_entries" : "fixed_entries";
}

const ENTRY_COLUMNS = "id, kind, date::text, category, description, value::float8, created_at, fixed_entry_id";

function parseEntry(raw: unknown) {
  const e = vObject(raw, "lançamento");
  return {
    id: vId(e.id),
    kind: vEnum(e.kind, ENTRY_KINDS, "tipo"),
    date: vDate(e.date),
    category: vText(e.category, "categoria", { max: 80, required: true }),
    description: vText(e.description, "descrição", { max: 200 }),
    value: vMoney(e.value),
    fixedEntryId: vOptionalId(e.fixedEntryId, "fixo"),
  };
}

export async function fetchMonthlyEntries(ym: string, scope: MonthlyEntriesScope = "personal"): Promise<FinanceEntry[]> {
  const userId = await requireUserId();
  const table = entryTable(scope);
  const start = `${vYm(ym)}-01`;
  const rows = await getDb()(
    `SELECT ${ENTRY_COLUMNS}
     FROM public.${table} WHERE user_id = $1 AND date >= $2::date AND date < $3::date
     ORDER BY date DESC, created_at DESC`,
    [userId, start, nextMonthStart(ym)],
  );
  return mapEntryRows(rows as never[]);
}

export async function fetchYearlyEntries(year: string, scope: MonthlyEntriesScope = "personal"): Promise<FinanceEntry[]> {
  const userId = await requireUserId();
  const table = entryTable(scope);
  const y = Number(vYear(year));
  const rows = await getDb()(
    `SELECT ${ENTRY_COLUMNS}
     FROM public.${table} WHERE user_id = $1 AND date >= $2::date AND date < $3::date
     ORDER BY date DESC, created_at DESC`,
    [userId, `${y}-01-01`, `${y + 1}-01-01`],
  );
  return mapEntryRows(rows as never[]);
}

export async function fetchEntriesBeforeMonth(ym: string, scope: MonthlyEntriesScope = "personal"): Promise<FinanceEntry[]> {
  const userId = await requireUserId();
  const table = entryTable(scope);
  const rows = await getDb()(
    `SELECT ${ENTRY_COLUMNS}
     FROM public.${table} WHERE user_id = $1 AND date < $2::date
     ORDER BY date ASC, created_at ASC`,
    [userId, `${vYm(ym)}-01`],
  );
  return mapEntryRows(rows as never[]);
}

export async function fetchOpeningBalance(ym: string, scope: MonthlyEntriesScope = "personal"): Promise<number> {
  const userId = await requireUserId();
  const fn = vEnum(scope, SCOPES, "escopo") === "business" ? "get_pj_opening_balance" : "get_opening_balance";
  const start = `${vYm(ym)}-01`;
  try {
    const rows = await getDb()(`SELECT public.${fn}($1, $2::date) AS balance`, [userId, start]);
    return Number(rows[0]?.balance ?? 0);
  } catch {
    const entries = await fetchEntriesBeforeMonth(ym, scope);
    return calculateOpeningBalance(entries);
  }
}

export async function fetchFixedEntries(scope: MonthlyEntriesScope = "personal"): Promise<FixedEntry[]> {
  const userId = await requireUserId();
  const table = fixedEntryTable(scope);
  const rows = await getDb()(
    `SELECT id, kind, category, description, day_of_month, created_at
     FROM public.${table} WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId],
  );
  return mapFixedEntryRows(rows as never[]);
}

export async function createFixedEntryTemplate(entry: FinanceEntry, scope: MonthlyEntriesScope = "personal") {
  const userId = await requireUserId();
  const table = fixedEntryTable(scope);
  const e = parseEntry(entry);
  const day = Number(e.date.slice(8, 10)) || 1;
  await getDb()(
    `INSERT INTO public.${table} (id, user_id, kind, category, description, day_of_month)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [e.id, userId, e.kind, e.category, e.description, day],
  );
}

export async function upsertMonthlyEntry(entry: FinanceEntry, scope: MonthlyEntriesScope = "personal") {
  const userId = await requireUserId();
  const table = entryTable(scope);
  const e = parseEntry(entry);
  // O WHERE no DO UPDATE impede sobrescrever um registro de outro usuário
  // cujo id seja conhecido (IDOR).
  await getDb()(
    `INSERT INTO public.${table} AS t (id, user_id, kind, date, category, description, value, fixed_entry_id)
     VALUES ($1, $2, $3, $4::date, $5, $6, $7, $8)
     ON CONFLICT (id) DO UPDATE SET
       kind = EXCLUDED.kind, date = EXCLUDED.date, category = EXCLUDED.category,
       description = EXCLUDED.description, value = EXCLUDED.value, fixed_entry_id = EXCLUDED.fixed_entry_id
     WHERE t.user_id = EXCLUDED.user_id`,
    [e.id, userId, e.kind, e.date, e.category, e.description || null, e.value, e.fixedEntryId],
  );
}

export async function deleteMonthlyEntry(id: string, scope: MonthlyEntriesScope = "personal") {
  const userId = await requireUserId();
  const table = entryTable(scope);
  await getDb()(`DELETE FROM public.${table} WHERE id = $1 AND user_id = $2`, [vId(id), userId]);
}

export async function deleteFixedEntry(id: string, scope: MonthlyEntriesScope = "personal") {
  const userId = await requireUserId();
  const table = fixedEntryTable(scope);
  await getDb()(`DELETE FROM public.${table} WHERE id = $1 AND user_id = $2`, [vId(id), userId]);
}
