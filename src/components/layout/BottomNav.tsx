"use client";

import * as React from "react";
import { Receipt, Building2, BarChart3, CreditCard, Target, type LucideIcon } from "lucide-react";
import type { NavKey } from "./AppSidebar";

type Props = {
  active: NavKey;
  onChange: (next: NavKey) => void;
};

const NAV_ITEMS: Array<{
  key: NavKey;
  label: string;
  icon: LucideIcon;
}> = [
  { key: "lancamentos", label: "Lanc.", icon: Receipt },
  { key: "lancamentos_pj", label: "Lanc. PJ", icon: Building2 },
  { key: "distribuicao_pj", label: "Salário PJ", icon: BarChart3 },
  { key: "controle", label: "Gastos", icon: CreditCard },
  { key: "metas", label: "Metas", icon: Target },
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
          const Icon = item.icon;
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
                <Icon
                  className="h-5 w-5"
                  aria-hidden
                  strokeWidth={isActive ? 2.25 : 1.8}
                  fill={isActive ? "currentColor" : "none"}
                  fillOpacity={isActive ? 0.15 : undefined}
                />
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
