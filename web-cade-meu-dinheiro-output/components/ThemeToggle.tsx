"use client";

import * as React from "react";
import { Button } from "./Button";

const STORAGE_KEY = "cmd_theme";

export function ThemeToggle() {
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function setTheme(next: "light" | "dark") {
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
    setIsDark(next === "dark");
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="gap-2"
    >
      <span aria-hidden>{isDark ? "☀️" : "🌙"}</span>
      {/* <span className="hidden sm:inline">
        {isDark ? "Tema escuro" : "Tema claro"}
      </span> */}
    </Button>
  );
}
