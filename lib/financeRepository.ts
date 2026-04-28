import type { FinanceEntry } from "./finance";
import { monthDateRange } from "./date";
import { mapEntryRows, mapFixedEntryRows, type FixedEntry } from "./entryMappers";
import { supabase } from "./supabaseClient";

const ENTRY_FIELDS = "id, kind, date, category, description, value, created_at, fixed_entry_id";
const CARD_ENTRY_FIELDS = "id, kind, date, category, description, value, created_at";
const FIXED_ENTRY_FIELDS = "id, kind, category, description, day_of_month, created_at";

export async function fetchEntriesByMonth(month: string): Promise<FinanceEntry[]> {
  const { start, end } = monthDateRange(month);

  const { data, error } = await supabase
    .from("entries")
    .select(ENTRY_FIELDS)
    .gte("date", start)
    .lt("date", end)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return mapEntryRows(data);
}

export async function fetchFixedEntries(): Promise<FixedEntry[]> {
  const { data, error } = await supabase
    .from("fixed_entries")
    .select(FIXED_ENTRY_FIELDS)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return mapFixedEntryRows(data);
}

export async function fetchCardEntries(): Promise<FinanceEntry[]> {
  const { data, error } = await supabase
    .from("card_entries")
    .select(CARD_ENTRY_FIELDS)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return mapEntryRows(data);
}

export async function saveFixedEntry(entry: FinanceEntry): Promise<void> {
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

export async function upsertMonthlyEntry(entry: FinanceEntry, exists: boolean): Promise<void> {
  const payload = {
    id: entry.id,
    kind: entry.kind,
    date: entry.date,
    category: entry.category,
    description: entry.description,
    value: entry.value,
    fixed_entry_id: entry.fixedEntryId ?? null,
  };

  const query = exists
    ? supabase.from("entries").update(payload).eq("id", entry.id)
    : supabase.from("entries").insert(payload);

  const { error } = await query;
  if (error) throw error;
}

export async function upsertCardEntryRecord(entry: FinanceEntry, exists: boolean): Promise<void> {
  const payload = {
    id: entry.id,
    kind: entry.kind,
    date: entry.date,
    category: entry.category,
    description: entry.description,
    value: entry.value,
  };

  const query = exists
    ? supabase.from("card_entries").update(payload).eq("id", entry.id)
    : supabase.from("card_entries").insert(payload);

  const { error } = await query;
  if (error) throw error;
}

export async function deleteFixedEntry(id: string): Promise<void> {
  const { error } = await supabase.from("fixed_entries").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteMonthlyEntry(id: string): Promise<void> {
  const { error } = await supabase.from("entries").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteCardEntryRecord(id: string): Promise<void> {
  const { error } = await supabase.from("card_entries").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteAllCardEntryRecords(): Promise<void> {
  const { error } = await supabase.from("card_entries").delete().gte("date", "0001-01-01");
  if (error) throw error;
}
