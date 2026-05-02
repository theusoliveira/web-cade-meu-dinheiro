import type { EntryKind, FinanceEntry, FixedEntry } from "../finance";
import type { Database } from "./types";

type EntryRow = Database["public"]["Tables"]["entries"]["Row"];
type PjEntryRow = Database["public"]["Tables"]["pj_entries"]["Row"];
type CardEntryRow = Database["public"]["Tables"]["card_entries"]["Row"];
type FixedEntryRow = Database["public"]["Tables"]["fixed_entries"]["Row"];
type PjFixedEntryRow = Database["public"]["Tables"]["pj_fixed_entries"]["Row"];

/** Linhas que possuem fixed_entry_id (entries e pj_entries, mas não card_entries). */
type RowWithFixedId = EntryRow | PjEntryRow;

export function mapEntryRows(
  data: EntryRow[] | PjEntryRow[] | CardEntryRow[] | null | undefined,
): FinanceEntry[] {
  return (data ?? []).map((row) => ({
    id: row.id,
    kind: row.kind as EntryKind,
    date: row.date,
    category: row.category,
    description: row.description ?? "",
    value: Number(row.value ?? 0),
    createdAt: new Date(row.created_at).getTime(),
    // O operador `in` não estreita o tipo em unions complexas; o cast resolve isso.
    fixedEntryId: "fixed_entry_id" in row
      ? (row as RowWithFixedId).fixed_entry_id ?? null
      : null,
  }));
}

export function mapFixedEntryRows(
  data: FixedEntryRow[] | PjFixedEntryRow[] | null | undefined,
): FixedEntry[] {
  return (data ?? []).map((row) => ({
    id: row.id,
    kind: row.kind as EntryKind,
    category: row.category ?? "",
    description: row.description ?? "",
    dayOfMonth: Number(row.day_of_month ?? 1),
    createdAt: new Date(row.created_at).getTime(),
  }));
}