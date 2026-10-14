import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ChevronDown, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import { Loading, ErrorBox, MealItemRow } from "@/components/nutri-ui";
import { Button } from "@/components/ui/button";
import type { Meal } from "@/lib/nutrition";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "Saved meal plans – NutriGuide" }, { name: "description", content: "Your saved meal plans and daily totals." }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState<string | null>(null);
  const q = useQuery({
    queryKey: ["plans", "all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("meal_plans").select("*").order("created_at", { ascending: false });
      if (error) throw new Error("Could not load your saved plans.");
      return data;
    },
  });
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("meal_plans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["plans"] }); toast.success("Plan deleted"); },
    onError: () => toast.error("Could not delete the plan."),
  });

  return (
    <>
      <PageHeader title="Saved meal plans" subtitle="Every plan you've saved, newest first." />
      {q.isLoading ? <Loading /> : q.error ? <ErrorBox message={(q.error as Error).message} onRetry={() => q.refetch()} /> : !q.data?.length ? (
        <div className="rounded-3xl border border-dashed border-border p-14 text-center text-muted-foreground">
          No saved plans yet. <Link to="/meal-plan" className="text-primary hover:underline">Generate one</Link>.
        </div>
      ) : (
        <div className="space-y-3">
          {q.data.map((p) => (
            <div key={p.id} className="rounded-2xl border border-border bg-card shadow-soft">
              <button className="flex w-full items-center justify-between gap-4 p-5 text-left" onClick={() => setOpen(open === p.id ? null : p.id)}>
                <div>
                  <p className="font-semibold">{new Date(p.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</p>
                  <p className="text-sm text-muted-foreground">
                    {p.total_calories} / {p.target_calories} kcal · P {p.total_protein}g · C {p.total_carbohydrates}g · F {p.total_fat}g
                  </p>
                </div>
                <ChevronDown className={`h-5 w-5 transition ${open === p.id ? "rotate-180" : ""}`} />
              </button>
              {open === p.id && (
                <div className="border-t border-border p-5">
                  <div className="grid gap-6 md:grid-cols-2">
                    {(["breakfast", "lunch", "snack", "dinner"] as const).map((k) => {
                      const m = p[k] as unknown as Meal;
                      return (
                        <div key={k}>
                          <p className="text-sm font-semibold capitalize">{k} · {Math.round(m.calories)} kcal</p>
                          <div className="divide-y divide-border">{m.items.map((it) => <MealItemRow key={it.foodId} item={it} />)}</div>
                        </div>
                      );
                    })}
                  </div>
                  <Button variant="outline" size="sm" className="mt-4 text-destructive" onClick={() => del.mutate(p.id)} disabled={del.isPending}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
