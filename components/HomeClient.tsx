"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { ThemeToggle } from "./ThemeToggle";
import { AppSidebar } from "./AppSidebar";
import { UserMenu } from "./UserMenu";
import { todayAsDateInputValue, type EntryKind, type FinanceEntry } from "../lib/finance";
import { useCardEntries } from "../hooks/useCardEntries";
import { useMonthlyEntries } from "../hooks/useMonthlyEntries";
import { useProfile } from "../hooks/useProfile";

const EntriesClient = dynamic(
  () => import("./EntriesClient").then((mod) => mod.EntriesClient),
  { loading: () => <SectionFallback label="Carregando lançamentos..." /> },
);

const CardControlClient = dynamic(
  () => import("./CardControlClient").then((mod) => mod.CardControlClient),
  { loading: () => <SectionFallback label="Carregando controle de gastos..." /> },
);

const GoalsClient = dynamic(
  () => import("./GoalsClient").then((mod) => mod.GoalsClient),
  { loading: () => <SectionFallback label="Carregando metas..." /> },
);

const AddEntryDialog = dynamic(
  () => import("./AddEntryDialog").then((mod) => mod.AddEntryDialog),
);

type ActiveTab = "lancamentos" | "lancamentos_pj" | "controle" | "metas";

function SectionFallback({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
      {label}
    </div>
  );
}

export function HomeClient() {
  const [month, setMonth] = React.useState(() => todayAsDateInputValue().slice(0, 7));
  const [activeTab, setActiveTab] = React.useState<ActiveTab>("lancamentos");

  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [kind, setKind] = React.useState<EntryKind>("income");
  const [editing, setEditing] = React.useState<FinanceEntry | null>(null);

  const { displayName } = useProfile();
  const personalMonthlyEntries = useMonthlyEntries(month, activeTab === "lancamentos", "personal");
  const businessMonthlyEntries = useMonthlyEntries(
    month,
    activeTab === "lancamentos_pj",
    "business",
  );
  const cardEntries = useCardEntries(activeTab === "controle");

  React.useEffect(() => {
    try {
      const value = window.localStorage.getItem("sidebar_collapsed");
      if (value === "1") setSidebarCollapsed(true);
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
    setDialogOpen(false);
    setEditing(null);
    setMobileMenuOpen(false);
  }, [activeTab]);

  function openDialog(nextKind: EntryKind) {
    setKind(nextKind);
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(entry: FinanceEntry) {
    if (entry.isAutoCarryover) return;
    setKind(entry.kind);
    setEditing(entry);
    setDialogOpen(true);
  }

  const isBusinessEntriesTab = activeTab === "lancamentos_pj";
  const isMonthlyEntriesTab = activeTab === "lancamentos" || isBusinessEntriesTab;
  const activeMonthlyEntries = isBusinessEntriesTab
    ? businessMonthlyEntries
    : personalMonthlyEntries;

  const visibleEntries =
    activeTab === "controle" ? cardEntries.entries : activeMonthlyEntries.visibleEntries;

  const onSubmit =
    activeTab === "controle" ? cardEntries.upsertEntry : activeMonthlyEntries.upsertEntry;

  const tabTitle =
    activeTab === "lancamentos"
      ? "Lançamentos"
      : activeTab === "lancamentos_pj"
        ? "Lançamentos PJ"
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
              {isMonthlyEntriesTab ? (
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
                        : `Excluir este lançamento?\n\n${entry.description} — ${entry.value}`,
                    );
                    if (ok) activeMonthlyEntries.deleteEntry(entry);
                  }}
                  title={isBusinessEntriesTab ? "Lançamentos PJ" : "Lançamentos"}
                  description={
                    isBusinessEntriesTab
                      ? "Registre receitas, despesas e investimentos da conta PJ."
                      : "Registre receitas, despesas e investimentos do mês."
                  }
                  incomeChartTitle={
                    isBusinessEntriesTab ? "Receitas da conta PJ" : "De onde vem meu dinheiro"
                  }
                  expenseChartTitle={
                    isBusinessEntriesTab ? "Despesas da conta PJ" : "Onde estou gastando mais"
                  }
                  investmentChartTitle={
                    isBusinessEntriesTab ? "Investimentos da conta PJ" : "Onde estou investindo"
                  }
                />
              ) : null}

              {activeTab === "controle" ? (
                <CardControlClient
                  entries={visibleEntries}
                  openDialog={(entryKind) => openDialog(entryKind)}
                  onEdit={openEdit}
                  onDelete={(entry) => {
                    const ok = window.confirm(
                      `Excluir este lançamento do cartão?\n\n${entry.description} — ${entry.value}`,
                    );
                    if (ok) cardEntries.removeEntry(entry);
                  }}
                  onDeleteAll={cardEntries.removeAll}
                />
              ) : null}

              {activeTab === "metas" ? <GoalsClient /> : null}

              {dialogOpen ? (
                <AddEntryDialog
                  open={dialogOpen}
                  kind={kind}
                  allowFixed={isMonthlyEntriesTab}
                  onClose={() => {
                    setDialogOpen(false);
                    setEditing(null);
                  }}
                  initial={editing}
                  onSubmit={onSubmit}
                />
              ) : null}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
