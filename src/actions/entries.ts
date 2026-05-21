"use server";

import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { mapEntryRows, mapFixedEntryRows } from "@/lib/db/mappers";
import { calculateOpeningBalance, nextMonthStart } from "@/lib/finance";
import type { FinanceEntry, FixedEntry } from "@/lib/finance";

export type MonthlyEntriesScope = "personal" | "business";

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado");
  return session.user.id;
}

function entryTable(scope: MonthlyEntriesScope) {
  return scope === "business" ? "pj_entries" : "entries";
}
function fixedEntryTable(scope: MonthlyEntriesScope) {
  return scope === "business" ? "pj_fixed_entries" : "fixed_entries";
}

export async function fetchMonthlyEntries(ym: string, scope: MonthlyEntriesScope = "personal"): Promise<FinanceEntry[]> {
  const sql = getDb();
  const userId = await getUserId();
  const table = entryTable(scope);
  const start = `${ym}-01`;
  const next = nextMonthStart(ym);
  const rows = await sql(
    `SELECT id, kind, date::text, category, description, value::float8, created_at, fixed_entry_id
     FROM public.${table} WHERE user_id = $1 AND date >= $2::date AND date < $3::date
     ORDER BY date DESC, created_at DESC`,
    [userId, start, next],
  );
  return mapEntryRows(rows as never[]);
}

export async function fetchEntriesBeforeMonth(ym: string, scope: MonthlyEntriesScope = "personal"): Promise<FinanceEntry[]> {
  const sql = getDb();
  const userId = await getUserId();
  const table = entryTable(scope);
  const start = `${ym}-01`;
  const rows = await sql(
    `SELECT id, kind, date::text, category, description, value::float8, created_at, fixed_entry_id
     FROM public.${table} WHERE user_id = $1 AND date < $2::date
     ORDER BY date ASC, created_at ASC`,
    [userId, start],
  );
  return mapEntryRows(rows as never[]);
}

export async function fetchOpeningBalance(ym: string, scope: MonthlyEntriesScope = "personal"): Promise<number> {
  const sql = getDb();
  const userId = await getUserId();
  const fn = scope === "business" ? "get_pj_opening_balance" : "get_opening_balance";
  const start = `${ym}-01`;
  try {
    const rows = await sql(`SELECT public.${fn}($1, $2::date) AS balance`, [userId, start]) as Record<string, unknown>[];
    return Number(rows[0]?.balance ?? 0);
  } catch {
    const entries = await fetchEntriesBeforeMonth(ym, scope);
    return calculateOpeningBalance(entries);
  }
}

export async function fetchFixedEntries(scope: MonthlyEntriesScope = "personal"): Promise<FixedEntry[]> {
  const sql = getDb();
  const userId = await getUserId();
  const table = fixedEntryTable(scope);
  const rows = await sql(
    `SELECT id, kind, category, description, day_of_month, created_at
     FROM public.${table} WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId],
  );
  return mapFixedEntryRows(rows as never[]);
}

export async function createFixedEntryTemplate(entry: FinanceEntry, scope: MonthlyEntriesScope = "personal") {
  const sql = getDb();
  const userId = await getUserId();
  const table = fixedEntryTable(scope);
  const day = Number(entry.date.split("-")[2] ?? "1") || 1;
  await sql(
    `INSERT INTO public.${table} (id, user_id, kind, category, description, day_of_month)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [entry.id, userId, entry.kind, entry.category, entry.description, day],
  );
}

export async function upsertMonthlyEntry(entry: FinanceEntry, scope: MonthlyEntriesScope = "personal") {
  const sql = getDb();
  const userId = await getUserId();
  const table = entryTable(scope);
  await sql(
    `INSERT INTO public.${table} (id, user_id, kind, date, category, description, value, fixed_entry_id)
     VALUES ($1, $2, $3, $4::date, $5, $6, $7, $8)
     ON CONFLICT (id) DO UPDATE SET
       kind = EXCLUDED.kind, date = EXCLUDED.date, category = EXCLUDED.category,
       description = EXCLUDED.description, value = EXCLUDED.value, fixed_entry_id = EXCLUDED.fixed_entry_id`,
    [entry.id, userId, entry.kind, entry.date, entry.category, entry.description ?? null, entry.value, entry.fixedEntryId ?? null],
  );
}

export async function deleteMonthlyEntry(id: string, scope: MonthlyEntriesScope = "personal") {
  const sql = getDb();
  const userId = await getUserId();
  const table = entryTable(scope);
  await sql(`DELETE FROM public.${table} WHERE id = $1 AND user_id = $2`, [id, userId]);
}

export async function deleteFixedEntry(id: string, scope: MonthlyEntriesScope = "personal") {
  const sql = getDb();
  const userId = await getUserId();
  const table = fixedEntryTable(scope);
  await sql(`DELETE FROM public.${table} WHERE id = $1 AND user_id = $2`, [id, userId]);
}
