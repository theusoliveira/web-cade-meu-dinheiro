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
        "rounded-2xl p-5",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  color = "neutral",
}: {
  label: string;
  value: string;
  color?: "income" | "expense" | "investment" | "balance" | "neutral";
}) {
  const colors = {
    income: "border-l-4 border-l-emerald-500",
    expense: "border-l-4 border-l-rose-500",
    investment: "border-l-4 border-l-sky-500",
    balance: "border-l-4 border-l-amber-400",
    neutral: "",
  };

  return (
    <div
      className={`rounded-xl border p-4 border-[var(--border)] ${colors[color]}`}
    >
      <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">{label}</p>
      <p className="mt-1.5 text-xl font-bold text-[var(--foreground)] ">{value}</p>
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
