"use client";

import * as React from "react";
import type { NavKey } from "@/components/layout/AppSidebar";
import type { EntryKind } from "@/lib/finance";

type Props = {
  activeTab: NavKey;
  onSelectEntry: (kind: EntryKind) => void;
  onAddGoal: () => void;
};

type ActionOption = {
  kind: EntryKind;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  colorClass: string;
};

const PERSONAL_OPTIONS: ActionOption[] = [
  {
    kind: "income",
    label: "Receita",
    sublabel: "Dinheiro que entrou",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
        <path d="M12 5v14M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    colorClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50",
  },
  {
    kind: "expense",
    label: "Despesa",
    sublabel: "Dinheiro que saiu",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
        <path d="M12 19V5M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    colorClass: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50",
  },
  {
    kind: "investment",
    label: "Investimento",
    sublabel: "Aplicação financeira",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
        <path d="M2 20h20M5 20V10l5-5 4 4 5-6v17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    colorClass: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/50",
  },
];

const BUSINESS_OPTIONS: ActionOption[] = [
  { ...PERSONAL_OPTIONS[0], label: "Entrada", sublabel: "Receita da empresa" },
  { ...PERSONAL_OPTIONS[1], label: "Saída", sublabel: "Despesa da empresa" },
  { ...PERSONAL_OPTIONS[2], label: "Investimento", sublabel: "Aplicação da empresa" },
];

const CARD_OPTIONS: ActionOption[] = [
  { ...PERSONAL_OPTIONS[0], label: "Receita", sublabel: "Crédito no cartão" },
  { ...PERSONAL_OPTIONS[1], label: "Despesa", sublabel: "Gasto no cartão" },
];

export function MobileActionSheet({ activeTab, onSelectEntry, onAddGoal }: Props) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function handleFABClick() {
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
      ? PERSONAL_OPTIONS
      : activeTab === "lancamentos_pj"
        ? BUSINESS_OPTIONS
        : CARD_OPTIONS;

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Action sheet */}
      <div
        className={`fixed left-0 right-0 z-50 md:hidden transition-all duration-300 ease-out ${open ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
          }`}
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 80px)" }}
        role="dialog"
        aria-label="Escolha o tipo de lançamento"
        aria-modal
      >
        <div className="mx-4 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl shadow-black/20">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
              Adicionar lançamento
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="cursor-pointer h-6 w-6 flex items-center justify-center rounded-full bg-[var(--surface-raised)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden>
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="p-3 grid gap-2">
            {options.map((opt) => (
              <button
                key={opt.kind}
                type="button"
                onClick={() => handleSelect(opt.kind)}
                className={`flex w-full items-center gap-3 cursor-pointer rounded-xl border px-4 py-3 text-left transition-opacity active:opacity-70 ${opt.colorClass}`}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/60 dark:bg-black/30">
                  {opt.icon}
                </span>
                <div>
                  <p className="text-sm font-bold">{opt.label}</p>
                  <p className="text-xs opacity-70">{opt.sublabel}</p>
                </div>
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
        className={`fixed right-4 z-50 md:hidden cursor-pointer
          grid h-14 w-14 place-items-center rounded-full
          bg-[var(--accent)] text-white
          shadow-lg shadow-emerald-900/30
          transition-all active:scale-95
          hover:brightness-110`}
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 76px)" }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={`h-6 w-6 transition-transform duration-200 ${open ? "rotate-45" : ""}`}
          aria-hidden
        >
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </button>
    </>
  );
}
