"use client";

import * as React from "react";
import { signOut, useSession } from "next-auth/react";
import { useBusy } from "@/components/features/BusyProvider";

type Props = { displayName?: string };

export function UserMenu({ displayName }: Props) {
  const busy = useBusy();
  const { data: session } = useSession();
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  const email = session?.user?.email ?? "";
  const label = (displayName ?? session?.user?.name ?? "").trim();
  const initials = label
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

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
      await signOut({ redirect: false });
    });
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="cursor-pointer flex h-9 w-9 items-center justify-center rounded-xl border font-semibold text-sm transition-all"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "var(--surface)",
          color: "var(--foreground)",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "var(--surface-raised)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "var(--surface)"; }}
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
          className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border shadow-2xl animate-scale-in"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--border)",
            boxShadow: "0 20px 40px rgba(0,61,91,0.15)",
          }}
        >
          <div
            className="flex items-center gap-3 px-4 py-4 border-b"
            style={{ borderColor: "var(--border)" }}
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-white text-sm"
              style={{ backgroundColor: "var(--ivory-orange)" }}
            >
              {initials || "?"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                {label || "Usuário"}
              </p>
              {email && (
                <p className="truncate text-xs" style={{ color: "var(--muted)" }}>{email}</p>
              )}
            </div>
          </div>

          <div className="p-1">
            <button
              role="menuitem"
              type="button"
              onClick={logout}
              className="w-full flex items-center gap-2.5 cursor-pointer rounded-xl px-3 py-2.5 text-left text-sm font-medium text-rose-600 transition-colors"
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(225,29,72,0.06)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
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
