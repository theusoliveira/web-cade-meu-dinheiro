"use client";

import * as React from "react";
import {
  CheckCircle2, CalendarClock, Target, Sparkles,
  Wallet, Briefcase, PiggyBank, CreditCard, ArrowUpRight, ArrowDownRight, ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useBusy } from "@/components/features/BusyProvider";
import { fetchYearlyEntries, fetchMonthlyEntries, fetchOpeningBalance } from "@/actions/entries";
import { fetchDueAlerts, type AlertRecord } from "@/actions/alerts";
import { fetchObjectives, type ObjectiveRecord } from "@/actions/objectives";
import { completionMonth, monthLabel } from "@/lib/finance/objectives";
import { fetchCardMonthTotals } from "@/actions/cardEntries";
import { fetchRebalanceClasses } from "@/actions/rebalance";
import { buildEntriesWithVirtuals, formatCurrencyBRL, isSaldoEntry, todayAsDateInputValue, type FinanceEntry } from "@/lib/finance";

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

/** Valor compacto para rótulos: R$ 1,2 mil, R$ 3,4 mi. */
function compactBRL(v: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1,
  }).format(v);
}

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

/**
 * Paleta do dashboard: a cor da marca (--accent) é a única cor "decorativa".
 * Verde/vermelho aparecem só onde carregam significado (sobra/falta, alta/queda, vencimento).
 */
function ProgressBar({ pct, opacity = 1 }: { pct: number; opacity?: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-raised)]">
      <div
        className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-500"
        style={{ width: `${Math.max(0, Math.min(100, pct))}%`, opacity }}
      />
    </div>
  );
}

function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-bold text-[var(--foreground)]">{title}</p>
        {subtitle && <p className="text-xs text-[var(--muted)]">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function LinkButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex shrink-0 items-center gap-0.5 text-xs font-semibold text-[var(--accent)] hover:text-[var(--accent-dark)]"
    >
      {children}
      <ChevronRight className="h-3.5 w-3.5" aria-hidden />
    </button>
  );
}

function EmptyState({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; text: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 py-6 text-center">
      <Icon className="h-7 w-7 text-[var(--muted-light)]" strokeWidth={1.5} />
      <p className="text-sm text-[var(--muted)]">{text}</p>
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
    .slice(0, 6);

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

type Wealth = { personal: number; business: number | null; portfolio: number | null };
type CardTotals = { expense: number; count: number };

/** Destaque do topo: saldo do mês + patrimônio, num bloco na cor da marca. */
function Hero({ now, wealth, displayName }: { now: MonthNow; wealth: Wealth; displayName?: string }) {
  const accounts = [
    { label: "Conta pessoal", value: wealth.personal, icon: Wallet },
    ...(wealth.business !== null ? [{ label: "Conta PJ", value: wealth.business, icon: Briefcase }] : []),
    ...(wealth.portfolio !== null ? [{ label: "Carteira", value: wealth.portfolio, icon: PiggyBank }] : []),
  ];
  const total = accounts.reduce((t, a) => t + a.value, 0);
  const flows = [
    { label: "Entrou", value: now.income, sign: "+" },
    { label: "Saiu", value: now.expense, sign: "−" },
    { label: "Investido", value: now.investment, sign: "" },
  ];

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-6 text-white shadow-sm sm:p-7">
      <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/5" aria-hidden />
      <div className="pointer-events-none absolute -bottom-28 right-28 h-56 w-56 rounded-full bg-white/5" aria-hidden />

      <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="min-w-0">
          <p className="text-sm text-white/70">
            {greeting()}{displayName ? `, ${displayName.split(" ")[0]}` : ""}
          </p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-white/60">Saldo disponível</p>
          <p className={`mt-1 text-4xl font-bold tabular-nums tracking-tight sm:text-5xl ${now.available < 0 ? "text-rose-200" : ""}`}>
            {formatCurrencyBRL(now.available)}
          </p>

          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
            {flows.map((f) => (
              <div key={f.label}>
                <p className="text-[11px] uppercase tracking-wider text-white/60">{f.label} no mês</p>
                <p className="text-base font-semibold tabular-nums">
                  {f.sign && <span className="mr-0.5 text-white/60">{f.sign}</span>}
                  {formatCurrencyBRL(f.value)}
                </p>
              </div>
            ))}
          </div>

          {now.upcoming > 0 && (
            <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/80">
              <CalendarClock className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {formatCurrencyBRL(now.upcoming)} em saídas agendadas até o fim do mês (já descontadas)
            </p>
          )}
        </div>

        {accounts.length > 1 && (
          <div className="rounded-xl bg-white/10 p-4 lg:min-w-64">
            <p className="text-[11px] uppercase tracking-wider text-white/60">Patrimônio total</p>
            <p className="text-xl font-bold tabular-nums">{formatCurrencyBRL(total)}</p>
            <ul className="mt-3 grid gap-2 border-t border-white/10 pt-3">
              {accounts.map(({ label, value, icon: Icon }) => (
                <li key={label} className="flex items-center justify-between gap-4 text-sm">
                  <span className="flex items-center gap-2 text-white/75">
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                    {label}
                  </span>
                  <span className="font-semibold tabular-nums">{formatCurrencyBRL(value)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

function MonthCompare({ c, card }: { c: Comparison; card: CardTotals | null }) {
  const base = c.previousSamePeriod;
  const diffPct = base > 0 ? ((c.current - base) / base) * 100 : null;
  const up = diffPct !== null && diffPct > 0;
  return (
    <Card className="flex h-full flex-col">
      <CardHeader title="Gastos do mês" subtitle="Até hoje × mesmo período do mês passado" />
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-2xl font-bold tabular-nums text-[var(--foreground)]">{formatCurrencyBRL(c.current)}</p>
          <p className="text-xs text-[var(--muted)]">mês passado: {formatCurrencyBRL(base)}</p>
        </div>
        {diffPct !== null && (
          <span
            className="flex items-center gap-0.5 rounded-full bg-[var(--surface-raised)] px-2 py-1 text-xs font-bold"
            style={{ color: up ? "var(--expense)" : "var(--income)" }}
          >
            {up ? <ArrowUpRight className="h-3.5 w-3.5" aria-hidden /> : <ArrowDownRight className="h-3.5 w-3.5" aria-hidden />}
            {Math.abs(diffPct).toFixed(0)}%
          </span>
        )}
      </div>

      {c.risers.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">Subiu mais</p>
          <ul className="grid gap-1.5">
            {c.risers.map((r) => (
              <li key={r.category} className="flex justify-between gap-2 text-xs">
                <span className="truncate text-[var(--foreground)]">{r.category}</span>
                <span className="shrink-0 tabular-nums text-[var(--muted)]">+ {formatCurrencyBRL(r.delta)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {card && card.count > 0 && (
        <p className="mt-auto flex items-center gap-2 pt-5 text-xs text-[var(--muted)]">
          <CreditCard className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" aria-hidden />
          Cartão no mês: <strong className="tabular-nums text-[var(--foreground)]">{formatCurrencyBRL(card.expense)}</strong>
        </p>
      )}
    </Card>
  );
}

function AlertsCard({ alerts, onNavigate }: { alerts: AlertRecord[]; onNavigate?: () => void }) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader
        title="Contas a vencer"
        subtitle={alerts.length ? `${alerts.length} pendente${alerts.length !== 1 ? "s" : ""}` : undefined}
        action={onNavigate && <LinkButton onClick={onNavigate}>Ver todas</LinkButton>}
      />
      {alerts.length === 0 ? (
        <EmptyState icon={CheckCircle2} text="Tudo em dia" />
      ) : (
        <ul className="grid gap-1">
          {alerts.slice(0, 4).map((a) => {
            const days = daysUntil(a.dueDate);
            const urgent = days <= 0;
            return (
              <li key={a.id} className="flex items-center gap-3 py-1.5">
                <div
                  className={`flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg leading-none ${
                    urgent ? "bg-rose-500/10" : "bg-[var(--surface-raised)]"
                  }`}
                  style={{ color: urgent ? "var(--expense)" : "var(--foreground)" }}
                >
                  <span className="text-sm font-bold">{a.dueDate.slice(8, 10)}</span>
                  <span className="mt-0.5 text-[9px] uppercase">{MONTHS[Number(a.dueDate.slice(5, 7)) - 1]}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--foreground)]">{a.name}</p>
                  <p className="text-xs" style={{ color: urgent ? "var(--expense)" : "var(--muted)" }}>
                    {days < 0 ? "Vencida" : days === 0 ? "Vence hoje" : `Em ${days} dia${days !== 1 ? "s" : ""}`}
                  </p>
                </div>
                {a.expectedValue != null && (
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-[var(--foreground)]">
                    {formatCurrencyBRL(a.expectedValue)}
                  </span>
                )}
              </li>
            );
          })}
          {alerts.length > 4 && <li className="pt-1 text-center text-xs text-[var(--muted)]">+{alerts.length - 4} outras contas</li>}
        </ul>
      )}
    </Card>
  );
}

function ObjectivesCard({
  objectives,
  currentYm,
  onNavigate,
}: {
  objectives: ObjectiveRecord[];
  currentYm: string;
  onNavigate?: () => void;
}) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader
        title="Objetivos"
        subtitle={objectives.length ? "Progresso e conclusão prevista" : undefined}
        action={onNavigate && <LinkButton onClick={onNavigate}>Ver todos</LinkButton>}
      />
      {objectives.length === 0 ? (
        <EmptyState icon={Target} text="Nenhum objetivo cadastrado" />
      ) : (
        <ul className="grid gap-4">
          {objectives.slice(0, 4).map((o) => {
            const pct = o.targetValue > 0 ? Math.min(100, (o.initialValue / o.targetValue) * 100) : 0;
            const done = completionMonth(o, currentYm);
            return (
              <li key={o.id}>
                <div className="mb-1.5 flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-[var(--foreground)]">{o.name}</p>
                  <span className="shrink-0 text-xs font-bold tabular-nums text-[var(--accent)]">{pct.toFixed(0)}%</span>
                </div>
                <ProgressBar pct={pct} />
                <div className="mt-1 flex justify-between gap-2 text-[11px] tabular-nums text-[var(--muted)]">
                  <span>{compactBRL(o.initialValue)} de {compactBRL(o.targetValue)}</span>
                  <span>{done ? monthLabel(done.month) : "Não atinge"}</span>
                </div>
              </li>
            );
          })}
          {objectives.length > 4 && <li className="text-center text-xs text-[var(--muted)]">+{objectives.length - 4} outros objetivos</li>}
        </ul>
      )}
    </Card>
  );
}

/** Números do ano numa única faixa, separados por divisórias. */
function YearStrip({ s, yearStart, yearNet }: { s: Summary; yearStart: number; yearNet: number }) {
  const items = [
    { label: "Receitas", value: s.income },
    { label: "Despesas", value: s.expense },
    { label: "Investimentos", value: s.investment },
  ];
  return (
    <Card className="grid grid-cols-2 overflow-hidden p-0 lg:grid-cols-4">
      {items.map((i, idx) => (
        <div
          key={i.label}
          className={`border-[var(--border)] px-5 py-4 ${idx === 1 ? "border-l" : ""} ${idx === 2 ? "border-t lg:border-l lg:border-t-0" : ""}`}
        >
          <p className="text-xs text-[var(--muted)]">{i.label}</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-[var(--foreground)]">{formatCurrencyBRL(i.value)}</p>
        </div>
      ))}
      <div className="border-l border-t border-[var(--border)] bg-[var(--accent)]/5 px-5 py-4 lg:border-t-0">
        <p className="text-xs font-semibold text-[var(--accent)]">Resultado do ano</p>
        <p className="mt-1 text-lg font-bold tabular-nums" style={{ color: yearNet < 0 ? "var(--expense)" : "var(--foreground)" }}>
          {formatCurrencyBRL(yearNet)}
        </p>
        <p className="truncate text-[10px] text-[var(--muted)]">com saldo inicial de {formatCurrencyBRL(yearStart)}</p>
      </div>
    </Card>
  );
}

/** Barras mensais em CSS puro — sem biblioteca de gráficos, render instantâneo. */
function MonthlyChart({ months, year, currentYm }: { months: Month[]; year: string; currentYm: string }) {
  const max = Math.max(1, ...months.flatMap((m) => [m.income, m.expense]));
  const [hover, setHover] = React.useState<number | null>(null);
  const focus = hover ?? (currentYm.startsWith(year) ? Number(currentYm.slice(5)) - 1 : 11);
  const fm = months[focus];
  const net = fm.income - fm.expense;

  return (
    <Card className="flex w-full flex-col">
      <CardHeader
        title="Fluxo mensal"
        subtitle={`Receitas × despesas em ${year}`}
        action={
          <div className="flex shrink-0 items-center gap-3 text-[11px] text-[var(--muted)]">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-[var(--accent)]" />Receitas</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-[var(--border-strong)]" />Despesas</span>
          </div>
        }
      />

      <div className="relative flex min-h-44 flex-1 items-end gap-1 sm:gap-2" onMouseLeave={() => setHover(null)}>
        <div className="pointer-events-none absolute inset-x-0 bottom-5 top-2 flex flex-col justify-between" aria-hidden>
          {[0, 1, 2, 3].map((i) => <div key={i} className="border-t border-dashed border-[var(--border)]" />)}
        </div>
        {months.map((m, i) => {
          const active = i === focus;
          return (
            <button
              key={i}
              type="button"
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onClick={() => setHover(i)}
              className={`relative flex h-full flex-1 flex-col items-center justify-end gap-1 rounded-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${active ? "bg-[var(--surface-raised)]" : ""}`}
              aria-label={`${MONTHS[i]}: receitas ${formatCurrencyBRL(m.income)}, despesas ${formatCurrencyBRL(m.expense)}`}
            >
              <div className={`flex h-full w-full items-end justify-center gap-0.5 pt-2 transition-opacity ${active ? "opacity-100" : "opacity-70"}`}>
                <div className="w-1/2 max-w-3.5 rounded-t-sm bg-[var(--accent)]" style={{ height: `${(m.income / max) * 100}%` }} />
                <div className="w-1/2 max-w-3.5 rounded-t-sm bg-[var(--border-strong)]" style={{ height: `${(m.expense / max) * 100}%` }} />
              </div>
              <span className={`text-[10px] ${active ? "font-bold text-[var(--foreground)]" : "text-[var(--muted)]"}`}>{MONTHS[i]}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[var(--border)] pt-3 text-xs">
        <div>
          <p className="text-[var(--muted)]">Receitas · {MONTHS[focus]}</p>
          <p className="font-semibold tabular-nums text-[var(--foreground)]">{formatCurrencyBRL(fm.income)}</p>
        </div>
        <div>
          <p className="text-[var(--muted)]">Despesas · {MONTHS[focus]}</p>
          <p className="font-semibold tabular-nums text-[var(--foreground)]">{formatCurrencyBRL(fm.expense)}</p>
        </div>
        <div>
          <p className="text-[var(--muted)]">Sobra</p>
          <p className="font-semibold tabular-nums" style={{ color: net < 0 ? "var(--expense)" : "var(--income)" }}>
            {formatCurrencyBRL(net)}
          </p>
        </div>
      </div>
    </Card>
  );
}

type HealthStatus = "good" | "warn" | "bad";
const HEALTH_LABEL: Record<HealthStatus, string> = { good: "Ótimo", warn: "Atenção", bad: "Alto" };
const HEALTH_COLOR: Record<HealthStatus, string> = { good: "var(--income)", warn: "#d97706", bad: "var(--expense)" };

function HealthCard({ income, expense, investment }: { income: number; expense: number; investment: number }) {
  const savings = income > 0 ? ((income - expense) / income) * 100 : 0;
  const commitment = income > 0 ? (expense / income) * 100 : 0;
  const invested = income > 0 ? (investment / income) * 100 : 0;

  const rows: { label: string; hint: string; pct: number; status: HealthStatus | null }[] = [
    { label: "Taxa de poupança", hint: "da receita não foi gasta", pct: savings, status: savings >= 20 ? "good" : savings >= 10 ? "warn" : "bad" },
    { label: "Comprometimento", hint: "da receita virou despesa", pct: commitment, status: commitment <= 70 ? "good" : commitment <= 90 ? "warn" : "bad" },
    { label: "Investido", hint: "da receita foi investida", pct: invested, status: null },
  ];

  let tip = "Lance suas receitas para ver sua saúde financeira.";
  if (income > 0) {
    if (savings >= 20) tip = "Excelente! Você está guardando mais de 20% do que ganha.";
    else if (commitment > 90) tip = "Atenção: quase toda a renda está indo para despesas.";
    else tip = "Tente chegar a 20% de poupança — revise as maiores categorias de gasto.";
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader title="Saúde financeira" subtitle="Indicadores do ano" />
      <ul className="mb-4 grid gap-4">
        {rows.map((r) => (
          <li key={r.label}>
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <span className="text-xs font-semibold text-[var(--foreground)]">{r.label}</span>
              <span className="flex items-baseline gap-2">
                {income > 0 && r.status && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: HEALTH_COLOR[r.status] }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: HEALTH_COLOR[r.status] }} />
                    {HEALTH_LABEL[r.status]}
                  </span>
                )}
                <span className="text-sm font-bold tabular-nums text-[var(--foreground)]">{r.pct.toFixed(1)}%</span>
              </span>
            </div>
            <ProgressBar pct={r.pct} />
            <p className="mt-1 text-[10px] text-[var(--muted)]">{r.hint}</p>
          </li>
        ))}
      </ul>
      <p className="mt-auto flex gap-2 rounded-lg bg-[var(--accent)]/5 px-3 py-2.5 text-xs text-[var(--foreground)]">
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" aria-hidden />
        {tip}
      </p>
    </Card>
  );
}

function TopExpenses({ items, total }: { items: Summary["topExpenses"]; total: number }) {
  return (
    <Card>
      <CardHeader title="Para onde vai o dinheiro" subtitle="Maiores categorias de despesa no ano" />
      {items.length === 0 ? (
        <EmptyState icon={Wallet} text="Nenhuma despesa no período" />
      ) : (
        <ul className="grid gap-x-8 gap-y-3 md:grid-cols-2">
          {items.map((c, i) => {
            const pct = total > 0 ? (c.value / total) * 100 : 0;
            return (
              <li key={c.category}>
                <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
                  <span className="truncate font-semibold text-[var(--foreground)]">
                    <span className="mr-1.5 tabular-nums text-[var(--muted)]">{i + 1}</span>{c.category}
                  </span>
                  <span className="shrink-0 tabular-nums text-[var(--muted)]">
                    {formatCurrencyBRL(c.value)} · <strong className="text-[var(--foreground)]">{pct.toFixed(0)}%</strong>
                  </span>
                </div>
                {/* Mesma cor, intensidade decrescente pelo ranking */}
                <ProgressBar pct={pct} opacity={1 - i * 0.13} />
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

type Data = {
  summary: Summary; yearStart: number; now: MonthNow; alerts: AlertRecord[]; objectives: ObjectiveRecord[];
  wealth: Wealth; compare: Comparison; card: CardTotals | null;
};

const ok = <T,>(r: PromiseSettledResult<T>): T | null => (r.status === "fulfilled" ? r.value : null);

export function DashboardClient({
  onNavigateAlerts,
  onNavigateObjectives,
  displayName,
}: {
  onNavigateAlerts?: () => void;
  onNavigateObjectives?: () => void;
  displayName?: string;
}) {
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
        // Essenciais + complementares, todos em paralelo. Os complementares usam
        // allSettled: se algum falhar, o restante do dashboard aparece mesmo assim.
        const [core, extra] = await Promise.all([
          Promise.all([
            fetchYearlyEntries(year, "personal"),
            fetchMonthlyEntries(currentYm, "personal"),
            fetchOpeningBalance(currentYm, "personal"),
            fetchDueAlerts(),
            fetchObjectives(),
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
        const [entries, monthEntries, monthOpening, alerts, objectives, janOpening] = core;
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
          objectives,
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
        <div className="skeleton h-56 rounded-2xl" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-52 rounded-xl" />)}
        </div>
        <div className="skeleton h-24 rounded-xl" />
        <div className="skeleton h-64 rounded-xl" />
      </div>
    );
  }

  const { summary: s, yearStart, now, alerts, objectives, wealth, compare, card } = data;
  const yearNet = yearStart + s.income - s.expense - s.investment;

  return (
    <div className="grid gap-4 animate-fade-in">
      <Hero now={now} wealth={wealth} displayName={displayName} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MonthCompare c={compare} card={card} />
        <AlertsCard alerts={alerts} onNavigate={onNavigateAlerts} />
        <div className="md:col-span-2 xl:col-span-1">
          <ObjectivesCard objectives={objectives} currentYm={currentYm} onNavigate={onNavigateObjectives} />
        </div>
      </div>

      <div className="flex items-end justify-between gap-3 pt-4">
        <div>
          <p className="text-base font-bold text-[var(--foreground)]">Resumo do ano</p>
          <p className="text-xs text-[var(--muted)]">Como {year} está se desenhando</p>
        </div>
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          aria-label="Ano"
          className="h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-semibold text-[var(--foreground)]"
        >
          {yearOptions().map((y) => <option key={y} value={String(y)}>{y}</option>)}
        </select>
      </div>

      <YearStrip s={s} yearStart={yearStart} yearNet={yearNet} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex lg:col-span-2"><MonthlyChart months={s.months} year={year} currentYm={currentYm} /></div>
        <HealthCard income={s.income} expense={s.expense} investment={s.investment} />
      </div>

      <TopExpenses items={s.topExpenses} total={s.expense} />
    </div>
  );
}
