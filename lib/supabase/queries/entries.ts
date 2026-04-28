import type { FinanceEntry } from "../../finance";
import { calculateOpeningBalance, nextMonthStart } from "../../finance";
import { mapEntryRows, mapFixedEntryRows } from "../mappers";
import { supabase } from "../client";

const ENTRY_COLUMNS =
  "id, kind, date, category, description, value, created_at, fixed_entry_id";

export async function fetchMonthlyEntries(ym: string): Promise<FinanceEntry[]> {
  const start = `${ym}-01`;
  const next = nextMonthStart(ym);

  const { data, error } = await supabase
    .from("entries")
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
): Promise<FinanceEntry[]> {
  const start = `${ym}-01`;

  const { data, error } = await supabase
    .from("entries")
    .select(ENTRY_COLUMNS)
    .lt("date", start)
    .order("date", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return mapEntryRows(data);
}

export async function fetchOpeningBalance(ym: string): Promise<number> {
  const start = `${ym}-01`;
  const { data, error } = await supabase.rpc("get_opening_balance", {
    month_start: start,
  });

  if (!error) return Number(data ?? 0);

  console.warn(
    "get_opening_balance RPC indisponível; usando fallback no cliente.",
    error,
  );

  const entriesBeforeMonth = await fetchEntriesBeforeMonth(ym);
  return calculateOpeningBalance(entriesBeforeMonth);
}

export async function fetchFixedEntries() {
  const { data, error } = await supabase
    .from("fixed_entries")
    .select("id, kind, category, description, day_of_month, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return mapFixedEntryRows(data);
}

export async function createFixedEntryTemplate(entry: FinanceEntry) {
  const day = Number(entry.date.split("-")[2] ?? "1") || 1;

  const { error } = await supabase.from("fixed_entries").insert({
    id: entry.id,
    kind: entry.kind,
    category: entry.category,
    description: entry.description,
    day_of_month: day,
  });

  if (error) throw error;
}

export async function upsertMonthlyEntry(entry: FinanceEntry) {
  const { error } = await supabase.from("entries").upsert({
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

export async function deleteMonthlyEntry(id: string) {
  const { error } = await supabase.from("entries").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteFixedEntry(id: string) {
  const { error } = await supabase.from("fixed_entries").delete().eq("id", id);
  if (error) throw error;
}
