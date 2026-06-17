"use client";

import * as React from "react";

export type NavKey =
  | "dashboard"
  | "lancamentos"
  | "lancamentos_pj"
  | "metas"
  | "controle"
  | "distribuicao_pj"
  | "distribuicao_clt"
  | "alertas";

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
  forMobile?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    shortLabel: "Início",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" aria-hidden>
        <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    key: "lancamentos",
    label: "Lançamentos",
    shortLabel: "Lanc.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" aria-hidden>
        <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M7 9h10M7 12h7M7 15h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "lancamentos_pj",
    label: "Lançamentos PJ",
    shortLabel: "Lanc. PJ",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" aria-hidden>
        <path d="M3 21V8l9-5 9 5v13" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M9 21V13h6v8" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    key: "distribuicao_pj",
    label: "Distribuição PJ",
    shortLabel: "Salário PJ",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" aria-hidden>
        <path d="M21 21H3M21 3H3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M6 21V12M10 21V6M14 21V10M18 21V4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "distribuicao_clt",
    label: "Distribuição CLT",
    shortLabel: "Salário CLT",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" aria-hidden>
        <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M12 12v4M10 14h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "metas",
    label: "Metas",
    shortLabel: "Metas",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" aria-hidden>
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
    shortLabel: "Gastos",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" aria-hidden>
        <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M2 10h20" stroke="currentColor" strokeWidth="1.8" />
        <path d="M6 15h3M15 15h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "alertas",
    label: "Alertas",
    shortLabel: "Alertas",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" aria-hidden>
        <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

function LogoMark({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 ${collapsed ? "justify-center" : ""}`}>
      {/* Ivory orange dot as logo mark */}
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-sm font-black text-white text-sm tracking-tight"
        style={{ backgroundColor: "var(--sidebar-logo-bg)" }}
      >
        $
      </div>
      {!collapsed && (
        <div className="leading-tight">
          <p className="text-[13px] font-bold" style={{ color: "var(--sidebar-text)" }}>Cadê Meu</p>
          <p className="text-xs font-semibold" style={{ color: "var(--sidebar-logo-bg)" }}>Dinheiro?</p>
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
  forMobile = false,
}: Props) {
  const width = collapsed ? "md:w-[72px]" : "md:w-65";

  return (
    <>
      {/* Spacer */}
      {!forMobile && (
        <div className={`hidden md:block shrink-0 ${width} transition-[width] duration-200`} aria-hidden />
      )}

      <aside
        className={[
          forMobile
            ? "flex flex-col w-full h-full"
            : "hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:z-40 md:h-dvh md:transition-[width] md:duration-200",
          "border-r",
          forMobile ? "" : width,
        ].join(" ")}
        style={{
          backgroundColor: "var(--sidebar-bg)",
          borderColor: "var(--sidebar-border)",
        }}
      >
        {/* Header */}
        <div className={`flex items-center py-5 ${collapsed ? "justify-center px-3" : "px-4 justify-between"}`}>
          <LogoMark collapsed={collapsed} />
          {!collapsed && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="h-7 w-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer"
              style={{ color: "var(--sidebar-text-muted)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "var(--sidebar-hover-bg)";
                (e.currentTarget as HTMLElement).style.color = "var(--sidebar-text)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                (e.currentTarget as HTMLElement).style.color = "var(--sidebar-text-muted)";
              }}
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
              className="h-7 w-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer"
              style={{ color: "var(--sidebar-text-muted)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "var(--sidebar-hover-bg)";
                (e.currentTarget as HTMLElement).style.color = "var(--sidebar-text)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                (e.currentTarget as HTMLElement).style.color = "var(--sidebar-text-muted)";
              }}
              aria-label="Expandir menu"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}

        {/* Divider */}
        <div className="mx-4 mb-3 h-px" style={{ backgroundColor: "var(--sidebar-border)" }} />

        {/* Nav */}
        <nav className={`flex-1 overflow-y-auto py-1 ${collapsed ? "px-2" : "px-3"}`}>
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
                      "w-full flex items-center rounded-xl transition-all duration-150 cursor-pointer",
                      collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5",
                    ].join(" ")}
                    style={
                      isActive
                        ? {
                            backgroundColor: "var(--sidebar-active-bg)",
                            color: "var(--sidebar-active-text)",
                          }
                        : {
                            color: "var(--sidebar-text)",
                          }
                    }
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.backgroundColor = "var(--sidebar-hover-bg)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                      }
                    }}
                  >
                    <span
                      style={{
                        color: isActive ? "var(--sidebar-active-icon)" : "var(--sidebar-text-muted)",
                      }}
                    >
                      {item.icon}
                    </span>
                    {!collapsed && (
                      <span className="text-[13px] font-semibold truncate">{item.label}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom */}
        <div className={`py-4 ${collapsed ? "px-2" : "px-4"}`}>
          <div className="h-px mb-4" style={{ backgroundColor: "var(--sidebar-border)" }} />
          {!collapsed && (
            <p
              className="text-[10px] text-center font-light"
              style={{ color: "var(--sidebar-text-muted)" }}
            >
              © {new Date().getFullYear()} Cadê Meu Dinheiro?
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
