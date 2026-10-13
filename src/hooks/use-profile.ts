import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", user!.id).maybeSingle();
      if (error) throw new Error("Could not load your profile.");
      return data;
    },
  });
}

export function useFoods() {
  return useQuery({
    queryKey: ["foods"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("foods").select("*").order("name");
      if (error) throw new Error("Could not load the food database.");
      return (data ?? []).map((f) => ({
        ...f,
        calories: Number(f.calories),
        protein: Number(f.protein),
        carbohydrates: Number(f.carbohydrates),
        fat: Number(f.fat),
        fiber: Number(f.fiber),
        sugar: Number(f.sugar),
      }));
    },
  });
}

/** Turns server/network errors into friendly copy. */
export function friendlyError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e ?? "");
  if (msg.includes("PROFILE_INCOMPLETE")) return "Please complete your health profile first.";
  if (msg.includes("NO_PLAN")) return "No foods match your current dietary restrictions. Try updating your preferences.";
  if (msg.includes("Unauthorized")) return "Your session has expired. Please log in again.";
  if (/fetch|network/i.test(msg)) return "Network error. Please check your connection and try again.";
  return msg || "Something went wrong. Please try again.";
}
