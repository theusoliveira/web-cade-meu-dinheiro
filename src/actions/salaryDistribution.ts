"use server";

import { getDb } from "@/lib/db";
import { auth } from "@/lib/auth";
import { newId } from "@/lib/finance/id";

const sql = getDb();

// ─── Types ───────────────────────────────────────────────────────────────────

export type DistributionItem = {
  id: string;
  categoryId: string;
  description: string;
  value: number;
  itemKey: string | null;
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

async function getUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado");
  return session.user.id;
}

// ─── Fetch ───────────────────────────────────────────────────────────────────

export async function fetchDistributionMonth(month: string): Promise<DistributionMonth | null> {
  const userId = await getUserId();
  const rows = await sql(
    `SELECT id, month, hours::float8, hourly_rate::float8, commission::float8, simples_auto
     FROM public.pj_distribution_months
     WHERE user_id = $1 AND month = $2
     LIMIT 1`,
    [userId, month],
  );
  const data = rows[0];
  if (!data) return null;
  return {
    id: data.id as string,
    month: data.month as string,
    hours: Number(data.hours),
    hourlyRate: Number(data.hourly_rate),
    commission: Number(data.commission),
    simplesAuto: data.simples_auto as boolean,
  };
}

export async function fetchDistributionCategories(month: string): Promise<DistributionCategory[]> {
  const userId = await getUserId();

  const cats = await sql(
    `SELECT id, month, name, is_fixed, sort_order
     FROM public.pj_distribution_categories
     WHERE user_id = $1 AND month = $2
     ORDER BY sort_order ASC`,
    [userId, month],
  );

  if (!cats || cats.length === 0) return [];

  const catIds = cats.map((c) => c.id as string);
  const items = await sql(
    `SELECT id, category_id, description, value::float8, item_key, sort_order
     FROM public.pj_distribution_items
     WHERE category_id = ANY($1)
     ORDER BY sort_order ASC`,
    [catIds],
  );

  return cats.map((cat) => ({
    id: cat.id as string,
    month: cat.month as string,
    name: cat.name as string,
    isFixed: cat.is_fixed as boolean,
    sortOrder: cat.sort_order as number,
    items: (items ?? [])
      .filter((i) => i.category_id === cat.id)
      .map((i) => ({
        id: i.id as string,
        categoryId: i.category_id as string,
        description: i.description as string,
        value: Number(i.value),
        itemKey: (i.item_key as string) ?? null,
        sortOrder: i.sort_order as number,
      })),
  }));
}

// ─── Upsert billing ──────────────────────────────────────────────────────────

export async function upsertDistributionMonth(data: {
  month: string;
  hours: number;
  hourlyRate: number;
  commission: number;
  simplesAuto: boolean;
}): Promise<DistributionMonth> {
  const userId = await getUserId();
  const existing = await fetchDistributionMonth(data.month);

  if (existing) {
    await sql(
      `UPDATE public.pj_distribution_months
       SET hours = $1, hourly_rate = $2, commission = $3, simples_auto = $4
       WHERE id = $5`,
      [data.hours, data.hourlyRate, data.commission, data.simplesAuto, existing.id],
    );
    return { ...existing, ...data, hourlyRate: data.hourlyRate };
  }

  const id = newId();
  await sql(
    `INSERT INTO public.pj_distribution_months (id, user_id, month, hours, hourly_rate, commission, simples_auto)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, userId, data.month, data.hours, data.hourlyRate, data.commission, data.simplesAuto],
  );
  return { id, ...data, hourlyRate: data.hourlyRate };
}

// ─── Init fixed category ─────────────────────────────────────────────────────

export async function initFixedCategory(month: string): Promise<DistributionCategory> {
  const userId = await getUserId();
  const catId = newId();

  await sql(
    `INSERT INTO public.pj_distribution_categories (id, user_id, month, name, is_fixed, sort_order)
     VALUES ($1, $2, $3, 'Despesas PJ', true, 0)`,
    [catId, userId, month],
  );

  const itemsToInsert = [
    { id: newId(), description: "Contabilidade",   itemKey: "contabilidade",   sortOrder: 0 },
    { id: newId(), description: "Simples Nacional", itemKey: "simples_nacional", sortOrder: 1 },
    { id: newId(), description: "INSS",             itemKey: "inss",             sortOrder: 2 },
  ];

  for (const item of itemsToInsert) {
    await sql(
      `INSERT INTO public.pj_distribution_items (id, category_id, description, value, item_key, sort_order)
       VALUES ($1, $2, $3, 0, $4, $5)`,
      [item.id, catId, item.description, item.itemKey, item.sortOrder],
    );
  }

  return {
    id: catId, month, name: "Despesas PJ", isFixed: true, sortOrder: 0,
    items: itemsToInsert.map((i) => ({
      id: i.id, categoryId: catId, description: i.description,
      value: 0, itemKey: i.itemKey, sortOrder: i.sortOrder,
    })),
  };
}

// ─── Category CRUD ────────────────────────────────────────────────────────────

export async function insertCategory(data: {
  month: string; name: string; sortOrder: number;
}): Promise<DistributionCategory> {
  const userId = await getUserId();
  const id = newId();
  await sql(
    `INSERT INTO public.pj_distribution_categories (id, user_id, month, name, is_fixed, sort_order)
     VALUES ($1, $2, $3, $4, false, $5)`,
    [id, userId, data.month, data.name, data.sortOrder],
  );
  return { id, month: data.month, name: data.name, isFixed: false, sortOrder: data.sortOrder, items: [] };
}

export async function deleteCategory(id: string): Promise<void> {
  const userId = await getUserId();
  await sql(
    `DELETE FROM public.pj_distribution_categories WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
}

// ─── Item CRUD ────────────────────────────────────────────────────────────────

export async function insertItem(data: {
  categoryId: string; description: string; value: number; sortOrder: number;
}): Promise<DistributionItem> {
  const id = newId();
  await sql(
    `INSERT INTO public.pj_distribution_items (id, category_id, description, value, item_key, sort_order)
     VALUES ($1, $2, $3, $4, null, $5)`,
    [id, data.categoryId, data.description, data.value, data.sortOrder],
  );
  return { id, categoryId: data.categoryId, description: data.description, value: data.value, itemKey: null, sortOrder: data.sortOrder };
}

export async function updateItemValue(id: string, value: number): Promise<void> {
  await sql(`UPDATE public.pj_distribution_items SET value = $1 WHERE id = $2`, [value, id]);
}

export async function updateItemDescription(id: string, description: string): Promise<void> {
  await sql(`UPDATE public.pj_distribution_items SET description = $1 WHERE id = $2`, [description, id]);
}

export async function deleteItem(id: string): Promise<void> {
  await sql(`DELETE FROM public.pj_distribution_items WHERE id = $1`, [id]);
}
