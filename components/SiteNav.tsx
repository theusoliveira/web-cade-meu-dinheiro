"use client";

import * as React from "react";
import { Button } from "./Button";

export type NavKey = "lancamentos" | "metas" | "controle";

type Props = {
  active: NavKey;
  onChange: (next: NavKey) => void;
};

export function SiteNav({ active, onChange }: Props) {
  const [open, setOpen] = React.useState(false);

  function go(next: NavKey) {
    onChange(next);
    setOpen(false);
  }

  const itemClass = (key: NavKey) =>
    `cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      active === key
        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
        : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
    }`;

  return (
    <div className="relative">
      {/* Desktop */}
      <nav className="hidden items-center gap-2 sm:flex">
        <button className={itemClass("lancamentos")} onClick={() => go("lancamentos")}>
          Lançamentos
        </button>
        <button className={itemClass("metas")} onClick={() => go("metas")}>
          Metas
        </button>
        <button className={itemClass("controle")} onClick={() => go("controle")}>
          Controle de gastos
        </button>
      </nav>

      {/* Mobile hamburger */}
      <div className="sm:hidden">
        <Button
          variant="secondary"
          aria-label="Abrir menu"
          onClick={() => setOpen((v) => !v)}
          className="h-10 w-10 p-0 grid place-items-center"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4 6h16M4 12h16M4 18h16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </Button>

        {open ? (
          <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
            <button
              className={`w-full text-left ${itemClass("lancamentos")}`}
              onClick={() => go("lancamentos")}
            >
              Lançamentos
            </button>
            <button
              className={`mt-1 w-full text-left ${itemClass("metas")}`}
              onClick={() => go("metas")}
            >
              Metas
            </button>
            <button
              className={`mt-1 w-full text-left ${itemClass("controle")}`}
              onClick={() => go("controle")}
            >
              Controle de gastos
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
