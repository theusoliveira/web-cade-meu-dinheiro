"use client";

import * as React from "react";
import type { NavKey } from "./AppSidebar";
import type { EntryKind } from "../lib/finance";

type Props = {
  activeTab: NavKey;
  onSelectEntry: (kind: EntryKind) => void;
  onAddGoal: () => void;
};

type ActionOption = {
  kind: EntryKind;
  label: string;
  icon: string;
  colorClass: string;
};

const ENTRY_OPTIONS: Record<"personal" | "business" | "card", ActionOption[]> = {
  personal: [
    { kind: "income",     label: "Receita",      icon: "+", colorClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50" },
    { kind: "expense",    label: "Despesa",       icon: "−", colorClass: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50" },
    { kind: "investment", label: "Investimento",  icon: "↑", colorClass: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900/50" },
  ],
  business: [
    { kind: "income",     label: "Entrada",    icon: "+", colorClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50" },
    { kind: "expense",    label: "Saída",      icon: "−", colorClass: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50" },
    { kind: "investment", label: "Investimento",  icon: "↑", colorClass: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900/50" },
  ],
  card: [
    { kind: "income",  label: "Receita",  icon: "+", colorClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50" },
    { kind: "expense", label: "Despesa",  icon: "−", colorClass: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50" },
  ],
};

export function MobileActionSheet({ activeTab, onSelectEntry, onAddGoal }: Props) {
  const [open, setOpen] = React.useState(false);

  // Fecha com ESC ou back gesture
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function handleFABClick() {
    // Metas: abre o dialog diretamente, sem action sheet
    if (activeTab === "metas") {
      onAddGoal();
      return;
    }
    setOpen((v) => !v);
  }

  function handleSelect(kind: EntryKind) {
    setOpen(false);
    onSelectEntry(kind);
  }

  const options =
    activeTab === "lancamentos"
      ? ENTRY_OPTIONS.personal
      : activeTab === "lancamentos_pj"
        ? ENTRY_OPTIONS.business
        : ENTRY_OPTIONS.card;

  // Posicionado acima da bottom nav (h-16 = 64px + safe area)
  const fabBottom = "bottom-[calc(env(safe-area-inset-bottom)+76px)]";

  return (
    <>
      {/* Backdrop */}
      {open ? (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      {/* Action sheet — desliza de baixo para cima */}
      <div
        className={`fixed left-0 right-0 z-50 md:hidden transition-[transform,opacity] duration-300 ease-out ${
          open
            ? "translate-y-0 opacity-100"
            : "translate-y-full opacity-0 pointer-events-none"
        }`}
        style={{ bottom: `calc(env(safe-area-inset-bottom) + 80px)` }}
        role="dialog"
        aria-label="Escolha o tipo de lançamento"
        aria-modal="true"
      >
        <div className="mx-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
          <p className="border-b border-zinc-100 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            Adicionar lançamento
          </p>
          <div className="p-3 grid gap-2">
            {options.map((opt) => (
              <button
                key={opt.kind}
                type="button"
                onClick={() => handleSelect(opt.kind)}
                className={`flex w-full items-center gap-4 rounded-xl border px-4 py-3.5 text-left text-sm font-semibold transition-opacity active:opacity-70 ${opt.colorClass}`}
              >
                <span
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/60 text-base font-bold dark:bg-black/30"
                  aria-hidden="true"
                >
                  {opt.icon}
                </span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* FAB */}
      <button
        type="button"
        onClick={handleFABClick}
        aria-label={open ? "Fechar menu de ações" : "Adicionar lançamento"}
        className={`fixed right-4 z-50 md:hidden grid h-14 w-14 place-items-center rounded-full bg-[#0b2a5b] text-white shadow-lg shadow-black/20 transition-transform active:scale-95 dark:bg-blue-600 ${fabBottom}`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={`h-6 w-6 transition-transform duration-200 ${open ? "rotate-45" : ""}`}
          aria-hidden="true"
        >
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </button>
    </>
  );
}
