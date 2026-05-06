"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { ThemeToggle } from "./ThemeToggle";
import { AppSidebar } from "./AppSidebar";
import { BottomNav } from "./BottomNav";
import { MobileActionSheet } from "./MobileActionSheet";
import { UserMenu } from "./UserMenu";
import { todayAsDateInputValue, type EntryKind, type FinanceEntry } from "../lib/finance";
import { useCardEntries } from "../hooks/useCardEntries";
import { useMonthlyEntries } from "../hooks/useMonthlyEntries";
import { useProfile } from "../hooks/useProfile";
import type { NavKey } from "./AppSidebar";

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

const SalaryDistributionClient = dynamic(
  () => import("./SalaryDistributionClient").then((mod) => mod.SalaryDistributionClient),
  { loading: () => <SectionFallback label="Carregando distribuição de salário..." /> },
);

const TAB_TITLES: Record<NavKey, string> = {
  lancamentos: "Lançamentos",
  lancamentos_pj: "Lançamentos PJ",
  distribuicao_pj: "Distribuição de Salário PJ",
  metas: "Metas",
  controle: "Controle de gastos",
};

const TAB_SUBTITLES: Record<NavKey, string> = {
  lancamentos: "Receitas, despesas e investimentos",
  lancamentos_pj: "Conta pessoa jurídica",
  distribuicao_pj: "Planeje seu faturamento",
  metas: "Acompanhe sua evolução",
  controle: "Visão geral sem filtro de mês",
};

function SectionFallback({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-green-100 bg-white p-8 text-center text-sm text-zinc-500 dark:border-green-900/30 dark:bg-zinc-950 dark:text-zinc-400">
      <div className="mb-3 flex justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-200 border-t-green-600" />
      </div>
      {label}
    </div>
  );
}

export function HomeClient() {
  const [month, setMonth] = React.useState(() => todayAsDateInputValue().slice(0, 7));
  const [activeTab, setActiveTab] = React.useState<NavKey>("lancamentos");
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [kind, setKind] = React.useState<EntryKind>("income");
  const [editing, setEditing] = React.useState<FinanceEntry | null>(null);
  const [goalAddTrigger, setGoalAddTrigger] = React.useState(0);

  const { displayName } = useProfile();

  const isBusinessTab = activeTab === "lancamentos_pj";
  const isMonthlyTab = activeTab === "lancamentos" || isBusinessTab;
  const showFAB = activeTab !== "metas" && activeTab !== "distribuicao_pj"
    ? isMonthlyTab || activeTab === "controle"
    : activeTab === "metas";

  const personalMonthlyEntries = useMonthlyEntries(month, activeTab === "lancamentos", "personal");
  const businessMonthlyEntries = useMonthlyEntries(month, isBusinessTab, "business");
  const cardEntries = useCardEntries(activeTab === "controle");

  const activeMonthlyEntries = isBusinessTab ? businessMonthlyEntries : personalMonthlyEntries;
  const visibleEntries =
    activeTab === "controle" ? cardEntries.entries : activeMonthlyEntries.visibleEntries;
  const onSubmit =
    activeTab === "controle" ? cardEntries.upsertEntry : activeMonthlyEntries.upsertEntry;

  React.useEffect(() => {
    try {
      if (window.localStorage.getItem("sidebar_collapsed") === "1") setSidebarCollapsed(true);
    } catch {}
  }, []);

  const toggleSidebarCollapsed = React.useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try { window.localStorage.setItem("sidebar_collapsed", next ? "1" : "0"); } catch {}
      return next;
    });
  }, []);

  React.useEffect(() => {
    setDialogOpen(false);
    setEditing(null);
    setGoalAddTrigger(0);
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

  return (
    <div className="min-h-[100dvh] bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="flex min-h-[100dvh]">
        <AppSidebar
          active={activeTab}
          onChange={setActiveTab}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapsed}
          mobileOpen={false}
          onMobileClose={() => {}}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-green-100/80 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:border-green-900/20 dark:bg-zinc-950/80 dark:supports-[backdrop-filter]:bg-zinc-950/70">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+12px)] sm:px-6 lg:px-8">
              <div className="min-w-0">
                <p className="truncate text-base font-bold leading-tight text-zinc-900 dark:text-zinc-50">
                  {TAB_TITLES[activeTab]}
                </p>
                <p className="truncate text-xs font-medium text-zinc-400 dark:text-zinc-500">
                  {TAB_SUBTITLES[activeTab]}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <ThemeToggle />
                <UserMenu displayName={displayName} />
              </div>
            </div>
          </header>

          <main className="w-full flex-1 px-4 py-6 sm:px-6 lg:px-8
            pb-[calc(env(safe-area-inset-bottom)+160px)]
            md:pb-[calc(env(safe-area-inset-bottom)+32px)]">
            <div className="mx-auto w-full max-w-7xl">
              {isMonthlyTab ? (
                <EntriesClient
                  month={month}
                  setMonth={setMonth}
                  entries={visibleEntries}
                  openDialog={openDialog}
                  onEdit={openEdit}
                  isPJ={isBusinessTab}
                  onDelete={(entry) => {
                    const isFixedVirtual = Boolean(entry.isVirtualFixed && entry.fixedEntryId);
                    const ok = window.confirm(
                      isFixedVirtual
                        ? `Excluir este lançamento fixo?\n\n${entry.description}`
                        : `Excluir este lançamento?\n\n${entry.description} — ${entry.value}`,
                    );
                    if (ok) activeMonthlyEntries.deleteEntry(entry);
                  }}
                  title={isBusinessTab ? "Lançamentos PJ" : "Lançamentos"}
                  description={
                    isBusinessTab
                      ? "Registre receitas, despesas e investimentos da conta PJ."
                      : "Registre receitas, despesas e investimentos do mês."
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

              {activeTab === "metas" ? (
                <GoalsClient addTrigger={goalAddTrigger} />
              ) : null}

              {activeTab === "distribuicao_pj" ? (
                <SalaryDistributionClient />
              ) : null}

              {dialogOpen ? (
                <AddEntryDialog
                  open={dialogOpen}
                  kind={kind}
                  allowFixed={isMonthlyTab}
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

      <BottomNav active={activeTab} onChange={setActiveTab} />

      {showFAB ? (
        <MobileActionSheet
          activeTab={activeTab}
          onSelectEntry={openDialog}
          onAddGoal={() => setGoalAddTrigger((v) => v + 1)}
        />
      ) : null}
    </div>
  );
}
