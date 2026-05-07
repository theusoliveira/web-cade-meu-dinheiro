"use client";

import * as React from "react";
import type { FinanceEntry } from "@/lib/finance";
import { useBusy } from "@/components/features/BusyProvider";
import {
  deleteAllCardEntries,
  deleteCardEntry,
  fetchCardEntries,
  upsertCardEntry,
} from "@/lib/supabase/queries/cardEntries";

export function useCardEntries(enabled: boolean) {
  const [entries, setEntries] = React.useState<FinanceEntry[]>([]);
  const { run } = useBusy();

  const reload = React.useCallback(async () => {
    if (!enabled) return;

    await run(async () => {
      try {
        setEntries(await fetchCardEntries());
      } catch (error) {
        console.error(error);
      }
    });
  }, [enabled, run]);

  React.useEffect(() => {
    reload();
  }, [reload]);

  const upsertEntry = React.useCallback(
    async (entry: FinanceEntry) => {
      await run(async () => {
        try {
          await upsertCardEntry(entry);
          setEntries(await fetchCardEntries());
        } catch (error) {
          console.error(error);
          alert(
            error instanceof Error
              ? error.message
              : "Erro ao salvar (cartão). Veja o console.",
          );
        }
      });
    },
    [run],
  );

  const removeEntry = React.useCallback(
    async (entry: FinanceEntry) => {
      await run(async () => {
        try {
          await deleteCardEntry(entry.id);
          setEntries(await fetchCardEntries());
        } catch (error) {
          console.error(error);
          alert("Erro ao excluir (cartão). Veja o console.");
        }
      });
    },
    [run],
  );

  const removeAll = React.useCallback(async () => {
    await run(async () => {
      try {
        await deleteAllCardEntries();
        setEntries([]);
      } catch (error) {
        console.error(error);
        alert("Erro ao excluir todos (cartão). Veja o console.");
      }
    });
  }, [run]);

  return { entries, reload, upsertEntry, removeEntry, removeAll };
}
