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
import { lastDayOfMonthFromYM } from "../lib/date";
import { sortEntriesAsc, type FixedEntry } from "../lib/entryMappers";
import {
  deleteAllCardEntryRecords,
  deleteCardEntryRecord,
  deleteFixedEntry,
  deleteMonthlyEntry,
  fetchCardEntries,
  fetchEntriesByMonth,
  fetchFixedEntries as fetchFixedEntryRows,
  saveFixedEntry,
  upsertCardEntryRecord,
  upsertMonthlyEntry,
} from "../lib/financeRepository";
import { supabase } from "../lib/supabaseClient";

export function HomeClient() {
  const [month, setMonth] = React.useState(() =>
    todayAsDateInputValue().slice(0, 7)
  );

  const [activeTab, setActiveTab] = React.useState<
    "lancamentos" | "controle" | "metas"
  >("lancamentos");

  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const [entries, setEntries] = React.useState<FinanceEntry[]>([]);
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
        setDisplayName((data?.display_name ?? data?.full_name ?? "").toString());
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

  const fetchEntriesMonth = React.useCallback(
    async (ym: string) => {
      await busy.run(async () => {
        try {
          setEntries(await fetchEntriesByMonth(ym));
        } catch (error) {
          console.error(error);
        }
      });
    },
    [busy]
  );

  const fetchFixedEntries = React.useCallback(async () => {
    await busy.run(async () => {
      try {
        setFixedEntries(await fetchFixedEntryRows());
      } catch (error) {
        console.error(error);
      }
    });
  }, [busy]);

  const fetchCardAll = React.useCallback(async () => {
    await busy.run(async () => {
      try {
        setCardEntries(await fetchCardEntries());
      } catch (error) {
        console.error(error);
      }
    });
  }, [busy]);

  React.useEffect(() => {
    if (activeTab !== "lancamentos") return;
    fetchEntriesMonth(month);
  }, [month, activeTab, fetchEntriesMonth]);

  React.useEffect(() => {
    if (activeTab !== "lancamentos") return;
    fetchFixedEntries();
  }, [activeTab, fetchFixedEntries]);

  React.useEffect(() => {
    if (activeTab !== "controle") return;
    fetchCardAll();
  }, [activeTab, fetchCardAll]);

  const openDialog = React.useCallback((nextKind: EntryKind) => {
    setKind(nextKind);
    setEditing(null);
    setDialogOpen(true);
  }, []);

  const openEdit = React.useCallback((entry: FinanceEntry) => {
    setKind(entry.kind);
    setEditing(entry);
    setDialogOpen(true);
  }, []);

  async function upsertEntry(entry: FinanceEntry) {
    await busy.run(async () => {
      try {
        if (entry.isFixedTemplate) {
          await saveFixedEntry(entry);
          await fetchFixedEntries();
          await fetchEntriesMonth(month);
          return;
        }

        const exists = entries.some((p) => p.id === entry.id);
        await upsertMonthlyEntry(entry, exists);
        await fetchEntriesMonth(month);
      } catch (error) {
        console.error(error);
        alert(
          entry.isFixedTemplate
            ? "Erro ao salvar lançamento fixo. Veja o console."
            : "Erro ao salvar. Veja o console."
        );
      }
    });
  }

  async function upsertCardEntry(entry: FinanceEntry) {
    if (entry.kind === "investment") {
      alert("No Controle de gastos, só é permitido Receita ou Despesa.");
      return;
    }

    await busy.run(async () => {
      try {
        const exists = cardEntries.some((p) => p.id === entry.id);
        await upsertCardEntryRecord(entry, exists);
        await fetchCardAll();
      } catch (error) {
        console.error(error);
        alert("Erro ao salvar (cartão). Veja o console.");
      }
    });
  }

  async function deleteEntry(entry: FinanceEntry) {
    await busy.run(async () => {
      try {
        if (entry.isVirtualFixed && entry.fixedEntryId) {
          await deleteFixedEntry(entry.fixedEntryId);
          await fetchFixedEntries();
          await fetchEntriesMonth(month);
          return;
        }

        await deleteMonthlyEntry(entry.id);
        await fetchEntriesMonth(month);
      } catch (error) {
        console.error(error);
        alert(
          entry.isVirtualFixed
            ? "Erro ao excluir lançamento fixo. Veja o console."
            : "Erro ao excluir. Veja o console."
        );
      }
    });
  }

  async function deleteCardEntry(entry: FinanceEntry) {
    await busy.run(async () => {
      try {
        await deleteCardEntryRecord(entry.id);
        await fetchCardAll();
      } catch (error) {
        console.error(error);
        alert("Erro ao excluir (cartão). Veja o console.");
      }
    });
  }

  async function deleteAllCardEntries() {
    await busy.run(async () => {
      try {
        await deleteAllCardEntryRecords();
        setCardEntries([]);
      } catch (error) {
        console.error(error);
        alert("Erro ao excluir todos (cartão). Veja o console.");
      }
    });
  }

  const entriesWithFixed = React.useMemo(() => {
    if (activeTab !== "lancamentos") return entries;

    const ym = month;
    const lastDay = lastDayOfMonthFromYM(ym);

    const byFixedId = new Map<string, FinanceEntry>();
    for (const e of entries) {
      const fid = e.fixedEntryId ?? null;
      if (fid) byFixedId.set(fid, e);
    }

    const virtuals: FinanceEntry[] = [];
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
  }, [activeTab, entries, fixedEntries, month]);

  const visibleEntries = activeTab === "controle" ? cardEntries : entriesWithFixed;
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
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M4 6h16M4 12h16M4 18h16"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold leading-tight">{tabTitle}</p>
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
                    const isFixedVirtual = Boolean(entry.isVirtualFixed && entry.fixedEntryId);
                    const ok = window.confirm(
                      isFixedVirtual
                        ? `Excluir este lançamento fixo?\n\n${entry.description}`
                        : `Excluir este lançamento?\n\n${entry.description} — ${entry.value}`
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
                      `Excluir este lançamento do cartão?\n\n${entry.description} — ${entry.value}`
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
