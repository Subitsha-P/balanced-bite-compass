import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { getRecommendations } from "@/lib/api.functions";
import { friendlyError } from "@/hooks/use-profile";
import { PageHeader } from "@/components/app-shell";
import { Loading, ErrorBox, StatCard } from "@/components/nutri-ui";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { foodImage } from "@/lib/food-images";
import { GOAL_LABELS, DIET_LABELS, allergenLabel } from "@/lib/nutrition";

export const Route = createFileRoute("/_authenticated/recommendations")({
  head: () => ({ meta: [{ title: "Recommendations – NutriGuide" }, { name: "description", content: "Foods ranked for your goal, diet and allergies." }] }),
  component: RecsPage,
});

function RecsPage() {
  const fn = useServerFn(getRecommendations);
  const q = useQuery({ queryKey: ["recommendations"], queryFn: () => fn({ data: {} }), retry: false });
  const [filter, setFilter] = useState("all");

  if (q.isLoading) return <Loading label="Scoring foods for you…" />;
  if (q.error) return <><PageHeader title="Recommendations" /><ErrorBox message={friendlyError(q.error)} onRetry={() => q.refetch()} /></>;
  const d = q.data!;
  const recs = d.recommendations.filter((r) =>
    filter === "all" ? true : filter === "protein" ? r.tags.includes("High Protein") : filter === "lowcal" ? r.tags.includes("Low Calorie") : r.tags.includes("High Fiber"),
  );

  return (
    <>
      <PageHeader title="Your recommendations" subtitle={`Ranked for ${GOAL_LABELS[d.profile.goal].toLowerCase()} on a ${DIET_LABELS[d.profile.diet_type].toLowerCase()} diet.`} />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Daily target" value={d.calc.target} unit="kcal" />
        <StatCard label="Safe foods" value={d.recommendations.length} hint={`of ${d.totalFoods} in the database`} />
        <StatCard label="Filtered out" value={d.excludedCount} hint="diet or allergy conflicts" />
      </div>
      {d.profile.allergies.length > 0 && (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" /> Excluding: {d.profile.allergies.map(allergenLabel).join(", ")}
        </p>
      )}
      <Tabs value={filter} onValueChange={setFilter} className="mt-6">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="protein">High protein</TabsTrigger>
          <TabsTrigger value="lowcal">Low calorie</TabsTrigger>
          <TabsTrigger value="fiber">High fiber</TabsTrigger>
        </TabsList>
      </Tabs>
      {recs.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">No foods match your current dietary restrictions. Try updating your preferences.</p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {recs.slice(0, 40).map((r, i) => (
            <article key={r.food.id} className="flex gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft">
              <div className="relative">
                <img src={foodImage(r.food.image)} alt="" className="h-20 w-20 rounded-xl object-cover" loading="lazy" />
                <span className="absolute -left-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-foreground text-xs font-bold text-background">{i + 1}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{r.food.name}</h3>
                    <p className="text-xs text-muted-foreground">{r.food.serving_size} · {r.food.calories} kcal · P {r.food.protein}g</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-2xl font-semibold text-primary">{r.score}</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">score</p>
                  </div>
                </div>
                <Progress value={r.score} className="mt-2 h-1.5" />
                <p className="mt-2 text-sm text-muted-foreground">{r.reasons[0]}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {r.tags.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}
                </div>
                <details className="mt-2 text-xs text-muted-foreground">
                  <summary className="cursor-pointer">Score breakdown</summary>
                  <p className="mt-1">Diet {r.breakdown.diet}/20 · Allergy {r.breakdown.allergy}/20 · Goal {r.breakdown.goal}/25 · Protein {r.breakdown.protein}/20 · Calories {r.breakdown.calorie}/15</p>
                </details>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
