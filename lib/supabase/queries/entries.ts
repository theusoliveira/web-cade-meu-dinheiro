import type { FinanceEntry } from "../../finance";
import { calculateOpeningBalance, nextMonthStart } from "../../finance";
import { mapEntryRows, mapFixedEntryRows } from "../mappers";
import { supabase } from "../client";

const ENTRY_COLUMNS =
  "id, kind, date, category, description, value, created_at, fixed_entry_id";

const FIXED_COLUMNS = "id, kind, category, description, day_of_month, created_at";

export type MonthlyEntriesScope = "personal" | "business";

// ---------------------------------------------------------------------------
// Helpers privados — centralizam a escolha de tabela pelo escopo
// ---------------------------------------------------------------------------

function entryTable(scope: MonthlyEntriesScope) {
  return scope === "business" ? ("pj_entries" as const) : ("entries" as const);
}

function fixedEntryTable(scope: MonthlyEntriesScope) {
  return scope === "business"
    ? ("pj_fixed_entries" as const)
    : ("fixed_entries" as const);
}

function openingBalanceRpc(scope: MonthlyEntriesScope) {
  return scope === "business" ? "get_pj_opening_balance" : "get_opening_balance";
}

// ---------------------------------------------------------------------------
// Queries públicas
// ---------------------------------------------------------------------------

export async function fetchMonthlyEntries(
  ym: string,
  scope: MonthlyEntriesScope = "personal",
): Promise<FinanceEntry[]> {
  const start = `${ym}-01`;
  const next = nextMonthStart(ym);

  const { data, error } = await supabase
    .from(entryTable(scope))
    .select(ENTRY_COLUMNS)
    .gte("date", start)
    .lt("date", next)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return mapEntryRows(data);
}

export async function fetchEntriesBeforeMonth(
  ym: string,
  scope: MonthlyEntriesScope = "personal",
): Promise<FinanceEntry[]> {
  const start = `${ym}-01`;

  const { data, error } = await supabase
    .from(entryTable(scope))
    .select(ENTRY_COLUMNS)
    .lt("date", start)
    .order("date", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return mapEntryRows(data);
}

export async function fetchOpeningBalance(
  ym: string,
  scope: MonthlyEntriesScope = "personal",
): Promise<number> {
  const start = `${ym}-01`;

  const { data, error } = await supabase.rpc(openingBalanceRpc(scope), {
    month_start: start,
  });

  if (!error) return Number(data ?? 0);

  console.warn(
    `${openingBalanceRpc(scope)} RPC indisponível; usando fallback no cliente.`,
    error,
  );

  const entriesBeforeMonth = await fetchEntriesBeforeMonth(ym, scope);
  return calculateOpeningBalance(entriesBeforeMonth);
}

export async function fetchFixedEntries(scope: MonthlyEntriesScope = "personal") {
  const { data, error } = await supabase
    .from(fixedEntryTable(scope))
    .select(FIXED_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return mapFixedEntryRows(data);
}

export async function createFixedEntryTemplate(
  entry: FinanceEntry,
  scope: MonthlyEntriesScope = "personal",
) {
  const day = Number(entry.date.split("-")[2] ?? "1") || 1;

  const { error } = await supabase.from(fixedEntryTable(scope)).insert({
    id: entry.id,
    kind: entry.kind,
    category: entry.category,
    description: entry.description,
    day_of_month: day,
  });

  if (error) throw error;
}

export async function upsertMonthlyEntry(
  entry: FinanceEntry,
  scope: MonthlyEntriesScope = "personal",
) {
  const { error } = await supabase.from(entryTable(scope)).upsert({
    id: entry.id,
    kind: entry.kind,
    date: entry.date,
    category: entry.category,
    description: entry.description,
    value: entry.value,
    fixed_entry_id: entry.fixedEntryId ?? null,
  });

  if (error) throw error;
}

export async function deleteMonthlyEntry(
  id: string,
  scope: MonthlyEntriesScope = "personal",
) {
  const { error } = await supabase.from(entryTable(scope)).delete().eq("id", id);
  if (error) throw error;
}

export async function deleteFixedEntry(
  id: string,
  scope: MonthlyEntriesScope = "personal",
) {
  const { error } = await supabase.from(fixedEntryTable(scope)).delete().eq("id", id);
  if (error) throw error;
}
