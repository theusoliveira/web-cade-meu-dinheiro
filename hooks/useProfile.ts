"use client";

import * as React from "react";
import { useBusy } from "../components/BusyProvider";
import { fetchCurrentProfileDisplayName } from "../lib/supabase/queries/profile";

export function useProfile() {
  const [displayName, setDisplayName] = React.useState("");
  const { run } = useBusy();

  React.useEffect(() => {
    let alive = true;

    run(async () => {
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
  }, [run]);

  return { displayName };
}
