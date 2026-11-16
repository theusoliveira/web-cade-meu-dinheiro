"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { formatCurrencyBRL, type EntryKind, type FinanceEntry } from "@/lib/finance";

export type KindFilter = "all" | EntryKind;
export type KindSegment = { key: KindFilter; label: string };

/** Estado + aplicação dos filtros (tipo, categoria e busca) sobre uma lista de lançamentos. */
export function useEntryFilters(entries: FinanceEntry[]) {
  const [kind, setKind] = React.useState<KindFilter>("all");
  const [category, setCategory] = React.useState("");
  const [query, setQuery] = React.useState("");

  const categories = React.useMemo(
    () => [...new Set(entries.map((e) => e.category))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [entries],
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (kind !== "all" && e.kind !== kind) return false;
      if (category && e.category !== category) return false;
      if (q && !`${e.description ?? ""} ${e.category}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [entries, kind, category, query]);

  const total = React.useMemo(
    () => filtered.reduce((t, e) => (e.kind === "income" ? t + e.value : t - e.value), 0),
    [filtered],
  );

  return { kind, setKind, category, setCategory, query, setQuery, categories, filtered, total };
}

type BarProps = {
  filters: ReturnType<typeof useEntryFilters>;
  segments: KindSegment[];
};

const fieldClass =
  "h-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--foreground)] " +
  "outline-none transition-all focus:border-[var(--accent)]";

export function EntryFiltersBar({ filters, segments }: BarProps) {
  const { kind, setKind, category, setCategory, query, setQuery, categories, filtered, total } = filters;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-semibold text-[var(--foreground)]">
        {filtered.length} no filtro
        <span className="font-normal text-[var(--muted)]"> · Total {formatCurrencyBRL(total)}</span>
      </p>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="no-scrollbar inline-flex max-w-full gap-1 self-start overflow-x-auto rounded-xl bg-[var(--accent-light)] p-1">
          {segments.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setKind(s.key)}
              aria-pressed={kind === s.key}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium sm:px-3.5 transition-colors ${
                kind === s.key
                  ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Filtrar por categoria"
          className={`${fieldClass} cursor-pointer px-3 lg:w-56`}
        >
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <div className="relative lg:flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-light)]" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar"
            aria-label="Buscar lançamentos"
            className={`${fieldClass} w-full pl-[2.25rem] pr-3`}
          />
        </div>
      </div>
    </div>
  );
}
