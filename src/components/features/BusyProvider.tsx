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

/** Barra fina no topo: indica atividade sem bloquear nem escurecer a tela. */
function LoadingOverlay() {
  return (
    <div
      className="fixed inset-x-0 top-0 z-[9999] h-0.5 overflow-hidden bg-[var(--accent)]/15"
      role="progressbar"
      aria-label="Carregando"
      aria-busy="true"
    >
      <div className="busy-bar h-full w-1/3 bg-[var(--accent)]" />
    </div>
  );
}
