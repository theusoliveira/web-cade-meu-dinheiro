import { lastDayOfMonthFromYM } from "./dates";
import type { FinanceEntry, FixedEntry } from "./types";

export function sortEntriesAsc(a: FinanceEntry, b: FinanceEntry): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  return (a.createdAt ?? 0) - (b.createdAt ?? 0);
}

export function signedEntryValue(entry: FinanceEntry): number {
  return entry.kind === "income" ? entry.value : -entry.value;
}

export function isSaldoEntry(entry: Pick<FinanceEntry, "category">): boolean {
  return entry.category.trim().toLocaleLowerCase("pt-BR") === "saldo";
}

export function calculateOpeningBalance(entriesBeforeMonth: FinanceEntry[]): number {
  const byMonth = new Map<string, FinanceEntry[]>();

  for (const entry of entriesBeforeMonth) {
    const ym = entry.date.slice(0, 7);
    const monthEntries = byMonth.get(ym) ?? [];
    monthEntries.push(entry);
    byMonth.set(ym, monthEntries);
  }

  let balance = 0;

  for (const ym of [...byMonth.keys()].sort()) {
    const monthEntries = byMonth.get(ym) ?? [];
    const manualSaldoEntries = monthEntries.filter(isSaldoEntry);

    if (manualSaldoEntries.length > 0) {
      balance = manualSaldoEntries.reduce(
        (sum, entry) => sum + signedEntryValue(entry),
        0,
      );
    }

    for (const entry of monthEntries) {
      if (isSaldoEntry(entry)) continue;
      balance += signedEntryValue(entry);
    }
  }

  return balance;
}

export function createAutoCarryoverEntry(
  ym: string,
  openingBalance: number,
): FinanceEntry | null {
  if (Math.abs(openingBalance) < 0.005) return null;

  const isPositive = openingBalance >= 0;

  return {
    id: `auto-carryover-${ym}`,
    kind: isPositive ? "income" : "expense",
    date: `${ym}-01`,
    category: "Saldo",
    description: isPositive
      ? "Saldo do mês anterior"
      : "Saldo negativo do mês anterior",
    value: Math.abs(openingBalance),
    createdAt: -1,
    isAutoCarryover: true,
  };
}

export function buildEntriesWithVirtuals(params: {
  month: string;
  entries: FinanceEntry[];
  fixedEntries: FixedEntry[];
  openingBalance: number;
}): FinanceEntry[] {
  const { month, entries, fixedEntries, openingBalance } = params;
  const lastDay = lastDayOfMonthFromYM(month);
  const hasManualSaldoInCurrentMonth = entries.some(isSaldoEntry);
  const autoCarryover = hasManualSaldoInCurrentMonth
    ? null
    : createAutoCarryoverEntry(month, openingBalance);

  const byFixedId = new Map<string, FinanceEntry>();
  for (const entry of entries) {
    const fixedEntryId = entry.fixedEntryId ?? null;
    if (fixedEntryId) byFixedId.set(fixedEntryId, entry);
  }

  const virtuals: FinanceEntry[] = autoCarryover ? [autoCarryover] : [];

  for (const fixedEntry of fixedEntries) {
    if (byFixedId.has(fixedEntry.id)) continue;

    const day = Math.max(1, Math.min(fixedEntry.dayOfMonth, lastDay));
    const date = `${month}-${String(day).padStart(2, "0")}`;

    virtuals.push({
      id: `virtual-${fixedEntry.id}`,
      kind: fixedEntry.kind,
      date,
      category: fixedEntry.category,
      description: fixedEntry.description,
      value: 0,
      createdAt: fixedEntry.createdAt,
      fixedEntryId: fixedEntry.id,
      isVirtualFixed: true,
    });
  }

  return [...entries, ...virtuals].sort(sortEntriesAsc);
}
