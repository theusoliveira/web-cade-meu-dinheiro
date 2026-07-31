import * as React from "react";
import { twMerge } from "tailwind-merge";
import { TrendingUp, TrendingDown, LineChart, Wallet, AlertTriangle, List } from "lucide-react";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "raised" | "outlined";
};

export function Card({ variant = "default", className, children, ...props }: CardProps) {
  const variants = {
    default: "bg-[var(--surface)] border border-[var(--border)]",
    raised: "bg-[var(--surface)] border border-[var(--border)] shadow-sm",
    outlined: "bg-transparent border-2 border-dashed border-[var(--border)]",
  };

  return (
    <div
      className={twMerge(
        "rounded-xl p-5",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

const STAT_ICONS: Record<string, React.ReactNode> = {
  income: <TrendingUp className="h-5 w-5" aria-hidden />,
  expense: <TrendingDown className="h-5 w-5" aria-hidden />,
  investment: <LineChart className="h-5 w-5" aria-hidden />,
  balance: <Wallet className="h-5 w-5" aria-hidden />,
  warning: <AlertTriangle className="h-5 w-5" aria-hidden />,
  neutral: <List className="h-5 w-5" aria-hidden />,
};

export function StatCard({
  label,
  value,
  color = "neutral",
  icon,
}: {
  label: string;
  value: string;
  color?: "income" | "expense" | "investment" | "balance" | "warning" | "neutral";
  icon?: React.ReactNode;
}) {
  const iconStyles: Record<string, string> = {
    income: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    expense: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    investment: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
    balance: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    neutral: "bg-[var(--surface-raised)] text-[var(--muted)]",
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 flex items-center gap-3">
      <div className={`shrink-0 rounded-lg p-2.5 ${iconStyles[color]}`}>
        {icon ?? STAT_ICONS[color]}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-[var(--muted)]">{label}</p>
        <p className="mt-0.5 text-lg font-bold text-[var(--foreground)] truncate">{value}</p>
      </div>
    </div>
  );
}

export function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "income" | "expense" | "investment" | "default" | "muted";
}) {
  const variants = {
    income: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/50",
    expense: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/50",
    investment: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-900/50",
    default: "bg-[var(--surface-raised)] text-[var(--foreground)] border-[var(--border)]",
    muted: "bg-[var(--surface-raised)] text-[var(--muted)] border-[var(--border)]",
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}