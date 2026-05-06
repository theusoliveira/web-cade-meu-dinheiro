import type { FinanceEntry } from "@/lib/finance";

const STORAGE_KEY = "cmd_entries_v1";

export function loadEntries(): FinanceEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as FinanceEntry[];
  } catch {
    return [];
  }
}

export function saveEntries(entries: FinanceEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // ignore
  }
}

export function sortEntriesDesc(a: FinanceEntry, b: FinanceEntry): number {
  // Primary: date desc, Secondary: createdAt desc
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  return (b.createdAt ?? 0) - (a.createdAt ?? 0);
}
