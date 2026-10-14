import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, RefreshCw, Save, Sunrise, Sun, Cookie, Moon } from "lucide-react";
import { generatePlan, saveMealPlan } from "@/lib/api.functions";
import { friendlyError } from "@/hooks/use-profile";
import { PageHeader } from "@/components/app-shell";
import { ErrorBox, StatCard, MealItemRow, MacroBar, MacroLegend } from "@/components/nutri-ui";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { Meal, MealPlan } from "@/lib/nutrition";

export const Route = createFileRoute("/_authenticated/meal-plan")({
  head: () => ({ meta: [{ title: "Meal planner – NutriGuide" }, { name: "description", content: "Generate a full day of meals matched to your calorie target." }] }),
  component: MealPlanPage,
});

const MEALS = [
  { key: "breakfast", label: "Breakfast", icon: Sunrise },
  { key: "lunch", label: "Lunch", icon: Sun },
  { key: "snack", label: "Snack", icon: Cookie },
  { key: "dinner", label: "Dinner", icon: Moon },
] as const;

function MealPlanPage() {
  const gen = useServerFn(generatePlan);
  const save = useServerFn(saveMealPlan);
  const qc = useQueryClient();
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [saved, setSaved] = useState(false);

  const g = useMutation({
    mutationFn: () => gen(),
    onSuccess: (r) => { setPlan(r.plan); setSaved(false); },
  });
  const s = useMutation({
    mutationFn: (p: MealPlan) => save({ data: p }),
    onSuccess: () => { setSaved(true); qc.invalidateQueries({ queryKey: ["plans"] }); toast.success("Meal plan saved"); },
    onError: (e) => toast.error(friendlyError(e)),
  });

  return (
    <>
      <PageHeader
        title="Meal planner"
        subtitle="A full day of meals that respects your diet, allergies and calorie target."
        action={
          <div className="flex gap-2">
            <Button onClick={() => g.mutate()} disabled={g.isPending}>
              {g.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              {plan ? "Regenerate" : "Generate meal plan"}
            </Button>
            {plan && (
              <Button variant="outline" onClick={() => s.mutate(plan)} disabled={s.isPending || saved}>
                {s.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {saved ? "Saved" : "Save plan"}
              </Button>
            )}
          </div>
        }
      />
      {g.error && <div className="mb-6"><ErrorBox message={friendlyError(g.error)} onRetry={() => g.mutate()} /></div>}
      {!plan && !g.isPending && !g.error && (
        <div className="rounded-3xl border border-dashed border-border p-14 text-center text-muted-foreground">
          Press <strong>Generate meal plan</strong> to build today's menu. Saved plans appear in <Link to="/history" className="text-primary hover:underline">Saved Plans</Link>.
        </div>
      )}
      {plan && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Target" value={plan.targetCalories} unit="kcal" />
            <StatCard label="Planned" value={plan.totalCalories} unit="kcal" hint={`${Math.round((plan.totalCalories / plan.targetCalories) * 100)}% of target`} />
            <StatCard label="Protein" value={plan.totalProtein} unit="g" />
            <StatCard label="Carbs / Fat" value={`${plan.totalCarbohydrates} / ${plan.totalFat}`} unit="g" />
          </div>
          <div className="mt-4 rounded-2xl border border-border bg-card p-5">
            <MacroBar protein={plan.totalProtein} carbs={plan.totalCarbohydrates} fat={plan.totalFat} />
            <div className="mt-3"><MacroLegend protein={plan.totalProtein} carbs={plan.totalCarbohydrates} fat={plan.totalFat} /></div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {MEALS.map(({ key, label, icon }) => <MealCard key={key} label={label} Icon={icon} meal={plan[key]} />)}
          </div>
        </>
      )}
    </>
  );
}

export function MealCard({ label, Icon, meal }: { label: string; Icon: typeof Sun; meal: Meal }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-display text-xl font-semibold"><Icon className="h-5 w-5 text-accent" />{label}</h3>
        <span className="text-sm text-muted-foreground">{Math.round(meal.calories)} / {Math.round(meal.target)} kcal</span>
      </div>
      <Progress value={Math.min(100, (meal.calories / Math.max(meal.target, 1)) * 100)} className="mt-3 h-1.5" />
      <div className="mt-2 divide-y divide-border">
        {meal.items.length ? meal.items.map((it) => <MealItemRow key={it.foodId} item={it} />) : <p className="py-4 text-sm text-muted-foreground">No suitable foods found for this meal.</p>}
      </div>
    </div>
  );
}
