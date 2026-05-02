import * as React from "react";
import { twMerge } from "tailwind-merge";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: Props) {
  const base =
    "inline-flex cursor-pointer items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400/50 disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none";

  const sizes = {
    sm: "h-9 px-3 text-sm",
    md: "h-10 px-4 text-sm",
  } as const;

  const variants = {
    primary:
      "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200",
    secondary:
      "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800",
    ghost:
      "bg-transparent text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900",
  } as const;

  return (
    <button
      {...props}
      className={twMerge(`${base} ${sizes[size]} ${variants[variant]} ${className}`)}
    />
  );
}
