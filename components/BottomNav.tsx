"use client";

import * as React from "react";
import type { NavKey } from "./AppSidebar";

type Props = {
  active: NavKey;
  onChange: (next: NavKey) => void;
};

const NAV_ITEMS: Array<{ key: NavKey; label: string; icon: React.ReactNode }> = [
  {
    key: "lancamentos",
    label: "Lançamentos",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
        <path d="M9 6h11M9 12h11M9 18h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="4" cy="6" r="1.5" fill="currentColor" />
        <circle cx="4" cy="12" r="1.5" fill="currentColor" />
        <circle cx="4" cy="18" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    key: "lancamentos_pj",
    label: "Lanç. PJ",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
        <path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 12h5v4h-5a2 2 0 0 1 0-4Z" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    key: "distribuicao_pj",
    label: "Distrib.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
        <path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    key: "controle",
    label: "Controle",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
        <rect x="2" y="5" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="2" />
        <path d="M2 10h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M6 15h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "metas",
    label: "Metas",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
      </svg>
    ),
  },
];

export function BottomNav({ active, onChange }: Props) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-green-100 bg-white/96 backdrop-blur-md pb-[env(safe-area-inset-bottom)] dark:border-green-900/30 dark:bg-green-950/95 md:hidden"
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
              className={`flex cursor-pointer flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-all duration-150 ${
                isActive
                  ? "text-green-700 dark:text-green-400"
                  : "text-zinc-400 hover:text-green-600 dark:text-zinc-500 dark:hover:text-green-400"
              }`}
            >
              <span className={`transition-transform duration-150 ${isActive ? "scale-110" : ""}`}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
