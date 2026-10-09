"use client";

import * as React from "react";
import {
  CheckCircle2, AlertTriangle, Target, Sparkles,
  Wallet, Briefcase, PiggyBank, CreditCard, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useBusy } from "@/components/features/BusyProvider";
import { fetchYearlyEntries, fetchMonthlyEntries, fetchOpeningBalance } from "@/actions/entries";
import { fetchDueAlerts, type AlertRecord } from "@/actions/alerts";
import { fetchGoals, type GoalRecord } from "@/actions/goals";
import { fetchCardMonthTotals } from "@/actions/cardEntries";
import { fetchRebalanceClasses } from "@/actions/rebalance";
import { buildEntriesWithVirtuals, formatCurrencyBRL, formatDateBR, isSaldoEntry, todayAsDateInputValue, type FinanceEntry } from "@/lib/finance";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function daysUntil(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${dueDate}T00:00:00`);
  return Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
}

function yearOptions(): number[] {
  const current = new Date().getFullYear();
  return Array.from({ length: 6 }, (_, i) => current - i);
}

/** Valor compacto para eixos/rótulos: R$ 1,2 mil, R$ 3,4 mi. */
function compactBRL(v: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1,
  }).format(v);
}

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--border)]">
      <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.max(0, Math.min(100, pct))}%`, backgroundColor: color }} />
    </div>
  );
}

// ─── Agregação (tudo em memória, a partir dos dados já carregados) ───────────

type Month = { income: number; expense: number; investment: number };

type Summary = {
  income: number;
  expense: number;
  investment: number;
  months: Month[];
  topExpenses: { category: string; value: number }[];
};

function summarize(entries: FinanceEntry[]): Summary {
  const months: Month[] = Array.from({ length: 12 }, () => ({ income: 0, expense: 0, investment: 0 }));
  const byCategory = new Map<string, number>();
  let income = 0, expense = 0, investment = 0;

  for (const e of entries) {
    // "Saldo" é ajuste manual de saldo, não fluxo do período.
    if (isSaldoEntry(e)) continue;
    const m = months[Number(e.date.slice(5, 7)) - 1];
    if (!m) continue;
    m[e.kind] += e.value;
    if (e.kind === "income") income += e.value;
    else if (e.kind === "expense") {
      expense += e.value;
      byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.value);
    } else investment += e.value;
  }

  const topExpenses = [...byCategory.entries()]
    .map(([category, value]) => ({ category, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return { income, expense, investment, months, topExpenses };
}

type MonthNow = { available: number; income: number; expense: number; investment: number; upcoming: number };

/**
 * Mesmo cálculo da aba "Lançamentos": lançamentos do mês inteiro + saldo
 * trazido do mês anterior (substituído pelo lançamento manual "Saldo", se houver).
 */
function monthBalance(ym: string, entries: FinanceEntry[], opening: number): number {
  return buildEntriesWithVirtuals({ month: ym, entries, fixedEntries: [], openingBalance: opening })
    .reduce((t, e) => t + (e.kind === "income" ? e.value : -e.value), 0);
}

function summarizeCurrentMonth(ym: string, entries: FinanceEntry[], opening: number, today: string): MonthNow {
  let income = 0, expense = 0, investment = 0, upcoming = 0;
  for (const e of entries) {
    if (isSaldoEntry(e)) continue;
    if (e.kind === "income") income += e.value;
    else if (e.kind === "expense") expense += e.value;
    else investment += e.value;
    if (e.date > today && e.kind !== "income") upcoming += e.value;
  }
  return { available: monthBalance(ym, entries, opening), income, expense, investment, upcoming };
}

/** Saldo que abriu o ano: o lançamento "Saldo" de janeiro ou, se não houver, o saldo trazido de dezembro. */
function yearStartBalance(year: string, entries: FinanceEntry[], janOpening: number): number {
  const janSaldo = entries.filter((e) => e.date.startsWith(`${year}-01`) && isSaldoEntry(e));
  if (janSaldo.length === 0) return janOpening;
  return janSaldo.reduce((t, e) => t + (e.kind === "income" ? e.value : -e.value), 0);
}

function prevYm(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
}

type Comparison = {
  current: number;
  /** Mesmo período (até o dia de hoje) no mês anterior — comparação justa. */
  previousSamePeriod: number;
  risers: { category: string; delta: number }[];
};

function compareMonths(cur: FinanceEntry[], prev: FinanceEntry[], today: string): Comparison {
  const day = today.slice(8, 10);
  const byCat = new Map<string, number>();
  let current = 0, previousSamePeriod = 0;
  for (const e of cur) {
    if (e.kind !== "expense" || isSaldoEntry(e) || e.date > today) continue;
    current += e.value;
    byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.value);
  }
  for (const e of prev) {
    if (e.kind !== "expense" || isSaldoEntry(e) || e.date.slice(8, 10) > day) continue;
    previousSamePeriod += e.value;
    byCat.set(e.category, (byCat.get(e.category) ?? 0) - e.value);
  }
  const risers = [...byCat.entries()]
    .filter(([, d]) => d > 0.005)
    .map(([category, delta]) => ({ category, delta }))
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 3);
  return { current, previousSamePeriod, risers };
}

// ─── Componentes visuais ─────────────────────────────────────────────────────

function HeroBalance({ now, displayName }: { now: MonthNow; displayName?: string }) {
  return (
    <Card className="relative h-full overflow-hidden p-6">
      <div className="absolute inset-y-0 left-0 w-1 bg-[var(--accent)]" aria-hidden />
      <p className="text-sm text-[var(--muted)]">
        {greeting()}{displayName ? `, ${displayName.split(" ")[0]}` : ""} 👋
      </p>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Saldo disponível</p>
      <p className={`mt-1 text-3xl sm:text-4xl font-bold tabular-nums ${now.available < 0 ? "text-[var(--expense)]" : "text-[var(--foreground)]"}`}>
        {formatCurrencyBRL(now.available)}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div>
          <p className="text-xs text-[var(--muted)]">Entrou no mês</p>
          <p className="text-sm font-semibold tabular-nums text-[var(--income)]">+ {formatCurrencyBRL(now.income)}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--muted)]">Saiu no mês</p>
          <p className="text-sm font-semibold tabular-nums text-[var(--expense)]">− {formatCurrencyBRL(now.expense)}</p>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <p className="text-xs text-[var(--muted)]">Investido no mês</p>
          <p className="text-sm font-semibold tabular-nums text-[var(--investment)]">{formatCurrencyBRL(now.investment)}</p>
        </div>
      </div>
      {now.upcoming > 0 && (
        <p className="mt-4 rounded-lg bg-[var(--surface-raised)] px-3 py-2 text-xs text-[var(--muted)]">
          Ainda há <strong className="text-[var(--foreground)]">{formatCurrencyBRL(now.upcoming)}</strong> em saídas com data nos próximos dias deste mês (já descontadas do saldo).
        </p>
      )}
    </Card>
  );
}

function Kpi({ label, value, color, hint }: { label: string; value: number; color: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} aria-hidden />
        <p className="text-xs text-[var(--muted)]">{label}</p>
      </div>
      <p className="mt-1 text-lg font-bold tabular-nums text-[var(--foreground)]">{formatCurrencyBRL(value)}</p>
      {hint && <p className="mt-0.5 truncate text-[10px] text-[var(--muted)]">{hint}</p>}
    </div>
  );
}

/** Barras mensais em CSS puro — sem biblioteca de gráficos, render instantâneo. */
function MonthlyChart({ months, year, currentYm }: { months: Month[]; year: string; currentYm: string }) {
  const max = Math.max(1, ...months.flatMap((m) => [m.income, m.expense]));
  const [hover, setHover] = React.useState<number | null>(null);
  const focus = hover ?? (currentYm.startsWith(year) ? Number(currentYm.slice(5)) - 1 : 11);
  const fm = months[focus];

  return (
    <Card className="flex w-full flex-col">
      {/* Cabeçalho com a mesma estrutura do card "Saúde financeira" para alinhar. */}
      <p className="text-sm font-bold text-[var(--foreground)]">Fluxo mensal</p>
      <p className="mb-4 text-xs text-[var(--muted)]">Receitas × despesas em {year}</p>

      <div className="flex min-h-40 flex-1 items-end gap-1 sm:gap-2" onMouseLeave={() => setHover(null)}>
        {months.map((m, i) => {
          const active = i === focus;
          return (
            <button
              key={i}
              type="button"
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onClick={() => setHover(i)}
              className="flex h-full flex-1 flex-col items-center justify-end gap-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              aria-label={`${MONTHS[i]}: receitas ${formatCurrencyBRL(m.income)}, despesas ${formatCurrencyBRL(m.expense)}`}
            >
              <div className={`flex h-full w-full items-end justify-center gap-0.5 transition-opacity ${active ? "opacity-100" : "opacity-60"}`}>
                <div className="w-1/2 max-w-3 rounded-t bg-[var(--income)]" style={{ height: `${(m.income / max) * 100}%` }} />
                <div className="w-1/2 max-w-3 rounded-t bg-[var(--expense)]" style={{ height: `${(m.expense / max) * 100}%` }} />
              </div>
              <span className={`text-[10px] ${active ? "font-bold text-[var(--foreground)]" : "text-[var(--muted)]"}`}>{MONTHS[i]}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[var(--surface-raised)] px-3 py-2 text-xs">
        <span className="font-semibold capitalize text-[var(--foreground)]">{MONTHS[focus]}/{year}</span>
        <span className="tabular-nums text-[var(--income)]">+ {formatCurrencyBRL(fm.income)}</span>
        <span className="tabular-nums text-[var(--expense)]">− {formatCurrencyBRL(fm.expense)}</span>
        <span className="text-[10px] text-[var(--muted)]">escala: {compactBRL(max)}</span>
      </div>
    </Card>
  );
}

function HealthCard({ income, expense, investment }: { income: number; expense: number; investment: number }) {
  const savings = income > 0 ? ((income - expense) / income) * 100 : 0;
  const commitment = income > 0 ? (expense / income) * 100 : 0;
  const invested = income > 0 ? (investment / income) * 100 : 0;

  const rows = [
    {
      label: "Taxa de poupança", hint: "da receita não foi gasta", pct: savings,
      color: savings >= 20 ? "var(--income)" : savings >= 10 ? "#f59e0b" : "var(--expense)",
    },
    {
      label: "Comprometimento", hint: "da receita virou despesa", pct: commitment,
      color: commitment <= 70 ? "var(--income)" : commitment <= 90 ? "#f59e0b" : "var(--expense)",
    },
    { label: "Investido", hint: "da receita foi investida", pct: invested, color: "var(--investment)" },
  ];

  let tip = "Lance suas receitas para ver sua saúde financeira.";
  if (income > 0) {
    if (savings >= 20) tip = "Excelente! Você está guardando mais de 20% do que ganha.";
    else if (commitment > 90) tip = "Atenção: quase toda a renda está indo para despesas.";
    else tip = "Tente chegar a 20% de poupança — revise as maiores categorias de gasto.";
  }

  return (
    <Card className="flex h-full flex-col">
      <p className="text-sm font-bold text-[var(--foreground)]">Saúde financeira</p>
      <p className="mb-4 text-xs text-[var(--muted)]">Indicadores do ano</p>
      <ul className="mb-4 grid gap-4">
        {rows.map((r) => (
          <li key={r.label}>
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="text-xs font-semibold text-[var(--foreground)]">{r.label}</span>
              <span className="text-sm font-bold tabular-nums" style={{ color: r.color }}>{r.pct.toFixed(1)}%</span>
            </div>
            <ProgressBar pct={r.pct} color={r.color} />
            <p className="mt-1 text-[10px] text-[var(--muted)]">{r.hint}</p>
          </li>
        ))}
      </ul>
      <p className="mt-auto flex gap-2 rounded-lg bg-[var(--surface-raised)] px-3 py-2 text-xs text-[var(--muted)]">
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" aria-hidden />
        {tip}
      </p>
    </Card>
  );
}

function TopExpenses({ items, total }: { items: Summary["topExpenses"]; total: number }) {
  return (
    <Card>
      <p className="text-sm font-bold text-[var(--foreground)]">Para onde vai o dinheiro</p>
      <p className="mb-4 text-xs text-[var(--muted)]">Maiores categorias de despesa no ano</p>
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-[var(--muted)]">Nenhuma despesa no período</p>
      ) : (
        <ul className="grid gap-3">
          {items.map((c, i) => {
            const pct = total > 0 ? (c.value / total) * 100 : 0;
            return (
              <li key={c.category}>
                <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
                  <span className="truncate font-semibold text-[var(--foreground)]">
                    <span className="mr-1.5 text-[var(--muted)]">{i + 1}.</span>{c.category}
                  </span>
                  <span className="shrink-0 tabular-nums text-[var(--muted)]">
                    {formatCurrencyBRL(c.value)} · {pct.toFixed(0)}%
                  </span>
                </div>
                <ProgressBar pct={pct} color="var(--expense)" />
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

type Wealth = { personal: number; business: number | null; portfolio: number | null };
type CardTotals = { expense: number; count: number };

function WealthStrip({ w }: { w: Wealth }) {
  const items = [
    { label: "Conta pessoal", value: w.personal, icon: Wallet },
    ...(w.business !== null ? [{ label: "Conta PJ", value: w.business, icon: Briefcase }] : []),
    ...(w.portfolio !== null ? [{ label: "Carteira investida", value: w.portfolio, icon: PiggyBank }] : []),
  ];
  const total = items.reduce((t, i) => t + i.value, 0);
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Patrimônio total</p>
          <p className="text-xl font-bold tabular-nums text-[var(--foreground)]">{formatCurrencyBRL(total)}</p>
        </div>
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {items.map(({ label, value, icon: Icon }) => (
            <li key={label} className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--surface-raised)] text-[var(--accent)]">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <p className="text-[11px] text-[var(--muted)]">{label}</p>
                <p className="text-sm font-semibold tabular-nums text-[var(--foreground)]">{formatCurrencyBRL(value)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

function MonthCompare({ c, card }: { c: Comparison; card: CardTotals | null }) {
  const base = c.previousSamePeriod;
  const diffPct = base > 0 ? ((c.current - base) / base) * 100 : null;
  const up = diffPct !== null && diffPct > 0;
  return (
    <Card className="h-full">
      <p className="text-sm font-bold text-[var(--foreground)]">Este mês × mês passado</p>
      <p className="mb-4 text-xs text-[var(--muted)]">Despesas até hoje, comparadas ao mesmo período</p>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-2xl font-bold tabular-nums text-[var(--foreground)]">{formatCurrencyBRL(c.current)}</p>
          <p className="text-xs text-[var(--muted)]">mês passado: {formatCurrencyBRL(base)}</p>
        </div>
        {diffPct !== null && (
          <span className={`flex items-center gap-0.5 rounded-full px-2 py-1 text-xs font-bold ${up ? "bg-rose-500/10 text-[var(--expense)]" : "bg-emerald-500/10 text-[var(--income)]"}`}>
            {up ? <ArrowUpRight className="h-3.5 w-3.5" aria-hidden /> : <ArrowDownRight className="h-3.5 w-3.5" aria-hidden />}
            {Math.abs(diffPct).toFixed(0)}%
          </span>
        )}
      </div>

      {c.risers.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Gastando mais em</p>
          <ul className="grid gap-1.5">
            {c.risers.map((r) => (
              <li key={r.category} className="flex justify-between gap-2 text-xs">
                <span className="truncate text-[var(--foreground)]">{r.category}</span>
                <span className="shrink-0 tabular-nums text-[var(--expense)]">+ {formatCurrencyBRL(r.delta)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {card && card.count > 0 && (
        <p className="mt-4 flex items-center gap-2 rounded-lg bg-[var(--surface-raised)] px-3 py-2 text-xs text-[var(--muted)]">
          <CreditCard className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" aria-hidden />
          Cartão no mês: <strong className="tabular-nums text-[var(--foreground)]">{formatCurrencyBRL(card.expense)}</strong>
        </p>
      )}
    </Card>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

type Data = {
  summary: Summary; yearStart: number; now: MonthNow; alerts: AlertRecord[]; goals: GoalRecord[];
  wealth: Wealth; compare: Comparison; card: CardTotals | null;
};

const ok = <T,>(r: PromiseSettledResult<T>): T | null => (r.status === "fulfilled" ? r.value : null);

export function DashboardClient({ onNavigateAlerts, displayName }: { onNavigateAlerts?: () => void; displayName?: string }) {
  const today = todayAsDateInputValue();
  const currentYm = today.slice(0, 7);
  const [year, setYear] = React.useState(() => today.slice(0, 4));
  const [data, setData] = React.useState<Data | null>(null);
  const [error, setError] = React.useState(false);
  const { run } = useBusy();

  React.useEffect(() => {
    let alive = true;
    run(async () => {
      try {
        // Mesmas consultas de antes, em paralelo; toda a análise é feita no cliente.
        // Essenciais + complementares, todos em paralelo. Os complementares usam
        // allSettled: se algum falhar, o restante do dashboard aparece mesmo assim.
        const [core, extra] = await Promise.all([
          Promise.all([
            fetchYearlyEntries(year, "personal"),
            fetchMonthlyEntries(currentYm, "personal"),
            fetchOpeningBalance(currentYm, "personal"),
            fetchDueAlerts(),
            fetchGoals(),
            fetchOpeningBalance(`${year}-01`, "personal"),
          ]),
          Promise.allSettled([
            fetchMonthlyEntries(prevYm(currentYm), "personal"),
            fetchMonthlyEntries(currentYm, "business"),
            fetchOpeningBalance(currentYm, "business"),
            fetchCardMonthTotals(currentYm),
            fetchRebalanceClasses(),
          ]),
        ]);
        if (!alive) return;
        const [entries, monthEntries, monthOpening, alerts, goals, janOpening] = core;
        const prev = ok(extra[0]), pjEntries = ok(extra[1]), pjOpening = ok(extra[2]);
        const card = ok(extra[3]), classes = ok(extra[4]);

        const now = summarizeCurrentMonth(currentYm, monthEntries, monthOpening, today);
        const hasPj = pjEntries !== null && pjOpening !== null && (pjEntries.length > 0 || pjOpening !== 0);
        setError(false);
        setData({
          summary: summarize(entries),
          yearStart: yearStartBalance(year, entries, janOpening),
          now,
          alerts,
          goals,
          wealth: {
            personal: now.available,
            business: hasPj ? monthBalance(currentYm, pjEntries, pjOpening) : null,
            portfolio: classes && classes.length > 0 ? classes.reduce((t, c) => t + c.currentValue, 0) : null,
          },
          compare: compareMonths(monthEntries, prev ?? [], today),
          card,
        });
      } catch (err) {
        console.error(err);
        if (alive) setError(true);
      }
    });
    return () => { alive = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  if (error && !data) {
    return <Card className="text-center text-sm text-[var(--muted)]">Não foi possível carregar o dashboard. Tente recarregar a página.</Card>;
  }

  if (!data) {
    return (
      <div className="grid gap-4">
        <div className="skeleton h-48 rounded-xl" />
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
        </div>
        <div className="skeleton h-56 rounded-xl" />
      </div>
    );
  }

  const { summary: s, yearStart, now, alerts, goals, wealth, compare, card } = data;
  const yearNet = yearStart + s.income - s.expense - s.investment;

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2"><HeroBalance now={now} displayName={displayName} /></div>
        <MonthCompare c={compare} card={card} />
      </div>

      {(wealth.business !== null || wealth.portfolio !== null) && <WealthStrip w={wealth} />}

      <div className="flex items-center justify-between gap-3 pt-2">
        <p className="text-sm font-bold text-[var(--foreground)]">Resumo de {year}</p>
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          aria-label="Ano"
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm font-semibold text-[var(--foreground)]"
        >
          {yearOptions().map((y) => <option key={y} value={String(y)}>{y}</option>)}
        </select>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Kpi label="Receitas" value={s.income} color="var(--income)" />
        <Kpi label="Despesas" value={s.expense} color="var(--expense)" />
        <Kpi label="Investimentos" value={s.investment} color="var(--investment)" />
        <Kpi label="Resultado do ano" value={yearNet} color={yearNet >= 0 ? "var(--accent)" : "var(--expense)"} hint={`inclui saldo inicial de ${formatCurrencyBRL(yearStart)}`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex lg:col-span-2"><MonthlyChart months={s.months} year={year} currentYm={currentYm} /></div>
        <HealthCard income={s.income} expense={s.expense} investment={s.investment} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <TopExpenses items={s.topExpenses} total={s.expense} />

        {/* Alertas */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-bold text-[var(--foreground)]">Contas a vencer</p>
            {onNavigateAlerts && (
              <button type="button" onClick={onNavigateAlerts} className="text-xs font-semibold text-[var(--accent)] hover:text-[var(--accent-dark)]">
                Ver todos →
              </button>
            )}
          </div>
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <CheckCircle2 className="h-8 w-8 text-[var(--muted)]" aria-hidden strokeWidth={1.5} />
              <p className="text-sm text-[var(--muted)]">Nenhuma conta a vencer</p>
            </div>
          ) : (
            <ul className="grid gap-2">
              {alerts.slice(0, 4).map((a) => {
                const days = daysUntil(a.dueDate);
                return (
                  <li key={a.id} className="flex items-center gap-3 rounded-lg bg-[var(--surface-raised)] px-3 py-2.5">
                    <AlertTriangle className={`h-4 w-4 shrink-0 ${days === 0 ? "text-rose-500" : "text-amber-500"}`} aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--foreground)]">{a.name}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {formatDateBR(a.dueDate)} · {days === 0 ? "Hoje!" : `${days} dia${days !== 1 ? "s" : ""}`}
                        {a.expectedValue != null && ` · ${formatCurrencyBRL(a.expectedValue)}`}
                      </p>
                    </div>
                  </li>
                );
              })}
              {alerts.length > 4 && <li className="py-1 text-center text-xs text-[var(--muted)]">+{alerts.length - 4} outras contas</li>}
            </ul>
          )}
        </Card>

        {/* Metas */}
        <Card>
          <p className="mb-4 text-sm font-bold text-[var(--foreground)]">Progresso das metas</p>
          {goals.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <Target className="h-8 w-8 text-[var(--muted)]" aria-hidden strokeWidth={1.5} />
              <p className="text-sm text-[var(--muted)]">Nenhuma meta cadastrada</p>
            </div>
          ) : (
            <ul className="grid gap-3">
              {goals.slice(0, 4).map((g) => {
                const pct = g.targetValue > 0 ? Math.min(100, (g.currentValue / g.targetValue) * 100) : 0;
                return (
                  <li key={g.id}>
                    <div className="mb-1 flex items-center justify-between">
                      <p className="truncate text-xs font-semibold text-[var(--foreground)]">{g.description || "Meta"}</p>
                      <span className="ml-2 shrink-0 text-xs text-[var(--muted)]">{pct.toFixed(0)}%</span>
                    </div>
                    <ProgressBar pct={pct} color={pct >= 100 ? "var(--income)" : "var(--investment)"} />
                    <div className="mt-1 flex justify-between text-[10px] tabular-nums text-[var(--muted)]">
                      <span>{formatCurrencyBRL(g.currentValue)}</span>
                      <span>{formatCurrencyBRL(g.targetValue)}</span>
                    </div>
                  </li>
                );
              })}
              {goals.length > 4 && <li className="text-center text-xs text-[var(--muted)]">+{goals.length - 4} outras metas</li>}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
