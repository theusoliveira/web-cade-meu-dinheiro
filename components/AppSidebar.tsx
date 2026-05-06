"use client";

import * as React from "react";

export type NavKey = "lancamentos" | "lancamentos_pj" | "metas" | "controle" | "distribuicao_pj";

type Props = {
  active: NavKey;
  onChange: (next: NavKey) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  /** @deprecated Mobile agora usa BottomNav. */
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

function Icon({
  name,
  className,
}: {
  name: "list" | "target" | "card" | "chart" | "wallet";
  className?: string;
}) {
  const cls = className ?? "h-5 w-5";

  if (name === "chart") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={cls}>
        <path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (name === "list") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={cls}>
        <path d="M9 6h11M9 12h11M9 18h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="4" cy="6" r="1.5" fill="currentColor" />
        <circle cx="4" cy="12" r="1.5" fill="currentColor" />
        <circle cx="4" cy="18" r="1.5" fill="currentColor" />
      </svg>
    );
  }

  if (name === "target") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={cls}>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
      </svg>
    );
  }

  if (name === "wallet") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={cls}>
        <path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 12h5v4h-5a2 2 0 0 1 0-4Z" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }

  // card
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={cls}>
      <rect x="2" y="5" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="M2 10h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 15h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SidebarBody({
  active,
  onChange,
  onAfterNavigate,
  topRight,
  collapsed,
}: {
  active: NavKey;
  onChange: (next: NavKey) => void;
  onAfterNavigate?: () => void;
  topRight?: React.ReactNode;
  collapsed?: boolean;
}) {
  const items: Array<{
    key: NavKey;
    label: string;
    icon: "list" | "target" | "card" | "chart" | "wallet";
  }> = [
    { key: "lancamentos", label: "Lançamentos", icon: "list" },
    { key: "lancamentos_pj", label: "Lançamentos PJ", icon: "wallet" },
    { key: "distribuicao_pj", label: "Distribuição PJ", icon: "chart" },
    { key: "metas", label: "Metas", icon: "target" },
    { key: "controle", label: "Controle de gastos", icon: "card" },
  ];

  function go(next: NavKey) {
    onChange(next);
    onAfterNavigate?.();
  }

  const isCollapsed = Boolean(collapsed);

  const itemClass = (isActive: boolean) => {
    const base =
      "w-full flex cursor-pointer items-center rounded-xl text-sm font-semibold transition-all duration-150 " +
      (isCollapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-2.5");

    return (
      base +
      " " +
      (isActive
        ? "bg-white/20 text-white shadow-sm"
        : "text-white/75 hover:bg-white/10 hover:text-white")
    );
  };

  return (
    <div className="flex h-full flex-col">
      <div className={isCollapsed ? "px-2 pt-5" : "px-4 pt-5"}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/20 text-white font-bold text-lg shadow-inner">
              💸
            </div>

            {isCollapsed ? null : (
              <div className="leading-tight">
                <p className="text-sm font-bold tracking-tight">Cadê meu dinheiro?</p>
                <p className="text-xs text-white/60 font-medium">Financeiro pessoal</p>
              </div>
            )}
          </div>

          {topRight ? <div className="shrink-0">{topRight}</div> : null}
        </div>
      </div>

      <div className={isCollapsed ? "mx-2 mt-6 h-px bg-white/10" : "mx-4 mt-5 h-px bg-white/10"} />

      <nav className={isCollapsed ? "mt-4 px-1 space-y-1" : "mt-4 px-2 space-y-1"}>
        {items.map((it) => (
          <button
            key={it.key}
            type="button"
            className={itemClass(active === it.key)}
            onClick={() => go(it.key)}
            title={isCollapsed ? it.label : undefined}
            aria-label={isCollapsed ? it.label : undefined}
          >
            <Icon name={it.icon} className="h-5 w-5 shrink-0" />
            {isCollapsed ? null : <span className="truncate">{it.label}</span>}
          </button>
        ))}
      </nav>
    </div>
  );
}

export function AppSidebar({
  active,
  onChange,
  collapsed,
  onToggleCollapse,
}: Props) {
  const desktopWidth = collapsed ? "md:w-20" : "md:w-64";

  return (
    <>
      {/* Espaçador */}
      <div className={`hidden md:block ${desktopWidth}`} aria-hidden="true" />

      <aside
        className={
          "hidden md:flex md:flex-col md:border-r md:border-green-900/30 md:bg-gradient-to-b md:from-green-900 md:to-green-950 md:text-white dark:md:from-green-950 dark:md:to-green-950 " +
          "md:fixed md:inset-y-0 md:left-0 md:z-40 md:h-dvh md:transition-[width] md:duration-200 " +
          desktopWidth
        }
      >
        <div className="h-full overflow-y-auto">
          <SidebarBody active={active} onChange={onChange} collapsed={collapsed} />
        </div>
      </aside>

      {/* Botão de colapso flutuante — só desktop */}
      <button
        type="button"
        onClick={onToggleCollapse}
        className={
          "hidden md:grid fixed z-[60] -translate-x-1/2 " +
          (collapsed ? "left-20 " : "left-64 ") +
          "top-[calc(env(safe-area-inset-top)+24px)] " +
          "h-8 w-8 place-items-center rounded-full " +
          "border border-green-200 bg-white text-green-700 shadow-md cursor-pointer " +
          "hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-400/60 " +
          "dark:border-green-800 dark:bg-green-950 dark:text-green-300 dark:hover:bg-green-900"
        }
        aria-label={collapsed ? "Expandir menu" : "Minimizar menu"}
        title={collapsed ? "Expandir" : "Minimizar"}
      >
        {collapsed ? (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
            <path d="M10 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
            <path d="M14 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
    </>
  );
}
