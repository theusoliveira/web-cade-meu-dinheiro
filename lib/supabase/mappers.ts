import type { EntryKind, FinanceEntry, FixedEntry } from "../finance";
import type { Database } from "./types";

type EntryRow = Database["public"]["Tables"]["entries"]["Row"];
type CardEntryRow = Database["public"]["Tables"]["card_entries"]["Row"];
type FixedEntryRow = Database["public"]["Tables"]["fixed_entries"]["Row"];

export function mapEntryRows(
  data: EntryRow[] | CardEntryRow[] | null | undefined,
): FinanceEntry[] {
  return (data ?? []).map((row) => ({
    id: row.id,
    kind: row.kind as EntryKind,
    date: row.date,
    category: row.category,
    description: row.description ?? "",
    value: Number(row.value ?? 0),
    createdAt: new Date(row.created_at).getTime(),
    fixedEntryId: "fixed_entry_id" in row ? row.fixed_entry_id ?? null : null,
  }));
}

export function mapFixedEntryRows(
  data: FixedEntryRow[] | null | undefined,
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
