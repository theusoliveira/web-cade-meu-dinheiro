import { supabase } from "@/lib/supabase/client";

export async function fetchCurrentProfileDisplayName(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id;
  if (!userId) return "";

  const { data, error } = await supabase
    .from("profiles")
    .select("display_name, full_name")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return (data?.display_name ?? data?.full_name ?? "").toString();
}
