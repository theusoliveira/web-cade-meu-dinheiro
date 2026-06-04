"use client";

import * as React from "react";
import { Card } from "@/components/ui/Card";
import { useBusy } from "@/components/features/BusyProvider";
import { fetchMonthlyEntries, fetchOpeningBalance } from "@/actions/entries";
import { fetchDueAlerts, type AlertRecord } from "@/actions/alerts";
import { fetchGoals } from "@/actions/goals";
import { formatCurrencyBRL, formatDateBR, todayAsDateInputValue } from "@/lib/finance";
import type { GoalRecord } from "@/actions/goals";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysUntil(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${dueDate}T00:00:00`);
  return Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
}

function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function DashStatCard({
  label,
  value,
  color = "neutral",
  icon,
}: {
  label: string;
  value: string;
  color?: "income" | "expense" | "investment" | "balance" | "neutral";
  icon: React.ReactNode;
}) {
  const borderColors = {
    income: "border-l-emerald-500",
    expense: "border-l-rose-500",
    investment: "border-l-sky-500",
    balance: "border-l-amber-400",
    neutral: "border-l-transparent",
  };
  return (
    <div className={`rounded-2xl border border-[var(--border)] border-l-4 ${borderColors[color]} bg-[var(--surface)] p-5 flex items-start gap-4`}>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">{label}</p>
        <p className="mt-1.5 text-2xl font-bold text-[var(--foreground)] truncate">{value}</p>
      </div>
      <div className="shrink-0 rounded-xl bg-[var(--surface-raised)] p-2.5 text-[var(--muted)]">
        {icon}
      </div>
    </div>
  );
}

// ─── Mini Bar ─────────────────────────────────────────────────────────────────

function MiniProgressBar({ value, max, color = "#10b981" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--border)]">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

type Totals = { income: number; expense: number; investment: number; balance: number };

export function DashboardClient({ onNavigateAlerts }: { onNavigateAlerts?: () => void }) {
  const currentMonth = todayAsDateInputValue().slice(0, 7);
  const [totals, setTotals] = React.useState<Totals>({ income: 0, expense: 0, investment: 0, balance: 0 });
  const [openingBalance, setOpeningBalance] = React.useState(0);
  const [dueAlerts, setDueAlerts] = React.useState<AlertRecord[]>([]);
  const [goals, setGoals] = React.useState<GoalRecord[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const { run } = useBusy();

  React.useEffect(() => {
    let alive = true;
    run(async () => {
      try {
        const [entries, ob, alerts, goalList] = await Promise.all([
          fetchMonthlyEntries(currentMonth, "personal"),
          fetchOpeningBalance(currentMonth, "personal"),
          fetchDueAlerts(),
          fetchGoals(),
        ]);

        if (!alive) return;

        let income = 0, expense = 0, investment = 0;
        for (const e of entries) {
          if (e.kind === "income") income += e.value;
          else if (e.kind === "expense") expense += e.value;
          else investment += e.value;
        }
        setTotals({ income, expense, investment, balance: ob + income - expense - investment });
        setOpeningBalance(ob);
        setDueAlerts(alerts);
        setGoals(goalList);
        setLoaded(true);
      } catch (err) {
        console.error(err);
      }
    });
    return () => { alive = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth]);

  const savingsRate = totals.income > 0
    ? Math.max(0, ((totals.income - totals.expense) / totals.income) * 100)
    : 0;

  const expenseRate = totals.income > 0
    ? Math.min(100, (totals.expense / totals.income) * 100)
    : 0;

  if (!loaded) {
    return (
      <div className="grid gap-4 animate-fade-in">
        <div className="skeleton h-10 w-48 rounded-xl" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-[var(--foreground)]">Dashboard</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Visão geral de {monthLabel(currentMonth)}
        </p>
      </div>

      {/* ─── KPIs ─────────────────────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DashStatCard
          label="Receitas"
          value={formatCurrencyBRL(totals.income)}
          color="income"
          icon={<svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden><path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clipRule="evenodd" /></svg>}
        />
        <DashStatCard
          label="Despesas"
          value={formatCurrencyBRL(totals.expense)}
          color="expense"
          icon={<svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden><path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clipRule="evenodd" /></svg>}
        />
        <DashStatCard
          label="Investimentos"
          value={formatCurrencyBRL(totals.investment)}
          color="investment"
          icon={<svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden><path fillRule="evenodd" d="M12.577 4.878a.75.75 0 01.919-.53l4.78 1.281a.75.75 0 01.531.919l-1.281 4.78a.75.75 0 01-1.449-.387l.81-3.022a19.407 19.407 0 00-5.594 5.203.75.75 0 01-1.139.093L7 10.06l-3.72 3.72a.75.75 0 11-1.06-1.061l4.25-4.25a.75.75 0 011.06 0l1.956 1.956a20.924 20.924 0 015.293-5.136l-3.023.81a.75.75 0 01-.387-1.45z" clipRule="evenodd" /></svg>}
        />
        <DashStatCard
          label="Saldo disponível"
          value={formatCurrencyBRL(totals.balance)}
          color="balance"
          icon={<svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden><path d="M10.75 10.818v2.614A3.13 3.13 0 0011.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.560-.612-.875a3.13 3.13 0 00-1.138-.432zM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603a2.45 2.45 0 00-.35.13c-.14.065-.27.143-.386.235-.737.576-.738 1.205-.184 1.692z" /><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v.022a2.68 2.68 0 011.418.504c.478.317.832.803.832 1.474s-.354 1.157-.832 1.474A2.68 2.68 0 0110.75 12v.022a1 1 0 11-2 0v-.043a2.68 2.68 0 01-1.08-.476C7.192 11.157 6.75 10.596 6.75 9.875c0-.62.327-1.07.751-1.352.14-.092.293-.165.449-.22V8z" clipRule="evenodd" /></svg>}
        />
      </div>

      {/* ─── Análise financeira ───────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Taxa de poupança */}
        <Card>
          <p className="mb-1 text-sm font-bold text-[var(--foreground)]">Taxa de poupança</p>
          <p className="text-xs text-[var(--muted)] mb-4">Quanto da receita você está guardando este mês</p>
          <div className="flex items-end justify-between mb-2">
            <span className="text-3xl font-bold text-[var(--foreground)]">{savingsRate.toFixed(1)}%</span>
            <span className="text-xs text-[var(--muted)]">
              {savingsRate >= 20 ? "✅ Ótimo!" : savingsRate >= 10 ? "⚠️ Pode melhorar" : "🔴 Atenção"}
            </span>
          </div>
          <MiniProgressBar value={savingsRate} max={100} color={savingsRate >= 20 ? "#10b981" : savingsRate >= 10 ? "#f59e0b" : "#e11d48"} />
        </Card>

        {/* Comprometimento de renda */}
        <Card>
          <p className="mb-1 text-sm font-bold text-[var(--foreground)]">Comprometimento da renda</p>
          <p className="text-xs text-[var(--muted)] mb-4">Percentual gasto em relação às receitas</p>
          <div className="flex items-end justify-between mb-2">
            <span className="text-3xl font-bold text-[var(--foreground)]">{expenseRate.toFixed(1)}%</span>
            <span className="text-xs text-[var(--muted)]">
              {expenseRate <= 70 ? "✅ Controlado" : expenseRate <= 90 ? "⚠️ Elevado" : "🔴 Crítico"}
            </span>
          </div>
          <MiniProgressBar value={expenseRate} max={100} color={expenseRate <= 70 ? "#10b981" : expenseRate <= 90 ? "#f59e0b" : "#e11d48"} />
        </Card>
      </div>

      {/* ─── Alertas e Metas ──────────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Alertas */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-bold text-[var(--foreground)]">Contas a vencer</p>
            {onNavigateAlerts && (
              <button
                type="button"
                onClick={onNavigateAlerts}
                className="text-xs font-semibold text-[var(--accent)] hover:text-[var(--accent-dark)] transition-colors"
              >
                Ver todos →
              </button>
            )}
          </div>
          {dueAlerts.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-[var(--muted)]" aria-hidden>
                <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-sm text-[var(--muted)]">Nenhuma conta a vencer</p>
            </div>
          ) : (
            <ul className="grid gap-2">
              {dueAlerts.slice(0, 4).map((a) => {
                const days = daysUntil(a.dueDate);
                return (
                  <li key={a.id} className="flex items-center gap-3 rounded-xl bg-[var(--surface-raised)] px-3 py-2.5">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${days === 0 ? "bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400" : "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"}`}>
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
                        <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--foreground)] truncate">{a.name}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {formatDateBR(a.dueDate)} · {days === 0 ? "Hoje!" : `${days} dia${days !== 1 ? "s" : ""}`}
                        {a.expectedValue != null && ` · ${formatCurrencyBRL(a.expectedValue)}`}
                      </p>
                    </div>
                  </li>
                );
              })}
              {dueAlerts.length > 4 && (
                <li className="text-center text-xs text-[var(--muted)] py-1">
                  +{dueAlerts.length - 4} outras contas
                </li>
              )}
            </ul>
          )}
        </Card>

        {/* Metas */}
        <Card>
          <p className="mb-4 text-sm font-bold text-[var(--foreground)]">Progresso das metas</p>
          {goals.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-[var(--muted)]" aria-hidden>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
              </svg>
              <p className="text-sm text-[var(--muted)]">Nenhuma meta cadastrada</p>
            </div>
          ) : (
            <ul className="grid gap-3">
              {goals.slice(0, 4).map((g) => {
                const pct = g.targetValue > 0 ? Math.min(100, (g.currentValue / g.targetValue) * 100) : 0;
                return (
                  <li key={g.id}>
                    <div className="mb-1 flex items-center justify-between">
                      <p className="text-xs font-semibold text-[var(--foreground)] truncate">{g.description || "Meta"}</p>
                      <span className="text-xs text-[var(--muted)] shrink-0 ml-2">{pct.toFixed(0)}%</span>
                    </div>
                    <MiniProgressBar value={pct} max={100} color={pct >= 100 ? "#10b981" : "#0284c7"} />
                    <div className="mt-1 flex justify-between text-[10px] text-[var(--muted)]">
                      <span>{formatCurrencyBRL(g.currentValue)}</span>
                      <span>{formatCurrencyBRL(g.targetValue)}</span>
                    </div>
                  </li>
                );
              })}
              {goals.length > 4 && (
                <li className="text-center text-xs text-[var(--muted)]">+{goals.length - 4} outras metas</li>
              )}
            </ul>
          )}
        </Card>
      </div>

      {/* ─── Saldo anterior ───────────────────────────────────────────────── */}
      {/* <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-[var(--foreground)]">Saldo inicial do mês</p>
            <p className="mt-0.5 text-xs text-[var(--muted)]">Saldo acumulado trazido de meses anteriores</p>
          </div>
          <p className={`text-xl font-bold ${openingBalance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
            {formatCurrencyBRL(openingBalance)}
          </p>
        </div>
      </Card> */}
    </div>
  );
}
