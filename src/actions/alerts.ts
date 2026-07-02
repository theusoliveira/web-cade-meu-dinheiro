"use server";

import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { newId } from "@/lib/finance/id";

export type AlertRecord = {
  id: string;
  name: string;
  dueDate: string;       // YYYY-MM-DD — para não-recorrentes; para recorrentes é a próxima ocorrência calculada
  reminderDays: number;
  expectedValue: number | null;
  active: boolean;
  recurring: boolean;    // true = repete todo mês
  dayOfMonth: number | null; // 1–31, usado quando recurring = true
  createdAt: number;
};

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado");
  return session.user.id;
}

/**
 * Para alertas recorrentes, a data de vencimento é sempre recalculada a
 * partir do dayOfMonth (nunca lida do valor persistido), garantindo que o
 * alerta se renove automaticamente todo mês em vez de ficar "Vencida".
 */
function nextOccurrence(dayOfMonth: number): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const year = today.getFullYear();
  const month = today.getMonth();

  const maxDay = new Date(year, month + 1, 0).getDate();
  const day = Math.min(dayOfMonth, maxDay);
  const candidate = new Date(year, month, day);
  if (candidate >= today) {
    return candidate.toISOString().slice(0, 10);
  }

  const nextMonth = month + 1;
  const nextYear = nextMonth > 11 ? year + 1 : year;
  const nm = nextMonth > 11 ? 0 : nextMonth;
  const maxDayNext = new Date(nextYear, nm + 1, 0).getDate();
  const dayNext = Math.min(dayOfMonth, maxDayNext);
  return new Date(nextYear, nm, dayNext).toISOString().slice(0, 10);
}

function mapRow(row: Record<string, unknown>): AlertRecord {
  const recurring = Boolean(row.recurring);
  const dayOfMonth = row.day_of_month != null ? Number(row.day_of_month) : null;
  return {
    id: row.id as string,
    name: row.name as string,
    dueDate: recurring && dayOfMonth != null ? nextOccurrence(dayOfMonth) : (row.due_date as string) ?? "",
    reminderDays: Number(row.reminder_days ?? 3),
    expectedValue: row.expected_value != null ? Number(row.expected_value) : null,
    active: Boolean(row.active),
    recurring,
    dayOfMonth,
    createdAt: new Date(row.created_at as string).getTime(),
  };
}

export async function fetchAlerts(): Promise<AlertRecord[]> {
  const sql = getDb();
  const userId = await getUserId();
  const rows = await sql(
    `SELECT id, name, due_date::text, reminder_days, expected_value::float8,
            active, recurring, day_of_month, created_at
     FROM public.alerts WHERE user_id = $1
     ORDER BY due_date ASC, created_at DESC`,
    [userId],
  );
  return (rows as Record<string, unknown>[]).map(mapRow);
}

export async function upsertAlert(alert: AlertRecord): Promise<void> {
  const sql = getDb();
  const userId = await getUserId();
  const id = alert.id || newId();
  await sql(
    `INSERT INTO public.alerts
       (id, user_id, name, due_date, reminder_days, expected_value, active, recurring, day_of_month)
     VALUES ($1, $2, $3, $4::date, $5, $6, $7, $8, $9)
     ON CONFLICT (id) DO UPDATE SET
       name           = EXCLUDED.name,
       due_date       = EXCLUDED.due_date,
       reminder_days  = EXCLUDED.reminder_days,
       expected_value = EXCLUDED.expected_value,
       active         = EXCLUDED.active,
       recurring      = EXCLUDED.recurring,
       day_of_month   = EXCLUDED.day_of_month`,
    [id, userId, alert.name, alert.dueDate, alert.reminderDays,
     alert.expectedValue, alert.active, alert.recurring, alert.dayOfMonth],
  );
}

export async function deleteAlert(id: string): Promise<void> {
  const sql = getDb();
  const userId = await getUserId();
  await sql(`DELETE FROM public.alerts WHERE id = $1 AND user_id = $2`, [id, userId]);
}

export async function toggleAlert(id: string, active: boolean): Promise<void> {
  const sql = getDb();
  const userId = await getUserId();
  await sql(
    `UPDATE public.alerts SET active = $1 WHERE id = $2 AND user_id = $3`,
    [active, id, userId],
  );
}

/** Retorna alertas cujo lembrete está ativo hoje */
export async function fetchDueAlerts(): Promise<AlertRecord[]> {
  const sql = getDb();
  const userId = await getUserId();
  // Alertas recorrentes têm a data de vencimento recalculada em mapRow, então
  // aqui trazemos todos os ativos (recorrentes ou com due_date futura) e
  // aplicamos a janela de lembrete em memória, já com a data efetiva.
  const rows = await sql(
    `SELECT id, name, due_date::text, reminder_days, expected_value::float8,
            active, recurring, day_of_month, created_at
     FROM public.alerts
     WHERE user_id = $1
       AND active = true
       AND (recurring = true OR due_date >= CURRENT_DATE)`,
    [userId],
  );
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (rows as Record<string, unknown>[])
    .map(mapRow)
    .filter((a) => {
      const remindFrom = new Date(`${a.dueDate}T00:00:00`);
      remindFrom.setDate(remindFrom.getDate() - a.reminderDays);
      return remindFrom <= today;
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}
