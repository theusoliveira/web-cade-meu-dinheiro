"use client";

import * as React from "react";

export type NavKey =
  | "lancamentos"
  | "lancamentos_pj"
  | "metas"
  | "controle"
  | "distribuicao_pj";

type NavItem = {
  key: NavKey;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
};

type Props = {
  active: NavKey;
  onChange: (next: NavKey) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

const NAV_ITEMS: NavItem[] = [
  {
    key: "lancamentos",
    label: "Lançamentos",
    shortLabel: "Pessoal",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
        <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M7 9h10M7 12h7M7 15h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "lancamentos_pj",
    label: "Lançamentos PJ",
    shortLabel: "PJ",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
        <path d="M3 21V8l9-5 9 5v13" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M9 21V13h6v8" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    key: "distribuicao_pj",
    label: "Distribuição PJ",
    shortLabel: "Distrib.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
        <path d="M21 21H3M21 3H3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M6 21V12M10 21V6M14 21V10M18 21V4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "metas",
    label: "Metas",
    shortLabel: "Metas",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "controle",
    label: "Controle de Gastos",
    shortLabel: "Cartão",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
        <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M2 10h20" stroke="currentColor" strokeWidth="1.8" />
        <path d="M6 15h3M15 15h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
];

function LogoMark({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-900/40">
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
          <path d="M12 6v12M8 10c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v.5c0 1.1-.9 2-2 2h-4c-1.1 0-2 .9-2 2v.5c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </div>
      {!collapsed && (
        <div>
          <p className="text-sm font-bold text-white leading-tight">Cadê Meu</p>
          <p className="text-xs text-emerald-400 font-semibold leading-tight">Dinheiro?</p>
        </div>
      )}
    </div>
  );
}

export function AppSidebar({
  active,
  onChange,
  collapsed,
  onToggleCollapse,
}: Props) {
  const width = collapsed ? "md:w-[72px]" : "md:w-60";

  return (
    <>
      {/* Spacer */}
      <div className={`hidden md:block shrink-0 ${width} transition-[width] duration-200`} aria-hidden />

      {/* Sidebar */}
      <aside
        className={[
          "hidden md:flex md:flex-col",
          "md:fixed md:inset-y-0 md:left-0 md:z-40",
          "md:h-dvh md:transition-[width] md:duration-200",
          "bg-[var(--sidebar-bg)] border-r border-white/5",
          width,
        ].join(" ")}
      >
        {/* Header */}
        <div className={`flex items-center py-5 ${collapsed ? "justify-center px-3" : "px-4 justify-between"}`}>
          <LogoMark collapsed={collapsed} />
          {!collapsed && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="h-7 w-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
              aria-label="Minimizar menu"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>

        {collapsed && (
          <div className="flex justify-center pb-2">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="h-7 w-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
              aria-label="Expandir menu"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}

        {/* Divider */}
        <div className="mx-4 mb-2 h-px bg-white/8" />

        {/* Nav */}
        <nav className={`flex-1 overflow-y-auto py-2 ${collapsed ? "px-2" : "px-3"}`}>
          {!collapsed && (
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/30">
              Navegação
            </p>
          )}

          <ul className="grid gap-0.5">
            {NAV_ITEMS.map((item) => {
              const isActive = active === item.key;
              return (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => onChange(item.key)}
                    title={collapsed ? item.label : undefined}
                    aria-label={item.label}
                    aria-current={isActive ? "page" : undefined}
                    className={[
                      "w-full flex items-center rounded-xl transition-all cursor-pointer",
                      collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5",
                      isActive
                        ? "bg-emerald-500/15 text-white"
                        : "text-white/55 hover:bg-white/6 hover:text-white/90",
                    ].join(" ")}
                  >
                    <span className={isActive ? "text-emerald-400" : ""}>
                      {item.icon}
                    </span>
                    {!collapsed && (
                      <span className="text-sm font-medium truncate">{item.label}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom */}
        <div className={`py-4 ${collapsed ? "px-2" : "px-4"}`}>
          <div className="h-px bg-white/8 mb-4" />
          {!collapsed && (
            <p className="text-[10px] text-white/25 text-center">
              © 2026 Cadê Meu Dinheiro?
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
