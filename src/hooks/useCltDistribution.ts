"use client";

import * as React from "react";
import { useBusy } from "@/components/features/BusyProvider";
import {
  fetchCltDistributionMonth,
  fetchCltDistributionCategories,
  upsertCltDistributionMonth,
  addCltCategory,
  renameCltCategory,
  deleteCltCategory,
  addCltItem,
  updateCltItem,
  deleteCltItem,
  type CltDistributionCategory,
} from "@/actions/cltDistribution";

const FIXED_MONTH = "global";

export function useCltDistribution() {
  const { run } = useBusy();

  const [salary, setSalary] = React.useState(0);
  const [monthId, setMonthId] = React.useState<string | null>(null);
  const [categories, setCategories] = React.useState<CltDistributionCategory[]>([]);
  const [loading, setLoading] = React.useState(false);

  const reload = React.useCallback(async () => {
    await run(async () => {
      setLoading(true);
      try {
        const [monthData, cats] = await Promise.all([
          fetchCltDistributionMonth(FIXED_MONTH),
          fetchCltDistributionCategories(FIXED_MONTH),
        ]);
        setSalary(monthData?.salary ?? 0);
        setMonthId(monthData?.id ?? null);
        setCategories(cats);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    });
  }, [run]);

  React.useEffect(() => { reload(); }, [reload]);

  const saveSalary = React.useCallback(
    async (value: number) => {
      setSalary(value);
      try {
        const saved = await upsertCltDistributionMonth(FIXED_MONTH, value);
        setMonthId(saved.id);
      } catch (err) {
        console.error(err);
        alert("Erro ao salvar salário.");
      }
    },
    [],
  );

  const saveItemValue = React.useCallback(
    async (itemId: string, value: number, categoryId: string) => {
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id !== categoryId
            ? cat
            : { ...cat, items: cat.items.map((it) => (it.id === itemId ? { ...it, value } : it)) },
        ),
      );
      try {
        const cat = categories.find((c) => c.id === categoryId);
        const item = cat?.items.find((i) => i.id === itemId);
        if (item) await updateCltItem(itemId, item.description, value);
      } catch (err) {
        console.error(err);
        reload();
      }
    },
    [categories, reload],
  );

  const saveItemDescription = React.useCallback(
    async (itemId: string, description: string, categoryId: string) => {
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id !== categoryId
            ? cat
            : { ...cat, items: cat.items.map((it) => (it.id === itemId ? { ...it, description } : it)) },
        ),
      );
      try {
        const cat = categories.find((c) => c.id === categoryId);
        const item = cat?.items.find((i) => i.id === itemId);
        if (item) await updateCltItem(itemId, description, item.value);
      } catch (err) {
        console.error(err);
        reload();
      }
    },
    [categories, reload],
  );

  const addCategory = React.useCallback(
    async (name: string, firstItemDescription: string, firstItemValue: number) => {
      await run(async () => {
        try {
          const newCat = await addCltCategory(FIXED_MONTH, name);
          const newItem = await addCltItem(newCat.id, firstItemDescription, firstItemValue);
          setCategories((prev) => [...prev, { ...newCat, items: [newItem] }]);
        } catch (err) {
          console.error(err);
          alert("Erro ao adicionar categoria.");
        }
      });
    },
    [run],
  );

  const addItemToCategory = React.useCallback(
    async (categoryId: string, description: string, value: number) => {
      await run(async () => {
        try {
          const newItem = await addCltItem(categoryId, description, value);
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
    [run],
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
        await deleteCltItem(itemId);
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
        await deleteCltCategory(categoryId);
      } catch (err) {
        console.error(err);
        reload();
      }
    },
    [reload],
  );

  return {
    salary,
    monthId,
    categories,
    loading,
    saveSalary,
    saveItemValue,
    saveItemDescription,
    addCategory,
    addItemToCategory,
    removeItem,
    removeCategory,
    reload,
  };
}
