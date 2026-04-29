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
        <path d="M8 6h13M8 12h13M8 18h13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "lancamentos_pj",
    label: "Lançamentos PJ",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
        <path d="M8 6h13M8 12h13M8 18h13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <rect x="1" y="1" width="5" height="3" rx="1" fill="currentColor" opacity="0" />
      </svg>
    ),
  },
  {
    key: "controle",
    label: "Controle de gastos",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
        <path d="M4 7.5h16M4 10.5h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M6 5h12a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M7 16h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "metas",
    label: "Metas",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
        <path d="M12 21a9 9 0 1 0-9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 17a5 5 0 1 0-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
];

export function BottomNav({ active, onChange }: Props) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 bg-white/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] dark:border-zinc-800 dark:bg-zinc-950/95 md:hidden"
      aria-label="Navegação principal"
    >
      <div className="grid h-16 grid-cols-4">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
                isActive
                  ? "text-[#0b2a5b] dark:text-blue-400"
                  : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              <span className={`transition-transform ${isActive ? "scale-110" : ""}`}>
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
