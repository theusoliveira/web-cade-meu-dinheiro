"use server";

import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function fetchCurrentProfileDisplayName(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return "";
  const sql = getDb();
  const rows = await sql(
    `SELECT display_name, full_name FROM public.users WHERE id = $1 LIMIT 1`,
    [userId],
  );
  const row = rows[0];
  return ((row?.display_name ?? row?.full_name ?? "") as string).toString();
}