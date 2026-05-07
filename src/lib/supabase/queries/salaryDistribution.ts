import { supabase } from "@/lib/supabase/client";
import { newId } from "../../finance/id";

// ─── Types ───────────────────────────────────────────────────────────────────

export type DistributionItem = {
  id: string;
  categoryId: string;
  description: string;
  value: number;
  itemKey: string | null; // 'contabilidade' | 'simples_nacional' | 'inss'
  sortOrder: number;
};

export type DistributionCategory = {
  id: string;
  month: string;
  name: string;
  isFixed: boolean;
  sortOrder: number;
  items: DistributionItem[];
};

export type DistributionMonth = {
  id: string;
  month: string;
  hours: number;
  hourlyRate: number;
  commission: number;
  simplesAuto: boolean;
};

// ─── Fetch ────────────────────────────────────────────────────────────────────

export async function fetchDistributionMonth(month: string): Promise<DistributionMonth | null> {
  const { data, error } = await supabase
    .from("pj_distribution_months")
    .select("*")
    .eq("month", month)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    month: data.month,
    hours: Number(data.hours),
    hourlyRate: Number(data.hourly_rate),
    commission: Number(data.commission),
    simplesAuto: data.simples_auto,
  };
}

export async function fetchDistributionCategories(month: string): Promise<DistributionCategory[]> {
  const { data: cats, error: catsErr } = await supabase
    .from("pj_distribution_categories")
    .select("*")
    .eq("month", month)
    .order("sort_order", { ascending: true });

  if (catsErr) throw catsErr;
  if (!cats || cats.length === 0) return [];

  const catIds = cats.map((c) => c.id);
  const { data: items, error: itemsErr } = await supabase
    .from("pj_distribution_items")
    .select("*")
    .in("category_id", catIds)
    .order("sort_order", { ascending: true });

  if (itemsErr) throw itemsErr;

  return cats.map((cat) => ({
    id: cat.id,
    month: cat.month,
    name: cat.name,
    isFixed: cat.is_fixed,
    sortOrder: cat.sort_order,
    items: (items ?? [])
      .filter((i) => i.category_id === cat.id)
      .map((i) => ({
        id: i.id,
        categoryId: i.category_id,
        description: i.description,
        value: Number(i.value),
        itemKey: i.item_key,
        sortOrder: i.sort_order,
      })),
  }));
}

// ─── Upsert billing inputs ───────────────────────────────────────────────────

export async function upsertDistributionMonth(data: {
  month: string;
  hours: number;
  hourlyRate: number;
  commission: number;
  simplesAuto: boolean;
}): Promise<DistributionMonth> {
  const existing = await fetchDistributionMonth(data.month);

  if (existing) {
    const { error } = await supabase
      .from("pj_distribution_months")
      .update({
        hours: data.hours,
        hourly_rate: data.hourlyRate,
        commission: data.commission,
        simples_auto: data.simplesAuto,
      })
      .eq("id", existing.id);
    if (error) throw error;
    return { ...existing, ...data, hourlyRate: data.hourlyRate };
  }

  const id = newId();
  const { error } = await supabase.from("pj_distribution_months").insert({
    id,
    month: data.month,
    hours: data.hours,
    hourly_rate: data.hourlyRate,
    commission: data.commission,
    simples_auto: data.simplesAuto,
  });
  if (error) throw error;
  return { id, ...data, hourlyRate: data.hourlyRate };
}

// ─── Initialize "Despesas PJ" fixed category ─────────────────────────────────

export async function initFixedCategory(month: string): Promise<DistributionCategory> {
  const catId = newId();

  const { error: catErr } = await supabase.from("pj_distribution_categories").insert({
    id: catId,
    month,
    name: "Despesas PJ",
    is_fixed: true,
    sort_order: 0,
  });
  if (catErr) throw catErr;

  const itemsToInsert = [
    { id: newId(), category_id: catId, description: "Contabilidade",   value: 0, item_key: "contabilidade",   sort_order: 0 },
    { id: newId(), category_id: catId, description: "Simples Nacional", value: 0, item_key: "simples_nacional", sort_order: 1 },
    { id: newId(), category_id: catId, description: "INSS",             value: 0, item_key: "inss",             sort_order: 2 },
  ];

  const { error: itemsErr } = await supabase.from("pj_distribution_items").insert(itemsToInsert);
  if (itemsErr) throw itemsErr;

  return {
    id: catId,
    month,
    name: "Despesas PJ",
    isFixed: true,
    sortOrder: 0,
    items: itemsToInsert.map((i) => ({
      id: i.id,
      categoryId: catId,
      description: i.description,
      value: 0,
      itemKey: i.item_key,
      sortOrder: i.sort_order,
    })),
  };
}

// ─── Category CRUD ────────────────────────────────────────────────────────────

export async function insertCategory(data: {
  month: string;
  name: string;
  sortOrder: number;
}): Promise<DistributionCategory> {
  const id = newId();
  const { error } = await supabase.from("pj_distribution_categories").insert({
    id,
    month: data.month,
    name: data.name,
    is_fixed: false,
    sort_order: data.sortOrder,
  });
  if (error) throw error;
  return { id, month: data.month, name: data.name, isFixed: false, sortOrder: data.sortOrder, items: [] };
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from("pj_distribution_categories").delete().eq("id", id);
  if (error) throw error;
}

// ─── Item CRUD ────────────────────────────────────────────────────────────────

export async function insertItem(data: {
  categoryId: string;
  description: string;
  value: number;
  sortOrder: number;
}): Promise<DistributionItem> {
  const id = newId();
  const { error } = await supabase.from("pj_distribution_items").insert({
    id,
    category_id: data.categoryId,
    description: data.description,
    value: data.value,
    item_key: null,
    sort_order: data.sortOrder,
  });
  if (error) throw error;
  return { id, categoryId: data.categoryId, description: data.description, value: data.value, itemKey: null, sortOrder: data.sortOrder };
}

export async function updateItemValue(id: string, value: number): Promise<void> {
  const { error } = await supabase.from("pj_distribution_items").update({ value }).eq("id", id);
  if (error) throw error;
}

export async function updateItemDescription(id: string, description: string): Promise<void> {
  const { error } = await supabase.from("pj_distribution_items").update({ description }).eq("id", id);
  if (error) throw error;
}

export async function deleteItem(id: string): Promise<void> {
  const { error } = await supabase.from("pj_distribution_items").delete().eq("id", id);
  if (error) throw error;
}
