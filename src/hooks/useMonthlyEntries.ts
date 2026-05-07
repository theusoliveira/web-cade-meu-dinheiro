"use client";

import * as React from "react";
import type { FinanceEntry, FixedEntry } from "@/lib/finance";
import { buildEntriesWithVirtuals } from "@/lib/finance";
import { useBusy } from "@/components/features/BusyProvider";
import {
  createFixedEntryTemplate,
  deleteFixedEntry,
  deleteMonthlyEntry,
  fetchFixedEntries,
  fetchMonthlyEntries,
  fetchOpeningBalance,
  upsertMonthlyEntry,
  type MonthlyEntriesScope,
} from "@/lib/supabase/queries/entries";

export function useMonthlyEntries(
  month: string,
  enabled: boolean,
  scope: MonthlyEntriesScope = "personal",
) {
  const [entries, setEntries] = React.useState<FinanceEntry[]>([]);
  const [fixedEntries, setFixedEntries] = React.useState<FixedEntry[]>([]);
  const [openingBalance, setOpeningBalance] = React.useState(0);
  const { run } = useBusy();

  const reloadMonth = React.useCallback(async () => {
    if (!enabled) return;

    await run(async () => {
      try {
        const [nextEntries, nextFixedEntries, nextOpeningBalance] = await Promise.all([
          fetchMonthlyEntries(month, scope),
          fetchFixedEntries(scope),
          fetchOpeningBalance(month, scope),
        ]);

        setEntries(nextEntries);
        setFixedEntries(nextFixedEntries);
        setOpeningBalance(nextOpeningBalance);
      } catch (error) {
        console.error(error);
      }
    });
  }, [enabled, month, run, scope]);

  React.useEffect(() => {
    reloadMonth();
  }, [reloadMonth]);

  const refreshEntriesOnly = React.useCallback(async () => {
    const [nextEntries, nextOpeningBalance] = await Promise.all([
      fetchMonthlyEntries(month, scope),
      fetchOpeningBalance(month, scope),
    ]);
    setEntries(nextEntries);
    setOpeningBalance(nextOpeningBalance);
  }, [month, scope]);

  const upsertEntry = React.useCallback(
    async (entry: FinanceEntry) => {
      await run(async () => {
        try {
          if (entry.isFixedTemplate) {
            await createFixedEntryTemplate(entry, scope);
            const [nextFixedEntries, nextEntries] = await Promise.all([
              fetchFixedEntries(scope),
              fetchMonthlyEntries(month, scope),
            ]);
            setFixedEntries(nextFixedEntries);
            setEntries(nextEntries);
            return;
          }

          await upsertMonthlyEntry(entry, scope);
          await refreshEntriesOnly();
        } catch (error) {
          console.error(error);
          alert("Erro ao salvar. Veja o console.");
        }
      });
    },
    [month, refreshEntriesOnly, run, scope],
  );

  const deleteEntry = React.useCallback(
    async (entry: FinanceEntry) => {
      await run(async () => {
        try {
          if (entry.isVirtualFixed && entry.fixedEntryId) {
            await deleteFixedEntry(entry.fixedEntryId, scope);
            const [nextFixedEntries, nextEntries] = await Promise.all([
              fetchFixedEntries(scope),
              fetchMonthlyEntries(month, scope),
            ]);
            setFixedEntries(nextFixedEntries);
            setEntries(nextEntries);
            return;
          }

          await deleteMonthlyEntry(entry.id, scope);
          await refreshEntriesOnly();
        } catch (error) {
          console.error(error);
          alert("Erro ao excluir. Veja o console.");
        }
      });
    },
    [month, refreshEntriesOnly, run, scope],
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
