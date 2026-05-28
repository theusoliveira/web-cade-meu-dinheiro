"use client";

import * as React from "react";
import type { NavKey } from "./AppSidebar";

type Props = {
  active: NavKey;
  onChange: (next: NavKey) => void;
};

const NAV_ITEMS: Array<{
  key: NavKey;
  label: string;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
}> = [
  {
    key: "lancamentos",
    label: "Lanc.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
        <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M7 9h10M7 12h7M7 15h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    activeIcon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
        <rect x="3" y="5" width="18" height="14" rx="2" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.8" />
        <path d="M7 9h10M7 12h7M7 15h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "lancamentos_pj",
    label: "Lanc. PJ",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
        <path d="M3 21V8l9-5 9 5v13" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M9 21V13h6v8" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
    activeIcon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
        <path d="M3 21V8l9-5 9 5v13" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M9 21V13h6v8" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    key: "distribuicao_pj",
    label: "Salário PJ",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
        <path d="M21 21H3M6 21V12M10 21V6M14 21V10M18 21V4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    activeIcon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
        <path d="M21 21H3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M6 21V12M10 21V6M14 21V10M18 21V4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "controle",
    label: "Gastos",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
        <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M2 10h20M6 15h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    activeIcon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
        <rect x="2" y="5" width="20" height="14" rx="2" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.8" />
        <path d="M2 10h20M6 15h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "metas",
    label: "Metas",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      </svg>
    ),
    activeIcon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
        <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
      </svg>
    ),
  },
];

export function BottomNav({ active, onChange }: Props) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden
        border-t border-[var(--border)]
        bg-[var(--surface)]/95 backdrop-blur-xl
        pb-[env(safe-area-inset-bottom)]"
      aria-label="Navegação principal"
    >
      <div className="grid h-16 grid-cols-5">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={[
                "flex flex-col items-center justify-center gap-1 cursor-pointer",
                "text-[10px] font-semibold transition-all",
                isActive
                  ? "text-[var(--accent)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]",
              ].join(" ")}
            >
              <span
                className={[
                  "flex items-center justify-center rounded-xl transition-all",
                  isActive
                    ? "bg-[var(--accent)]/10 p-1.5 -m-1.5"
                    : "p-1.5 -m-1.5",
                ].join(" ")}
              >
                {isActive ? item.activeIcon : item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
