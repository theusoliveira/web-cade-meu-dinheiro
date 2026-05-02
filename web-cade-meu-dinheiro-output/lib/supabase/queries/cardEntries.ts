import type { FinanceEntry } from "../../finance";
import { mapEntryRows } from "../mappers";
import { supabase } from "../client";

export async function fetchCardEntries(): Promise<FinanceEntry[]> {
  const { data, error } = await supabase
    .from("card_entries")
    .select("id, kind, date, category, description, value, created_at")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return mapEntryRows(data);
}

export async function upsertCardEntry(entry: FinanceEntry) {
  if (entry.kind === "investment") {
    throw new Error("No Controle de gastos, só é permitido Receita ou Despesa.");
  }

  const { error } = await supabase.from("card_entries").upsert({
    id: entry.id,
    kind: entry.kind,
    date: entry.date,
    category: entry.category,
    description: entry.description,
    value: entry.value,
  });

  if (error) throw error;
}

export async function deleteCardEntry(id: string) {
  const { error } = await supabase.from("card_entries").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteAllCardEntries() {
  const { error } = await supabase
    .from("card_entries")
    .delete()
    .gte("date", "0001-01-01");

  if (error) throw error;
}
