import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ShieldCheck, HeartPulse, Sparkles, Heart, ListFilter, Apple } from "lucide-react";
import { getRecommendations, getRecipeRecommendations } from "@/lib/api.functions";
import { friendlyError } from "@/hooks/use-profile";
import { useLikes } from "@/hooks/use-recipes";
import { PageHeader } from "@/components/app-shell";
import { Loading, ErrorBox, StatCard } from "@/components/nutri-ui";
import { RecipeCard } from "@/components/recipe-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { foodImage } from "@/lib/food-images";
import { GOAL_LABELS, DIET_LABELS, allergenLabel } from "@/lib/nutrition";
import { conditionLabel } from "@/lib/recipes";

export const Route = createFileRoute("/_authenticated/recommendations")({
  head: () => ({ meta: [{ title: "Recommendations – NutriGuide" }, { name: "description", content: "Basic and custom Indian dish recommendations for your goal, diet, allergies and health conditions." }] }),
  component: RecsPage,
});

function RecsPage() {
  const [tab, setTab] = useState("basic");
  return (
    <>
      <PageHeader title="Your recommendations" subtitle="Choose Basic to rank dishes on your health profile alone, or Custom to also match the dishes you like." />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="basic" className="gap-1.5"><ListFilter className="h-4 w-4" /> Basic</TabsTrigger>
          <TabsTrigger value="custom" className="gap-1.5"><Heart className="h-4 w-4" /> Custom (dishes I like)</TabsTrigger>
          <TabsTrigger value="foods" className="gap-1.5"><Apple className="h-4 w-4" /> Single foods</TabsTrigger>
        </TabsList>
        <TabsContent value="basic" className="mt-6"><DishRecs mode="basic" /></TabsContent>
        <TabsContent value="custom" className="mt-6"><DishRecs mode="custom" /></TabsContent>
        <TabsContent value="foods" className="mt-6"><FoodRecs /></TabsContent>
      </Tabs>
    </>
  );
}

function DishRecs({ mode }: { mode: "basic" | "custom" }) {
  const fn = useServerFn(getRecipeRecommendations);
  const q = useQuery({ queryKey: ["recipe-recs", mode], queryFn: () => fn({ data: { mode } }), retry: false });
  const { liked, toggle } = useLikes();

  if (q.isLoading) return <Loading label={mode === "custom" ? "Learning your taste…" : "Scoring dishes for you…"} />;
  if (q.error) return <ErrorBox message={friendlyError(q.error)} onRetry={() => q.refetch()} />;
  const d = q.data!;
  const conds = d.profile.conditions ?? [];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Daily target" value={d.calc.target} unit="kcal" hint={`${GOAL_LABELS[d.profile.goal]} · ${DIET_LABELS[d.profile.diet_type]}`} />
        <StatCard label={mode === "custom" ? "New dishes for you" : "Suitable dishes"} value={d.items.length} hint={`of ${d.totalRecipes} Indian recipes`} />
        <StatCard label="Filtered out" value={d.excluded.length} hint="diet, allergy or health conflicts" />
      </div>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
        {conds.length > 0 ? (
          <span className="flex items-center gap-2"><HeartPulse className="h-4 w-4 text-primary" /> Health: {conds.map(conditionLabel).join(", ")}</span>
        ) : (
          <span className="flex items-center gap-2"><HeartPulse className="h-4 w-4" /> No health conditions set — <Link to="/profile" className="text-primary hover:underline">add them</Link> for diabetes, heart, BP, weight or senior-friendly picks.</span>
        )}
        {d.profile.allergies.length > 0 && (
          <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Excluding: {d.profile.allergies.map(allergenLabel).join(", ")}</span>
        )}
      </div>

      {mode === "custom" && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-soft">
          <p className="flex items-center gap-2 font-semibold"><Sparkles className="h-4 w-4 text-accent" /> Your taste profile</p>
          {d.needsLikes ? (
            <p className="mt-2 text-sm text-muted-foreground">You have not liked any dishes yet. Open the recipe library and tap the heart on 3 or more dishes you enjoy — we will learn your taste from their region, flavours and ingredients.</p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
              {d.liked.map((l) => (
                <Link key={l.id} to="/recipes/$slug" params={{ slug: l.slug }}><Badge variant="outline" className="gap-1"><Heart className="h-3 w-3 fill-current text-destructive" />{l.name}</Badge></Link>
              ))}
            </div>
          )}
          <Button asChild size="sm" variant="outline" className="mt-3"><Link to="/recipes">{d.needsLikes ? "Pick dishes I like" : "Like more dishes"}</Link></Button>
        </div>
      )}

      {!d.needsLikes && (d.items.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">No dishes match your current restrictions. Try updating your preferences.</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {d.items.map((s, i) => (
            <RecipeCard
              key={s.recipe.id}
              recipe={s.recipe}
              liked={liked.includes(s.recipe.id)}
              onLike={() => toggle(s.recipe.id)}
              top={<span className="rounded-full bg-foreground px-2.5 py-1 text-xs font-bold text-background">#{i + 1}</span>}
              footer={
                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">{mode === "custom" ? "Match score" : "Health score"}</span>
                    <span className="font-display text-2xl font-semibold text-primary">{s.score}</span>
                  </div>
                  <Progress value={s.score} className="mt-1 h-1.5" />
                  <p className="mt-2 text-xs text-muted-foreground">{s.because ?? s.reason}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Goal {s.breakdown.goal}/25 · Health {s.breakdown.health}/30 · Calories {s.breakdown.calorie}/20 · Nutrition {s.breakdown.nutrition}/25
                    {s.preference != null && <> · Taste match {s.preference}%</>}
                  </p>
                </div>
              }
            />
          ))}
        </div>
      ))}

      {d.excluded.length > 0 && (
        <details className="mt-8 rounded-2xl border border-border bg-card p-5 text-sm">
          <summary className="cursor-pointer font-medium">Why {d.excluded.length} dishes were filtered out</summary>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {d.excluded.map((e) => (
              <li key={e.id}><Link to="/recipes/$slug" params={{ slug: e.slug }} className="font-medium hover:underline">{e.name}</Link> <span className="text-muted-foreground">— {e.reasons.join("; ")}</span></li>
            ))}
          </ul>
        </details>
      )}
    </>
  );
}

function FoodRecs() {
  const fn = useServerFn(getRecommendations);
  const q = useQuery({ queryKey: ["recommendations"], queryFn: () => fn({ data: {} }), retry: false });
  const [filter, setFilter] = useState("all");

  if (q.isLoading) return <Loading label="Scoring foods for you…" />;
  if (q.error) return <ErrorBox message={friendlyError(q.error)} onRetry={() => q.refetch()} />;
  const d = q.data!;
  const recs = d.recommendations.filter((r) =>
    filter === "all" ? true : filter === "protein" ? r.tags.includes("High Protein") : filter === "lowcal" ? r.tags.includes("Low Calorie") : r.tags.includes("High Fiber"),
  );

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Daily target" value={d.calc.target} unit="kcal" />
        <StatCard label="Safe foods" value={d.recommendations.length} hint={`of ${d.totalFoods} in the database`} />
        <StatCard label="Filtered out" value={d.excludedCount} hint="diet, allergy or health conflicts" />
      </div>
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
