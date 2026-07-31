"use client";

import * as React from "react";
import { twMerge } from "tailwind-merge";
import { AlertCircle } from "lucide-react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="grid gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--foreground)]"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-[var(--muted)] pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={twMerge(
              "w-full h-10 rounded-lg border bg-[var(--surface)] text-sm text-[var(--foreground)] " +
              "placeholder:text-[var(--muted-light)] " +
              "outline-none transition-all duration-150 " +
              "focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-0 focus:border-[var(--accent)] " +
              (error ? "border-rose-500" : "border-[var(--border)]") + " " +
              (leftIcon ? "pl-10" : "pl-3") + " " +
              (rightIcon ? "pr-10" : "pr-3"),
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 text-[var(--muted)]">
              {rightIcon}
            </span>
          )}
        </div>
        {error && (
          <p className="text-xs text-rose-500 flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-xs text-[var(--muted)]">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";


type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
};

export function Select({ label, error, className, id, children, ...props }: SelectProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="grid gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-[var(--foreground)]">
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={twMerge(
          "w-full h-10 rounded-lg border bg-[var(--surface)] pl-3 pr-8 text-sm text-[var(--foreground)] " +
          "outline-none transition-all duration-150 cursor-pointer " +
          "focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] " +
          (error ? "border-rose-500" : "border-[var(--border)]"),
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  );
}
