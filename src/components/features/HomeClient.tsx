"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { AppSidebar, type NavKey } from "@/components/layout/AppSidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { MobileActionSheet } from "@/components/features/MobileActionSheet";
import { UserMenu } from "@/components/layout/UserMenu";
import { todayAsDateInputValue, type EntryKind, type FinanceEntry } from "@/lib/finance";
import { useCardEntries } from "@/hooks/useCardEntries";
import { useMonthlyEntries } from "@/hooks/useMonthlyEntries";
import { useProfile } from "@/hooks/useProfile";

const EntriesClient = dynamic(
  () => import("@/components/features/EntriesClient").then((m) => m.EntriesClient),
  { loading: () => <SectionFallback /> },
);
const CardControlClient = dynamic(
  () => import("@/components/features/CardControlClient").then((m) => m.CardControlClient),
  { loading: () => <SectionFallback /> },
);
const GoalsClient = dynamic(
  () => import("@/components/features/GoalsClient").then((m) => m.GoalsClient),
  { loading: () => <SectionFallback /> },
);
const AddEntryDialog = dynamic(
  () => import("@/components/features/AddEntryDialog").then((m) => m.AddEntryDialog),
);
const SalaryDistributionClient = dynamic(
  () => import("@/components/features/SalaryDistributionClient").then((m) => m.SalaryDistributionClient),
  { loading: () => <SectionFallback /> },
);

const TAB_TITLES: Record<NavKey, string> = {
  lancamentos: "Lançamentos Pessoais",
  lancamentos_pj: "Lançamentos PJ",
  distribuicao_pj: "Distribuição de Salário PJ",
  metas: "Metas Financeiras",
  controle: "Controle de Gastos",
};

const TAB_DESCRIPTIONS: Record<NavKey, string> = {
  lancamentos: "Acompanhe suas receitas, despesas e investimentos",
  lancamentos_pj: "Gerencie as finanças da sua empresa",
  distribuicao_pj: "Planeje a distribuição do seu faturamento",
  metas: "Defina e acompanhe suas metas financeiras",
  controle: "Controle os gastos do cartão de crédito",
};

function SectionFallback() {
  return (
    <div className="grid gap-4">
      <div className="skeleton h-40 w-full rounded-2xl" />
      <div className="skeleton h-64 w-full rounded-2xl" />
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
  const showFAB =
    activeTab !== "metas" && activeTab !== "distribuicao_pj"
      ? isMonthlyTab || activeTab === "controle"
      : activeTab === "metas";

  const personalMonthlyEntries = useMonthlyEntries(month, activeTab === "lancamentos", "personal");
  const businessMonthlyEntries = useMonthlyEntries(month, isBusinessTab, "business");
  const cardEntries = useCardEntries(activeTab === "controle");

  const activeMonthlyEntries = isBusinessTab ? businessMonthlyEntries : personalMonthlyEntries;
  const visibleEntries = activeTab === "controle" ? cardEntries.entries : activeMonthlyEntries.visibleEntries;
  const onSubmit = activeTab === "controle" ? cardEntries.upsertEntry : activeMonthlyEntries.upsertEntry;

  React.useEffect(() => {
    try {
      if (window.localStorage.getItem("sidebar_collapsed") === "1") setSidebarCollapsed(true);
    } catch { }
  }, []);

  const toggleSidebarCollapsed = React.useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try { window.localStorage.setItem("sidebar_collapsed", next ? "1" : "0"); } catch { }
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
    <div className="min-h-[100dvh] bg-[var(--background)] text-[var(--foreground)]">
      <div className="flex min-h-[100dvh]">
        <AppSidebar
          active={activeTab}
          onChange={setActiveTab}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapsed}
          mobileOpen={false}
          onMobileClose={() => { }}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Header */}
          <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-xl">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8"
              style={{ paddingTop: "calc(env(safe-area-inset-top) + 14px)", paddingBottom: "14px" }}>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[var(--foreground)] leading-tight">
                  {TAB_TITLES[activeTab]}
                </p>
                <p className="truncate text-xs text-[var(--muted)] leading-tight mt-0.5">
                  {TAB_DESCRIPTIONS[activeTab]}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <ThemeToggle />
                <UserMenu displayName={displayName} />
              </div>
            </div>
          </header>

          {/* Main */}
          <main
            className="w-full flex-1 px-4 py-6 sm:px-6 lg:px-8"
            style={{
              paddingBottom: "calc(env(safe-area-inset-bottom) + 160px)",
            }}
          >
            <div className="mx-auto w-full max-w-7xl md:[padding-bottom:24px]">
              {isMonthlyTab && (
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
                      ? "Registre entradas, saídas e investimentos da conta PJ."
                      : "Registre receitas, despesas e investimentos do mês."
                  }
                />
              )}

              {activeTab === "controle" && (
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
              )}

              {activeTab === "metas" && <GoalsClient addTrigger={goalAddTrigger} />}

              {activeTab === "distribuicao_pj" && <SalaryDistributionClient />}

              {dialogOpen && (
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
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile navigation */}
      <BottomNav active={activeTab} onChange={setActiveTab} />

      {/* FAB */}
      {showFAB && (
        <MobileActionSheet
          activeTab={activeTab}
          onSelectEntry={openDialog}
          onAddGoal={() => setGoalAddTrigger((v) => v + 1)}
        />
      )}
    </div>
  );
}
