"use client";

import * as React from "react";
import {
  LayoutDashboard,
  Receipt,
  Building2,
  BarChart3,
  Briefcase,
  Target,
  Shuffle,
  CreditCard,
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

export type NavKey =
  | "dashboard"
  | "lancamentos"
  | "lancamentos_pj"
  | "metas"
  | "controle"
  | "distribuicao_pj"
  | "distribuicao_clt"
  | "rebalanceador"
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
  /** Quando true, renderiza sem as classes "hidden md:flex" — para o slide-over mobile */
  forMobile?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    shortLabel: "Início",
    icon: <LayoutDashboard className="h-[18px] w-[18px]" aria-hidden />,
  },
  {
    key: "lancamentos",
    label: "Lançamentos",
    shortLabel: "Lanc.",
    icon: <Receipt className="h-[18px] w-[18px]" aria-hidden />,
  },
  {
    key: "lancamentos_pj",
    label: "Lançamentos PJ",
    shortLabel: "Lanc. PJ",
    icon: <Building2 className="h-[18px] w-[18px]" aria-hidden />,
  },
  {
    key: "distribuicao_pj",
    label: "Distribuição PJ",
    shortLabel: "Salário PJ",
    icon: <BarChart3 className="h-[18px] w-[18px]" aria-hidden />,
  },
  {
    key: "distribuicao_clt",
    label: "Distribuição CLT",
    shortLabel: "Salário CLT",
    icon: <Briefcase className="h-[18px] w-[18px]" aria-hidden />,
  },
  {
    key: "metas",
    label: "Metas",
    shortLabel: "Metas",
    icon: <Target className="h-[18px] w-[18px]" aria-hidden />,
  },
  {
    key: "rebalanceador",
    label: "Rebalanceador",
    shortLabel: "Rebalanc.",
    icon: <Shuffle className="h-[18px] w-[18px]" aria-hidden />,
  },
  {
    key: "controle",
    label: "Controle de Gastos",
    shortLabel: "Gastos",
    icon: <CreditCard className="h-[18px] w-[18px]" aria-hidden />,
  },
  {
    key: "alertas",
    label: "Alertas",
    shortLabel: "Alertas",
    icon: <Bell className="h-[18px] w-[18px]" aria-hidden />,
  },
];

function LogoMark({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 ${collapsed ? "justify-center" : ""}`}>
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-sm"
        style={{ backgroundColor: "var(--sidebar-logo-bg)" }}
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5" aria-hidden>
          <path d="M12 6v12M8 10c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v.5c0 1.1-.9 2-2 2h-4c-1.1 0-2 .9-2 2v.5c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </div>
      {!collapsed && (
        <div className="leading-tight">
          <p className="text-sm font-bold" style={{ color: "var(--sidebar-active-text)" }}>Cadê Meu</p>
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
      {/* Spacer — só no desktop */}
      {!forMobile && (
        <div className={`hidden md:block shrink-0 ${width} transition-[width] duration-200`} aria-hidden />
      )}

      {/* Sidebar */}
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
              style={{
                color: "var(--sidebar-text-muted)",
              }}
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
              <PanelLeftClose className="h-4 w-4" aria-hidden />
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
              <PanelLeftOpen className="h-4 w-4" aria-hidden />
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
                      "w-full flex items-center rounded-lg transition-all duration-150 cursor-pointer",
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
              className="text-[10px] text-center"
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