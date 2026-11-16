"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Em desenvolvimento o SW serviria chunks antigos do cache; remove qualquer um já instalado.
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
      if ("caches" in window) caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
      return;
    }

    navigator.serviceWorker
      .register("/sw.js")
      .catch((err) => console.warn("SW registration failed:", err));
  }, []);

  return null;
}
