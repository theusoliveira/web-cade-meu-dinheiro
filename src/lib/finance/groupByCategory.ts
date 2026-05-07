import type { EntryKind, FinanceEntry } from "./types";

export type ChartSlice = { name: string; value: number };

/**
 * Agrega entradas por categoria para um determinado tipo (kind),
 * retornando os dados prontos para uso nos gráficos.
 */
export function groupByCategory(entries: FinanceEntry[], kind: EntryKind): ChartSlice[] {
  const map = new Map<string, number>();

  for (const entry of entries) {
    if (entry.kind !== kind) continue;
    map.set(entry.category, (map.get(entry.category) ?? 0) + entry.value);
  }

  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}
