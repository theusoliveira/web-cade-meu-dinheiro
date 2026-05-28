"use server";

import { getDb } from "@/lib/db/client";
import { auth } from "@/lib/auth";
import { newId } from "@/lib/finance/id";

// ─── Types ───────────────────────────────────────────────────────────────────

export type CltDistributionItem = {
  id: string;
  categoryId: string;
  description: string;
  value: number;
  sortOrder: number;
};

export type CltDistributionCategory = {
  id: string;
  month: string;
  name: string;
  sortOrder: number;
  items: CltDistributionItem[];
};

export type CltDistributionMonth = {
  id: string;
  month: string;
  salary: number;
};

async function getUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado");
  return session.user.id;
}

// ─── Fetch ───────────────────────────────────────────────────────────────────

export async function fetchCltDistributionMonth(month: string): Promise<CltDistributionMonth | null> {
  const sql = getDb();
  const userId = await getUserId();
  const rows = await sql(
    `SELECT id, month, salary::float8
     FROM public.clt_distribution_months
     WHERE user_id = $1 AND month = $2
     LIMIT 1`,
    [userId, month],
  );
  const data = rows[0];
  if (!data) return null;
  return {
    id: data.id as string,
    month: data.month as string,
    salary: Number(data.salary),
  };
}

export async function fetchCltDistributionCategories(month: string): Promise<CltDistributionCategory[]> {
  const sql = getDb();
  const userId = await getUserId();

  const rows = await sql(
    `SELECT
       c.id AS cat_id, c.month, c.name, c.sort_order AS cat_sort_order,
       i.id AS item_id, i.category_id, i.description, i.value::float8, i.sort_order AS item_sort_order
     FROM public.clt_distribution_categories c
     LEFT JOIN public.clt_distribution_items i ON i.category_id = c.id
     WHERE c.user_id = $1 AND c.month = $2
     ORDER BY c.sort_order ASC, i.sort_order ASC`,
    [userId, month],
  );

  if (!rows || rows.length === 0) return [];

  const catMap = new Map<string, CltDistributionCategory>();
  for (const row of rows) {
    const catId = row.cat_id as string;
    if (!catMap.has(catId)) {
      catMap.set(catId, {
        id: catId,
        month: row.month as string,
        name: row.name as string,
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
        sortOrder: row.item_sort_order as number,
      });
    }
  }

  return Array.from(catMap.values());
}

// ─── Upsert month ─────────────────────────────────────────────────────────────

export async function upsertCltDistributionMonth(month: string, salary: number): Promise<CltDistributionMonth> {
  const sql = getDb();
  const userId = await getUserId();
  const existing = await fetchCltDistributionMonth(month);
  const id = existing?.id ?? newId();

  await sql(
    `INSERT INTO public.clt_distribution_months (id, user_id, month, salary)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, month) DO UPDATE SET salary = EXCLUDED.salary`,
    [id, userId, month, salary],
  );
  return { id, month, salary };
}

// ─── Category CRUD ────────────────────────────────────────────────────────────

export async function addCltCategory(month: string, name: string): Promise<CltDistributionCategory> {
  const sql = getDb();
  const userId = await getUserId();
  const id = newId();

  const maxRow = await sql(
    `SELECT COALESCE(MAX(sort_order), -1) AS mo FROM public.clt_distribution_categories WHERE user_id = $1 AND month = $2`,
    [userId, month],
  );
  const sortOrder = (maxRow[0]?.mo as number ?? -1) + 1;

  await sql(
    `INSERT INTO public.clt_distribution_categories (id, user_id, month, name, sort_order) VALUES ($1, $2, $3, $4, $5)`,
    [id, userId, month, name, sortOrder],
  );
  return { id, month, name, sortOrder, items: [] };
}

export async function renameCltCategory(catId: string, name: string): Promise<void> {
  const sql = getDb();
  const userId = await getUserId();
  await sql(
    `UPDATE public.clt_distribution_categories SET name = $1 WHERE id = $2 AND user_id = $3`,
    [name, catId, userId],
  );
}

export async function deleteCltCategory(catId: string): Promise<void> {
  const sql = getDb();
  const userId = await getUserId();
  // Items cascade via FK
  await sql(`DELETE FROM public.clt_distribution_categories WHERE id = $1 AND user_id = $2`, [catId, userId]);
}

// ─── Item CRUD ────────────────────────────────────────────────────────────────

export async function addCltItem(categoryId: string, description: string, value: number): Promise<CltDistributionItem> {
  const sql = getDb();
  const id = newId();

  const maxRow = await sql(
    `SELECT COALESCE(MAX(sort_order), -1) AS mo FROM public.clt_distribution_items WHERE category_id = $1`,
    [categoryId],
  );
  const sortOrder = (maxRow[0]?.mo as number ?? -1) + 1;

  await sql(
    `INSERT INTO public.clt_distribution_items (id, category_id, description, value, sort_order) VALUES ($1, $2, $3, $4, $5)`,
    [id, categoryId, description, value, sortOrder],
  );
  return { id, categoryId, description, value, sortOrder };
}

export async function updateCltItem(itemId: string, description: string, value: number): Promise<void> {
  const sql = getDb();
  await sql(
    `UPDATE public.clt_distribution_items SET description = $1, value = $2 WHERE id = $3`,
    [description, value, itemId],
  );
}

export async function deleteCltItem(itemId: string): Promise<void> {
  const sql = getDb();
  await sql(`DELETE FROM public.clt_distribution_items WHERE id = $1`, [itemId]);
}
