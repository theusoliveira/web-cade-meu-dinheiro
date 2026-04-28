import type { EntryKind, FinanceEntry } from "./finance";

export type FixedEntry = {
  id: string;
  kind: EntryKind;
  category: string;
  description: string;
  dayOfMonth: number;
  createdAt: number;
};

export function mapEntryRows(data: any[] | null | undefined): FinanceEntry[] {
  return (data ?? []).map((row) => ({
    id: row.id,
    kind: row.kind as EntryKind,
    date: row.date as string,
    category: row.category as any,
    description: (row.description ?? "") as string,
    value: Number(row.value),
    createdAt: new Date(row.created_at as string).getTime(),
    fixedEntryId: (row.fixed_entry_id ?? null) as string | null,
  }));
}

export function mapFixedEntryRows(data: any[] | null | undefined): FixedEntry[] {
  return (data ?? []).map((row) => ({
    id: row.id as string,
    kind: row.kind as EntryKind,
    category: (row.category ?? "") as string,
    description: (row.description ?? "") as string,
    dayOfMonth: Number(row.day_of_month ?? 1),
    createdAt: new Date(row.created_at as string).getTime(),
  }));
}

export function sortEntriesAsc(a: FinanceEntry, b: FinanceEntry): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  return (a.createdAt ?? 0) - (b.createdAt ?? 0);
}
