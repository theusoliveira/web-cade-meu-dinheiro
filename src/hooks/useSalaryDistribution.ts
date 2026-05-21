"use client";

import * as React from "react";
import { useBusy } from "@/components/features/BusyProvider";
import {
  fetchDistributionMonth,
  fetchDistributionCategories,
  upsertDistributionMonth,
  ensureFixedCategory,
  insertCategory,
  deleteCategory,
  insertItem,
  updateItemValue,
  updateItemDescription,
  deleteItem,
  type DistributionCategory,
} from "@/actions/salaryDistribution";

const FIXED_MONTH = "global";

export function useSalaryDistribution() {
  const { run } = useBusy();

  const [billing, setBilling] = React.useState<{
    id: string; month: string; hours: number;
    hourlyRate: number; commission: number; simplesAuto: boolean;
  } | null>(null);
  const [categories, setCategories] = React.useState<DistributionCategory[]>([]);
  const [loading, setLoading] = React.useState(false);

  const reload = React.useCallback(async () => {
    await run(async () => {
      setLoading(true);
      try {
        // Ensure fixed category exists (idempotent — no-op if already there)
        await ensureFixedCategory(FIXED_MONTH);

        const [bData, cats] = await Promise.all([
          fetchDistributionMonth(FIXED_MONTH),
          fetchDistributionCategories(FIXED_MONTH),
        ]);

        setBilling(bData);
        setCategories(cats);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    });
  }, [run]);

  React.useEffect(() => {
    reload();
  }, [reload]);

  const saveBilling = React.useCallback(
    async (updates: { hours?: number; hourlyRate?: number; commission?: number; simplesAuto?: boolean }) => {
      await run(async () => {
        try {
          const current = billing ?? { id: "", month: FIXED_MONTH, hours: 0, hourlyRate: 0, commission: 0, simplesAuto: true };
          const merged = { ...current, ...updates };
          const saved = await upsertDistributionMonth({
            month: FIXED_MONTH,
            hours: merged.hours,
            hourlyRate: merged.hourlyRate,
            commission: merged.commission,
            simplesAuto: merged.simplesAuto,
          });
          setBilling(saved);
        } catch (err) {
          console.error(err);
          alert("Erro ao salvar. Veja o console.");
        }
      });
    },
    [billing, run],
  );

  const saveItemValue = React.useCallback(
    async (itemId: string, value: number, categoryId: string) => {
      // Optimistic update
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id !== categoryId
            ? cat
            : { ...cat, items: cat.items.map((it) => (it.id === itemId ? { ...it, value } : it)) },
        ),
      );
      try {
        await updateItemValue(itemId, value);
      } catch (err) {
        console.error(err);
        reload();
      }
    },
    [reload],
  );

  const saveItemDescription = React.useCallback(
    async (itemId: string, description: string, categoryId: string) => {
      // Optimistic update
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id !== categoryId
            ? cat
            : { ...cat, items: cat.items.map((it) => (it.id === itemId ? { ...it, description } : it)) },
        ),
      );
      try {
        await updateItemDescription(itemId, description);
      } catch (err) {
        console.error(err);
        reload();
      }
    },
    [reload],
  );

  const addCategory = React.useCallback(
    async (name: string, firstItemDescription: string, firstItemValue: number) => {
      await run(async () => {
        try {
          const sortOrder = categories.length;
          const newCat = await insertCategory({ month: FIXED_MONTH, name, sortOrder });
          const newItem = await insertItem({
            categoryId: newCat.id,
            description: firstItemDescription,
            value: firstItemValue,
            sortOrder: 0,
          });
          setCategories((prev) => [...prev, { ...newCat, items: [newItem] }]);
        } catch (err) {
          console.error(err);
          alert("Erro ao adicionar categoria.");
        }
      });
    },
    [categories.length, run],
  );

  const addItemToCategory = React.useCallback(
    async (categoryId: string, description: string, value: number) => {
      await run(async () => {
        try {
          const cat = categories.find((c) => c.id === categoryId);
          const sortOrder = cat ? cat.items.length : 0;
          const newItem = await insertItem({ categoryId, description, value, sortOrder });
          setCategories((prev) =>
            prev.map((c) =>
              c.id !== categoryId ? c : { ...c, items: [...c.items, newItem] },
            ),
          );
        } catch (err) {
          console.error(err);
          alert("Erro ao adicionar item.");
        }
      });
    },
    [categories, run],
  );

  const removeItem = React.useCallback(
    async (itemId: string, categoryId: string) => {
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id !== categoryId
            ? cat
            : { ...cat, items: cat.items.filter((it) => it.id !== itemId) },
        ),
      );
      try {
        await deleteItem(itemId);
      } catch (err) {
        console.error(err);
        reload();
      }
    },
    [reload],
  );

  const removeCategory = React.useCallback(
    async (categoryId: string) => {
      setCategories((prev) => prev.filter((c) => c.id !== categoryId));
      try {
        await deleteCategory(categoryId);
      } catch (err) {
        console.error(err);
        reload();
      }
    },
    [reload],
  );

  return {
    billing,
    categories,
    loading,
    saveBilling,
    saveItemValue,
    saveItemDescription,
    addCategory,
    addItemToCategory,
    removeItem,
    removeCategory,
    reload,
  };
}
