"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { AppSidebar, type NavKey } from "@/components/layout/AppSidebar";
import { UserMenu } from "@/components/layout/UserMenu";
import { NotificationBell } from "@/components/features/NotificationBell";
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
const CltDistributionClient = dynamic(
  () => import("@/components/features/CltDistributionClient").then((m) => m.CltDistributionClient),
  { loading: () => <SectionFallback /> },
);
const AlertsClient = dynamic(
  () => import("@/components/features/AlertsClient").then((m) => m.AlertsClient),
  { loading: () => <SectionFallback /> },
);
const DashboardClient = dynamic(
  () => import("@/components/features/DashboardClient").then((m) => m.DashboardClient),
  { loading: () => <SectionFallback /> },
);
const MobileActionSheet = dynamic(
  () => import("@/components/features/MobileActionSheet").then((m) => m.MobileActionSheet),
);

const TAB_TITLES: Record<NavKey, string> = {
  dashboard: "Dashboard",
  lancamentos: "Lançamentos Pessoais",
  lancamentos_pj: "Lançamentos PJ",
  distribuicao_pj: "Distribuição de Salário PJ",
  distribuicao_clt: "Distribuição de Salário CLT",
  metas: "Metas Financeiras",
  controle: "Controle de Gastos",
  alertas: "Alertas de Contas",
};

const TAB_DESCRIPTIONS: Record<NavKey, string> = {
  dashboard: "Visão geral das suas finanças",
  lancamentos: "Acompanhe suas receitas, despesas e investimentos",
  lancamentos_pj: "Gerencie as finanças da sua empresa",
  distribuicao_pj: "Planeje a distribuição do seu faturamento",
  distribuicao_clt: "Planeje a distribuição do seu salário CLT",
  metas: "Defina e acompanhe suas metas financeiras",
  controle: "Controle os gastos do cartão de crédito",
  alertas: "Gerencie alertas de contas a vencer",
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
  const [activeTab, setActiveTab] = React.useState<NavKey>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [kind, setKind] = React.useState<EntryKind>("income");
  const [editing, setEditing] = React.useState<FinanceEntry | null>(null);
  const [goalAddTrigger, setGoalAddTrigger] = React.useState(0);

  const { displayName } = useProfile();

  const isBusinessTab = activeTab === "lancamentos_pj";
  const isMonthlyTab = activeTab === "lancamentos" || isBusinessTab;
  const showFAB =
    activeTab !== "metas" && activeTab !== "distribuicao_pj" && activeTab !== "distribuicao_clt" && activeTab !== "alertas" && activeTab !== "dashboard"
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
    setMobileMenuOpen(false);
  }, [activeTab]);

  // Close mobile menu on outside click
  React.useEffect(() => {
    if (!mobileMenuOpen) return;
    function handleKey(e: KeyboardEvent) { if (e.key === "Escape") setMobileMenuOpen(false); }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [mobileMenuOpen]);

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

  function handleTabChange(tab: NavKey) {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  }

  return (
    <div className="min-h-[100dvh] bg-[var(--background)] text-[var(--foreground)]">
      <div className="flex min-h-[100dvh]">
        {/* Desktop sidebar */}
        <AppSidebar
          active={activeTab}
          onChange={handleTabChange}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapsed}
          mobileOpen={false}
          onMobileClose={() => { }}
        />

        {/* Mobile slide-over menu */}
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden
            />
            <div className="fixed inset-y-0 left-0 z-50 w-72 md:hidden" style={{ backgroundColor: "var(--sidebar-bg)" }}>
              <AppSidebar
                active={activeTab}
                onChange={handleTabChange}
                collapsed={false}
                onToggleCollapse={() => setMobileMenuOpen(false)}
                mobileOpen={mobileMenuOpen}
                onMobileClose={() => setMobileMenuOpen(false)}
                forMobile
              />
            </div>
          </>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Header */}
          <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-xl">
            <div
              className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8"
              style={{ paddingTop: "calc(env(safe-area-inset-top) + 14px)", paddingBottom: "14px" }}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Hamburguer — mobile only */}
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen((v) => !v)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] transition-colors hover:bg-[var(--surface-raised)] hover:text-[var(--foreground)] md:hidden"
                  aria-label="Abrir menu"
                  aria-expanded={mobileMenuOpen}
                >
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
                    <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>

                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[var(--foreground)] leading-tight">
                    {TAB_TITLES[activeTab]}
                  </p>
                  <p className="truncate text-xs text-[var(--muted)] leading-tight mt-0.5">
                    {TAB_DESCRIPTIONS[activeTab]}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <NotificationBell onNavigateAlerts={() => setActiveTab("alertas")} />
                <ThemeToggle />
                <UserMenu displayName={displayName} />
              </div>
            </div>
          </header>

          {/* Main */}
          <main
            className="w-full flex-1 px-4 py-6 sm:px-6 lg:px-8"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 32px)" }}
          >
            <div className="mx-auto w-full max-w-7xl">
              {activeTab === "dashboard" && (
                <DashboardClient onNavigateAlerts={() => setActiveTab("alertas")} />
              )}

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
                  onDeleteSelected={cardEntries.removeSelected}
                />
              )}

              {activeTab === "metas" && <GoalsClient addTrigger={goalAddTrigger} />}
              {activeTab === "distribuicao_pj" && <SalaryDistributionClient />}
              {activeTab === "distribuicao_clt" && <CltDistributionClient />}
              {activeTab === "alertas" && <AlertsClient />}

              {dialogOpen && (
                <AddEntryDialog
                  open={dialogOpen}
                  kind={kind}
                  allowFixed={isMonthlyTab}
                  onClose={() => { setDialogOpen(false); setEditing(null); }}
                  initial={editing}
                  onSubmit={onSubmit}
                />
              )}
            </div>
          </main>
        </div>
      </div>

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
