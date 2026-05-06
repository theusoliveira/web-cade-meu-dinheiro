"use client";

import * as React from "react";
import { supabase } from "../lib/supabaseClient";
import { useBusy } from "./BusyProvider";

type Props = {
  displayName?: string;
};

export function UserMenu({ displayName }: Props) {
  const busy = useBusy();
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState<string>("");
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const label = (displayName ?? "").trim();

  React.useEffect(() => {
    let alive = true;
    async function loadEmail() {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !alive) return;
      setEmail(user?.email ?? "");
    }
    loadEmail();
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
      if (error) {
        console.error(error);
        alert("Não foi possível sair agora. Tente novamente.");
      }
    });
  }

  const initials = label
    ? label.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()
    : "U";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="grid h-9 w-9 cursor-pointer place-items-center rounded-xl bg-green-600 text-white font-bold text-xs shadow-sm hover:bg-green-700 transition focus:outline-none focus:ring-2 focus:ring-green-400/40"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menu do usuário"
      >
        {initials}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-green-600 text-white font-bold text-xs">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {label || "Usuário"}
                </p>
                {email ? (
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{email}</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

          <button
            role="menuitem"
            type="button"
            onClick={logout}
            className="flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-left text-sm font-medium text-rose-600 hover:bg-rose-50 transition dark:text-rose-400 dark:hover:bg-rose-950/30"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Sair da conta
          </button>
        </div>
      ) : null}
    </div>
  );
}
