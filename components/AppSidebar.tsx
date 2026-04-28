"use client";

import * as React from "react";
import type { NavKey } from "./SiteNav";

type Props = {
  active: NavKey;
  onChange: (next: NavKey) => void;

  /** Apenas para telas grandes (md+) */
  collapsed: boolean;
  onToggleCollapse: () => void;

  /** Controla o drawer no mobile */
  mobileOpen: boolean;
  onMobileClose: () => void;
};

function Icon({
  name,
  className,
}: {
  name: "list" | "target" | "card";
  className?: string;
}) {
  const cls = className ?? "h-5 w-5";

  if (name === "list") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={cls}>
        <path
          d="M8 6h13M8 12h13M8 18h13"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M3.5 6h.01M3.5 12h.01M3.5 18h.01"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (name === "target") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={cls}>
        <path
          d="M12 21a9 9 0 1 0-9-9"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M12 17a5 5 0 1 0-5-5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M12 13a1 1 0 1 0-1-1"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  // card
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={cls}>
      <path
        d="M4 7.5h16M4 10.5h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6 5h12a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M7 16h4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
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
    icon: "list" | "target" | "card";
  }> = [
    { key: "lancamentos", label: "Lançamentos", icon: "list" },
    { key: "lancamentos_pj", label: "Lançamentos PJ", icon: "list" },
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
      "w-full flex cursor-pointer items-center rounded-xl text-sm font-medium transition-colors " +
      (isCollapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-2");

    return (
      base +
      " " +
      (isActive
        ? "bg-white/15 text-white"
        : "text-white/80 hover:bg-white/10 hover:text-white")
    );
  };

  return (
    <div className="flex h-full flex-col">
      <div className={isCollapsed ? "px-2 pt-4" : "px-3 pt-5"}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 text-white">
              $
            </div>

            {isCollapsed ? null : (
              <div className="leading-tight">
                <p className="text-sm font-semibold">Cadê meu dinheiro?</p>
                <p className="text-xs text-white/70">Financeiro pessoal</p>
              </div>
            )}
          </div>

          {topRight ? <div className="shrink-0">{topRight}</div> : null}
        </div>
      </div>

      <nav className={isCollapsed ? "mt-6 px-1" : "mt-6 px-2"}>
        {items.map((it) => (
          <button
            key={it.key}
            type="button"
            className={itemClass(active === it.key)}
            onClick={() => go(it.key)}
            title={isCollapsed ? it.label : undefined}
            aria-label={isCollapsed ? it.label : undefined}
          >
            <Icon name={it.icon} className="h-5 w-5" />
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
  mobileOpen,
  onMobileClose,
  collapsed,
  onToggleCollapse,
}: Props) {
  React.useEffect(() => {
    if (!mobileOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onMobileClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen, onMobileClose]);

  const desktopWidth = collapsed ? "md:w-20" : "md:w-64";

  // Botão flutuante no viewport (não é cortado por overflow de nenhum container)
  const desktopToggle = (
    <button
      type="button"
      onClick={onToggleCollapse}
      className={
        "hidden md:grid fixed z-[60] -translate-x-1/2 " +
        (collapsed ? "left-20 " : "left-64 ") +
        "top-[calc(env(safe-area-inset-top)+24px)] " +
        "h-9 w-9 place-items-center rounded-full " +
        "border border-[#93c5fd] bg-[#dbeafe] text-[#0b2a5b] shadow-md " +
        "hover:bg-[#bfdbfe] focus:outline-none focus:ring-2 focus:ring-[#93c5fd]/60 " +
        "dark:border-[#60a5fa]/60 dark:bg-[#0b2a5b] dark:text-white dark:hover:bg-[#0a2550]"
      }
      aria-label={collapsed ? "Expandir menu" : "Minimizar menu"}
      title={collapsed ? "Expandir" : "Minimizar"}
    >
      {collapsed ? (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <path
            d="M10 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <path
            d="M14 6l-6 6 6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );

  // Desktop sidebar (fixa)
  const desktop = (
    <>
      {/* Espaçador para o conteúdo não ficar embaixo da sidebar fixa */}
      <div className={`hidden md:block ${desktopWidth}`} aria-hidden="true" />

      <aside
        className={
          "hidden md:flex md:flex-col md:border-r md:border-white/10 md:bg-[#0b2a5b] md:text-white dark:md:bg-[#071b3b] " +
          "md:fixed md:inset-y-0 md:left-0 md:z-40 md:h-dvh md:transition-[width] md:duration-200 " +
          desktopWidth
        }
      >
        <div className="h-full overflow-y-auto">
          <SidebarBody active={active} onChange={onChange} collapsed={collapsed} />
        </div>
      </aside>

      {desktopToggle}
    </>
  );

  // Mobile drawer
  const mobile = mobileOpen ? (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        aria-label="Fechar menu"
        className="absolute inset-0 bg-black/40"
        onClick={onMobileClose}
      />

      <div className="absolute left-0 top-0 h-full w-[18rem] max-w-[80vw] bg-[#0b2a5b] text-white shadow-2xl dark:bg-[#071b3b]">
        <div className="h-full overflow-y-auto pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
          <SidebarBody
            active={active}
            onChange={onChange}
            onAfterNavigate={onMobileClose}
            collapsed={false}
            topRight={
              <button
                type="button"
                onClick={onMobileClose}
                className="grid h-10 w-10 place-items-center rounded-xl text-white/80 hover:bg-white/10 hover:text-white"
                aria-label="Fechar"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            }
          />
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {desktop}
      {mobile}
    </>
  );
}
