import { supabase } from "../client";
import { newId } from "../../finance/id";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SalarySettings = {
  id: string;
  monthYear: string;
  hours: number;
  hourlyRate: number;
  commission: number;
  accounting: number;
  inss: number;
  simplasOverride: number | null;
};

export type SalaryCategory = {
  id: string;
  monthYear: string;
  name: string;
  sortOrder: number;
};

export type SalaryItem = {
  id: string;
  categoryId: string;
  description: string;
  value: number;
};

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export async function fetchSalarySettings(monthYear: string): Promise<SalarySettings | null> {
  const { data, error } = await supabase
    .from("pj_salary_settings")
    .select("*")
    .eq("month_year", monthYear)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    monthYear: data.month_year,
    hours: Number(data.hours ?? 0),
    hourlyRate: Number(data.hourly_rate ?? 0),
    commission: Number(data.commission ?? 0),
    accounting: Number(data.accounting ?? 0),
    inss: Number(data.inss ?? 0),
    simplasOverride: data.simples_override != null ? Number(data.simples_override) : null,
  };
}

export async function upsertSalarySettings(settings: Omit<SalarySettings, "id"> & { id?: string }): Promise<void> {
  const id = settings.id ?? newId();

  const { error } = await supabase.from("pj_salary_settings").upsert({
    id,
    month_year: settings.monthYear,
    hours: settings.hours,
    hourly_rate: settings.hourlyRate,
    commission: settings.commission,
    accounting: settings.accounting,
    inss: settings.inss,
    simples_override: settings.simplasOverride,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function fetchSalaryCategories(monthYear: string): Promise<SalaryCategory[]> {
  const { data, error } = await supabase
    .from("pj_salary_categories")
    .select("*")
    .eq("month_year", monthYear)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    monthYear: row.month_year,
    name: row.name,
    sortOrder: Number(row.sort_order ?? 0),
  }));
}

export async function createSalaryCategory(monthYear: string, name: string): Promise<SalaryCategory> {
  const id = newId();

  const { data: existingCats } = await supabase
    .from("pj_salary_categories")
    .select("sort_order")
    .eq("month_year", monthYear)
    .order("sort_order", { ascending: false })
    .limit(1);

  const maxOrder = existingCats?.[0]?.sort_order ?? -1;
  const sortOrder = Number(maxOrder) + 1;

  const { error } = await supabase.from("pj_salary_categories").insert({
    id,
    month_year: monthYear,
    name,
    sort_order: sortOrder,
  });

  if (error) throw error;

  return { id, monthYear, name, sortOrder };
}

export async function deleteSalaryCategory(id: string): Promise<void> {
  // Items are deleted via ON DELETE CASCADE
  const { error } = await supabase.from("pj_salary_categories").delete().eq("id", id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------

export async function fetchSalaryItems(categoryIds: string[]): Promise<SalaryItem[]> {
  if (categoryIds.length === 0) return [];

  const { data, error } = await supabase
    .from("pj_salary_items")
    .select("*")
    .in("category_id", categoryIds)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    categoryId: row.category_id,
    description: row.description,
    value: Number(row.value ?? 0),
  }));
}

export async function createSalaryItem(categoryId: string, description: string, value: number): Promise<SalaryItem> {
  const id = newId();

  const { error } = await supabase.from("pj_salary_items").insert({
    id,
    category_id: categoryId,
    description,
    value,
  });

  if (error) throw error;

  return { id, categoryId, description, value };
}

export async function updateSalaryItem(id: string, value: number): Promise<void> {
  const { error } = await supabase
    .from("pj_salary_items")
    .update({ value })
    .eq("id", id);

  if (error) throw error;
}

export async function deleteSalaryItem(id: string): Promise<void> {
  const { error } = await supabase.from("pj_salary_items").delete().eq("id", id);
  if (error) throw error;
}
