"use client";

import * as React from "react";

type BusyContextValue = {
  isBusy: boolean;
  run<T>(fn: () => Promise<T>): Promise<T>;
  begin(): void;
  end(): void;
};

const BusyContext = React.createContext<BusyContextValue | null>(null);

export function BusyProvider({ children }: { children: React.ReactNode }) {
  const [count, setCount] = React.useState(0);
  const isBusy = count > 0;
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (!isBusy) {
      setVisible(false);
      return;
    }
    const t = window.setTimeout(() => setVisible(true), 180);
    return () => window.clearTimeout(t);
  }, [isBusy]);

  const begin = React.useCallback(() => setCount((c) => c + 1), []);
  const end = React.useCallback(() => setCount((c) => Math.max(0, c - 1)), []);

  const run = React.useCallback(
    async <T,>(fn: () => Promise<T>) => {
      begin();
      try {
        return await fn();
      } finally {
        end();
      }
    },
    [begin, end],
  );

  return (
    <BusyContext.Provider value={{ isBusy, run, begin, end }}>
      {children}
      {visible ? <LoadingOverlay /> : null}
    </BusyContext.Provider>
  );
}

export function useBusy() {
  const ctx = React.useContext(BusyContext);
  if (!ctx) throw new Error("useBusy must be used within <BusyProvider />");
  return ctx;
}

function LoadingOverlay() {
  return (
    <div
      className="fixed inset-0 z-[9999] grid place-items-center bg-black/25 backdrop-blur-[2px]"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-sm px-5 py-4 shadow-2xl">
        <div className="relative h-5 w-5">
          <div className="absolute inset-0 h-5 w-5 animate-spin rounded-full border-2 border-[var(--accent)]/20 border-t-[var(--accent)]" />
        </div>
        <p className="text-sm font-semibold text-[var(--foreground)]">Carregando…</p>
      </div>
    </div>
  );
}
