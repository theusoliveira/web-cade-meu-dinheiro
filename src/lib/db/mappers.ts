import type { EntryKind, FinanceEntry, FixedEntry } from "@/lib/finance";

type RawEntryRow = {
  id: string;
  kind: string;
  date: string;
  category: string;
  description?: string | null;
  value: number | string;
  created_at: string;
  fixed_entry_id?: string | null;
};

type RawFixedEntryRow = {
  id: string;
  kind: string;
  category?: string | null;
  description?: string | null;
  day_of_month?: number | string | null;
  created_at: string;
};

export function mapEntryRows(data: RawEntryRow[] | null | undefined): FinanceEntry[] {
  return (data ?? []).map((row) => ({
    id: row.id,
    kind: row.kind as EntryKind,
    date: row.date,
    category: row.category,
    description: row.description ?? "",
    value: Number(row.value ?? 0),
    createdAt: new Date(row.created_at).getTime(),
    fixedEntryId: row.fixed_entry_id ?? null,
  }));
}

export function mapFixedEntryRows(data: RawFixedEntryRow[] | null | undefined): FixedEntry[] {
  return (data ?? []).map((row) => ({
    id: row.id,
    kind: row.kind as EntryKind,
    category: row.category ?? "",
    description: row.description ?? "",
    dayOfMonth: Number(row.day_of_month ?? 1),
    createdAt: new Date(row.created_at).getTime(),
  }));
}
