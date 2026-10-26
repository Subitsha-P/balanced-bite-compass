import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { normalizeRecipe, type Recipe } from "@/lib/recipes";
import { useAuth } from "./use-auth";
import { useProfile } from "./use-profile";

export function useRecipes() {
  return useQuery({
    queryKey: ["recipes"],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<Recipe[]> => {
      const { data, error } = await supabase.from("recipes").select("*").order("name");
      if (error) throw new Error("Could not load recipes.");
      return (data ?? []).map((r) => normalizeRecipe(r as Record<string, unknown>));
    },
  });
}

/** Liked dish ids live on the profile; toggling feeds the Custom recommendations. */
export function useLikes() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const liked: string[] = (profile?.liked_recipe_ids as string[] | undefined) ?? [];

  const toggle = useMutation({
    mutationFn: async (id: string) => {
      const next = liked.includes(id) ? liked.filter((x) => x !== id) : [...liked, id];
      const { error } = await supabase.from("profiles").update({ liked_recipe_ids: next }).eq("user_id", user!.id);
      if (error) throw error;
      return { next, added: !liked.includes(id) };
    },
    onSuccess: ({ added }) => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["recipe-recs"] });
      toast.success(added ? "Added to dishes you like" : "Removed from dishes you like");
    },
    onError: () => toast.error("Could not update your liked dishes. Please try again."),
  });

  return { liked, toggle: (id: string) => toggle.mutate(id), pending: toggle.isPending };
}
