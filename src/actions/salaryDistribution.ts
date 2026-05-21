"use server";

import { getDb } from "@/lib/db/client";
import { auth } from "@/lib/auth";
import { newId } from "@/lib/finance/id";

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
  const sql = getDb();
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
  const sql = getDb();
  const userId = await getUserId();

  // Single query joining categories + items to avoid N+1
  const rows = await sql(
    `SELECT
       c.id AS cat_id, c.month, c.name, c.is_fixed, c.sort_order AS cat_sort_order,
       i.id AS item_id, i.category_id, i.description, i.value::float8, i.item_key, i.sort_order AS item_sort_order
     FROM public.pj_distribution_categories c
     LEFT JOIN public.pj_distribution_items i ON i.category_id = c.id
     WHERE c.user_id = $1 AND c.month = $2
     ORDER BY c.sort_order ASC, i.sort_order ASC`,
    [userId, month],
  );

  if (!rows || rows.length === 0) return [];

  // Group items by category
  const catMap = new Map<string, DistributionCategory>();
  for (const row of rows) {
    const catId = row.cat_id as string;
    if (!catMap.has(catId)) {
      catMap.set(catId, {
        id: catId,
        month: row.month as string,
        name: row.name as string,
        isFixed: row.is_fixed as boolean,
        sortOrder: row.cat_sort_order as number,
        items: [],
      });
    }
    if (row.item_id) {
      catMap.get(catId)!.items.push({
        id: row.item_id as string,
        categoryId: catId,
        description: row.description as string,
        value: Number(row.value),
        itemKey: (row.item_key as string) ?? null,
        sortOrder: row.item_sort_order as number,
      });
    }
  }

  return Array.from(catMap.values());
}

// ─── Init fixed category (idempotent — uses INSERT ... ON CONFLICT DO NOTHING) ─

export async function ensureFixedCategory(month: string): Promise<DistributionCategory | null> {
  const sql = getDb();
  const userId = await getUserId();

  // Check if fixed category already exists
  const existing = await sql(
    `SELECT id FROM public.pj_distribution_categories
     WHERE user_id = $1 AND month = $2 AND is_fixed = true
     LIMIT 1`,
    [userId, month],
  );

  if (existing.length > 0) return null; // already exists, no-op

  const catId = newId();
  await sql(
    `INSERT INTO public.pj_distribution_categories (id, user_id, month, name, is_fixed, sort_order)
     VALUES ($1, $2, $3, 'Despesas PJ', true, 0)
     ON CONFLICT DO NOTHING`,
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

// ─── Upsert billing ──────────────────────────────────────────────────────────

export async function upsertDistributionMonth(data: {
  month: string;
  hours: number;
  hourlyRate: number;
  commission: number;
  simplesAuto: boolean;
}): Promise<DistributionMonth> {
  const sql = getDb();
  const userId = await getUserId();

  const rows = await sql(
    `INSERT INTO public.pj_distribution_months (id, user_id, month, hours, hourly_rate, commission, simples_auto)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (user_id, month) DO UPDATE SET
       hours = EXCLUDED.hours,
       hourly_rate = EXCLUDED.hourly_rate,
       commission = EXCLUDED.commission,
       simples_auto = EXCLUDED.simples_auto
     RETURNING id`,
    [newId(), userId, data.month, data.hours, data.hourlyRate, data.commission, data.simplesAuto],
  );

  return {
    id: (rows[0]?.id as string) ?? "",
    ...data,
    hourlyRate: data.hourlyRate,
  };
}

// ─── Category CRUD ────────────────────────────────────────────────────────────

export async function insertCategory(data: {
  month: string; name: string; sortOrder: number;
}): Promise<DistributionCategory> {
  const sql = getDb();
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
  const sql = getDb();
  const userId = await getUserId();
  // Items are deleted via ON DELETE CASCADE in the schema
  await sql(
    `DELETE FROM public.pj_distribution_categories WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
}

// ─── Item CRUD ────────────────────────────────────────────────────────────────

export async function insertItem(data: {
  categoryId: string; description: string; value: number; sortOrder: number;
}): Promise<DistributionItem> {
  const sql = getDb();
  const id = newId();
  await sql(
    `INSERT INTO public.pj_distribution_items (id, category_id, description, value, item_key, sort_order)
     VALUES ($1, $2, $3, $4, null, $5)`,
    [id, data.categoryId, data.description, data.value, data.sortOrder],
  );
  return { id, categoryId: data.categoryId, description: data.description, value: data.value, itemKey: null, sortOrder: data.sortOrder };
}

export async function updateItemValue(id: string, value: number): Promise<void> {
  const sql = getDb();
  await sql(`UPDATE public.pj_distribution_items SET value = $1 WHERE id = $2`, [value, id]);
}

export async function updateItemDescription(id: string, description: string): Promise<void> {
  const sql = getDb();
  await sql(`UPDATE public.pj_distribution_items SET description = $1 WHERE id = $2`, [description, id]);
}

export async function deleteItem(id: string): Promise<void> {
  const sql = getDb();
  await sql(`DELETE FROM public.pj_distribution_items WHERE id = $1`, [id]);
}
