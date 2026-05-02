"use client";

import * as React from "react";
import { supabase } from "../lib/supabaseClient";
import { useBusy } from "./BusyProvider";

type Props = {
  displayName?: string;
};

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className ?? "h-5 w-5"}
      fill="none"
    >
      <path
        d="M20 21a8 8 0 0 0-16 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12 13a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function UserMenu({ displayName }: Props) {
  const busy = useBusy();
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState<string>("");

  const containerRef = React.useRef<HTMLDivElement | null>(null);

  const label = (displayName ?? "").trim();

  React.useEffect(() => {
    let alive = true;

    async function loadEmail() {
      // Não uso busy.run aqui pra não abrir overlay só por causa do menu
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error(error);
        return;
      }
      if (!alive) return;
      setEmail(user?.email ?? "");
    }

    loadEmail();
    return () => {
      alive = false;
    };
  }, []);

  React.useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!open) return;
      const t = e.target as Node;
      if (containerRef.current?.contains(t)) return;
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
      // AuthGate detecta e volta pro login automaticamente
    });
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="grid h-9 w-9 cursor-pointer place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900/40"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menu do usuário"
      >
        <UserIcon className="h-5 w-5" />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="px-4 py-3">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {label || "Usuário"}
            </p>
            {email ? (
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{email}</p>
            ) : (
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">—</p>
            )}
          </div>

          <div className="h-px bg-zinc-200 dark:bg-zinc-800" />

          {/* Futuro:
          <button
            role="menuitem"
            type="button"
            className="w-full px-4 py-3 text-left text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-900/40"
          >
            Meus dados
          </button>
          */}

          <button
            role="menuitem"
            type="button"
            onClick={logout}
            className="w-full px-4 py-3 cursor-pointer text-left text-sm text-rose-700 hover:bg-rose-50 dark:text-rose-200 dark:hover:bg-rose-950/30"
          >
            Sair
          </button>
        </div>
      ) : null}
    </div>
  );
}
