import * as React from "react";
import { twMerge } from "tailwind-merge";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: Props) {
  const base =
    "inline-flex cursor-pointer items-center justify-center rounded-lg font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-green-500/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none select-none";

  const sizes = {
    sm: "h-9 px-3 text-sm",
    md: "h-10 px-4 text-sm",
  } as const;

  const variants = {
    primary:
      "bg-green-600 text-white hover:bg-green-700 active:bg-green-800 shadow-sm dark:bg-green-600 dark:hover:bg-green-500",
    secondary:
      "bg-green-50 text-green-800 hover:bg-green-100 active:bg-green-200 dark:bg-green-950/40 dark:text-green-200 dark:hover:bg-green-900/50",
    ghost:
      "bg-transparent text-zinc-700 hover:bg-zinc-100 active:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800/60",
    danger:
      "bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm dark:bg-rose-700 dark:hover:bg-rose-600",
  } as const;

  return (
    <button
      {...props}
      className={twMerge(`${base} ${sizes[size]} ${variants[variant]} ${className}`)}
    />
  );
}
