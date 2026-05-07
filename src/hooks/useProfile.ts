"use client";

import * as React from "react";
import { useBusy } from "@/components/features/BusyProvider";
import { fetchCurrentProfileDisplayName } from "@/lib/supabase/queries/profile";

export function useProfile() {
  const [displayName, setDisplayName] = React.useState("");
  const { run } = useBusy();

  // Capturamos `run` em uma ref para que o efeito não precise declará-la como dep
  // (run é estável via useCallback, mas o objeto de contexto muda a cada render)
  const runRef = React.useRef(run);
  React.useEffect(() => { runRef.current = run; });

  React.useEffect(() => {
    let alive = true;

    runRef.current(async () => {
      try {
        const name = await fetchCurrentProfileDisplayName();
        if (alive) setDisplayName(name);
      } catch (error) {
        console.error(error);
      }
    });

    return () => {
      alive = false;
    };
  }, []); // Roda apenas na montagem — runRef garante a versão mais recente de run

  return { displayName };
}
