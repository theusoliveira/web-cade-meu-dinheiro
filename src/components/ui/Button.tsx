"use client";

import * as React from "react";
import { twMerge } from "tailwind-merge";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
  size?: "xs" | "sm" | "md" | "lg";
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  loading,
  leftIcon,
  rightIcon,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl font-semibold " +
    "transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 " +
    "focus-visible:ring-[var(--accent)] select-none " +
    "disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none " +
    "active:scale-[0.97]";

  const sizes = {
    xs: "h-7 px-3 text-xs gap-1.5",
    sm: "h-8 px-3.5 text-sm",
    md: "h-10 px-4 text-sm",
    lg: "h-11 px-5 text-base",
  } as const;

  const variants = {
    primary:
      "bg-[var(--accent)] text-white hover:brightness-110 shadow-sm shadow-emerald-900/20",
    secondary:
      "bg-[var(--surface-raised)] text-[var(--foreground)] hover:bg-[var(--border)] border border-[var(--border)]",
    ghost:
      "bg-transparent text-[var(--muted)] hover:bg-[var(--surface-raised)] hover:text-[var(--foreground)]",
    danger:
      "bg-rose-600 text-white hover:bg-rose-700 shadow-sm",
    success:
      "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm",
  } as const;

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={twMerge(`${base} ${sizes[size]} ${variants[variant]} ${className}`)}
    >
      {loading ? (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
}
