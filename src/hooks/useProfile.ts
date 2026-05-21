"use client";

import * as React from "react";
import { useBusy } from "@/components/features/BusyProvider";
import { fetchCurrentProfileDisplayName } from "@/actions/profile";

export function useProfile() {
  const [displayName, setDisplayName] = React.useState("");
  const { run } = useBusy();

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
    return () => { alive = false; };
  }, []);

  return { displayName };
}
