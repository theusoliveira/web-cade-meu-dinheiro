"use client";

import * as React from "react";

export function ServiceWorkerRegister() {
  React.useEffect(() => {
    // Avoid SW caching surprises while developing
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });

        // If there's an updated SW waiting, activate it ASAP (optional but convenient)
        if (reg.waiting) reg.waiting.postMessage("SKIP_WAITING");

        reg.addEventListener("updatefound", () => {
          const sw = reg.installing;
          if (!sw) return;

          sw.addEventListener("statechange", () => {
            if (sw.state === "installed" && navigator.serviceWorker.controller) {
              // New version installed. You could show a toast "Atualização disponível"
              // and reload on user action. Keeping it silent here.
            }
          });
        });
      } catch (err) {
        console.warn("[PWA] SW registration failed:", err);
      }
    };

    // Wait for the page to load to reduce competing network work
    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
