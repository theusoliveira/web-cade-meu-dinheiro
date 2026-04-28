"use client";

import * as React from "react";
import type { FinanceEntry, FixedEntry } from "../lib/finance";
import { buildEntriesWithVirtuals } from "../lib/finance";
import { useBusy } from "../components/BusyProvider";
import {
  createFixedEntryTemplate,
  deleteFixedEntry,
  deleteMonthlyEntry,
  fetchFixedEntries,
  fetchMonthlyEntries,
  fetchOpeningBalance,
  upsertMonthlyEntry,
} from "../lib/supabase/queries/entries";

export function useMonthlyEntries(month: string, enabled: boolean) {
  const [entries, setEntries] = React.useState<FinanceEntry[]>([]);
  const [fixedEntries, setFixedEntries] = React.useState<FixedEntry[]>([]);
  const [openingBalance, setOpeningBalance] = React.useState(0);
  const { run } = useBusy();

  const reloadMonth = React.useCallback(async () => {
    if (!enabled) return;

    await run(async () => {
      try {
        const [nextEntries, nextFixedEntries, nextOpeningBalance] = await Promise.all([
          fetchMonthlyEntries(month),
          fetchFixedEntries(),
          fetchOpeningBalance(month),
        ]);

        setEntries(nextEntries);
        setFixedEntries(nextFixedEntries);
        setOpeningBalance(nextOpeningBalance);
      } catch (error) {
        console.error(error);
      }
    });
  }, [enabled, month, run]);

  React.useEffect(() => {
    reloadMonth();
  }, [reloadMonth]);

  const refreshEntriesOnly = React.useCallback(async () => {
    const [nextEntries, nextOpeningBalance] = await Promise.all([
      fetchMonthlyEntries(month),
      fetchOpeningBalance(month),
    ]);
    setEntries(nextEntries);
    setOpeningBalance(nextOpeningBalance);
  }, [month]);

  const upsertEntry = React.useCallback(
    async (entry: FinanceEntry) => {
      await run(async () => {
        try {
          if (entry.isFixedTemplate) {
            await createFixedEntryTemplate(entry);
            const [nextFixedEntries, nextEntries] = await Promise.all([
              fetchFixedEntries(),
              fetchMonthlyEntries(month),
            ]);
            setFixedEntries(nextFixedEntries);
            setEntries(nextEntries);
            return;
          }

          await upsertMonthlyEntry(entry);
          await refreshEntriesOnly();
        } catch (error) {
          console.error(error);
          alert("Erro ao salvar. Veja o console.");
        }
      });
    },
    [month, refreshEntriesOnly, run],
  );

  const deleteEntry = React.useCallback(
    async (entry: FinanceEntry) => {
      await run(async () => {
        try {
          if (entry.isVirtualFixed && entry.fixedEntryId) {
            await deleteFixedEntry(entry.fixedEntryId);
            const [nextFixedEntries, nextEntries] = await Promise.all([
              fetchFixedEntries(),
              fetchMonthlyEntries(month),
            ]);
            setFixedEntries(nextFixedEntries);
            setEntries(nextEntries);
            return;
          }

          await deleteMonthlyEntry(entry.id);
          await refreshEntriesOnly();
        } catch (error) {
          console.error(error);
          alert("Erro ao excluir. Veja o console.");
        }
      });
    },
    [month, refreshEntriesOnly, run],
  );

  const visibleEntries = React.useMemo(
    () =>
      buildEntriesWithVirtuals({
        month,
        entries,
        fixedEntries,
        openingBalance,
      }),
    [entries, fixedEntries, month, openingBalance],
  );

  return {
    entries,
    fixedEntries,
    openingBalance,
    visibleEntries,
    reloadMonth,
    upsertEntry,
    deleteEntry,
  };
}
