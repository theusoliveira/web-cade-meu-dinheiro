"use client";

import * as React from "react";
import { AddEntryDialog } from "./AddEntryDialog";
import { ThemeToggle } from "./ThemeToggle";
import { AppSidebar } from "./AppSidebar";
import { GoalsClient } from "./GoalsClient";
import { EntriesClient } from "./EntriesClient";
import { CardControlClient } from "./CardControlClient";
import { useBusy } from "./BusyProvider";
import { UserMenu } from "./UserMenu";

import {
  todayAsDateInputValue,
  type EntryKind,
  type FinanceEntry,
} from "../lib/finance";
import { supabase } from "../lib/supabaseClient";

type FixedEntry = {
  id: string;
  kind: EntryKind;
  category: string;
  description: string;
  dayOfMonth: number; // NEW
  createdAt: number;
};

function nextMonthStart(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  let yy = y;
  let mm = m + 1;
  if (mm === 13) {
    yy += 1;
    mm = 1;
  }
  return `${yy}-${String(mm).padStart(2, "0")}-01`;
}

function sortEntriesAsc(a: FinanceEntry, b: FinanceEntry): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  return (a.createdAt ?? 0) - (b.createdAt ?? 0);
}

function mapDbRows(data: any[] | null | undefined): FinanceEntry[] {
  return (data ?? []).map((r) => ({
    id: r.id,
    kind: r.kind as EntryKind,
    date: r.date as string,
    category: r.category as any,
    description: (r.description ?? "") as string,
    value: Number(r.value),
    createdAt: new Date(r.created_at as string).getTime(),
    fixedEntryId: (r.fixed_entry_id ?? null) as string | null,
  }));
}

function mapFixedRows(data: any[] | null | undefined): FixedEntry[] {
  return (data ?? []).map((r) => ({
    id: r.id as string,
    kind: r.kind as EntryKind,
    category: (r.category ?? "") as string,
    description: (r.description ?? "") as string,
    dayOfMonth: Number(r.day_of_month ?? 1), // NEW
    createdAt: new Date(r.created_at as string).getTime(),
  }));
}

function lastDayOfMonthFromYM(ym: string): number {
  const [y, m] = ym.split("-").map(Number); // m = 1..12
  return new Date(y, m, 0).getDate();
}

function signedEntryValue(entry: FinanceEntry): number {
  return entry.kind === "income" ? entry.value : -entry.value;
}

function isSaldoEntry(entry: FinanceEntry): boolean {
  return entry.category.trim().toLocaleLowerCase("pt-BR") === "saldo";
}

function calculateOpeningBalance(entriesBeforeMonth: FinanceEntry[]): number {
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

    // Compatibilidade com o fluxo antigo: se o usuário já tinha informado
    // uma linha "Saldo" manualmente em algum mês, tratamos essa linha como
    // saldo inicial daquele mês, e não como uma receita extra acumulativa.
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

function createAutoCarryoverEntry(
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

export function HomeClient() {
  const [month, setMonth] = React.useState(() =>
    todayAsDateInputValue().slice(0, 7),
  );

  const [activeTab, setActiveTab] = React.useState<
    "lancamentos" | "controle" | "metas"
  >("lancamentos");

  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const [entries, setEntries] = React.useState<FinanceEntry[]>([]);
  const [entriesBeforeMonth, setEntriesBeforeMonth] = React.useState<
    FinanceEntry[]
  >([]);
  const [cardEntries, setCardEntries] = React.useState<FinanceEntry[]>([]);
  const [fixedEntries, setFixedEntries] = React.useState<FixedEntry[]>([]);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [kind, setKind] = React.useState<EntryKind>("income");
  const [editing, setEditing] = React.useState<FinanceEntry | null>(null);

  const [displayName, setDisplayName] = React.useState<string>("");

  const busy = useBusy();

  React.useEffect(() => {
    try {
      const v = window.localStorage.getItem("sidebar_collapsed");
      if (v === "1") setSidebarCollapsed(true);
    } catch {}
  }, []);

  const toggleSidebarCollapsed = React.useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem("sidebar_collapsed", next ? "1" : "0");
      } catch {}
      return next;
    });
  }, []);

  React.useEffect(() => {
    let alive = true;

    async function loadProfile() {
      await busy.run(async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const userId = user?.id;
        if (!userId) return;

        const { data, error } = await supabase
          .from("profiles")
          .select("display_name, full_name")
          .eq("id", userId)
          .single();

        if (error) {
          console.error(error);
          return;
        }

        if (!alive) return;
        setDisplayName(
          (data?.display_name ?? data?.full_name ?? "").toString(),
        );
      });
    }

    loadProfile();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    setDialogOpen(false);
    setEditing(null);
    setMobileMenuOpen(false);
  }, [activeTab]);

  async function fetchEntriesMonth(ym: string) {
    const start = `${ym}-01`;
    const next = nextMonthStart(ym);

    await busy.run(async () => {
      const { data, error } = await supabase
        .from("entries")
        .select(
          "id, kind, date, category, description, value, created_at, fixed_entry_id",
        )
        .gte("date", start)
        .lt("date", next)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        return;
      }
      setEntries(mapDbRows(data));
    });
  }

  async function fetchEntriesBeforeMonth(ym: string) {
    const start = `${ym}-01`;

    await busy.run(async () => {
      const { data, error } = await supabase
        .from("entries")
        .select(
          "id, kind, date, category, description, value, created_at, fixed_entry_id",
        )
        .lt("date", start)
        .order("date", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) {
        console.error(error);
        return;
      }
      setEntriesBeforeMonth(mapDbRows(data));
    });
  }

  async function fetchFixedEntries() {
    await busy.run(async () => {
      const { data, error } = await supabase
        .from("fixed_entries")
        .select("id, kind, category, description, day_of_month, created_at") // NEW
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        return;
      }
      setFixedEntries(mapFixedRows(data));
    });
  }

  async function fetchCardAll() {
    await busy.run(async () => {
      const { data, error } = await supabase
        .from("card_entries")
        .select("id, kind, date, category, description, value, created_at")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        return;
      }
      setCardEntries(mapDbRows(data));
    });
  }

  React.useEffect(() => {
    if (activeTab !== "lancamentos") return;
    fetchEntriesMonth(month);
    fetchEntriesBeforeMonth(month);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, activeTab]);

  React.useEffect(() => {
    if (activeTab !== "lancamentos") return;
    fetchFixedEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  React.useEffect(() => {
    if (activeTab !== "controle") return;
    fetchCardAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  function openDialog(nextKind: EntryKind) {
    setKind(nextKind);
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(entry: FinanceEntry) {
    setKind(entry.kind);
    setEditing(entry);
    setDialogOpen(true);
  }

  async function upsertEntry(entry: FinanceEntry) {
    await busy.run(async () => {
      if (entry.isFixedTemplate) {
        const day = Number(entry.date.split("-")[2] ?? "1") || 1;

        const payload = {
          id: entry.id,
          kind: entry.kind,
          category: entry.category,
          description: entry.description,
          day_of_month: day, // NEW
        };

        const { error } = await supabase.from("fixed_entries").insert(payload);
        if (error) {
          console.error(error);
          alert("Erro ao salvar lançamento fixo. Veja o console.");
          return;
        }

        await fetchFixedEntries();
        await fetchEntriesMonth(month);
        return;
      }

      const payload = {
        id: entry.id,
        kind: entry.kind,
        date: entry.date,
        category: entry.category,
        description: entry.description,
        value: entry.value,
        fixed_entry_id: entry.fixedEntryId ?? null,
      };

      const exists = entries.some((p) => p.id === entry.id);

      const q = exists
        ? supabase.from("entries").update(payload).eq("id", entry.id)
        : supabase.from("entries").insert(payload);

      const { error } = await q;
      if (error) {
        console.error(error);
        alert("Erro ao salvar. Veja o console.");
        return;
      }

      await fetchEntriesMonth(month);
    });
  }

  async function upsertCardEntry(entry: FinanceEntry) {
    if (entry.kind === "investment") {
      alert("No Controle de gastos, só é permitido Receita ou Despesa.");
      return;
    }

    await busy.run(async () => {
      const payload = {
        id: entry.id,
        kind: entry.kind,
        date: entry.date,
        category: entry.category,
        description: entry.description,
        value: entry.value,
      };

      const exists = cardEntries.some((p) => p.id === entry.id);

      const q = exists
        ? supabase.from("card_entries").update(payload).eq("id", entry.id)
        : supabase.from("card_entries").insert(payload);

      const { error } = await q;
      if (error) {
        console.error(error);
        alert("Erro ao salvar (cartão). Veja o console.");
        return;
      }

      await fetchCardAll();
    });
  }

  async function deleteEntry(entry: FinanceEntry) {
    await busy.run(async () => {
      // Se for uma linha virtual (fixo), deletar o template
      if (entry.isVirtualFixed && entry.fixedEntryId) {
        const { error } = await supabase
          .from("fixed_entries")
          .delete()
          .eq("id", entry.fixedEntryId);

        if (error) {
          console.error(error);
          alert("Erro ao excluir lançamento fixo. Veja o console.");
          return;
        }

        await fetchFixedEntries();
        await fetchEntriesMonth(month);
        return;
      }

      // Caso contrário, é um lançamento normal (ocorrência do mês)
      const { error } = await supabase
        .from("entries")
        .delete()
        .eq("id", entry.id);
      if (error) {
        console.error(error);
        alert("Erro ao excluir. Veja o console.");
        return;
      }
      await fetchEntriesMonth(month);
    });
  }

  async function deleteCardEntry(entry: FinanceEntry) {
    await busy.run(async () => {
      const { error } = await supabase
        .from("card_entries")
        .delete()
        .eq("id", entry.id);

      if (error) {
        console.error(error);
        alert("Erro ao excluir (cartão). Veja o console.");
        return;
      }
      await fetchCardAll();
    });
  }

  async function deleteAllCardEntries() {
    await busy.run(async () => {
      const { error } = await supabase
        .from("card_entries")
        .delete()
        .gte("date", "0001-01-01");

      if (error) {
        console.error(error);
        alert("Erro ao excluir todos (cartão). Veja o console.");
        return;
      }

      setCardEntries([]);
    });
  }

  const entriesWithFixed = React.useMemo(() => {
    if (activeTab !== "lancamentos") return entries;

    const ym = month;
    const lastDay = lastDayOfMonthFromYM(ym);
    const openingBalance = calculateOpeningBalance(entriesBeforeMonth);
    const hasManualSaldoInCurrentMonth = entries.some(isSaldoEntry);
    const autoCarryover = hasManualSaldoInCurrentMonth
      ? null
      : createAutoCarryoverEntry(ym, openingBalance);

    const byFixedId = new Map<string, FinanceEntry>();
    for (const e of entries) {
      const fid = e.fixedEntryId ?? null;
      if (fid) byFixedId.set(fid, e);
    }

    const virtuals: FinanceEntry[] = autoCarryover ? [autoCarryover] : [];
    for (const f of fixedEntries) {
      if (byFixedId.has(f.id)) continue;

      const day = Math.max(1, Math.min(f.dayOfMonth, lastDay));
      const date = `${ym}-${String(day).padStart(2, "0")}`;

      virtuals.push({
        id: `virtual-${f.id}`,
        kind: f.kind,
        date,
        category: f.category as any,
        description: f.description,
        value: 0,
        createdAt: f.createdAt,
        fixedEntryId: f.id,
        isVirtualFixed: true,
      });
    }

    return [...entries, ...virtuals].sort(sortEntriesAsc);
  }, [activeTab, entries, entriesBeforeMonth, fixedEntries, month]);

  const visibleEntries =
    activeTab === "controle" ? cardEntries : entriesWithFixed;
  const onSubmit = activeTab === "controle" ? upsertCardEntry : upsertEntry;

  const tabTitle =
    activeTab === "lancamentos"
      ? "Lançamentos"
      : activeTab === "metas"
        ? "Metas"
        : "Controle de gastos";

  return (
    <div className="min-h-[100dvh] bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <div className="flex min-h-[100dvh]">
        <AppSidebar
          active={activeTab}
          onChange={setActiveTab}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapsed}
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-zinc-200/60 bg-white/75 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-zinc-800/60 dark:bg-zinc-950/75 dark:supports-[backdrop-filter]:bg-zinc-950/60">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 pb-4 pt-[calc(env(safe-area-inset-top)+16px)] sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  className="grid h-10 w-10 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 md:hidden dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900/40"
                  aria-label="Abrir menu"
                  onClick={() => setMobileMenuOpen(true)}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M4 6h16M4 12h16M4 18h16"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold leading-tight">
                    {tabTitle}
                  </p>
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    Bem-vindo(a), {displayName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <ThemeToggle />
                <UserMenu displayName={displayName} />
              </div>
            </div>
          </header>

          <main className="w-full flex-1 px-4 py-6 pb-[calc(env(safe-area-inset-bottom)+24px)] sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-7xl">
              {activeTab === "lancamentos" ? (
                <EntriesClient
                  month={month}
                  setMonth={setMonth}
                  entries={visibleEntries}
                  openDialog={openDialog}
                  onEdit={openEdit}
                  onDelete={(entry) => {
                    const isFixedVirtual = Boolean(
                      entry.isVirtualFixed && entry.fixedEntryId,
                    );
                    const ok = window.confirm(
                      isFixedVirtual
                        ? `Excluir este lançamento fixo?\n\n${entry.description}`
                        : `Excluir este lançamento?\n\n${entry.description} — ${entry.value}`,
                    );
                    if (ok) deleteEntry(entry);
                  }}
                />
              ) : null}

              {activeTab === "controle" ? (
                <CardControlClient
                  entries={visibleEntries}
                  openDialog={(k) => openDialog(k)}
                  onEdit={openEdit}
                  onDelete={(entry) => {
                    const ok = window.confirm(
                      `Excluir este lançamento do cartão?\n\n${entry.description} — ${entry.value}`,
                    );
                    if (ok) deleteCardEntry(entry);
                  }}
                  onDeleteAll={deleteAllCardEntries}
                />
              ) : null}

              {activeTab === "metas" ? <GoalsClient /> : null}

              <AddEntryDialog
                open={dialogOpen}
                kind={kind}
                allowFixed={activeTab === "lancamentos"}
                onClose={() => {
                  setDialogOpen(false);
                  setEditing(null);
                }}
                initial={editing}
                onSubmit={onSubmit}
              />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
