import * as React from "react";
import { twMerge } from "tailwind-merge";

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
  income: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden>
      <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
    </svg>
  ),
  expense: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden>
      <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
    </svg>
  ),
  investment: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden>
      <path fillRule="evenodd" d="M12.577 4.878a.75.75 0 01.919-.53l4.78 1.281a.75.75 0 01.531.919l-1.281 4.78a.75.75 0 01-1.449-.387l.81-3.022a19.407 19.407 0 00-5.594 5.203.75.75 0 01-1.139.093L7 10.06l-3.72 3.72a.75.75 0 11-1.06-1.061l4.25-4.25a.75.75 0 011.06 0l1.956 1.956a20.924 20.924 0 015.293-5.136l-3.023.81a.75.75 0 01-.387-1.45z" clipRule="evenodd" />
    </svg>
  ),
  balance: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden>
      <path d="M10.75 10.818v2.614A3.13 3.13 0 0011.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.560-.612-.875a3.13 3.13 0 00-1.138-.432zM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603a2.45 2.45 0 00-.35.13c-.14.065-.27.143-.386.235-.737.576-.738 1.205-.184 1.692z" />
      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v.022a2.68 2.68 0 011.418.504c.478.317.832.803.832 1.474s-.354 1.157-.832 1.474A2.68 2.68 0 0110.75 12v.022a1 1 0 11-2 0v-.043a2.68 2.68 0 01-1.08-.476C7.192 11.157 6.75 10.596 6.75 9.875c0-.62.327-1.07.751-1.352.14-.092.293-.165.449-.22V8z" clipRule="evenodd" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden>
      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
  ),
  neutral: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden>
      <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10zm0 5.25a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
    </svg>
  ),
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
    income: "bg-emerald-50 text-emerald-600",
    expense: "bg-rose-50 text-rose-600",
    investment: "bg-sky-50 text-sky-600",
    balance: "bg-amber-50 text-amber-600",
    warning: "bg-amber-50 text-amber-600",
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