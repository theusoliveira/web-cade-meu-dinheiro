"use client";

import * as React from "react";
import { Bell, CheckCircle2, AlertTriangle } from "lucide-react";
import { fetchDueAlerts, type AlertRecord } from "@/actions/alerts";
import { formatCurrencyBRL, formatDateBR } from "@/lib/finance";

function daysUntil(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${dueDate}T00:00:00`);
  return Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
}

type Props = {
  onNavigateAlerts?: () => void;
};

export function NotificationBell({ onNavigateAlerts }: Props) {
  const [alerts, setAlerts] = React.useState<AlertRecord[]>([]);
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    let alive = true;
    fetchDueAlerts()
      .then((data) => { if (alive) setAlerts(data); })
      .catch(console.error);
    return () => { alive = false; };
  }, []);

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const count = alerts.length;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notificações${count > 0 ? ` — ${count} pendente${count !== 1 ? "s" : ""}` : ""}`}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] transition-colors hover:bg-[var(--surface-raised)] hover:text-[var(--foreground)]"
      >
        <Bell className="h-5 w-5" aria-hidden strokeWidth={1.8} />
        {count > 0 && (
          <span
            aria-hidden
            className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white"
          >
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <p className="text-sm font-bold text-[var(--foreground)]">Notificações</p>
            {count > 0 && (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                {count} pendente{count !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {count === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <CheckCircle2 className="h-8 w-8 text-[var(--muted)]" aria-hidden strokeWidth={1.5} />
              <p className="text-sm font-medium text-[var(--foreground)]">Tudo em dia!</p>
              <p className="text-xs text-[var(--muted)]">Nenhuma conta a vencer nos próximos dias.</p>
            </div>
          ) : (
            <ul className="max-h-72 divide-y divide-[var(--border)] overflow-y-auto">
              {alerts.map((alert) => {
                const days = daysUntil(alert.dueDate);
                return (
                  <li key={alert.id} className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${days === 0 ? "bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400" : "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"}`}>
                        <AlertTriangle className="h-4 w-4" aria-hidden strokeWidth={1.5} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[var(--foreground)]">{alert.name}</p>
                        <p className="text-xs text-[var(--muted)]">
                          Vence em {formatDateBR(alert.dueDate)}
                          {days === 0 ? " (hoje!)" : days === 1 ? " (amanhã)" : ` (em ${days} dias)`}
                        </p>
                        {alert.expectedValue != null && (
                          <p className="text-xs font-medium text-[var(--foreground)]">
                            Valor: {formatCurrencyBRL(alert.expectedValue)}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {onNavigateAlerts && (
            <div className="border-t border-[var(--border)] px-4 py-3">
              <button
                type="button"
                onClick={() => { setOpen(false); onNavigateAlerts(); }}
                className="w-full rounded-lg py-1.5 text-xs font-semibold text-[var(--accent)] transition-colors hover:text-[var(--accent-dark)]"
              >
                Ver todos os alertas →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
