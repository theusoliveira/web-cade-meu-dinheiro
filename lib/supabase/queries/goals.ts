import { supabase } from "../client";

export type GoalRecord = {
  id: string;
  description: string;
  currentValue: number;
  targetValue: number;
  forecast: string;
  createdAt: number;
};

function forecastToDate(ym: string): string {
  return `${ym}-01`;
}

function dateToForecast(dateStr: string): string {
  return (dateStr ?? "").slice(0, 7);
}

export async function fetchGoals(): Promise<GoalRecord[]> {
  const { data, error } = await supabase
    .from("goals")
    .select("id, description, current_value, target_value, forecast, created_at")
    .order("forecast", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    description: row.description ?? "",
    currentValue: Number(row.current_value ?? 0),
    targetValue: Number(row.target_value ?? 0),
    forecast: dateToForecast(row.forecast ?? ""),
    createdAt: new Date(row.created_at).getTime(),
  }));
}

export async function upsertGoal(goal: GoalRecord) {
  const { error } = await supabase.from("goals").upsert({
    id: goal.id,
    description: goal.description,
    current_value: goal.currentValue,
    target_value: goal.targetValue,
    forecast: forecastToDate(goal.forecast),
  });

  if (error) throw error;
}

export async function deleteGoal(id: string) {
  const { error } = await supabase.from("goals").delete().eq("id", id);
  if (error) throw error;
}
