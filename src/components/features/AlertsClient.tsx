"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Card, StatCard } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useBusy } from "@/components/features/BusyProvider";
import {
  fetchAlerts,
  upsertAlert,
  deleteAlert,
  toggleAlert,
  type AlertRecord,
} from "@/actions/alerts";
import { formatCurrencyBRL, formatBRLFromCents, formatDateBR } from "@/lib/finance";
import { newId } from "@/lib/finance/id";

// ─── Ícones — mesmo estilo stroke do sistema ──────────────────────────────────

function IconEdit() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden>
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-10 w-10" aria-hidden>
      <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconWarning() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
      <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconRepeat() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3" aria-hidden>
      <path d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysUntil(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${dueDate}T00:00:00`);
  return Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
}

/**
 * Para alertas recorrentes, calcula a próxima data de vencimento a partir
 * do dayOfMonth. Se o dia já passou neste mês, avança para o mês seguinte.
 */
function nextRecurringDate(dayOfMonth: number): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-indexed

  // Clamp day para o último dia do mês corrente
  const maxDay = new Date(year, month + 1, 0).getDate();
  const day = Math.min(dayOfMonth, maxDay);
  const candidate = new Date(year, month, day);

  if (candidate >= today) {
    return candidate.toISOString().slice(0, 10);
  }
  // Próximo mês
  const nextMonth = month + 1;
  const nextYear = nextMonth > 11 ? year + 1 : year;
  const nm = nextMonth > 11 ? 0 : nextMonth;
  const maxDayNext = new Date(nextYear, nm + 1, 0).getDate();
  const dayNext = Math.min(dayOfMonth, maxDayNext);
  return new Date(nextYear, nm, dayNext).toISOString().slice(0, 10);
}

function urgencyBadge(daysLeft: number, active: boolean) {
  if (!active) return { label: "Inativo", className: "bg-[var(--surface-raised)] text-[var(--muted)] border-[var(--border)]" };
  if (daysLeft < 0) return { label: "Vencida", className: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/50" };
  if (daysLeft === 0) return { label: "Vence hoje", className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/50" };
  if (daysLeft <= 3) return { label: `${daysLeft}d`, className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/50" };
  return { label: `${daysLeft}d`, className: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-900/50" };
}

// ─── Currency input mask ──────────────────────────────────────────────────────

function useCurrencyMask(initialCents: number, onChange: (cents: number) => void) {
  const [text, setText] = React.useState(() =>
    initialCents > 0 ? formatCurrencyBRL(initialCents / 100) : "",
  );
  const [cents, setCents] = React.useState(initialCents);

  React.useEffect(() => {
    setText(initialCents > 0 ? formatCurrencyBRL(initialCents / 100) : "");
    setCents(initialCents);
  }, [initialCents]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "");
    const c = digits ? parseInt(digits, 10) : 0;
    setCents(c);
    setText(c === 0 ? "" : formatCurrencyBRL(c / 100));
    onChange(c);
  }

  return { value: text, onChange: handleChange, cents };
}

// ─── Alert Dialog ─────────────────────────────────────────────────────────────

type AlertDialogProps = {
  open: boolean;
  initial: AlertRecord | null;
  onClose: () => void;
  onSubmit: (alert: AlertRecord) => void;
};

function AlertDialog({ open, initial, onClose, onSubmit }: AlertDialogProps) {
  const [name, setName] = React.useState("");
  const [recurring, setRecurring] = React.useState(false);
  const [dayOfMonth, setDayOfMonth] = React.useState(1);
  const [dueDate, setDueDate] = React.useState("");
  const [reminderDays, setReminderDays] = React.useState(3);
  const [valueCents, setValueCents] = React.useState(0);

  const currencyMask = useCurrencyMask(valueCents, setValueCents);

  React.useEffect(() => {
    if (!open) return;
    if (initial) {
      setName(initial.name);
      setRecurring(initial.recurring);
      setDayOfMonth(initial.dayOfMonth ?? 1);
      setDueDate(initial.dueDate);
      setReminderDays(initial.reminderDays);
      setValueCents(initial.expectedValue != null ? Math.round(initial.expectedValue * 100) : 0);
    } else {
      setName("");
      setRecurring(false);
      setDayOfMonth(new Date().getDate());
      setDueDate("");
      setReminderDays(3);
      setValueCents(0);
    }
  }, [open, initial]);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (!recurring && !dueDate) return;

    const resolvedDueDate = recurring
      ? nextRecurringDate(dayOfMonth)
      : dueDate;

    onSubmit({
      id: initial?.id ?? newId(),
      name: name.trim(),
      dueDate: resolvedDueDate,
      reminderDays,
      expectedValue: valueCents > 0 ? valueCents / 100 : null,
      active: initial?.active ?? true,
      recurring,
      dayOfMonth: recurring ? dayOfMonth : null,
      createdAt: initial?.createdAt ?? Date.now(),
    });
  }

  const inputClass =
    "h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-all";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={initial ? "Editar alerta" : "Novo alerta"}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
        <h2 className="mb-5 text-lg font-bold text-[var(--foreground)]">
          {initial ? "Editar alerta" : "Novo alerta de conta"}
        </h2>

        <form onSubmit={handleSubmit} className="grid gap-4">
          {/* Nome */}
          <Input
            label="Nome da conta"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Conta de luz"
            required
            autoFocus
          />

          {/* Toggle recorrente */}
          <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">Conta recorrente</p>
              <p className="text-xs text-[var(--muted)]">Repete todo mês no mesmo dia</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={recurring}
              onClick={() => setRecurring((v) => !v)}
              className={[
                "relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2",
                recurring ? "bg-[var(--accent)]" : "bg-[var(--border-strong)]",
              ].join(" ")}
            >
              <span className={[
                "inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
                recurring ? "translate-x-5" : "translate-x-1",
              ].join(" ")} />
            </button>
          </div>

          {/* Data / Dia do mês */}
          {recurring ? (
            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-[var(--foreground)]">
                Dia de vencimento todo mês
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(Math.min(31, Math.max(1, Number(e.target.value))))}
                  className={inputClass}
                />
                <span className="shrink-0 text-sm text-[var(--muted)]">de cada mês</span>
              </div>
            </div>
          ) : (
            <Input
              label="Data de vencimento"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          )}

          {/* Lembrete + Valor */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-[var(--foreground)]">
                Lembrar antes
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={reminderDays}
                  onChange={(e) => setReminderDays(Number(e.target.value))}
                  className={inputClass}
                />
                <span className="shrink-0 text-sm text-[var(--muted)]">dias</span>
              </div>
            </div>

            <Input
              label="Valor previsto"
              value={currencyMask.value}
              onChange={currencyMask.onChange}
              placeholder="R$ 0,00"
              inputMode="numeric"
            />
          </div>

          {/* Ações */}
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              {initial ? "Salvar" : "Adicionar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Alert Row ────────────────────────────────────────────────────────────────

function AlertRow({
  alert,
  onEdit,
  onDelete,
  onToggle,
}: {
  alert: AlertRecord;
  onEdit: (a: AlertRecord) => void;
  onDelete: (a: AlertRecord) => void;
  onToggle: (a: AlertRecord, active: boolean) => void;
}) {
  const daysLeft = daysUntil(alert.dueDate);
  const badge = urgencyBadge(daysLeft, alert.active);

  return (
    <div
      className={[
        "flex items-center gap-3 rounded-xl border p-4 transition-all",
        alert.active
          ? "border-[var(--border)] bg-[var(--surface)]"
          : "border-[var(--border)] bg-[var(--surface-raised)] opacity-60",
      ].join(" ")}
    >
      {/* Toggle ativo */}
      <button
        type="button"
        role="switch"
        aria-checked={alert.active}
        aria-label={alert.active ? "Desativar alerta" : "Ativar alerta"}
        onClick={() => onToggle(alert, !alert.active)}
        className={[
          "relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2",
          alert.active ? "bg-[var(--accent)]" : "bg-[var(--border-strong)]",
        ].join(" ")}
      >
        <span className={[
          "inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
          alert.active ? "translate-x-5" : "translate-x-1",
        ].join(" ")} />
      </button>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-[var(--foreground)] truncate">{alert.name}</p>
          {alert.recurring && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface-raised)] px-2 py-0.5 text-[10px] font-medium text-[var(--muted)]">
              <IconRepeat />
              Mensal
            </span>
          )}
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${badge.className}`}>
            {badge.label}
          </span>
        </div>
        <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-[var(--muted)]">
          {alert.recurring
            ? <span>Todo dia {alert.dayOfMonth} · próximo: {formatDateBR(alert.dueDate)}</span>
            : <span>Vence: {formatDateBR(alert.dueDate)}</span>
          }
          <span>Lembrar {alert.reminderDays}d antes</span>
          {alert.expectedValue != null && (
            <span>Valor: {formatCurrencyBRL(alert.expectedValue)}</span>
          )}
        </div>
      </div>

      {/* Ações */}
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onEdit(alert)}
          aria-label="Editar alerta"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] transition-colors hover:bg-[var(--surface-raised)] hover:text-[var(--foreground)]"
        >
          <IconEdit />
        </button>
        <button
          type="button"
          onClick={() => onDelete(alert)}
          aria-label="Excluir alerta"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
        >
          <IconTrash />
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AlertsClient() {
  const [alerts, setAlerts] = React.useState<AlertRecord[]>([]);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AlertRecord | null>(null);
  const { run } = useBusy();

  const reload = React.useCallback(async () => {
    await run(async () => {
      try {
        setAlerts(await fetchAlerts());
      } catch (err) {
        console.error(err);
      }
    });
  }, [run]);

  React.useEffect(() => { reload(); }, [reload]);

  async function handleSubmit(alertData: AlertRecord) {
    await run(async () => {
      try {
        await upsertAlert(alertData);
        setAlerts(await fetchAlerts());
        setDialogOpen(false);
        setEditing(null);
      } catch (err) {
        console.error(err);
        window.alert("Erro ao salvar alerta.");
      }
    });
  }

  async function handleDelete(alert: AlertRecord) {
    const ok = window.confirm(`Excluir alerta "${alert.name}"?`);
    if (!ok) return;
    await run(async () => {
      try {
        await deleteAlert(alert.id);
        setAlerts(await fetchAlerts());
      } catch (err) {
        console.error(err);
      }
    });
  }

  async function handleToggle(alert: AlertRecord, active: boolean) {
    await run(async () => {
      try {
        await toggleAlert(alert.id, active);
        setAlerts((prev) => prev.map((a) => a.id === alert.id ? { ...a, active } : a));
      } catch (err) {
        console.error(err);
      }
    });
  }

  const activeAlerts = alerts.filter((a) => a.active);
  const inactiveAlerts = alerts.filter((a) => !a.active);
  const dueCount = activeAlerts.filter(
    (a) => daysUntil(a.dueDate) <= a.reminderDays && daysUntil(a.dueDate) >= 0,
  ).length;

  return (
    <>
      <div className="grid gap-6 animate-fade-in">
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-[var(--foreground)]">Alertas de Contas</h1>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Cadastre contas a vencer e seja lembrado na data certa.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              className="hidden sm:inline-flex"
              onClick={() => { setEditing(null); setDialogOpen(true); }}
            >
              + Novo alerta
            </Button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <StatCard label="Total" value={String(alerts.length)} color="neutral" />
            <StatCard label="Ativos" value={String(activeAlerts.length)} color="income" />
            <StatCard
              label="A vencer em breve"
              value={String(dueCount)}
              color={dueCount > 0 ? "warning" : "neutral"}
            />
          </div>
        </Card>

        {alerts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-raised)] py-16 text-center">
            <span className="text-[var(--muted)]"><IconBell /></span>
            <p className="text-sm font-semibold text-[var(--foreground)]">Nenhum alerta cadastrado</p>
            <p className="text-xs text-[var(--muted)]">Clique em &quot;Novo alerta&quot; para começar</p>
          </div>
        ) : (
          <div className="grid gap-5">
            {activeAlerts.length > 0 && (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-[var(--foreground)]">Alertas ativos</h2>
                  <span className="text-xs text-[var(--muted)]">
                    {activeAlerts.length} alerta{activeAlerts.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="grid gap-2">
                  {activeAlerts.map((a) => (
                    <AlertRow
                      key={a.id}
                      alert={a}
                      onEdit={(al) => { setEditing(al); setDialogOpen(true); }}
                      onDelete={handleDelete}
                      onToggle={handleToggle}
                    />
                  ))}
                </div>
              </div>
            )}

            {inactiveAlerts.length > 0 && (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-[var(--muted)]">Alertas inativos</h2>
                  <span className="text-xs text-[var(--muted)]">{inactiveAlerts.length}</span>
                </div>
                <div className="grid gap-2">
                  {inactiveAlerts.map((a) => (
                    <AlertRow
                      key={a.id}
                      alert={a}
                      onEdit={(al) => { setEditing(al); setDialogOpen(true); }}
                      onDelete={handleDelete}
                      onToggle={handleToggle}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <AlertDialog
        open={dialogOpen}
        initial={editing}
        onClose={() => { setDialogOpen(false); setEditing(null); }}
        onSubmit={handleSubmit}
      />
    </>
  );
}