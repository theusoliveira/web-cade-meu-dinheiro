"use client";

import * as React from "react";
import { supabase } from "@/lib/supabase/client";
import { useBusy } from "@/components/features/BusyProvider";

type Props = { displayName?: string };

export function UserMenu({ displayName }: Props) {
  const busy = useBusy();
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const label = (displayName ?? "").trim();
  const initials = label
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  React.useEffect(() => {
    let alive = true;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (alive) setEmail(user?.email ?? "");
    });
    return () => { alive = false; };
  }, []);

  React.useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!open) return;
      if (containerRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  async function logout() {
    setOpen(false);
    await busy.run(async () => {
      const { error } = await supabase.auth.signOut();
      if (error) alert("Não foi possível sair agora. Tente novamente.");
    });
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="cursor-pointer flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] font-semibold text-sm text-[var(--foreground)] hover:bg-[var(--surface-raised)] transition-all"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menu do usuário"
      >
        {initials || (
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
            <path d="M20 21a8 8 0 0 0-16 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="12" cy="9" r="4" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl shadow-black/10 animate-scale-in"
        >
          {/* Avatar + info */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-[var(--border)]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/10 font-bold text-[var(--accent)] text-sm">
              {initials || "?"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                {label || "Usuário"}
              </p>
              {email && (
                <p className="truncate text-xs text-[var(--muted)]">{email}</p>
              )}
            </div>
          </div>

          <div className="p-1">
            <button
              role="menuitem"
              type="button"
              onClick={logout}
              className="w-full flex items-center gap-2.5 cursor-pointer rounded-xl px-3 py-2.5 text-left text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0" aria-hidden>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Sair da conta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
